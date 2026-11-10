import { z } from "zod";

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
  price: z.coerce.number().positive().max(999999),
  categoryId: z.string().min(1),
  preparationTimeMinutes: z.coerce.number().int().min(1).max(240).default(10),
  sortOrder: z.coerce.number().int().default(0),
  isAvailable: z.coerce.boolean().default(true),
});

export const createMenuCategorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(500).optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export type CreateMenuItemInput = z.infer<
  typeof createMenuItemSchema
>;

export type UpdateMenuItemInput = z.infer<
  typeof updateMenuItemSchema
>;