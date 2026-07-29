import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { validateBody } from "../middleware/validation";
import { getDb } from "../db/database";
import { ConvertRepository } from "../repositories/ConvertRepository";
import { PlaylistRepository } from "../repositories/PlaylistRepository";
import { TrackRepository } from "../repositories/TrackRepository";
import { ConvertService } from "../services/convertService";
import { ConvertController } from "../controllers/ConvertController";
import { logger } from "../logger";
import { env } from "../env";

const router: Router = Router();

let controller: ConvertController;
let convertService: ConvertService;
let playlistRepository: PlaylistRepository;
let trackRepository: TrackRepository;

router.use(
  asyncHandler(async (req, res, next) => {
    if (!controller) {
      const db = getDb();
      const repository = new ConvertRepository(db);
      convertService = new ConvertService(repository);
      playlistRepository = new PlaylistRepository(db);
      trackRepository = new TrackRepository(db);
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

// GET /api/convert/exports/:id/download - Download export ZIP
router.get(
  "/exports/:id/download",
  asyncHandler(async (req, res, next) => {
    const exportJob = await convertService.getExport(req.params.id);
    if (!exportJob) {
      throw new AppError(404, "Export not found", "EXPORT_NOT_FOUND");
    }

    if (exportJob.status !== "completed" || !exportJob.output_path) {
      throw new AppError(400, "Export is not ready for download", "EXPORT_NOT_READY");
    }

    // Construct full path (output_path is relative like /exports/:id/playlist.zip)
    const basePath = env.EXPORT_DIR || "./exports";
    const zipPath = require("path").join(basePath, exportJob.output_path);

    // Verify file exists
    if (!require("fs").existsSync(zipPath)) {
      throw new AppError(404, "Export file not found", "FILE_NOT_FOUND");
    }

    // Send file as download
    const filename = require("path").basename(zipPath);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const fileStream = require("fs").createReadStream(zipPath);
    fileStream.pipe(res);

    fileStream.on("error", (err) => {
      logger.error(`Error streaming export file:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: { message: "Error downloading file", code: "DOWNLOAD_ERROR" } });
      }
    });
  })
);

async function processExport(exportId: string): Promise<void> {
  try {
    const exportJob = await convertService.getExport(exportId);
    if (!exportJob) return;

    await convertService.updateExportStatus(exportId, "processing");

    // Get playlist and its tracks
    const playlist = await playlistRepository.getByIdWithTracks(exportJob.playlist_id);
    if (!playlist) {
      throw new AppError(404, "Playlist not found", "PLAYLIST_NOT_FOUND");
    }

    // Get track file paths
    const trackFilePaths = playlist.tracks.map((t: any) => t.file_path).filter((p: any) => p);

    if (trackFilePaths.length === 0) {
      throw new AppError(400, "Playlist has no tracks", "NO_TRACKS");
    }

    // Create ZIP file
    const zipPath = await convertService.createZipExport(
      exportId,
      exportJob.playlist_id,
      playlist.title,
      trackFilePaths,
      env.EXPORT_DIR || "./exports"
    );

    // Update export with completed status
    const relativeZipPath = `/exports/${exportId}/${require("path").basename(zipPath)}`;
    await convertService.updateExportStatus(exportId, "completed", relativeZipPath);
    logger.info(`Export completed: ${exportId} - ${zipPath}`);
  } catch (error) {
    logger.error(`Export processing error for ${exportId}:`, error);
    await convertService.updateExportStatus(exportId, "error");
  }
}

export default router;
