import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import {
  createKitchenStationSchema,
  updateKitchenTicketStatusSchema,
} from "../schemas/kitchen.schema.js";
import * as kotService from "../services/kot.service.js";
import * as kitchenService from "../services/kitchen.service.js";
import * as stationService from "../services/kitchen-station.service.js";
import { emitKitchenEvent } from "../sockets/socket-instance.js";

export const listKitchenStations: RequestHandler = asyncHandler(
  async (_req, res) => {
    const stations = await stationService.getKitchenStations();

    res.status(200).json({
      success: true,
      data: stations,
    });
  },
);

export const createKitchenStation: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = createKitchenStationSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid kitchen station details",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const station = await stationService.createKitchenStation(
      parsed.data,
    );

    res.status(201).json({
      success: true,
      message: "Kitchen station created",
      data: station,
    });
  },
);

export const sendOrderToKitchen: RequestHandler = asyncHandler(
  async (req, res) => {
    const tickets = await kotService.sendOrderToKitchen(
      String(req.params.id),
    );

    for (const ticket of tickets) {
      emitKitchenEvent("kot:new", ticket);
    }

    res.status(201).json({
      success: true,
      message: "Order sent to kitchen",
      data: tickets,
    });
  },
);

export const listKitchenTickets: RequestHandler = asyncHandler(
  async (_req, res) => {
    const tickets = await kitchenService.getKitchenTickets();

    res.status(200).json({
      success: true,
      data: tickets,
    });
  },
);

export const getKitchenTicket: RequestHandler = asyncHandler(
  async (req, res) => {
    const ticket = await kitchenService.getKitchenTicketById(
      String(req.params.id),
    );

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Kitchen ticket not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  },
);

export const changeKitchenTicketStatus: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = updateKitchenTicketStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid ticket status",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const ticket = await kitchenService.updateKitchenTicketStatus(
      String(req.params.id),
      parsed.data.status,
    );

    emitKitchenEvent("kot:updated", ticket);

    res.status(200).json({
      success: true,
      message: "Kitchen ticket updated",
      data: ticket,
    });
  },
);