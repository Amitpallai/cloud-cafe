import { prisma } from "../db/prisma.js";
import { AppError } from "../errors/AppError.js";
import type {
  CreateTableInput,
  UpdateTableInput,
} from "../schemas/table.schema.js";

export async function getTables() {
  return prisma.diningTable.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      tableNumber: "asc",
    },
  });
}

export async function getTableById(id: string) {
  return prisma.diningTable.findFirst({
    where: {
      id,
      isActive: true,
    },
  });
}

export async function createTable(data: CreateTableInput) {
  const existing = await prisma.diningTable.findUnique({
    where: {
      tableNumber: data.tableNumber,
    },
  });

  if (existing) {
    throw new AppError("A table with this number already exists", 409);
  }

  return prisma.diningTable.create({
    data: {
      tableNumber: data.tableNumber,
      name: data.name,
      capacity: data.capacity,
      section: data.section,
      type: data.type,
    },
  });
}

export async function updateTable(
  id: string,
  data: UpdateTableInput,
) {
  const existing = await getTableById(id);

  if (!existing) {
    throw new AppError("Table not found", 404);
  }

  if (
    data.tableNumber &&
    data.tableNumber !== existing.tableNumber
  ) {
    const duplicate = await prisma.diningTable.findUnique({
      where: {
        tableNumber: data.tableNumber,
      },
    });

    if (duplicate) {
      throw new AppError("This table number is already in use", 409);
    }
  }

  return prisma.diningTable.update({
    where: { id },
    data,
  });
}

export async function updateTableStatus(
  id: string,
  status: "AVAILABLE" | "RESERVED" | "OUT_OF_SERVICE",
) {
  const existing = await getTableById(id);

  if (!existing) {
    throw new AppError("Table not found", 404);
  }

  if (existing.status === "OCCUPIED" && status === "AVAILABLE") {
    throw new AppError(
      "An occupied table cannot be marked available manually",
      409,
    );
  }

  return prisma.diningTable.update({
    where: { id },
    data: { status },
  });
}

export async function deactivateTable(id: string) {
  const existing = await getTableById(id);

  if (!existing) {
    throw new AppError("Table not found", 404);
  }

  if (existing.status === "OCCUPIED") {
    throw new AppError("Cannot deactivate an occupied table", 409);
  }

  return prisma.diningTable.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
}