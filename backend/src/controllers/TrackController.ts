import { Request, Response, NextFunction } from "express";
import { TrackService } from "../services/trackService.js";
import { logger } from "../logger.js";

export class TrackController {
  constructor(private trackService: TrackService) {}

  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: { message: "No file provided", code: "NO_FILE" } });
        return;
      }

      const { title, artist } = req.body;
      if (!title) {
        res.status(400).json({ error: { message: "Title is required", code: "MISSING_TITLE" } });
        return;
      }

      const track = await this.trackService.createTrack(req.file.filename, req.file.path, req.file.size);
      res.status(201).json({ track });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tracks = await this.trackService.getTracks();
      res.json({ tracks });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const track = await this.trackService.getTrack(req.params.id);
      if (!track) {
        res.status(404).json({ error: { message: "Track not found", code: "NOT_FOUND" } });
        return;
      }
      res.json({ track });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await this.trackService.updateTrackMetadata(req.params.id, req.body);
      res.json({ track: updated });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.trackService.deleteTrack(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string;
      if (!status) {
        res.status(400).json({ error: { message: "Status query parameter is required", code: "MISSING_STATUS" } });
        return;
      }

      const tracks = await this.trackService.getTracksByStatus(status);
      res.json({ tracks });
    } catch (error) {
      next(error);
    }
  }
}
