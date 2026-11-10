import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

const allowedOrigin = new URL(env.CLIENT_URL).origin;

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function verifyOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (safeMethods.has(req.method)) {
    return next();
  }

  const origin = req.get("origin");

  if (!origin || origin !== allowedOrigin) {
    res.status(403).json({
      success: false,
      message: "Request origin is not allowed",
    });
    return;
  }

  next();
}