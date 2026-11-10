import { z } from "zod";

export const createOrderSchema = z.object({
  tableId: z.string().min(1),
  notes: z.string().trim().max(1000).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(100),
        notes: z.string().trim().max(500).optional(),
      }),
    )
    .min(1)
    .max(100),
});

export const addOrderItemsSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(100),
        notes: z.string().trim().max(500).optional(),
      }),
    )
    .min(1)
    .max(100),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;