import { prisma } from "../db/prisma.js";

export async function getKitchenStations() {
  return prisma.kitchenStation.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createKitchenStation(data: {
  name: string;
  code: string;
}) {
  return prisma.kitchenStation.create({
    data,
  });
}

export async function deactivateKitchenStation(id: string) {
  const station = await prisma.kitchenStation.findUnique({
    where: { id },
    include: {
      menuItems: {
        where: { isAvailable: true },
        select: { id: true },
      },
      tickets: {
        where: {
          status: { in: ["NEW", "PREPARING"] },
        },
        select: { id: true },
      },
    },
  });

  if (!station) {
    throw new Error("Kitchen station not found");
  }

  if (station.menuItems.length || station.tickets.length) {
    throw new Error(
      "Move active menu items and finish active tickets before deactivating this station",
    );
  }

  return prisma.kitchenStation.update({
    where: { id },
    data: { isActive: false },
  });
}