import type { UserRole } from "../generated/prisma/client.js";

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  OWNER: ["*"],

  MANAGER: [
    "dashboard:read",
    "menu:read",
    "menu:write",
    "orders:read",
    "orders:write",
    "tables:read",
    "tables:write",
    "inventory:read",
    "inventory:write",
    "reports:read",
    "staff:read",
    "staff:create",
  ],

  CASHIER: [
    "dashboard:read",
    "pos:read",
    "pos:write",
    "orders:read",
    "orders:create",
    "customers:read",
    "customers:write",
  ],

  KITCHEN: [
    "kitchen:read",
    "kot:read",
    "kot:update",
    "kds:read",
    "kds:update",
  ],

  WAITER: [
    "tables:read",
    "tables:update",
    "orders:read",
    "orders:create",
  ],
};