import { prisma } from "../db/prisma.js";
import { completeOrderIfReady } from "./order-completion.service.js";

export async function getKitchenTickets() {
  return prisma.kitchenTicket.findMany({
    where: {
      status: {
        in: ["NEW", "PREPARING"],
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
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getKitchenTicketById(id: string) {
  return prisma.kitchenTicket.findUnique({
    where: { id },
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
}

export async function updateKitchenTicketStatus(
  id: string,
  status: "PREPARING" | "READY",
) {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.kitchenTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new Error("Kitchen ticket not found");
    }

    if (ticket.status === "READY" || ticket.status === "CANCELLED") {
      throw new Error("This ticket is already finished");
    }

    if (status === "PREPARING" && ticket.status !== "NEW") {
      throw new Error("Only new tickets can be started");
    }

    const updated = await tx.kitchenTicket.update({
      where: { id },
      data: {
        status,
        ...(status === "PREPARING"
          ? { startedAt: new Date() }
          : { readyAt: new Date() }),
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

    // Update overall order status when all station tickets are ready.
    if (status === "READY") {
      const remaining = await tx.kitchenTicket.count({
        where: {
          orderId: ticket.orderId,
          status: { notIn: ["READY", "CANCELLED"] },
        },
      });

      if (remaining === 0) {
        await tx.order.update({
          where: { id: ticket.orderId },
          data: { status: "READY" },
        });

        await completeOrderIfReady(tx, ticket.orderId);
      } else {
        await tx.order.update({
          where: { id: ticket.orderId },
          data: { status: "PREPARING" },
        });
      }
    } else {
      await tx.order.update({
        where: { id: ticket.orderId },
        data: { status: "PREPARING" },
      });
    }

    return updated;
  });
}
