import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/db.js";
import { Playlist, PlaylistTrack, Track } from "../types/index.js";
import { logger } from "../logger.js";
import { calculateKeyDistance } from "./audioAnalyzer.js";

export async function createPlaylist(
  title: string,
  description?: string
): Promise<Playlist> {
  const db = await getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.run(
    `INSERT INTO playlists (id, title, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, title, description || null, now, now]
  );

  logger.info(`Playlist created: ${id} - ${title}`);
  return {
    id,
    title,
    description,
    total_duration_ms: 0,
    total_tracks: 0,
    created_at: now,
    updated_at: now,
  };
}

export async function getPlaylist(playlistId: string): Promise<Playlist | null> {
  const db = await getDb();
  const playlist = await db.get<Playlist>(
    "SELECT * FROM playlists WHERE id = ?",
    [playlistId]
  );

  if (!playlist) return null;

  const tracks = await db.all<PlaylistTrack[]>(
    `SELECT pt.*, t.* FROM playlist_tracks pt
     JOIN tracks t ON pt.track_id = t.id
     WHERE pt.playlist_id = ? ORDER BY pt.position ASC`,
    [playlistId]
  );

  return {
    ...playlist,
    tracks: tracks as unknown as Track[],
  };
}

export async function addTrackToPlaylist(
  playlistId: string,
  trackId: string,
  position?: number
): Promise<PlaylistTrack> {
  const db = await getDb();
  const id = uuidv4();

  // Get current max position
  const maxPos = await db.get<{ max_pos: number }>(
    "SELECT MAX(position) as max_pos FROM playlist_tracks WHERE playlist_id = ?",
    [playlistId]
  );

  const pos = position ?? (maxPos?.max_pos ?? -1) + 1;

  await db.run(
    `INSERT INTO playlist_tracks (id, playlist_id, track_id, position, added_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, playlistId, trackId, pos, new Date().toISOString()]
  );

  await updatePlaylistStats(playlistId);
  logger.info(`Track added to playlist: ${trackId} -> ${playlistId}`);

  return {
    id,
    playlist_id: playlistId,
    track_id: trackId,
    position: pos,
    added_at: new Date().toISOString(),
  };
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string
): Promise<void> {
  const db = await getDb();

  await db.run(
    "DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?",
    [playlistId, trackId]
  );

  await updatePlaylistStats(playlistId);
  logger.info(`Track removed from playlist: ${trackId} <- ${playlistId}`);
}

export async function reorderPlaylistTracks(
  playlistId: string,
  trackOrder: { trackId: string; position: number }[]
): Promise<void> {
  const db = await getDb();

  for (const { trackId, position } of trackOrder) {
    await db.run(
      "UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?",
      [position, playlistId, trackId]
    );
  }

  logger.info(`Playlist reordered: ${playlistId}`);
}

/**
 * Auto-sort playlist by harmonic compatibility + energy curve
 * Places tracks in optimal order for smooth transitions
 */
export async function autoOrderPlaylist(playlistId: string): Promise<void> {
  const db = await getDb();
  const playlist = await getPlaylist(playlistId);

  if (!playlist?.tracks || playlist.tracks.length === 0) {
    return;
  }

  const tracks = playlist.tracks;
  const sorted: Track[] = [];
  const used = new Set<string>();

  // Start with lowest energy track
  let current = tracks.reduce((min, t) =>
    (t.energy_level ?? 0) < (min.energy_level ?? 0) ? t : min
  );
  sorted.push(current);
  used.add(current.id);

  // Greedily pick next best track: harmonic compatibility + slight energy increase
  while (sorted.length < tracks.length) {
    let bestTrack: Track | null = null;
    let bestScore = -Infinity;

    for (const track of tracks) {
      if (used.has(track.id)) continue;

      const keyDistance = calculateKeyDistance(
        current.key_camelot ?? "8A",
        track.key_camelot ?? "8A"
      );
      const keyScore = Math.max(0, 10 - keyDistance); // 10 for adjacent, 0 for far
      const bpmDiff = Math.abs((track.bpm ?? 120) - (current.bpm ?? 120));
      const bpmScore = Math.max(0, 5 - bpmDiff / 10); // Prefer similar BPM
      const energyDiff = (track.energy_level ?? 5) - (current.energy_level ?? 5);
      const energyScore = Math.max(0, 5 - Math.abs(energyDiff) * 2); // Slight increase preferred

      const score = keyScore * 0.5 + bpmScore * 0.3 + energyScore * 0.2;

      if (score > bestScore) {
        bestScore = score;
        bestTrack = track;
      }
    }

    if (!bestTrack) break;
    sorted.push(bestTrack);
    used.add(bestTrack.id);
    current = bestTrack;
  }

  // Update positions
  const order = sorted.map((t, i) => ({ trackId: t.id, position: i }));
  await reorderPlaylistTracks(playlistId, order);
}

async function updatePlaylistStats(playlistId: string): Promise<void> {
  const db = await getDb();

  const stats = await db.get<{
    total_tracks: number;
    total_duration_ms: number;
  }>(
    `SELECT COUNT(*) as total_tracks, COALESCE(SUM(t.duration_ms), 0) as total_duration_ms
     FROM playlist_tracks pt
     JOIN tracks t ON pt.track_id = t.id
     WHERE pt.playlist_id = ?`,
    [playlistId]
  );

  if (stats) {
    await db.run(
      `UPDATE playlists SET total_tracks = ?, total_duration_ms = ?, updated_at = ?
       WHERE id = ?`,
      [stats.total_tracks, stats.total_duration_ms, new Date().toISOString(), playlistId]
    );
  }
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  const db = await getDb();
  await db.run("DELETE FROM playlists WHERE id = ?", [playlistId]);
  logger.info(`Playlist deleted: ${playlistId}`);
}
