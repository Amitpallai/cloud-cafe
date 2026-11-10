
import { randomBytes } from "node:crypto";
import { prisma } from "../db/prisma.js";
import { env } from "../config/env.js";
import type {
  ApplyDiscountInput,
  CreatePaymentInput,
} from "../schemas/billing.schema.js";
import { completeOrderIfReady } from "./order-completion.service.js";

function generateNumber(prefix: string): string {
  const now = new Date();

  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  return `${prefix}-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function toPaise(value: number): number {
  return Math.round(value * 100);
}

function fromPaise(value: number): number {
  return value / 100;
}

function calculateBill(subtotal: number, discount: number) {
  const taxablePaise = Math.max(
    0,
    toPaise(subtotal) - toPaise(discount),
  );

  const taxPaise = Math.round(
    taxablePaise * (env.TAX_RATE_PERCENT / 100),
  );

  return {
    taxAmount: fromPaise(taxPaise),
    total: fromPaise(taxablePaise + taxPaise),
  };
}

const billInclude = {
  table: true,
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
  items: true,
  payments: {
    where: { status: "COMPLETED" as const },
    orderBy: { createdAt: "asc" as const },
  },
  invoice: true,
  discount: true,
} as const;

// ============================================
// GET BILL
// ============================================

export async function getBill(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: billInclude,
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const paidPaise = order.payments.reduce(
    (sum, payment) =>
      sum + toPaise(Number(payment.amount)),
    0,
  );

  const totalPaise = toPaise(Number(order.total));

  return {
    order,
    summary: {
      subtotal: Number(order.subtotal),
      discount: Number(order.discountAmount),
      tax: Number(order.taxAmount),
      total: Number(order.total),
      paid: fromPaise(paidPaise),
      due: fromPaise(Math.max(0, totalPaise - paidPaise)),
    },
  };
}

// ============================================
// APPLY DISCOUNT
// ============================================

export async function applyOrderDiscount(
  orderId: string,
  data: ApplyDiscountInput,
  appliedById: string,
) {
  return prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (
        order.status === "COMPLETED" ||
        order.status === "CANCELLED"
      ) {
        throw new Error(
          "This order can no longer be discounted",
        );
      }

      // Do not allow discount changes after payment.
      const existingPayments = await tx.payment.count({
        where: {
          orderId,
          status: "COMPLETED",
        },
      });

      if (existingPayments > 0) {
        throw new Error(
          "Discount cannot be changed after a payment has been recorded",
        );
      }

      const subtotalPaise = toPaise(Number(order.subtotal));

      if (
        data.type === "PERCENTAGE" &&
        data.value > 100
      ) {
        throw new Error(
          "Percentage discount cannot exceed 100%",
        );
      }

      const requestedDiscountPaise =
        data.type === "PERCENTAGE"
          ? Math.round(
              subtotalPaise * (data.value / 100),
            )
          : toPaise(data.value);

      if (requestedDiscountPaise > subtotalPaise) {
        throw new Error(
          "Discount cannot exceed the subtotal",
        );
      }

      const discountAmount = fromPaise(
        requestedDiscountPaise,
      );

      const { taxAmount, total } = calculateBill(
        Number(order.subtotal),
        discountAmount,
      );

      await tx.orderDiscount.upsert({
        where: { orderId },

        create: {
          orderId,
          type: data.type,
          value: data.value,
          amount: discountAmount,
          reason: data.reason,
          appliedById,
        },

        update: {
          type: data.type,
          value: data.value,
          amount: discountAmount,
          reason: data.reason,
          appliedById,
          appliedAt: new Date(),
        },
      });

      return tx.order.update({
        where: { id: orderId },
        data: {
          discountAmount,
          taxAmount,
          total,
        },
        include: billInclude,
      });
    },
    {
      isolationLevel: "Serializable",
    },
  );
}

// ============================================
// RECORD PAYMENT
// ============================================

export async function recordPayment(
  orderId: string,
  data: CreatePaymentInput,
  receivedById: string,
) {
  return prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (
        order.status === "COMPLETED" ||
        order.status === "CANCELLED"
      ) {
        throw new Error("This order is already closed");
      }

      const existingPayments = await tx.payment.findMany({
        where: {
          orderId,
          status: "COMPLETED",
        },
        select: {
          amount: true,
        },
      });

      const alreadyPaidPaise = existingPayments.reduce(
        (sum, payment) =>
          sum + toPaise(Number(payment.amount)),
        0,
      );

      const totalPaise = toPaise(Number(order.total));
      const paymentPaise = toPaise(data.amount);
      const duePaise = totalPaise - alreadyPaidPaise;

      if (paymentPaise > duePaise) {
        throw new Error(
          "Payment exceeds the outstanding balance",
        );
      }

      const payment = await tx.payment.create({
        data: {
          paymentNumber: generateNumber("PAY"),
          orderId,
          receivedById,
          method: data.method,
          amount: fromPaise(paymentPaise),
          reference: data.reference,
          notes: data.notes,
        },
      });

      const newPaidPaise =
        alreadyPaidPaise + paymentPaise;

      let invoice = await tx.invoice.findUnique({
        where: { orderId },
      });

      if (!invoice) {
        invoice = await tx.invoice.create({
          data: {
            invoiceNumber: generateNumber("INV"),
            orderId,
            subtotal: order.subtotal,
            discountAmount: order.discountAmount,
            taxAmount: order.taxAmount,
            total: order.total,
            paidAmount: fromPaise(newPaidPaise),
          },
        });
      } else {
        invoice = await tx.invoice.update({
          where: { orderId },
          data: {
            paidAmount: fromPaise(newPaidPaise),
          },
        });
      }

      const isFullyPaid = newPaidPaise >= totalPaise;

      if (isFullyPaid) {
        await completeOrderIfReady(tx, orderId);
      }

      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: billInclude,
      });

      return {
        payment,
        invoice,
        order: updatedOrder,
        paid: fromPaise(newPaidPaise),
        due: fromPaise(
          Math.max(0, totalPaise - newPaidPaise),
        ),
        isFullyPaid,
      };
    },
    {
      isolationLevel: "Serializable",
    },
  );
}

// ============================================
// GET RECEIPT
// ============================================

export async function getReceipt(orderId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { orderId },
    include: {
      order: {
        include: {
          table: true,
          items: true,
          payments: {
            where: { status: "COMPLETED" },
            orderBy: { createdAt: "asc" },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    throw new Error(
      "Invoice not found. Record a payment first.",
    );
  }

  return invoice;
}
