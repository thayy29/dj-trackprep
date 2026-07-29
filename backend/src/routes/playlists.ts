import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { validateBody } from "../middleware/validation";
import { getDb } from "../db/database";
import { PlaylistRepository } from "../repositories/PlaylistRepository";
import { TrackRepository } from "../repositories/TrackRepository";
import { PlaylistService } from "../services/playlistService";
import { PlaylistController } from "../controllers/PlaylistController";

const router: Router = Router();

let controller: PlaylistController;

router.use(
  asyncHandler(async (req, res, next) => {
    if (!controller) {
      const db = getDb();
      const playlistRepository = new PlaylistRepository(db);
      const trackRepository = new TrackRepository(db);
      const service = new PlaylistService(playlistRepository, trackRepository);
      controller = new PlaylistController(service);
    }
    next();
  })
);

// POST /api/playlists - Create new playlist
const createPlaylistSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

router.post(
  "/",
  validateBody(createPlaylistSchema),
  asyncHandler(async (req, res, next) => {
    controller.create(req, res, next);
  })
);

// GET /api/playlists/:id - Get playlist with tracks
router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    controller.getById(req, res, next);
  })
);

// POST /api/playlists/:id/tracks - Add track to playlist
const addTrackSchema = z.object({
  track_id: z.string().uuid(),
  position: z.number().int().min(0).optional(),
});

router.post(
  "/:id/tracks",
  validateBody(addTrackSchema),
  asyncHandler(async (req, res, next) => {
    controller.addTrack(req, res, next);
  })
);

// DELETE /api/playlists/:id/tracks/:trackId - Remove track from playlist
router.delete(
  "/:id/tracks/:trackId",
  asyncHandler(async (req, res, next) => {
    req.body = { trackId: req.params.trackId };
    controller.removeTrack(req, res, next);
  })
);

// PUT /api/playlists/:id/reorder - Reorder tracks in playlist
const reorderSchema = z.object({
  tracks: z.array(
    z.object({
      track_id: z.string().uuid(),
      position: z.number().int().min(0),
    })
  ),
});

router.put(
  "/:id/reorder",
  validateBody(reorderSchema),
  asyncHandler(async (req, res, next) => {
    req.body = { trackOrder: req.body.tracks };
    controller.reorderTracks(req, res, next);
  })
);

// POST /api/playlists/:id/auto-order - Auto-sort by harmony & energy
router.post(
  "/:id/auto-order",
  asyncHandler(async (req, res, next) => {
    controller.autoOrder(req, res, next);
  })
);

// POST /api/playlists/compute-order - Compute harmonic order for track IDs
const computeOrderSchema = z.object({
  track_ids: z.array(z.string().uuid()),
});

router.post(
  "/compute-order",
  validateBody(computeOrderSchema),
  asyncHandler(async (req, res, next) => {
    const db = getDb();
    const trackRepository = new TrackRepository(db);
    const tracks = await Promise.all(
      req.body.track_ids.map((id: string) => trackRepository.getById(id))
    );

    const validTracks = tracks.filter((t) => t !== null);
    if (validTracks.length === 0) {
      throw new AppError(400, "No valid tracks found", "NO_VALID_TRACKS");
    }

    const playlistService = new PlaylistService(
      new PlaylistRepository(db),
      trackRepository
    );
    const ordered = await playlistService.computeHarmonicOrder(validTracks);
    res.json({ ordered_tracks: ordered });
  })
);

// DELETE /api/playlists/:id - Delete playlist
router.delete(
  "/:id",
  asyncHandler(async (req, res, next) => {
    controller.delete(req, res, next);
  })
);

export default router;
