import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import { env } from "../env.js";
import { logger } from "../logger.js";
import fs from "fs";

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (db) return db;

  const dbPath = env.DATABASE_URL.replace("sqlite://", "").replace("sqlite:", "");
  const dir = path.dirname(dbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON");
  logger.info(`Database connected: ${dbPath}`);

  return db;
}

export async function initDb(): Promise<void> {
  const database = await getDb();

  // Tracks table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      duration_ms INTEGER,
      bpm REAL,
      key_camelot TEXT,
      key_note TEXT,
      energy_level INTEGER,
      waveform_data TEXT,
      status TEXT DEFAULT 'analyzing',
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      analyzed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      total_duration_ms INTEGER DEFAULT 0,
      total_tracks INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      id TEXT PRIMARY KEY,
      playlist_id TEXT NOT NULL,
      track_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
      UNIQUE(playlist_id, track_id)
    );

    CREATE TABLE IF NOT EXISTS convert_presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      format TEXT NOT NULL,
      sample_rate INTEGER NOT NULL,
      bit_depth INTEGER,
      loudness_lufs REAL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exports (
      id TEXT PRIMARY KEY,
      playlist_id TEXT NOT NULL,
      preset_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      output_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (preset_id) REFERENCES convert_presets(id)
    );

    CREATE INDEX IF NOT EXISTS idx_tracks_status ON tracks(status);
    CREATE INDEX IF NOT EXISTS idx_tracks_key ON tracks(key_camelot);
    CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
    CREATE INDEX IF NOT EXISTS idx_exports_status ON exports(status);
  `);

  logger.info("Database initialized");
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    logger.info("Database closed");
  }
}

export { getDb };
