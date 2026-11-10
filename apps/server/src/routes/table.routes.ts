import { Router, type Router as ExpressRouter } from "express";

import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

import {
  changeTableStatus,
  createTable,
  deleteTable,
  getTable,
  listTables,
  updateTable,
} from "../controllers/table.controller.js";

const router: ExpressRouter = Router();

// All authenticated staff can view tables.
router.get("/", authenticate, listTables);
router.get("/:id", authenticate, getTable);

// Owner and manager can manage tables.
router.post(
  "/",
  authenticate,
  authorize("OWNER", "MANAGER"),
  createTable,
);

router.patch(
  "/:id",
  authenticate,
  authorize("OWNER", "MANAGER"),
  updateTable,
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("OWNER", "MANAGER"),
  changeTableStatus,
);

router.delete(
  "/:id",
  authenticate,
  authorize("OWNER", "MANAGER"),
  deleteTable,
);

export default router;