import { z } from "zod";

export const createTableSchema = z.object({
  tableNumber: z.string().trim().min(1).max(20),
  name: z.string().trim().max(60).optional(),
  capacity: z.coerce.number().int().min(1).max(30).default(2),
  section: z.string().trim().max(60).optional(),
  type: z.enum(["AC", "NON_AC"]).default("AC"),
});

export const updateTableSchema = createTableSchema.partial();

export const updateTableStatusSchema = z.object({
  status: z.enum([
    "AVAILABLE",
    "RESERVED",
    "OUT_OF_SERVICE",
  ]),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;