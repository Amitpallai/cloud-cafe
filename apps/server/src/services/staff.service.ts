import { AppError } from "../errors/AppError.js";
import { prisma } from "../db/prisma.js";
import { hashPassword } from "../utils/password.js";
import type {
  CreateStaffInput,
  UpdateStaffInput,
} from "../schemas/staff.schema.js";

const staffSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  employeeId: true,
  phone: true,
  isActive: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listStaffMembers() {
  return prisma.user.findMany({
    select: staffSelect,
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function getStaffMemberById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: staffSelect,
  });

  if (!user) {
    throw new AppError("Staff member not found", 404);
  }

  return user;
}

export async function createStaffMember(
  input: CreateStaffInput,
  createdById: string,
) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError("A user with this email already exists", 409);
  }

  if (input.employeeId) {
    const existingEmployee = await prisma.user.findUnique({
      where: { employeeId: input.employeeId },
      select: { id: true },
    });

    if (existingEmployee) {
      throw new AppError("Employee ID is already in use", 409);
    }
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      employeeId: input.employeeId ?? null,
      phone: input.phone ?? null,
      createdById,
    },
    select: staffSelect,
  });
}

export async function updateStaffMember(
  id: string,
  input: UpdateStaffInput,
) {
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { ...staffSelect, passwordHash: true },
  });

  if (!existingUser) {
    throw new AppError("Staff member not found", 404);
  }

  if (input.email && input.email !== existingUser.email) {
    const duplicate = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (duplicate) {
      throw new AppError("A user with this email already exists", 409);
    }
  }

  if (input.employeeId && input.employeeId !== existingUser.employeeId) {
    const duplicateEmployee = await prisma.user.findUnique({
      where: { employeeId: input.employeeId },
      select: { id: true },
    });

    if (duplicateEmployee) {
      throw new AppError("Employee ID is already in use", 409);
    }
  }

  const nextPasswordHash = input.password
    ? await hashPassword(input.password)
    : undefined;

  return prisma.user.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.email ? { email: input.email } : {}),
      ...(nextPasswordHash ? { passwordHash: nextPasswordHash } : {}),
      ...(input.role ? { role: input.role } : {}),
      ...(input.employeeId !== undefined ? { employeeId: input.employeeId || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    select: staffSelect,
  });
}

export async function toggleStaffStatus(
  id: string,
  isActive: boolean,
) {
  return updateStaffMember(id, { isActive });
}
