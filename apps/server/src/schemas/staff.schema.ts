import { z } from "zod";

const userRoleEnum = z.enum([
  "OWNER",
  "MANAGER",
  "CASHIER",
  "KITCHEN",
  "WAITER",
]);

const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters")
  .max(72, "Password must not exceed 72 characters");

export const createStaffSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().email().transform((email) => email.toLowerCase().trim()),
  password: passwordSchema,
  role: userRoleEnum.refine((role) => role !== "OWNER", {
    message: "Owner accounts cannot be created through staff management",
  }),
  employeeId: z.string().trim().min(2).max(50).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
});

export const updateStaffSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z
    .string()
    .email()
    .transform((email) => email.toLowerCase().trim())
    .optional(),
  password: passwordSchema.optional(),
  role: userRoleEnum.refine((role) => role !== "OWNER", {
    message: "Owner role cannot be assigned to staff members",
  }).optional(),
  employeeId: z.string().trim().min(2).max(50).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  isActive: z.boolean().optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
