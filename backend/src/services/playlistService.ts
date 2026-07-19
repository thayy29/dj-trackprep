import { PlaylistRepository } from "../repositories/PlaylistRepository.js";
import { TrackRepository } from "../repositories/TrackRepository.js";
import { Playlist, Track } from "../types/index.js";
import { logger } from "../logger.js";
import { calculateKeyDistance } from "./audioAnalyzer.js";

export class PlaylistService {
  constructor(
    private playlistRepository: PlaylistRepository,
    private trackRepository: TrackRepository
  ) {}

  async createPlaylist(title: string, description?: string): Promise<Playlist> {
    const playlist = await this.playlistRepository.create({ title, description });
    logger.info(`Playlist created: ${playlist.id} - ${title}`);
    return playlist;
  }

  async getPlaylist(playlistId: string): Promise<Playlist | null> {
    return this.playlistRepository.getById(playlistId);
  }

  async addTrackToPlaylist(playlistId: string, trackId: string, position?: number): Promise<void> {
    await this.playlistRepository.addTrack(playlistId, trackId, position);
    logger.info(`Track added to playlist: ${trackId} -> ${playlistId}`);
  }

  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    await this.playlistRepository.removeTrack(playlistId, trackId);
    logger.info(`Track removed from playlist: ${trackId} <- ${playlistId}`);
  }

  async reorderPlaylistTracks(
    playlistId: string,
    trackOrder: { trackId: string; position: number }[]
  ): Promise<void> {
    await this.playlistRepository.reorderTracks(playlistId, trackOrder);
    logger.info(`Playlist reordered: ${playlistId}`);
  }

  async autoOrderPlaylist(playlistId: string): Promise<void> {
    const playlist = await this.playlistRepository.getById(playlistId);
    if (!playlist) return;

    const tracks = await this.trackRepository.getByPlaylistId(playlistId);
    if (tracks.length === 0) return;

    const sorted: Track[] = [];
    const used = new Set<string>();

    let current = tracks.reduce((min, t) =>
      (t.energy_level ?? 0) < (min.energy_level ?? 0) ? t : min
    );
    sorted.push(current);
    used.add(current.id);

    while (sorted.length < tracks.length) {
      let bestTrack: Track | null = null;
      let bestScore = -Infinity;

      for (const track of tracks) {
        if (used.has(track.id)) continue;

        const keyDistance = calculateKeyDistance(
          current.key_camelot ?? "8A",
          track.key_camelot ?? "8A"
        );
        const keyScore = Math.max(0, 10 - keyDistance);
        const bpmDiff = Math.abs((track.bpm ?? 120) - (current.bpm ?? 120));
        const bpmScore = Math.max(0, 5 - bpmDiff / 10);
        const energyDiff = (track.energy_level ?? 5) - (current.energy_level ?? 5);
        const energyScore = Math.max(0, 5 - Math.abs(energyDiff) * 2);

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

    const order = sorted.map((t, i) => ({ trackId: t.id, position: i }));
    await this.reorderPlaylistTracks(playlistId, order);
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    await this.playlistRepository.delete(playlistId);
    logger.info(`Playlist deleted: ${playlistId}`);
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    return this.playlistRepository.getAll();
  }
}
