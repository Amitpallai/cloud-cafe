import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters")
  .max(72, "Password must not exceed 72 characters");

export const loginSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

export const demoLoginSchema = z.object({
  role: z.enum(["OWNER", "MANAGER", "CASHIER", "KITCHEN", "WAITER"]),
});

export const ownerSetupSchema = z.object({
  setupSecret: z.string().min(32),
  name: z.string().trim().min(2).max(100),
  email: z.string().email().transform((email) => email.toLowerCase().trim()),
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type OwnerSetupInput = z.infer<typeof ownerSetupSchema>;
