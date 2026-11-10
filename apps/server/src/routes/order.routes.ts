import { Router, type Router as ExpressRouter } from "express";

import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

import {
  cancelOrder,
  createOrder,
  getOrder,
  listOrders,
} from "../controllers/order.controller.js";

const router: ExpressRouter = Router();

// Owner, manager, cashier and waiter can handle orders.
const orderStaff = authorize(
  "OWNER",
  "MANAGER",
  "CASHIER",
  "WAITER",
);

router.get("/", authenticate, orderStaff, listOrders);
router.get("/:id", authenticate, orderStaff, getOrder);

router.post("/", authenticate, orderStaff, createOrder);

router.post(
  "/:id/cancel",
  authenticate,
  authorize("OWNER", "MANAGER", "CASHIER", "WAITER"),
  cancelOrder,
);

export default router;