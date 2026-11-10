import { prisma } from "../db/prisma.js";
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
    throw new Error("A table with this number already exists");
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
    throw new Error("Table not found");
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
      throw new Error("This table number is already in use");
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
    throw new Error("Table not found");
  }

  if (existing.status === "OCCUPIED" && status === "AVAILABLE") {
    throw new Error(
      "An occupied table cannot be marked available manually",
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
    throw new Error("Table not found");
  }

  if (existing.status === "OCCUPIED") {
    throw new Error("Cannot deactivate an occupied table");
  }

  return prisma.diningTable.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
}