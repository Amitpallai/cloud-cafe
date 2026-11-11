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

const tableAccess = authorize(
  "OWNER",
  "MANAGER",
  "CASHIER",
  "KITCHEN",
  "WAITER",
);
const tableManagementAccess = authorize("OWNER", "MANAGER");

// All authenticated staff can view tables, while owner and manager manage them.
router.get("/", authenticate, tableAccess, listTables);
router.get("/:id", authenticate, tableAccess, getTable);

router.post("/", authenticate, tableManagementAccess, createTable);

router.patch("/:id", authenticate, tableManagementAccess, updateTable);

router.patch(
  "/:id/status",
  authenticate,
  tableManagementAccess,
  changeTableStatus,
);

router.delete("/:id", authenticate, tableManagementAccess, deleteTable);

export default router;