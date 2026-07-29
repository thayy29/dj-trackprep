import { Request, Response, NextFunction } from "express";
import { PlaylistService } from "../services/playlistService";

export class PlaylistController {
  constructor(private playlistService: PlaylistService) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description } = req.body;
      if (!title) {
        res.status(400).json({ error: { message: "Title is required", code: "MISSING_TITLE" } });
        return;
      }

      const playlist = await this.playlistService.createPlaylist(title, description);
      res.status(201).json({ playlist });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const playlists = await this.playlistService.getAllPlaylists();
      res.json({ playlists });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const playlist = await this.playlistService.getPlaylist(req.params.id);
      if (!playlist) {
        res.status(404).json({ error: { message: "Playlist not found", code: "NOT_FOUND" } });
        return;
      }
      res.json({ playlist });
    } catch (error) {
      next(error);
    }
  }

  async addTrack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trackId = req.body.trackId || req.body.track_id;
      const position = req.body.position;
      if (!trackId) {
        res.status(400).json({ error: { message: "Track ID is required", code: "MISSING_TRACK_ID" } });
        return;
      }

      await this.playlistService.addTrackToPlaylist(req.params.id, trackId, position);
      res.status(201).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async removeTrack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trackId = req.body.trackId || req.body.track_id;
      if (!trackId) {
        res.status(400).json({ error: { message: "Track ID is required", code: "MISSING_TRACK_ID" } });
        return;
      }

      await this.playlistService.removeTrackFromPlaylist(req.params.id, trackId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async reorderTracks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { trackOrder } = req.body;
      if (!trackOrder || !Array.isArray(trackOrder)) {
        res.status(400).json({ error: { message: "Track order array is required", code: "INVALID_TRACK_ORDER" } });
        return;
      }

      const playlist = await this.playlistService.reorderPlaylistTracks(req.params.id, trackOrder);
      res.json({ playlist });
    } catch (error) {
      next(error);
    }
  }

  async autoOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const playlist = await this.playlistService.autoOrderPlaylist(req.params.id);
      res.json({ playlist });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.playlistService.deletePlaylist(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
