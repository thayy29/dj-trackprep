import { Knex } from "knex";
import { ConvertPreset, Export } from "../types/index.js";
import { v4 as uuidv4 } from "uuid";

export class ConvertRepository {
  constructor(private db: Knex) {}

  // Convert Presets
  async createPreset(data: Omit<ConvertPreset, "id" | "created_at">): Promise<ConvertPreset> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db("convert_presets").insert({
      id,
      ...data,
      created_at: now,
    });

    return this.getPresetById(id) as Promise<ConvertPreset>;
  }

  async getPresetById(id: string): Promise<ConvertPreset | null> {
    const preset = await this.db("convert_presets").where({ id }).first();
    return preset || null;
  }

  async getPresetByName(name: string): Promise<ConvertPreset | null> {
    const preset = await this.db("convert_presets").where({ name }).first();
    return preset || null;
  }

  async getAllPresets(): Promise<ConvertPreset[]> {
    return this.db("convert_presets").orderBy("name", "asc");
  }

  async updatePreset(id: string, data: Partial<ConvertPreset>): Promise<ConvertPreset> {
    await this.db("convert_presets").where({ id }).update(data);
    return this.getPresetById(id) as Promise<ConvertPreset>;
  }

  async deletePreset(id: string): Promise<void> {
    await this.db("convert_presets").where({ id }).delete();
  }

  // Exports
  async createExport(data: { playlistId: string; presetId: string }): Promise<Export> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db("exports").insert({
      id,
      playlist_id: data.playlistId,
      preset_id: data.presetId,
      status: "pending",
      created_at: now,
    });

    return this.getExportById(id) as Promise<Export>;
  }

  async getExportById(id: string): Promise<Export | null> {
    const exportRecord = await this.db("exports").where({ id }).first();
    if (!exportRecord) return null;

    return this.mapExport(exportRecord);
  }

  async getExportsByPlaylistId(playlistId: string): Promise<Export[]> {
    const exports = await this.db("exports").where({ playlist_id: playlistId }).orderBy("created_at", "desc");
    return exports.map((exp) => this.mapExport(exp));
  }

  async getExportsByStatus(status: string): Promise<Export[]> {
    const exports = await this.db("exports").where({ status }).orderBy("created_at", "desc");
    return exports.map((exp) => this.mapExport(exp));
  }

  async updateExport(
    id: string,
    data: Partial<{ status: string; output_path: string; completed_at: string }>
  ): Promise<Export> {
    await this.db("exports").where({ id }).update(data);
    return this.getExportById(id) as Promise<Export>;
  }

  async deleteExport(id: string): Promise<void> {
    await this.db("exports").where({ id }).delete();
  }

  private mapExport(record: any): Export {
    return {
      id: record.id,
      playlistId: record.playlist_id,
      presetId: record.preset_id,
      status: record.status,
      outputPath: record.output_path,
      createdAt: record.created_at,
      completedAt: record.completed_at,
    };
  }
}
