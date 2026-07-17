import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler.js";

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(400, "Validation failed", "VALIDATION_ERROR");
      }
      throw error;
    }
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(400, "Query validation failed", "VALIDATION_ERROR");
      }
      throw error;
    }
  };
}

// Common schemas
export const uuidSchema = z.string().uuid();
export const stringSchema = z.string().min(1);
export const numberSchema = z.number().positive();
export const camelotKeySchema = z.string().regex(/^([1-9]|1[0-2])[AB]$/);
export const bpmSchema = z.number().min(60).max(300);
export const energySchema = z.number().int().min(1).max(10);
