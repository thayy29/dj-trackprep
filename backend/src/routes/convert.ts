import { Router, Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validation.js";
import * as convertService from "../services/convertService.js";
import { logger } from "../logger.js";

const router: Router = Router();

// GET /api/convert/presets - List all convert presets
router.get(
  "/presets",
  asyncHandler(async (req, res) => {
    const presets = await convertService.getPresets();
    res.json({ presets });
  })
);

// GET /api/convert/presets/:id - Get single preset
router.get(
  "/presets/:id",
  asyncHandler(async (req, res) => {
    const preset = await convertService.getPreset(req.params.id);
    if (!preset) {
      throw new AppError(404, "Preset not found", "PRESET_NOT_FOUND");
    }
    res.json({ preset });
  })
);

// POST /api/convert/exports - Create new export job
const createExportSchema = z.object({
  playlist_id: z.string().uuid(),
  preset_id: z.string().uuid(),
});

router.post(
  "/exports",
  validateBody(createExportSchema),
  asyncHandler(async (req, res) => {
    const exportJob = await convertService.createExport(
      req.body.playlist_id,
      req.body.preset_id
    );

    // Start processing in background
    processExport(exportJob.id).catch((err) => {
      logger.error(`Export processing failed for ${exportJob.id}:`, err);
    });

    res.status(201).json({ export: exportJob });
  })
);

// GET /api/convert/exports/:id - Get export job status
router.get(
  "/exports/:id",
  asyncHandler(async (req, res) => {
    const exportJob = await convertService.getExport(req.params.id);
    if (!exportJob) {
      throw new AppError(404, "Export not found", "EXPORT_NOT_FOUND");
    }
    res.json({ export: exportJob });
  })
);

/**
 * Mock export processing
 * TODO: Implement real audio conversion using ffmpeg
 */
async function processExport(exportId: string): Promise<void> {
  try {
    const exportJob = await convertService.getExport(exportId);
    if (!exportJob) return;

    // Update to processing
    await convertService.updateExportStatus(exportId, "processing");

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // TODO: Generate actual ZIP file with converted tracks
    const mockOutputPath = `/exports/${exportId}/playlist.zip`;

    // Mark as completed
    await convertService.updateExportStatus(exportId, "completed", mockOutputPath);
    logger.info(`Export completed: ${exportId}`);
  } catch (error) {
    logger.error(`Export processing error for ${exportId}:`, error);
    await convertService.updateExportStatus(exportId, "error");
  }
}

export default router;
