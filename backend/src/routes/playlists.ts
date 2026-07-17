import { Router, Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validation.js";
import * as playlistService from "../services/playlistService.js";

const router: Router = Router();

// POST /api/playlists - Create new playlist
const createPlaylistSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

router.post(
  "/",
  validateBody(createPlaylistSchema),
  asyncHandler(async (req, res) => {
    const playlist = await playlistService.createPlaylist(
      req.body.title,
      req.body.description
    );
    res.status(201).json({ playlist });
  })
);

// GET /api/playlists/:id - Get playlist with tracks
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const playlist = await playlistService.getPlaylist(req.params.id);
    if (!playlist) {
      throw new AppError(404, "Playlist not found", "PLAYLIST_NOT_FOUND");
    }
    res.json({ playlist });
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
  asyncHandler(async (req, res) => {
    const playlistTrack = await playlistService.addTrackToPlaylist(
      req.params.id,
      req.body.track_id,
      req.body.position
    );
    res.status(201).json({ playlistTrack });
  })
);

// DELETE /api/playlists/:id/tracks/:trackId - Remove track from playlist
router.delete(
  "/:id/tracks/:trackId",
  asyncHandler(async (req, res) => {
    await playlistService.removeTrackFromPlaylist(req.params.id, req.params.trackId);
    res.status(204).send();
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
  asyncHandler(async (req, res) => {
    await playlistService.reorderPlaylistTracks(req.params.id, req.body.tracks);
    const playlist = await playlistService.getPlaylist(req.params.id);
    res.json({ playlist });
  })
);

// POST /api/playlists/:id/auto-order - Auto-sort by harmony & energy
router.post(
  "/:id/auto-order",
  asyncHandler(async (req, res) => {
    await playlistService.autoOrderPlaylist(req.params.id);
    const playlist = await playlistService.getPlaylist(req.params.id);
    res.json({ playlist });
  })
);

// DELETE /api/playlists/:id - Delete playlist
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await playlistService.deletePlaylist(req.params.id);
    res.status(204).send();
  })
);

export default router;
