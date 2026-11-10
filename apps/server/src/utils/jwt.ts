import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthTokenPayload } from "../types/auth.types.js";

export const generateAccessToken = (
  payload: AuthTokenPayload,
): string => {
  return jwt.sign(
    payload,
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
    },
  );
};

export const generateRefreshToken = (
  payload: AuthTokenPayload,
): string => {
  return jwt.sign(
    payload,
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
    },
  );
};

export const verifyAccessToken = (token: string): AuthTokenPayload => {
  return jwt.verify(
    token,
    env.JWT_ACCESS_SECRET,
  ) as AuthTokenPayload;
};

export const verifyRefreshToken = (token: string): AuthTokenPayload => {
  return jwt.verify(
    token,
    env.JWT_REFRESH_SECRET,
  ) as AuthTokenPayload;
};