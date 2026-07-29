import { Knex } from "knex";
import { Track } from "../types/index";
import { v4 as uuidv4 } from "uuid";

export class TrackRepository {
  constructor(private db: Knex) {}

  async create(data: Omit<Track, "id" | "created_at" | "uploaded_at" | "analyzed_at">): Promise<Track> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db("tracks").insert({
      id,
      ...data,
      uploaded_at: now,
      created_at: now,
    });

    return this.getById(id) as Promise<Track>;
  }

  async getById(id: string): Promise<Track | null> {
    const track = await this.db("tracks").where({ id }).first();
    return track || null;
  }

  async getAll(): Promise<Track[]> {
    return this.db("tracks").orderBy("created_at", "desc");
  }

  async getByStatus(status: string): Promise<Track[]> {
    return this.db("tracks").where({ status }).orderBy("created_at", "desc");
  }

  async update(id: string, data: Partial<Track>): Promise<Track> {
    await this.db("tracks").where({ id }).update(data);
    return this.getById(id) as Promise<Track>;
  }

  async delete(id: string): Promise<void> {
    await this.db("tracks").where({ id }).delete();
  }

  async getByPlaylistId(playlistId: string): Promise<Track[]> {
    return this.db("tracks")
      .join("playlist_tracks", "tracks.id", "playlist_tracks.track_id")
      .where("playlist_tracks.playlist_id", playlistId)
      .orderBy("playlist_tracks.position", "asc")
      .select("tracks.*");
  }
}
