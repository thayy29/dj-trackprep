import { ConvertRepository } from "../repositories/ConvertRepository";
import { ConvertPreset, Export } from "../types/index";
import { logger } from "../logger";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import { createWriteStream } from "fs";

export class ConvertService {
  constructor(private convertRepository: ConvertRepository) {}

  async initializePresets(): Promise<void> {
    const presets: Omit<ConvertPreset, "id" | "created_at">[] = [
      {
        name: "CDJ-3000",
        format: "wav",
        sample_rate: 44100,
        bit_depth: 16,
        loudness_lufs: -8,
        description: "Pioneer CDJ-3000 optimized - WAV 44.1kHz 16-bit, loud for club playback",
      },
      {
        name: "Serato",
        format: "aiff",
        sample_rate: 44100,
        bit_depth: 16,
        loudness_lufs: -6,
        description: "Serato DJ optimized - AIFF with cue points preserved",
      },
      {
        name: "Engine DJ",
        format: "flac",
        sample_rate: 48000,
        bit_depth: 24,
        loudness_lufs: -6,
        description: "Denon Engine DJ optimized - FLAC lossless, 48kHz",
      },
      {
        name: "Streaming",
        format: "mp3",
        sample_rate: 44100,
        bit_depth: undefined,
        loudness_lufs: -14,
        description: "Streaming platforms (Spotify, Apple Music) - MP3 320kbps normalized",
      },
      {
        name: "Club",
        format: "wav",
        sample_rate: 48000,
        bit_depth: 24,
        loudness_lufs: -9,
        description: "Live club PA system - WAV 48kHz 24-bit loud",
      },
    ];

    for (const preset of presets) {
      const exists = await this.convertRepository.getPresetByName(preset.name);
      if (!exists) {
        await this.convertRepository.createPreset(preset as any);
      }
    }

    logger.info("Convert presets initialized");
  }

  async getPresets(): Promise<ConvertPreset[]> {
    return this.convertRepository.getAllPresets();
  }

  async getPreset(presetId: string): Promise<ConvertPreset | null> {
    return this.convertRepository.getPresetById(presetId);
  }

  async createExport(playlistId: string, presetId: string): Promise<Export> {
    const preset = await this.convertRepository.getPresetById(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    const exportRecord = await this.convertRepository.createExport({
      playlistId,
      presetId,
    });

    logger.info(`Export created: ${exportRecord.id} - ${playlistId} with preset ${preset.name}`);
    return exportRecord;
  }

  async getExport(exportId: string): Promise<Export | null> {
    return this.convertRepository.getExportById(exportId);
  }

  async updateExportStatus(
    exportId: string,
    status: "pending" | "processing" | "completed" | "error",
    outputPath?: string
  ): Promise<Export> {
    const data: any = { status };
    if (outputPath) {
      data.output_path = outputPath;
      data.completed_at = new Date().toISOString();
    }

    const updated = await this.convertRepository.updateExport(exportId, data);
    logger.info(`Export status updated: ${exportId} -> ${status}`);
    return updated;
  }

  getExportFilename(playlistTitle: string, presetName: string, format: string): string {
    const timestamp = new Date().toISOString().split("T")[0];
    const safeTitle = playlistTitle.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    return `${safeTitle}_${presetName}_${timestamp}.${format}`;
  }

  /**
   * Create a ZIP export containing all tracks from a playlist
   * Returns the path to the generated ZIP file
   */
  async createZipExport(
    exportId: string,
    playlistId: string,
    playlistTitle: string,
    trackFilePaths: string[],
    exportsDir: string
  ): Promise<string> {
    try {
      // Create exports directory if it doesn't exist
      const exportDir = path.join(exportsDir, exportId);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const zipPath = path.join(exportDir, `${playlistTitle.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}.zip`);

      return new Promise((resolve, reject) => {
        const output = createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 6 } });

        output.on("close", () => {
          logger.info(`ZIP created: ${zipPath} (${archive.pointer()} bytes)`);
          resolve(zipPath);
        });

        archive.on("error", (err) => {
          logger.error(`ZIP creation error:`, err);
          reject(err);
        });

        archive.pipe(output);

        // Add each track file to the ZIP
        for (const filePath of trackFilePaths) {
          if (fs.existsSync(filePath)) {
            const filename = path.basename(filePath);
            archive.file(filePath, { name: filename });
          } else {
            logger.warn(`Track file not found for ZIP: ${filePath}`);
          }
        }

        archive.finalize();
      });
    } catch (error) {
      logger.error(`Failed to create ZIP export:`, error);
      throw error;
    }
  }
}
