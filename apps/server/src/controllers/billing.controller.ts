import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import {
  applyDiscountSchema,
  createPaymentSchema,
} from "../schemas/billing.schema.js";
import * as billingService from "../services/billing.service.js";

export const getBill: RequestHandler = asyncHandler(
  async (req, res) => {
    const bill = await billingService.getBill(
      String(req.params.orderId),
    );

    res.status(200).json({
      success: true,
      data: bill,
    });
  },
);

export const applyDiscount: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = applyDiscountSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid discount details",
        errors: parsed.error.flatten(),
      });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const order = await billingService.applyOrderDiscount(
      String(req.params.orderId),
      parsed.data,
      req.user.id,
    );

    res.status(200).json({
      success: true,
      message: "Discount applied successfully",
      data: order,
    });
  },
);

export const recordPayment: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = createPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid payment details",
        errors: parsed.error.flatten(),
      });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const result = await billingService.recordPayment(
      String(req.params.orderId),
      parsed.data,
      req.user.id,
    );

    res.status(201).json({
      success: true,
      message: result.isFullyPaid
        ? "Payment completed"
        : "Partial payment recorded",
      data: result,
    });
  },
);

export const getReceipt: RequestHandler = asyncHandler(
  async (req, res) => {
    const receipt = await billingService.getReceipt(
      String(req.params.orderId),
    );

    res.status(200).json({
      success: true,
      data: receipt,
    });
  },
);