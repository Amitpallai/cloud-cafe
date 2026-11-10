import type { Prisma } from "../generated/prisma/client.js";

export async function completeOrderIfReady(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { invoice: true },
  });

  if (!order || order.status !== "READY" || !order.invoice) {
    return false;
  }

  const paid = Math.round(Number(order.invoice.paidAmount) * 100);
  const total = Math.round(Number(order.invoice.total) * 100);

  if (paid < total) {
    return false;
  }

  const updated = await tx.order.updateMany({
    where: {
      id: orderId,
      status: "READY",
    },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  if (updated.count === 1) {
    await tx.diningTable.updateMany({
      where: {
        id: order.tableId,
        status: "OCCUPIED",
      },
      data: {
        status: "AVAILABLE",
      },
    });

    return true;
  }

  return false;
}