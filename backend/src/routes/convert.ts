import { Router, Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validation.js";
import { getDb } from "../db/database.js";
import { ConvertRepository } from "../repositories/ConvertRepository.js";
import { ConvertService } from "../services/convertService.js";
import { logger } from "../logger.js";

const router: Router = Router();

let presetInitialized = false;

// GET /api/convert/presets - List all convert presets
router.get(
  "/presets",
  asyncHandler(async (req: Request, res: Response) => {
    const db = getDb();
    const repository = new ConvertRepository(db);
    const service = new ConvertService(repository);

    // Initialize presets on first request
    if (!presetInitialized) {
      await service.initializePresets();
      presetInitialized = true;
    }

    const presets = await service.getPresets();
    res.json({ presets });
  })
);

// GET /api/convert/presets/:id - Get single preset
router.get(
  "/presets/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const db = getDb();
    const repository = new ConvertRepository(db);
    const service = new ConvertService(repository);
    const preset = await service.getPreset(req.params.id);
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
  asyncHandler(async (req: Request, res: Response) => {
    const db = getDb();
    const repository = new ConvertRepository(db);
    const service = new ConvertService(repository);

    const exportJob = await service.createExport(req.body.playlist_id, req.body.preset_id);

    // Start processing in background
    processExport(service, exportJob.id).catch((err) => {
      logger.error(`Export processing failed for ${exportJob.id}:`, err);
    });

    res.status(201).json({ export: exportJob });
  })
);

// GET /api/convert/exports/:id - Get export job status
router.get(
  "/exports/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const db = getDb();
    const repository = new ConvertRepository(db);
    const service = new ConvertService(repository);
    const exportJob = await service.getExport(req.params.id);
    if (!exportJob) {
      throw new AppError(404, "Export not found", "EXPORT_NOT_FOUND");
    }
    res.json({ export: exportJob });
  })
);

async function processExport(service: ConvertService, exportId: string): Promise<void> {
  try {
    const exportJob = await service.getExport(exportId);
    if (!exportJob) return;

    await service.updateExportStatus(exportId, "processing");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockOutputPath = `/exports/${exportId}/playlist.zip`;
    await service.updateExportStatus(exportId, "completed", mockOutputPath);
    logger.info(`Export completed: ${exportId}`);
  } catch (error) {
    logger.error(`Export processing error for ${exportId}:`, error);
    await service.updateExportStatus(exportId, "error");
  }
}

export default router;
