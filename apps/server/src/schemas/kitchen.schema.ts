import { z } from "zod";

export const createKitchenStationSchema = z.object({
  name: z.string().trim().min(2).max(60),
  code: z.string().trim().min(2).max(20).toUpperCase(),
});

export const updateKitchenTicketStatusSchema = z.object({
  status: z.enum(["PREPARING", "READY"]),
});

export type CreateKitchenStationInput = z.infer<
  typeof createKitchenStationSchema
>;