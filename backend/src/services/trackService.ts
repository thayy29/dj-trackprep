import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/db.js";
import { Track } from "../types/index.js";
import { analyzeAudio } from "./audioAnalyzer.js";
import { logger } from "../logger.js";
import fs from "fs";
import path from "path";

export async function createTrack(
  fileName: string,
  filePath: string,
  fileSize: number
): Promise<Track> {
  const db = await getDb();
  const id = uuidv4();
  const title = path.parse(fileName).name; // filename without extension

  const track: Track = {
    id,
    title,
    file_path: filePath,
    file_name: fileName,
    file_size: fileSize,
    status: "analyzing",
    uploaded_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  await db.run(
    `INSERT INTO tracks (id, title, file_path, file_name, file_size, status, uploaded_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      track.id,
      track.title,
      track.file_path,
      track.file_name,
      track.file_size,
      track.status,
      track.uploaded_at,
      track.created_at,
    ]
  );

  logger.info(`Track created: ${id} - ${title}`);
  return track;
}

export async function analyzeTrack(trackId: string): Promise<Track> {
  const db = await getDb();

  const track = await db.get<Track>("SELECT * FROM tracks WHERE id = ?", [trackId]);
  if (!track) {
    throw new Error(`Track not found: ${trackId}`);
  }

  try {
    logger.info(`Analyzing track: ${trackId}`);
    const analysis = await analyzeAudio(track.file_path);

    await db.run(
      `UPDATE tracks
       SET bpm = ?, key_camelot = ?, key_note = ?, energy_level = ?,
           duration_ms = ?, waveform_data = ?, status = ?, analyzed_at = ?
       WHERE id = ?`,
      [
        analysis.bpm,
        analysis.key_camelot,
        analysis.key_note,
        analysis.energy_level,
        analysis.duration_ms,
        analysis.waveform_data,
        "analyzed",
        new Date().toISOString(),
        trackId,
      ]
    );

    const updatedTrack = await db.get<Track | undefined>(
      "SELECT * FROM tracks WHERE id = ?",
      [trackId]
    );
    logger.info(`Track analyzed: ${trackId}`);
    return updatedTrack as Track;
  } catch (error) {
    logger.error(`Analysis failed for track ${trackId}:`, error);
    await db.run("UPDATE tracks SET status = ? WHERE id = ?", ["error", trackId]);
    throw error;
  }
}

export async function getTrack(trackId: string): Promise<Track | null> {
  const db = await getDb();
  return (await db.get<Track>("SELECT * FROM tracks WHERE id = ?", [trackId])) || null;
}

export async function getTracks(): Promise<Track[]> {
  const db = await getDb();
  return db.all<Track[]>(
    "SELECT * FROM tracks ORDER BY created_at DESC"
  );
}

export async function getTracksByStatus(status: string): Promise<Track[]> {
  const db = await getDb();
  return db.all<Track[]>(
    "SELECT * FROM tracks WHERE status = ? ORDER BY created_at DESC",
    [status]
  );
}

export async function deleteTrack(trackId: string): Promise<void> {
  const db = await getDb();
  const track = await getTrack(trackId);

  if (!track) {
    throw new Error(`Track not found: ${trackId}`);
  }

  // Delete file from disk
  if (fs.existsSync(track.file_path)) {
    fs.unlinkSync(track.file_path);
    logger.debug(`Deleted file: ${track.file_path}`);
  }

  // Delete from database
  await db.run("DELETE FROM tracks WHERE id = ?", [trackId]);
  logger.info(`Track deleted: ${trackId}`);
}

export async function updateTrackMetadata(
  trackId: string,
  metadata: Partial<Pick<Track, "title" | "artist" | "bpm" | "key_camelot" | "energy_level">>
): Promise<Track> {
  const db = await getDb();

  const updates: string[] = [];
  const values: (string | number | undefined)[] = [];

  if (metadata.title !== undefined) {
    updates.push("title = ?");
    values.push(metadata.title);
  }
  if (metadata.artist !== undefined) {
    updates.push("artist = ?");
    values.push(metadata.artist);
  }
  if (metadata.bpm !== undefined) {
    updates.push("bpm = ?");
    values.push(metadata.bpm);
  }
  if (metadata.key_camelot !== undefined) {
    updates.push("key_camelot = ?");
    values.push(metadata.key_camelot);
  }
  if (metadata.energy_level !== undefined) {
    updates.push("energy_level = ?");
    values.push(metadata.energy_level);
  }

  if (updates.length === 0) {
    return (await getTrack(trackId))!;
  }

  values.push(trackId);
  await db.run(`UPDATE tracks SET ${updates.join(", ")} WHERE id = ?`, values);

  const updated = await getTrack(trackId);
  logger.info(`Track metadata updated: ${trackId}`);
  return updated!;
}
