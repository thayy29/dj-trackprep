import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  DATABASE_URL: z.string().url().describe("PostgreSQL connection URL (postgresql://...)"),
  UPLOAD_DIR: z.string().default("./uploads"),
  EXPORT_DIR: z.string().default("./exports"),
  MAX_FILE_SIZE: z.coerce.number().positive().default(100 * 1024 * 1024), // 100MB
  ENABLE_AUDIO_ANALYSIS: z.coerce.boolean().default(true),
  ANALYSIS_WORKERS: z.coerce.number().int().positive().default(2),
  CORS_ORIGIN: z.string().default("*"),
  API_KEY: z.string().default(""),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
