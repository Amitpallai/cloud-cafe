import type { UserRole } from "../generated/prisma/client.js";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}