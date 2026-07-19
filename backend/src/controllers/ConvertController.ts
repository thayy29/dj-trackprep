import { Request, Response, NextFunction } from "express";
import { ConvertService } from "../services/convertService.js";

export class ConvertController {
  constructor(private convertService: ConvertService) {}

  async getPresets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const presets = await this.convertService.getPresets();
      res.json(presets);
    } catch (error) {
      next(error);
    }
  }

  async getPreset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preset = await this.convertService.getPreset(req.params.id);
      if (!preset) {
        res.status(404).json({ error: "Preset not found" });
        return;
      }
      res.json(preset);
    } catch (error) {
      next(error);
    }
  }

  async createExport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { playlistId, presetId } = req.body;
      if (!playlistId || !presetId) {
        res.status(400).json({ error: "Playlist ID and Preset ID are required" });
        return;
      }

      const exportRecord = await this.convertService.createExport(playlistId, presetId);
      res.status(201).json(exportRecord);
    } catch (error) {
      next(error);
    }
  }

  async getExport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exportRecord = await this.convertService.getExport(req.params.id);
      if (!exportRecord) {
        res.status(404).json({ error: "Export not found" });
        return;
      }
      res.json(exportRecord);
    } catch (error) {
      next(error);
    }
  }

  async updateExportStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, outputPath } = req.body;
      if (!status) {
        res.status(400).json({ error: "Status is required" });
        return;
      }

      const updated = await this.convertService.updateExportStatus(req.params.id, status, outputPath);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
}
