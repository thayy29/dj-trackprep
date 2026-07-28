import { TrackRepository } from "../repositories/TrackRepository.js";
import { Track } from "../types/index.js";
import { analyzeAudio } from "./audioAnalyzer.js";
import { logger } from "../logger.js";
import fs from "fs";
import path from "path";

export class TrackService {
  constructor(private trackRepository: TrackRepository) {}

  async createTrack(fileName: string, filePath: string, fileSize: number): Promise<Track> {
    const title = path.parse(fileName).name;

    const track = await this.trackRepository.create({
      title,
      artist: null,
      file_path: filePath,
      file_name: fileName,
      file_size: fileSize,
      status: "analyzing",
    } as any);

    this.analyzeTrackInBackground(track.id);
    logger.info(`Track created: ${track.id} - ${title}`);
    return track;
  }

  private async analyzeTrackInBackground(trackId: string): Promise<void> {
    try {
      const track = await this.trackRepository.getById(trackId);
      if (!track) return;

      logger.info(`Analyzing track: ${trackId}`);
      const analysis = await analyzeAudio(track.file_path);

      await this.trackRepository.update(trackId, {
        bpm: analysis.bpm,
        key_camelot: analysis.key_camelot,
        key_note: analysis.key_note,
        energy_level: analysis.energy_level,
        duration_ms: analysis.duration_ms,
        waveform_data: analysis.waveform_data ? JSON.stringify(analysis.waveform_data) : null,
        status: "analyzed",
        analyzed_at: new Date().toISOString(),
      } as any);

      logger.info(`Track analyzed: ${trackId}`);
    } catch (error) {
      logger.error(`Analysis failed for track ${trackId}:`, error);
      await this.trackRepository.update(trackId, { status: "error" } as any);
    }
  }

  async getTrack(trackId: string): Promise<Track | null> {
    return this.trackRepository.getById(trackId);
  }

  async getTracks(): Promise<Track[]> {
    return this.trackRepository.getAll();
  }

  async getTracksByStatus(status: string): Promise<Track[]> {
    return this.trackRepository.getByStatus(status);
  }

  async deleteTrack(trackId: string): Promise<void> {
    const track = await this.trackRepository.getById(trackId);

    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    if (fs.existsSync(track.file_path)) {
      fs.unlinkSync(track.file_path);
      logger.debug(`Deleted file: ${track.file_path}`);
    }

    await this.trackRepository.delete(trackId);
    logger.info(`Track deleted: ${trackId}`);
  }

  async updateTrackMetadata(
    trackId: string,
    metadata: Partial<Pick<Track, "title" | "artist" | "bpm" | "key_camelot" | "energy_level">>
  ): Promise<Track> {
    const updated = await this.trackRepository.update(trackId, metadata as any);
    logger.info(`Track metadata updated: ${trackId}`);
    return updated;
  }

  async reanalyzeTrack(trackId: string): Promise<void> {
    const track = await this.trackRepository.getById(trackId);
    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    await this.trackRepository.update(trackId, { status: "analyzing" } as any);
    this.analyzeTrackInBackground(trackId);
  }
}
