
import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import {
  cancelOrderSchema,
  createOrderSchema,
} from "../schemas/order.schema.js";
import * as orderService from "../services/order.service.js";

export const listOrders: RequestHandler = asyncHandler(
  async (_req, res) => {
    const orders = await orderService.getOrders();

    res.status(200).json({
      success: true,
      data: orders,
    });
  },
);

export const getOrder: RequestHandler = asyncHandler(
  async (req, res) => {
    const order = await orderService.getOrderById(
      String(req.params.id),
    );

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  },
);

export const createOrder: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid order details",
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

    const order = await orderService.createOrder(
      parsed.data,
      req.user.id,
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  },
);

export const cancelOrder: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = cancelOrderSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "A cancellation reason is required",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const order = await orderService.cancelOrder(
      String(req.params.id),
      parsed.data.reason,
    );

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  },
);
