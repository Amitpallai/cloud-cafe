import type { RequestHandler } from "express";
import { z } from "zod";

import { asyncHandler } from "../utils/async-handler.js";
import {
  createStaffSchema,
  updateStaffSchema,
} from "../schemas/staff.schema.js";
import * as staffService from "../services/staff.service.js";

export const listStaffMembers: RequestHandler = asyncHandler(
  async (_req, res) => {
    const staff = await staffService.listStaffMembers();

    res.status(200).json({
      success: true,
      data: staff,
    });
  },
);

export const getStaffMember: RequestHandler = asyncHandler(
  async (req, res) => {
    const staff = await staffService.getStaffMemberById(String(req.params.id));

    res.status(200).json({
      success: true,
      data: staff,
    });
  },
);

export const createStaffMember: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = createStaffSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid staff details",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const currentUserId = req.user?.id;

    if (!currentUserId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const staff = await staffService.createStaffMember(
      parsed.data,
      currentUserId,
    );

    res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      data: staff,
    });
  },
);

export const updateStaffMember: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = updateStaffSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid staff update details",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const staff = await staffService.updateStaffMember(
      String(req.params.id),
      parsed.data,
    );

    res.status(200).json({
      success: true,
      message: "Staff member updated successfully",
      data: staff,
    });
  },
);

export const toggleStaffStatus: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = z.object({ isActive: z.boolean() }).safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid status update",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const staff = await staffService.toggleStaffStatus(
      String(req.params.id),
      parsed.data.isActive,
    );

    res.status(200).json({
      success: true,
      message: "Staff status updated successfully",
      data: staff,
    });
  },
);
