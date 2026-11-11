import "dotenv/config";
import {
  demoAccountPassword,
  demoAccounts,
} from "../../demo-accounts.js";
import { prisma } from "../src/db/prisma.js";
import { hashPassword } from "../src/utils/password.js";

async function seedDemoAccounts() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo accounts cannot be seeded in production.");
  }

  const passwordHash = await hashPassword(demoAccountPassword);
  for (const account of demoAccounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        ...account,
        passwordHash,
      },
    });
    console.info(`Demo account ready: ${account.email}`);
  }
}

seedDemoAccounts()
  .catch((error: unknown) => {
    console.error("Could not seed demo accounts:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
