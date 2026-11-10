import { Router, type Router as ExpressRouter } from "express";

import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import {
  createStaffMember,
  getStaffMember,
  listStaffMembers,
  toggleStaffStatus,
  updateStaffMember,
} from "../controllers/staff.controller.js";
import {
  createStaffSchema,
  updateStaffSchema,
} from "../schemas/staff.schema.js";

const router: ExpressRouter = Router();

router.use(authenticate);

router.get(
  "/",
  authorize("OWNER", "MANAGER"),
  listStaffMembers,
);

router.get(
  "/:id",
  authorize("OWNER", "MANAGER"),
  getStaffMember,
);

router.post(
  "/",
  authorize("OWNER", "MANAGER"),
  validate(createStaffSchema),
  createStaffMember,
);

router.patch(
  "/:id",
  authorize("OWNER"),
  validate(updateStaffSchema),
  updateStaffMember,
);

router.patch(
  "/:id/status",
  authorize("OWNER"),
  toggleStaffStatus,
);

export default router;