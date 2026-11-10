
import { randomBytes } from "node:crypto";
import { prisma } from "../db/prisma.js";
import type { CreateOrderInput } from "../schemas/order.schema.js";
import { env } from "../config/env.js";

function generateOrderNumber(): string {
  const date = new Date();

  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  const suffix = randomBytes(3).toString("hex").toUpperCase();

  return `ORD-${datePart}-${suffix}`;
}

const orderInclude = {
  table: true,
  createdBy: {
    select: {
      id: true,
      name: true,
      employeeId: true,
    },
  },
  items: true,
} as const;

// ============================================
// GET ALL ORDERS
// ============================================

export async function getOrders() {
  return prisma.order.findMany({
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

// ============================================
// GET ORDER BY ID
// ============================================

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });
}

// ============================================
// CREATE ORDER
// ============================================

export async function createOrder(
  data: CreateOrderInput,
  createdById: string,
) {
  return prisma.$transaction(async (tx) => {
    // Check table availability.
    const table = await tx.diningTable.findFirst({
      where: {
        id: data.tableId,
        isActive: true,
        status: {
          in: ["AVAILABLE", "RESERVED"],
        },
      },
    });

    if (!table) {
      throw new Error(
        "Table is unavailable or does not exist",
      );
    }

    // Atomically claim the table.
    const claimed = await tx.diningTable.updateMany({
      where: {
        id: table.id,
        isActive: true,
        status: {
          in: ["AVAILABLE", "RESERVED"],
        },
      },
      data: {
        status: "OCCUPIED",
      },
    });

    if (claimed.count !== 1) {
      throw new Error(
        "This table has just been taken by another order",
      );
    }

    // Combine duplicate menu items.
    const quantities = new Map<
      string,
      { quantity: number; notes?: string }
    >();

    for (const item of data.items) {
      const previous = quantities.get(item.menuItemId);

      if (previous) {
        previous.quantity += item.quantity;

        if (item.notes) {
          previous.notes = [
            previous.notes,
            item.notes,
          ]
            .filter(Boolean)
            .join("; ");
        }
      } else {
        quantities.set(item.menuItemId, {
          quantity: item.quantity,
          notes: item.notes,
        });
      }
    }

    const menuIds = [...quantities.keys()];

    // Fetch current menu prices from the database.
    const menuItems = await tx.menuItem.findMany({
      where: {
        id: {
          in: menuIds,
        },
        isAvailable: true,
        category: {
          isActive: true,
        },
      },
    });

    if (menuItems.length !== menuIds.length) {
      throw new Error(
        "One or more menu items are unavailable",
      );
    }

    // Create a strongly typed lookup map.
    const menuById = new Map(
      menuItems.map((item) => [item.id, item] as const),
    );

    // Prepare order items using database prices.
    const orderItems = menuIds.map((menuItemId) => {
      const menuItem = menuById.get(menuItemId);

      if (!menuItem) {
        throw new Error(
          `Menu item not found: ${menuItemId}`,
        );
      }

      const requested = quantities.get(menuItemId);

      if (!requested) {
        throw new Error(
          `Requested quantity not found: ${menuItemId}`,
        );
      }

      const unitPricePaise = Math.round(
        Number(menuItem.price) * 100,
      );

      const lineTotalPaise =
        unitPricePaise * requested.quantity;

      return {
        menuItemId,
        itemName: menuItem.name,
        unitPrice: unitPricePaise / 100,
        quantity: requested.quantity,
        lineTotal: lineTotalPaise / 100,
        notes: requested.notes,
      };
    });

    // Calculate totals in paise.
    const subtotalPaise = orderItems.reduce(
      (sum, item) =>
        sum + Math.round(item.lineTotal * 100),
      0,
    );

    const taxPaise = Math.round(
      subtotalPaise * (env.TAX_RATE_PERCENT / 100),
    );

    const subtotal = subtotalPaise / 100;
    const taxAmount = taxPaise / 100;
    const total = (subtotalPaise + taxPaise) / 100;

    // Save order and items.
    return tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        tableId: table.id,
        createdById,
        notes: data.notes,
        subtotal,
        taxAmount,
        total,
        items: {
          create: orderItems,
        },
      },
      include: orderInclude,
    });
  });
}

// ============================================
// CANCEL ORDER
// ============================================

export async function cancelOrder(
  id: string,
  reason: string,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "OPEN") {
      throw new Error(
        "Only open orders can be cancelled at this stage",
      );
    }

    const updated = await tx.order.update({
      where: { id },
      data: {
        status: "CANCELLED",
        notes: [
          order.notes,
          `Cancellation reason: ${reason}`,
        ]
          .filter(Boolean)
          .join("\n"),
        cancelledAt: new Date(),
      },
      include: orderInclude,
    });

    // Release the table if no other active order exists.
    const otherActiveOrder = await tx.order.findFirst({
      where: {
        tableId: order.tableId,
        id: {
          not: order.id,
        },
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
    });

    if (!otherActiveOrder) {
      await tx.diningTable.updateMany({
        where: {
          id: order.tableId,
          status: "OCCUPIED",
        },
        data: {
          status: "AVAILABLE",
        },
      });
    }

    return updated;
  });
}
