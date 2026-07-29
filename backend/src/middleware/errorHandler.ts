import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../logger";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error({ err, url: req.url, method: req.method }, "Request error");

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code || "INTERNAL_ERROR",
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Validation error",
        code: "VALIDATION_ERROR",
        details: err.errors,
      },
    });
    return;
  }

  res.status(500).json({
    error: {
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    },
  });
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
