import { Router, type Router as ExpressRouter } from "express";

import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { uploadMenuImage } from "../middlewares/upload-image.js";

import {
  createMenuCategory,
  createMenuItem,
  listMenuCategories,
  listMenuItems,
  removeMenuItem,
  updateMenuItem,
} from "../controllers/menu.controller.js";

const router: ExpressRouter = Router();

router.get("/", authenticate, listMenuItems);
router.get("/categories", authenticate, listMenuCategories);

router.post(
  "/categories",
  authenticate,
  authorize("OWNER", "MANAGER"),
  createMenuCategory,
);

router.post(
  "/",
  authenticate,
  authorize("OWNER", "MANAGER"),
  uploadMenuImage.single("image"),
  createMenuItem,
);

router.patch(
  "/:id",
  authenticate,
  authorize("OWNER", "MANAGER"),
  uploadMenuImage.single("image"),
  updateMenuItem,
);

router.delete(
  "/:id",
  authenticate,
  authorize("OWNER", "MANAGER"),
  removeMenuItem,
);

export default router;