import { Knex } from "knex";
import { Playlist } from "../types/index.js";
import { v4 as uuidv4 } from "uuid";

export class PlaylistRepository {
  constructor(private db: Knex) {}

  async create(data: { title: string; description?: string }): Promise<Playlist> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db("playlists").insert({
      id,
      title: data.title,
      description: data.description || null,
      created_at: now,
      updated_at: now,
    });

    return this.getById(id) as Promise<Playlist>;
  }

  async getById(id: string): Promise<Playlist | null> {
    const playlist = await this.db("playlists").where({ id }).first();
    return playlist || null;
  }

  async getAll(): Promise<Playlist[]> {
    return this.db("playlists").orderBy("created_at", "desc");
  }

  async update(id: string, data: Partial<Playlist>): Promise<Playlist> {
    await this.db("playlists").where({ id }).update({
      ...data,
      updated_at: new Date().toISOString(),
    });
    return this.getById(id) as Promise<Playlist>;
  }

  async delete(id: string): Promise<void> {
    await this.db("playlists").where({ id }).delete();
  }

  async addTrack(playlistId: string, trackId: string, position?: number): Promise<void> {
    const maxPosition = await this.db("playlist_tracks")
      .where({ playlist_id: playlistId })
      .max("position")
      .first();

    const pos = position ?? (maxPosition?.max ?? -1) + 1;

    await this.db("playlist_tracks").insert({
      id: uuidv4(),
      playlist_id: playlistId,
      track_id: trackId,
      position: pos,
      added_at: new Date().toISOString(),
    });

    await this.updateStats(playlistId);
  }

  async removeTrack(playlistId: string, trackId: string): Promise<void> {
    await this.db("playlist_tracks")
      .where({ playlist_id: playlistId, track_id: trackId })
      .delete();

    await this.updateStats(playlistId);
  }

  async reorderTracks(playlistId: string, trackOrder: { trackId: string; position: number }[]): Promise<void> {
    for (const { trackId, position } of trackOrder) {
      await this.db("playlist_tracks")
        .where({ playlist_id: playlistId, track_id: trackId })
        .update({ position });
    }
  }

  async updateStats(playlistId: string): Promise<void> {
    const stats = await this.db("playlist_tracks")
      .join("tracks", "tracks.id", "playlist_tracks.track_id")
      .where("playlist_tracks.playlist_id", playlistId)
      .sum("tracks.duration_ms as total_duration_ms")
      .count("* as total_tracks")
      .first();

    if (stats) {
      await this.db("playlists").where({ id: playlistId }).update({
        total_tracks: stats.total_tracks || 0,
        total_duration_ms: stats.total_duration_ms || 0,
      });
    }
  }
}
