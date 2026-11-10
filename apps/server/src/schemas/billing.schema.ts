import { z } from "zod";

export const applyDiscountSchema = z.object({
  type: z.enum(["FIXED", "PERCENTAGE"]),
  value: z.coerce.number().positive(),
  reason: z.string().trim().min(3).max(300),
});

export const createPaymentSchema = z.object({
  method: z.enum(["CASH", "CARD", "UPI", "WALLET"]),
  amount: z.coerce.number().positive().max(9999999),
  reference: z.string().trim().max(150).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type ApplyDiscountInput = z.infer<
  typeof applyDiscountSchema
>;

export type CreatePaymentInput = z.infer<
  typeof createPaymentSchema
>;