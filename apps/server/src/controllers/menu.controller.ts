import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import {
  createMenuItemSchema,
  updateMenuItemSchema,
} from "../schemas/menu.schema.js";
import * as menuService from "../services/menu.service.js";
import { createMenuCategorySchema } from "../schemas/menu.schema.js";

export const createMenuCategory: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = createMenuCategorySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid category details",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const category = await menuService.createMenuCategory({
      ...parsed.data,
      sortOrder: parsed.data.sortOrder ?? 0,
    });

    res.status(201).json({
      success: true,
      message: "Menu category created successfully",
      data: category,
    });
  },
);

export const listMenuItems: RequestHandler = asyncHandler(
  async (_req, res) => {
    const items = await menuService.getMenuItems();

    res.status(200).json({
      success: true,
      data: items,
    });
  },
);

export const listMenuCategories: RequestHandler = asyncHandler(
  async (_req, res) => {
    const categories = await menuService.getActiveMenuCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  },
);

export const createMenuItem: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = createMenuItemSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid menu item details",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const item = await menuService.createMenuItem(
      parsed.data,
      req.file,
    );

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data: item,
    });
  },
);

export const updateMenuItem: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = updateMenuItemSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid menu item details",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const item = await menuService.updateMenuItem(
      String(req.params.id),
      parsed.data,
      req.file,
    );

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      data: item,
    });
  },
);

export const removeMenuItem: RequestHandler = asyncHandler(
  async (req, res) => {
    await menuService.deleteMenuItem(String(req.params.id));

    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });
  },
);