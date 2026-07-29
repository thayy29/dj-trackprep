import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { AppError } from "./errorHandler";
import { env } from "../env";
import { logger } from "../logger";

/**
 * API Key validation middleware
 * Checks for x-api-key header if API_KEY is configured
 */
export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip API key check if not configured
  if (!env.API_KEY) {
    next();
    return;
  }

  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey || apiKey !== env.API_KEY) {
    throw new AppError(401, "Invalid or missing API key", "UNAUTHORIZED");
  }

  next();
}

/**
 * CORS configuration
 * Restricts API access to configured origin(s)
 */
export function corsConfig() {
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl requests)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Allow if origin is in whitelist
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-api-key", "Authorization"],
  };
}

/**
 * Rate limiting middleware
 * Limits requests to prevent abuse
 */
export const rateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Max 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: (req) => {
    // Don't rate limit health check
    return req.path === "/health";
  },
  message: "Too many requests, please try again later",
  handler: (req, res) => {
    res.status(429).json({
      error: {
        message: "Too many requests, please try again later",
        code: "RATE_LIMIT_EXCEEDED",
      },
    });
  },
});

/**
 * Strict rate limit for upload endpoints (higher sensitivity)
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 25, // Max 25 uploads per windowMs
  skip: (req) => {
    // Only rate limit POST /api/tracks/upload
    return !req.path.includes("/upload");
  },
  message: "Too many upload requests, please try again later",
  handler: (req, res) => {
    res.status(429).json({
      error: {
        message: "Too many upload requests, please try again later",
        code: "UPLOAD_RATE_LIMIT",
      },
    });
  },
});

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Prevent XSS
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Prevent clickjacking
  res.setHeader("Content-Security-Policy", "default-src 'self'");

  // Disable caching for sensitive endpoints
  if (req.path.includes("/api/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  next();
}
