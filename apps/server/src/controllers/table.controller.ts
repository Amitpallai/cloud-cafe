import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import {
  createTableSchema,
  updateTableSchema,
  updateTableStatusSchema,
} from "../schemas/table.schema.js";
import * as tableService from "../services/table.service.js";

export const listTables: RequestHandler = asyncHandler(
  async (_req, res) => {
    const tables = await tableService.getTables();

    res.status(200).json({
      success: true,
      data: tables,
    });
  },
);

export const getTable: RequestHandler = asyncHandler(
  async (req, res) => {
    const table = await tableService.getTableById(
      String(req.params.id),
    );

    if (!table) {
      res.status(404).json({
        success: false,
        message: "Table not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: table,
    });
  },
);

export const createTable: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = createTableSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid table details",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const table = await tableService.createTable(parsed.data);

    res.status(201).json({
      success: true,
      message: "Table created successfully",
      data: table,
    });
  },
);

export const updateTable: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = updateTableSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid table details",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const table = await tableService.updateTable(
      String(req.params.id),
      parsed.data,
    );

    res.status(200).json({
      success: true,
      message: "Table updated successfully",
      data: table,
    });
  },
);

export const changeTableStatus: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = updateTableStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid table status",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const table = await tableService.updateTableStatus(
      String(req.params.id),
      parsed.data.status,
    );

    res.status(200).json({
      success: true,
      message: "Table status updated successfully",
      data: table,
    });
  },
);

export const deleteTable: RequestHandler = asyncHandler(
  async (req, res) => {
    await tableService.deactivateTable(String(req.params.id));

    res.status(200).json({
      success: true,
      message: "Table deactivated successfully",
    });
  },
);