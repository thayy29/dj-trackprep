import { Router } from "express";
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
import { TrackController } from "../controllers/TrackController.js";

const router: Router = Router();

// Configure multer with diskStorage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".mp3", ".wav", ".aiff", ".flac"];
    const allowedMimes = ["audio/mpeg", "audio/wav", "audio/aiff", "audio/flac"];

    if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, "Invalid file type", "INVALID_FILE_TYPE"));
    }
  },
});

// Initialize controller
let controller: TrackController;

router.use(
  asyncHandler(async (req, res, next) => {
    if (!controller) {
      const db = getDb();
      const repository = new TrackRepository(db);
      const service = new TrackService(repository);
      controller = new TrackController(service);
    }
    next();
  })
);

// POST /api/tracks/upload - Upload and create new tracks
router.post(
  "/upload",
  upload.array("files", 50),
  asyncHandler(async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      throw new AppError(400, "No files uploaded", "NO_FILES");
    }

    const db = getDb();
    const repository = new TrackRepository(db);
    const service = new TrackService(repository);
    const files = req.files as Express.Multer.File[];
    const tracks = [];

    for (const file of files) {
      const track = await service.createTrack(file.filename, file.path, file.size, file.originalname);
      tracks.push(track);
    }

    res.status(201).json({ tracks });
  })
);

// GET /api/tracks - List all tracks
router.get(
  "/",
  asyncHandler(async (req, res, next) => {
    controller.getAll(req, res, next);
  })
);

// GET /api/tracks/:id - Get single track
router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    controller.getById(req, res, next);
  })
);

// POST /api/tracks/:id/reanalyze - Re-analyze track
router.post(
  "/:id/reanalyze",
  asyncHandler(async (req, res, next) => {
    const db = getDb();
    const repository = new TrackRepository(db);
    const service = new TrackService(repository);

    const track = await service.getTrack(req.params.id);
    if (!track) {
      throw new AppError(404, "Track not found", "NOT_FOUND");
    }

    service.reanalyzeTrack(req.params.id);
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
  asyncHandler(async (req, res, next) => {
    controller.update(req, res, next);
  })
);

// DELETE /api/tracks/:id - Delete track
router.delete(
  "/:id",
  asyncHandler(async (req, res, next) => {
    controller.delete(req, res, next);
  })
);

export default router;
