
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "./prisma.js";

export async function withOwnerSetupLock<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      // Cast PostgreSQL void result to text so Neon adapter
      // and Prisma can deserialize the result.
      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(741852963)::text AS lock_result
      `;

      return callback(tx);
    },
    {
      maxWait: 15000,
      timeout: 30000,
    },
  );
}
