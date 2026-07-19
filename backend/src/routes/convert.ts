import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validation.js";
import { getDb } from "../db/database.js";
import { ConvertRepository } from "../repositories/ConvertRepository.js";
import { ConvertService } from "../services/convertService.js";
import { ConvertController } from "../controllers/ConvertController.js";
import { logger } from "../logger.js";

const router: Router = Router();

let controller: ConvertController;
let convertService: ConvertService;

router.use(
  asyncHandler(async (req, res, next) => {
    if (!controller) {
      const db = getDb();
      const repository = new ConvertRepository(db);
      convertService = new ConvertService(repository);
      controller = new ConvertController(convertService);

      // Initialize presets on first use
      await convertService.initializePresets();
    }
    next();
  })
);

// GET /api/convert/presets - List all convert presets
router.get(
  "/presets",
  asyncHandler(async (req, res, next) => {
    controller.getPresets(req, res, next);
  })
);

// GET /api/convert/presets/:id - Get single preset
router.get(
  "/presets/:id",
  asyncHandler(async (req, res, next) => {
    controller.getPreset(req, res, next);
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
  asyncHandler(async (req, res, next) => {
    controller.createExport(req, res, next);

    // Parse the response to get export ID and start processing
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (body.export?.id) {
        processExport(body.export.id).catch((err) => {
          logger.error(`Export processing failed for ${body.export.id}:`, err);
        });
      }
      return originalJson(body);
    };
  })
);

// GET /api/convert/exports/:id - Get export job status
router.get(
  "/exports/:id",
  asyncHandler(async (req, res, next) => {
    controller.getExport(req, res, next);
  })
);

async function processExport(exportId: string): Promise<void> {
  try {
    const exportJob = await convertService.getExport(exportId);
    if (!exportJob) return;

    await convertService.updateExportStatus(exportId, "processing");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockOutputPath = `/exports/${exportId}/playlist.zip`;
    await convertService.updateExportStatus(exportId, "completed", mockOutputPath);
    logger.info(`Export completed: ${exportId}`);
  } catch (error) {
    logger.error(`Export processing error for ${exportId}:`, error);
    await convertService.updateExportStatus(exportId, "error");
  }
}

export default router;
