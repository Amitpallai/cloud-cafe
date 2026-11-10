import { prisma } from "./src/db/prisma.js";

const checks: Array<[string, () => Promise<unknown>]> = [
  [
    "email lookup",
    () =>
      prisma.user.findUnique({
        where: { email: "diagnostic-nobody@example.invalid" },
        select: { id: true },
      }),
  ],
  [
    "owner lookup",
    () => prisma.user.findFirst({ where: { role: "OWNER" }, select: { id: true } }),
  ],
];

try {
  for (const [label, operation] of checks) {
    try {
      const result = await operation();
      console.log(`${label}: OK (${result === null ? "no match" : "matched"})`);
    } catch (error) {
      console.error(`${label}: FAILED`);
      console.error(error);
    }
  }
} finally {
  await prisma.$disconnect();
}
