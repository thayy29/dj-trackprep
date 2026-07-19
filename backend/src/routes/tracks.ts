import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { env } from "../env.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validation.js";
import { getDb } from "../db/database.js";
import { TrackRepository } from "../repositories/TrackRepository.js";
import { TrackService } from "../services/trackService.js";
import { logger } from "../logger.js";
import fs from "fs";

const router: Router = Router();

// Configure multer for file uploads
// MIME sniffing for audio files is unreliable across browsers/OSes
// (e.g. WAV can be "audio/wav", "audio/x-wav" or "audio/wave"), so we
// validate by file extension instead.
const allowedExtensions = /\.(mp3|wav|aiff|aif|flac|m4a)$/i;

const upload = multer({
  dest: env.UPLOAD_DIR,
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (allowedExtensions.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new AppError(400, "Invalid file type", "INVALID_FILE_TYPE"));
    }
  },
});

// POST /api/tracks/upload - Upload and create new tracks
router.post(
  "/upload",
  upload.array("files", 50),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.files || req.files.length === 0) {
      throw new AppError(400, "No files uploaded", "NO_FILES");
    }

    const files = req.files as Express.Multer.File[];
    const db = getDb();
    const repository = new TrackRepository(db);
    const service = new TrackService(repository);

    const tracks = [];

    for (const file of files) {
      // Rename file with UUID to avoid collisions
      const ext = path.extname(file.originalname);
      const newFilename = `${uuidv4()}${ext}`;
      const newFilePath = path.join(env.UPLOAD_DIR, newFilename);

      // Move file from temp location to permanent location
      fs.renameSync(file.path, newFilePath);

      // Create track in database
      const track = await service.createTrack(file.originalname, newFilePath, file.size);
      tracks.push(track);
    }

    res.status(201).json({ tracks });
  })
);

// GET /api/tracks - List all tracks
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const db = getDb();
    const repository = new TrackRepository(db);
    const service = new TrackService(repository);
    const tracks = await service.getTracks();
    res.json({ tracks });
  })
);

// GET /api/tracks/:id - Get single track
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const db = getDb();
    const repository = new TrackRepository(db);
    const service = new TrackService(repository);
    const track = await service.getTrack(req.params.id);
    if (!track) {
      throw new AppError(404, "Track not found", "TRACK_NOT_FOUND");
    }
    res.json({ track });
  })
);

// PUT /api/tracks/:id - Update track metadata
const updateTrackSchema = z.object({
  title: z.string().min(1).optional(),
  artist: z.string().optional(),
  bpm: z.number().min(60).max(300).optional(),
  key_camelot: z.string().regex(/^([1-9]|1[0-2])[AB]$/).optional(),
  energy_level: z.number().int().min(1).max(10).optional(),
});

router.put(
  "/:id",
  validateBody(updateTrackSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const db = getDb();
    const repository = new TrackRepository(db);
    const service = new TrackService(repository);
    const track = await service.updateTrackMetadata(req.params.id, req.body);
    res.json({ track });
  })
);

// DELETE /api/tracks/:id - Delete track
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const db = getDb();
    const repository = new TrackRepository(db);
    const service = new TrackService(repository);
    await service.deleteTrack(req.params.id);
    res.status(204).send();
  })
);

// POST /api/tracks/:id/reanalyze - Force re-analyze track
router.post(
  "/:id/reanalyze",
  asyncHandler(async (req: Request, res: Response) => {
    const db = getDb();
    const repository = new TrackRepository(db);
    const service = new TrackService(repository);
    const track = await service.reanalyzeTrack(req.params.id);
    res.json({ track });
  })
);

export default router;
