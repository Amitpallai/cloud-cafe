import { Router, type Router as ExpressRouter } from "express";

import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

import {
  applyDiscount,
  getBill,
  getReceipt,
  recordPayment,
} from "../controllers/billing.controller.js";

const router: ExpressRouter = Router();

const billingStaff = authorize(
  "OWNER",
  "MANAGER",
  "CASHIER",
);

router.get("/:orderId", authenticate, billingStaff, getBill);

router.get(
  "/:orderId/receipt",
  authenticate,
  billingStaff,
  getReceipt,
);

router.post(
  "/:orderId/discount",
  authenticate,
  authorize("OWNER", "MANAGER"),
  applyDiscount,
);

router.post(
  "/:orderId/payments",
  authenticate,
  billingStaff,
  recordPayment,
);

export default router;