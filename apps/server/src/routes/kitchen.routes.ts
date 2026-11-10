import { Router, type Router as ExpressRouter } from "express";

import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

import {
  changeKitchenTicketStatus,
  createKitchenStation,
  getKitchenTicket,
  listKitchenStations,
  listKitchenTickets,
  sendOrderToKitchen,
} from "../controllers/kitchen.controller.js";

const router: ExpressRouter = Router();

// Owner, manager and kitchen staff can view tickets.
const kitchenAccess = authorize(
  "OWNER",
  "MANAGER",
  "KITCHEN",
);

router.get("/stations", authenticate, kitchenAccess, listKitchenStations);
router.get("/tickets", authenticate, kitchenAccess, listKitchenTickets);
router.get("/tickets/:id", authenticate, kitchenAccess, getKitchenTicket);

// Only owner/manager can create stations.
router.post(
  "/stations",
  authenticate,
  authorize("OWNER", "MANAGER"),
  createKitchenStation,
);

// POS staff can send orders to the kitchen.
router.post(
  "/orders/:id/send",
  authenticate,
  authorize("OWNER", "MANAGER", "CASHIER", "WAITER"),
  sendOrderToKitchen,
);

// Kitchen staff update ticket status.
router.patch(
  "/tickets/:id/status",
  authenticate,
  authorize("OWNER", "MANAGER", "KITCHEN"),
  changeKitchenTicketStatus,
);

export default router;