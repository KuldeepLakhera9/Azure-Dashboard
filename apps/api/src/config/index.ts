import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const EnvSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  AZURE_SUBSCRIPTION_ID: z.string().optional(),
  AZURE_TENANT_ID: z.string().optional(),
  AZURE_CLIENT_ID: z.string().optional(),
  AZURE_CLIENT_SECRET: z.string().optional(),
  USE_MOCK_AZURE: z
    .string()
    .transform((val) => val === "true" || val === "1")
    .default("true"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  OPERATIONAL_CACHE_TTL_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  BILLING_CACHE_TTL_MS: z.coerce.number().default(24 * 60 * 60 * 1000), // 24 hours
  // Microsoft Entra ID Authentication
  AUTH_ENABLED: z
    .string()
    .transform((val) => val === "true" || val === "1")
    .default("true"),
  AZURE_AD_TENANT_ID: z.string().optional(),
  AZURE_AD_API_CLIENT_ID: z.string().optional(),
  AZURE_AD_AUDIENCE: z.string().optional(),
  REQUIRED_SCOPE: z.string().default("Dashboard.Read"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.format());
  throw new Error("Invalid backend environment configuration");
}

export const config = parsed.data;
