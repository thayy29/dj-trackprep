import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { env } from "./env";
import { logger } from "./logger";
import { initializeDatabase, closeDatabase, getDb } from "./db/database";
import { errorHandler } from "./middleware/errorHandler";
import { apiKeyMiddleware, corsConfig, rateLimiter, uploadRateLimiter, securityHeadersMiddleware } from "./middleware/security";
import { asyncHandler } from "./middleware/errorHandler";
import tracksRouter from "./routes/tracks.js";
import playlistsRouter from "./routes/playlists.js";
import convertRouter from "./routes/convert.js";

const app = express();

// Middleware - Order matters!

// Security headers first
app.use(securityHeadersMiddleware);

// CORS with configuration
app.use(cors(corsConfig()));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Body parsing
app.use(express.json());

// Rate limiting
app.use(rateLimiter);
app.use(uploadRateLimiter);

// API Key validation (async safe)
app.use(asyncHandler(apiKeyMiddleware));

// Routes
app.use("/api/tracks", tracksRouter);
app.use("/api/playlists", playlistsRouter);
app.use("/api/convert", convertRouter);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: { message: "Not found", code: "NOT_FOUND" } });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info("Shutting down gracefully...");
  await closeDatabase();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start server
async function start(): Promise<void> {
  try {
    await initializeDatabase();

    app.listen(env.PORT, () => {
      logger.info(`Server running on http://localhost:${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
