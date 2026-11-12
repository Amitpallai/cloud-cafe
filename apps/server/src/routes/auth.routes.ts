import { Router, type Router as ExpressRouter } from "express";

import { authController } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import {
  loginLimiter,
  ownerSetupLimiter,
  refreshLimiter,
} from "../middlewares/rate-limit.js";
import { verifyOrigin } from "../middlewares/verify-origin.js";
import { asyncHandler } from "../utils/async-handler.js";

import {
  demoLoginSchema,
  loginSchema,
  ownerSetupSchema,
} from "../schemas/auth.schema.js";

const router:ExpressRouter  = Router();

// Protect cookie-authenticated state-changing endpoints.
router.use(verifyOrigin);

// Initial owner setup — no public signup.
router.post(
  "/setup-owner",
  ownerSetupLimiter,
  validate(ownerSetupSchema),
  asyncHandler(authController.setupOwner),
);

// Shared login for owner and authorized staff.
router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  asyncHandler(authController.login),
);

router.post(
  "/demo-login",
  loginLimiter,
  validate(demoLoginSchema),
  asyncHandler(authController.loginAsDemo),
);

// Rotate the refresh token.
router.post(
  "/refresh",
  refreshLimiter,
  asyncHandler(authController.refresh),
);

// Authenticated logout.
router.post(
  "/logout",
  authenticate,
  asyncHandler(authController.logout),
);

// Current authenticated user.
router.get(
  "/me",
  authenticate,
  asyncHandler(authController.me),
);

export default router;