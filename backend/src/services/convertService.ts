import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/db.js";
import { ConvertPreset, Export } from "../types/index.js";
import { logger } from "../logger.js";

export async function initializePresets(): Promise<void> {
  const db = await getDb();

  const presets: Omit<ConvertPreset, "created_at">[] = [
    {
      id: uuidv4(),
      name: "CDJ-3000",
      format: "wav",
      sample_rate: 44100,
      bit_depth: 16,
      loudness_lufs: -8,
      description: "Pioneer CDJ-3000 optimized - WAV 44.1kHz 16-bit, loud for club playback",
    },
    {
      id: uuidv4(),
      name: "Serato",
      format: "aiff",
      sample_rate: 44100,
      bit_depth: 16,
      loudness_lufs: -6,
      description: "Serato DJ optimized - AIFF with cue points preserved",
    },
    {
      id: uuidv4(),
      name: "Engine DJ",
      format: "flac",
      sample_rate: 48000,
      bit_depth: 24,
      loudness_lufs: -6,
      description: "Denon Engine DJ optimized - FLAC lossless, 48kHz",
    },
    {
      id: uuidv4(),
      name: "Streaming",
      format: "mp3",
      sample_rate: 44100,
      bit_depth: undefined,
      loudness_lufs: -14,
      description: "Streaming platforms (Spotify, Apple Music) - MP3 320kbps normalized",
    },
    {
      id: uuidv4(),
      name: "Club",
      format: "wav",
      sample_rate: 48000,
      bit_depth: 24,
      loudness_lufs: -9,
      description: "Live club PA system - WAV 48kHz 24-bit loud",
    },
  ];

  for (const preset of presets) {
    const exists = await db.get(
      "SELECT id FROM convert_presets WHERE name = ?",
      [preset.name]
    );
    if (!exists) {
      await db.run(
        `INSERT INTO convert_presets (id, name, format, sample_rate, bit_depth, loudness_lufs, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          preset.id,
          preset.name,
          preset.format,
          preset.sample_rate,
          preset.bit_depth,
          preset.loudness_lufs,
          preset.description,
          new Date().toISOString(),
        ]
      );
    }
  }

  logger.info("Convert presets initialized");
}

export async function getPresets(): Promise<ConvertPreset[]> {
  const db = await getDb();
  return db.all<ConvertPreset[]>(
    "SELECT * FROM convert_presets ORDER BY name ASC"
  );
}

export async function getPreset(presetId: string): Promise<ConvertPreset | null> {
  const db = await getDb();
  return (await db.get<ConvertPreset>(
    "SELECT * FROM convert_presets WHERE id = ?",
    [presetId]
  )) || null;
}

export async function createExport(
  playlistId: string,
  presetId: string
): Promise<Export> {
  const db = await getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  // Validate playlist exists
  const playlist = await db.get(
    "SELECT id FROM playlists WHERE id = ?",
    [playlistId]
  );
  if (!playlist) {
    throw new Error(`Playlist not found: ${playlistId}`);
  }

  // Validate preset exists
  const preset = await getPreset(presetId);
  if (!preset) {
    throw new Error(`Preset not found: ${presetId}`);
  }

  await db.run(
    `INSERT INTO exports (id, playlist_id, preset_id, status, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, playlistId, presetId, "pending", now]
  );

  logger.info(`Export created: ${id} - ${playlistId} with preset ${preset.name}`);

  return {
    id,
    playlist_id: playlistId,
    preset_id: presetId,
    status: "pending",
    created_at: now,
  };
}

export async function getExport(exportId: string): Promise<Export | null> {
  const db = await getDb();
  return (await db.get<Export>(
    "SELECT * FROM exports WHERE id = ?",
    [exportId]
  )) || null;
}

export async function updateExportStatus(
  exportId: string,
  status: "pending" | "processing" | "completed" | "error",
  outputPath?: string
): Promise<Export> {
  const db = await getDb();

  const data: (string | null)[] = [status];
  if (outputPath) data.push(outputPath);
  data.push(exportId);

  let query = "UPDATE exports SET status = ?";
  if (outputPath) {
    query += ", output_path = ?, completed_at = ?";
    data.splice(1, 0, outputPath, new Date().toISOString());
  }
  query += " WHERE id = ?";

  await db.run(query, data);

  const updated = await getExport(exportId);
  logger.info(`Export status updated: ${exportId} -> ${status}`);
  return updated as Export;
}

/**
 * Formats export filename based on playlist and preset
 */
export function getExportFilename(
  playlistTitle: string,
  presetName: string,
  format: string
): string {
  const timestamp = new Date().toISOString().split("T")[0];
  const safeTitle = playlistTitle.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return `${safeTitle}_${presetName}_${timestamp}.${format}`;
}
