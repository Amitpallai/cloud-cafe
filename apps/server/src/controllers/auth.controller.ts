import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import {
  setAuthCookies,
  clearAuthCookies,
} from "../utils/cookies.js";
import { AppError } from "../errors/AppError.js";

export const authController = {
  async setupOwner(req: Request, res: Response) {
    const session = await authService.setupOwner(req.body);

    setAuthCookies(
      res,
      session.accessToken,
      session.refreshToken,
    );

    res.status(201).json({
      success: true,
      message: "Owner account created successfully",
      data: { user: session.user },
    });
  },

  async login(req: Request, res: Response) {
    const session = await authService.login(req.body);

    setAuthCookies(
      res,
      session.accessToken,
      session.refreshToken,
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user: session.user },
    });
  },

  async loginAsDemo(req: Request, res: Response) {
    const session = await authService.loginAsDemo(req.body.role);

    setAuthCookies(
      res,
      session.accessToken,
      session.refreshToken,
    );

    res.status(200).json({
      success: true,
      message: "Demo login successful",
      data: { user: session.user },
    });
  },

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new AppError("Refresh token missing", 401);
    }

    const session = await authService.refresh(refreshToken);

    setAuthCookies(
      res,
      session.accessToken,
      session.refreshToken,
    );

    res.status(200).json({
      success: true,
      message: "Session refreshed",
      data: { user: session.user },
    });
  },

  async logout(req: Request, res: Response) {
    if (req.user) {
      await authService.logout(req.user.id);
    }

    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  },

  async me(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const user = await authService.getCurrentUser(req.user.id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  },
};