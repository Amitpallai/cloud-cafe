import { timingSafeEqual } from "node:crypto";
import type { UserRole } from "../generated/prisma/client.js";

import { prisma } from "../db/prisma.js";
import { withOwnerSetupLock } from "../db/owner-setup-lock.js";
import { env } from "../config/env.js";
import { AppError } from "../errors/AppError.js";
import type {
  LoginInput,
  OwnerSetupInput,
} from "../schemas/auth.schema.js";

import { hashPassword, comparePassword } from "../utils/password.js";
import { hashToken } from "../utils/token-hash.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string | null;
  phone?: string | null;
  isActive?: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId ?? null,
    phone: user.phone ?? null,
    isActive: user.isActive ?? true,
  };
}

function verifySetupSecret(provided: string): boolean {
  const expected = Buffer.from(env.OWNER_SETUP_SECRET);
  const actual = Buffer.from(provided);

  return (
    expected.length === actual.length &&
    timingSafeEqual(expected, actual)
  );
}

async function createSession(user: SessionUser) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshTokenHash: hashToken(refreshToken),
      lastLoginAt: new Date(),
    },
  });

  return {
    user: publicUser(user),
    accessToken,
    refreshToken,
  };
}

export const authService = {
  async setupOwner(input: OwnerSetupInput) {
    if (!verifySetupSecret(input.setupSecret)) {
      throw new AppError("Invalid owner setup secret", 403);
    }

    const passwordHash = await hashPassword(input.password);

    const owner = await withOwnerSetupLock(async (tx) => {
      const existingOwner = await tx.user.findFirst({
        where: { role: "OWNER" },
        select: { id: true },
      });

      if (existingOwner) {
        throw new AppError("Owner account already exists", 409);
      }

      return tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: "OWNER",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
    });

    return createSession(owner);
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !user.isActive) {
      throw new AppError("Invalid email or password", 401);
    }

    const validPassword = await comparePassword(
      input.password,
      user.passwordHash,
    );

    if (!validPassword) {
      throw new AppError("Invalid email or password", 401);
    }

    return createSession(user);
  },

  async loginAsDemo(role: UserRole) {
    const user = await prisma.user.findUnique({
      where: { email: `demo.${role.toLowerCase()}@cloudcafe.test` },
    });

    if (!user || !user.isActive || user.role !== role) {
      throw new AppError("Demo account is unavailable. Seed demo accounts first.", 503);
    }

    return createSession(user);
  },

  async refresh(refreshToken: string) {
    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        refreshTokenHash: true,
      },
    });

    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new AppError("Session is no longer valid", 401);
    }

    const newPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    // Compare and replace the old hash atomically.
    const result = await prisma.user.updateMany({
      where: {
        id: user.id,
        isActive: true,
        refreshTokenHash: hashToken(refreshToken),
      },
      data: {
        refreshTokenHash: hashToken(newRefreshToken),
        lastLoginAt: new Date(),
      },
    });

    if (result.count !== 1) {
      throw new AppError("Refresh token has already been used", 401);
    }

    return {
      user: publicUser(user),
      accessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(userId: string) {
    await prisma.user.updateMany({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });

    return { message: "Logged out successfully" };
  },

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeId: true,
        phone: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError("User not found", 404);
    }

    return publicUser(user);
  },
};