import { randomBytes } from "node:crypto";
import { prisma } from "../db/prisma.js";

function generateTicketNumber() {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  return `KOT-${datePart}-${randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
}

export async function sendOrderToKitchen(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                kitchenStation: true,
              },
            },
          },
        },
        kitchenTickets: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "OPEN") {
      throw new Error("Only open orders can be sent to the kitchen");
    }

    if (order.items.length === 0) {
      throw new Error("Cannot send an empty order to the kitchen");
    }

    if (order.kitchenTickets.length > 0) {
      throw new Error("This order has already been sent to the kitchen");
    }

    // Create a fallback station for menu items without an assignment.
    const generalStation = await tx.kitchenStation.upsert({
      where: { code: "GENERAL" },
      create: {
        name: "General Kitchen",
        code: "GENERAL",
        isActive: true,
      },
      update: {},
    });

    const grouped = new Map<
      string,
      {
        stationId: string;
        items: typeof order.items;
      }
    >();

    for (const item of order.items) {
      const station = item.menuItem.kitchenStation;

      if (station && !station.isActive) {
        throw new Error(
          `Kitchen station for ${item.itemName} is inactive`,
        );
      }

      const stationId = station?.id ?? generalStation.id;

      const group = grouped.get(stationId) ?? {
        stationId,
        items: [],
      };

      group.items.push(item);
      grouped.set(stationId, group);
    }

    const tickets = [];

    for (const group of grouped.values()) {
      const ticket = await tx.kitchenTicket.create({
        data: {
          ticketNumber: generateTicketNumber(),
          orderId: order.id,
          stationId: group.stationId,
          items: {
            create: group.items.map((item: { id: any; itemName: any; quantity: any; notes: any; }) => ({
              orderItemId: item.id,
              itemName: item.itemName,
              quantity: item.quantity,
              notes: item.notes,
            })),
          },
        },
        include: {
          station: true,
          items: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              table: {
                select: {
                  tableNumber: true,
                },
              },
            },
          },
        },
      });

      tickets.push(ticket);
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: "SENT_TO_KITCHEN" },
    });

    return tickets;
  });
}