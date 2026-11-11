import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  CLIENT_URL: z.string().url(),

  // Neon PostgreSQL
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),

  // Authentication
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  OWNER_SETUP_SECRET: z.string().min(32),

  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),

  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  TAX_RATE_PERCENT: z.coerce.number().min(0).max(100).default(0),
});

const parsedEnv = envSchema.parse(process.env);

if (parsedEnv.JWT_ACCESS_SECRET === parsedEnv.JWT_REFRESH_SECRET) {
  throw new Error("JWT access and refresh secrets must be different.");
}

export const env = parsedEnv;
