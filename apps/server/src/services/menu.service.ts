import { prisma } from "../db/prisma.js";
import {
  deleteCloudinaryImage,
  uploadMenuImage,
} from "../utils/cloudinary.js";
import type {
  CreateMenuItemInput,
  UpdateMenuItemInput,
} from "../schemas/menu.schema.js";

export async function getMenuItems() {
  return prisma.menuItem.findMany({
    include: {
      category: true,
    },
    orderBy: [
      { sortOrder: "asc" },
      { name: "asc" },
    ],
  });
}

export async function createMenuCategory(data: {
  name: string;
  description?: string;
  sortOrder: number;
}) {
  return prisma.menuCategory.create({
    data,
  });
}

export async function getMenuItemById(id: string) {
  return prisma.menuItem.findUnique({
    where: { id },
    include: { category: true },
  });
}

export async function createMenuItem(
  data: CreateMenuItemInput,
  image?: Express.Multer.File,
) {
  const category = await prisma.menuCategory.findUnique({
    where: { id: data.categoryId },
  });

  if (!category || !category.isActive) {
    throw new Error("Menu category not found or inactive");
  }

  let uploadedImage: Awaited<ReturnType<typeof uploadMenuImage>> | undefined;

  if (image) {
    uploadedImage = await uploadMenuImage(image.buffer);
  }

  try {
    return await prisma.menuItem.create({
      data: {
        ...data,
        imageUrl: uploadedImage?.secure_url,
        imagePublicId: uploadedImage?.public_id,
      },
      include: { category: true },
    });
  } catch (error) {
    if (uploadedImage) {
      await deleteCloudinaryImage(uploadedImage.public_id).catch(
        console.error,
      );
    }

    throw error;
  }
}

export async function updateMenuItem(
  id: string,
  data: UpdateMenuItemInput,
  image?: Express.Multer.File,
) {
  const existing = await prisma.menuItem.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Menu item not found");
  }

  if (data.categoryId) {
    const category = await prisma.menuCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || !category.isActive) {
      throw new Error("Menu category not found or inactive");
    }
  }

  const uploadedImage = image
    ? await uploadMenuImage(image.buffer)
    : undefined;

  try {
    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...data,
        ...(uploadedImage
          ? {
              imageUrl: uploadedImage.secure_url,
              imagePublicId: uploadedImage.public_id,
            }
          : {}),
      },
      include: { category: true },
    });

    // Delete the old image only after the database update succeeds.
    if (uploadedImage && existing.imagePublicId) {
      await deleteCloudinaryImage(existing.imagePublicId).catch(
        console.error,
      );
    }

    return updated;
  } catch (error) {
    if (uploadedImage) {
      await deleteCloudinaryImage(uploadedImage.public_id).catch(
        console.error,
      );
    }

    throw error;
  }
}

export async function deleteMenuItem(id: string) {
  const existing = await prisma.menuItem.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Menu item not found");
  }

  // Database deletion happens first. Remove the image afterward.
  const deleted = await prisma.menuItem.delete({
    where: { id },
  });

  if (existing.imagePublicId) {
    await deleteCloudinaryImage(existing.imagePublicId).catch(
      console.error,
    );
  }

  return deleted;
}

export async function getActiveMenuCategories() {
  return prisma.menuCategory.findMany({
    where: { isActive: true },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
}

