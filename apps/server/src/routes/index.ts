import { Router, type Router as ExpressRouter } from "express";
import authRoutes from "./auth.routes.js";
import menuRoutes from "./menu.routes.js";
import tableRoutes from "./table.routes.js";
import orderRoutes from "./order.routes.js";
import kitchenRoutes from "./kitchen.routes.js";
import billingRoutes from "./billing.routes.js";
import staffRoutes from "./staff.routes.js";

const router: ExpressRouter = Router();

router.use("/auth", authRoutes);
router.use("/menu", menuRoutes);
router.use("/tables", tableRoutes);
router.use("/orders", orderRoutes);
router.use("/kitchen", kitchenRoutes);
router.use("/billing", billingRoutes);
router.use("/staff", staffRoutes);

export default router;