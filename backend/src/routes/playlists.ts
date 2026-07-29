import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { validateBody } from "../middleware/validation";
import { getDb } from "../db/database";
import { PlaylistRepository } from "../repositories/PlaylistRepository";
import { TrackRepository } from "../repositories/TrackRepository";
import { PlaylistService } from "../services/playlistService";
import { PlaylistController } from "../controllers/PlaylistController";
import { calculateKeyDistance } from "../services/audioAnalyzer";
import { logger } from "../logger";

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

// POST /api/playlists/suggest-next - Suggest next track based on harmonic compatibility
const suggestNextSchema = z.object({
  lastTrackKey: z.string().min(2).max(3), // e.g., "8A"
  lastTrackBPM: z.number().min(60).max(200),
  lastTrackEnergy: z.number().min(1).max(10).optional(),
  playlistTrackIds: z.array(z.string().uuid()),
});

router.post(
  "/suggest-next",
  validateBody(suggestNextSchema),
  asyncHandler(async (req, res, next) => {
    const db = getDb();
    const trackRepository = new TrackRepository(db);

    const { lastTrackKey, lastTrackBPM, lastTrackEnergy = 5, playlistTrackIds } = req.body;

    // Get all available tracks (not in current playlist)
    const allTracks = await trackRepository.getAll();
    const availableTracks = allTracks.filter((t) => !playlistTrackIds.includes(t.id) && t.status === "analyzed" && t.bpm && t.key_camelot);

    if (availableTracks.length === 0) {
      return res.json({ suggestedTrack: null });
    }

    const playlistService = new PlaylistService(new PlaylistRepository(db), trackRepository);

    // Calculate compatibility score for each available track
    const scoredTracks = availableTracks.map((track) => {
      // Harmonic compatibility (0-1)
      const keyDistance = calculateKeyDistance(lastTrackKey, track.key_camelot!);
      const harmonicScore = Math.max(0, 1 - keyDistance / 6); // Closer keys = higher score

      // BPM proximity (0-1) - prefer within ±20 BPM
      const bpmDiff = Math.abs(track.bpm! - lastTrackBPM);
      const bpmScore = Math.max(0, 1 - bpmDiff / 40);

      // Energy flow (0-1) - prefer gradual increases/decreases
      const energyDiff = Math.abs(track.energy_level! - lastTrackEnergy);
      const energyScore = Math.max(0, 1 - energyDiff / 5);

      // Weighted score: 60% harmonic, 25% BPM, 15% energy
      const compatibilityScore = harmonicScore * 0.6 + bpmScore * 0.25 + energyScore * 0.15;

      return {
        ...track,
        compatibilityScore,
      };
    });

    // Sort by score and pick the best one
    const bestTrack = scoredTracks.sort((a, b) => b.compatibilityScore - a.compatibilityScore)[0];

    if (!bestTrack) {
      return res.json({ suggestedTrack: null });
    }

    logger.info(`[Suggest] For key ${lastTrackKey} BPM ${lastTrackBPM}, suggested ${bestTrack.title} (score: ${bestTrack.compatibilityScore.toFixed(2)})`);

    res.json({
      suggestedTrack: {
        ...bestTrack,
        compatibilityScore: Math.round(bestTrack.compatibilityScore * 100) / 100,
      },
    });
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
