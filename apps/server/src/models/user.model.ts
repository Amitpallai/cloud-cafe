import { prisma } from "../db/prisma.js";
import type { Prisma, UserRole } from "../generated/prisma/client.js";

export const userModel = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  findOwner() {
    return prisma.user.findFirst({
      where: { role: "OWNER" },
    });
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  updateRefreshToken(id: string, refreshTokenHash: string | null) {
    return prisma.user.update({
      where: { id },
      data: { refreshTokenHash },
    });
  },

  updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },

  findByRefreshTokenHash(refreshTokenHash: string) {
    return prisma.user.findFirst({
      where: {
        refreshTokenHash,
        isActive: true,
      },
    });
  },

  findStaff() {
    return prisma.user.findMany({
      where: {
        role: { not: "OWNER" },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeId: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },
};