import { PlaylistRepository } from "../repositories/PlaylistRepository";
import { TrackRepository } from "../repositories/TrackRepository";
import { Playlist, Track } from "../types/index";
import { logger } from "../logger";
import { calculateKeyDistance } from "./audioAnalyzer";

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
  ): Promise<Playlist> {
    await this.playlistRepository.reorderTracks(playlistId, trackOrder);
    logger.info(`Playlist reordered: ${playlistId}`);
    const playlistWithTracks = await this.playlistRepository.getByIdWithTracks(playlistId);
    return playlistWithTracks as Playlist;
  }

  async computeHarmonicOrder(tracks: Track[]): Promise<Track[]> {
    if (tracks.length === 0) return [];

    const sorted: Track[] = [];
    const used = new Set<string>();

    // Start with lowest energy track (build energy throughout set)
    let current = tracks.reduce((min, t) =>
      (t.energy_level ?? 0) < (min.energy_level ?? 0) ? t : min
    );
    sorted.push(current);
    used.add(current.id);

    // Greedy algorithm: each step, pick next track with best harmonic compatibility
    while (sorted.length < tracks.length) {
      let bestTrack: Track | null = null;
      let bestScore = -Infinity;

      for (const track of tracks) {
        if (used.has(track.id)) continue;

        // HARMONIC COMPATIBILITY (60% weight) - most important for DJ mixing
        const keyDistance = calculateKeyDistance(
          current.key_camelot ?? "8A",
          track.key_camelot ?? "8A"
        );
        const keyScore = Math.max(0, 10 - keyDistance * 5);

        // BPM COMPATIBILITY (25% weight) - beatmatching requirement
        const bpmDiff = Math.abs((track.bpm ?? 120) - (current.bpm ?? 120));
        const bpmScore = Math.max(0, 5 - bpmDiff / 10);

        // ENERGY PROGRESSION (15% weight) - smooth energy buildup
        const energyDiff = (track.energy_level ?? 5) - (current.energy_level ?? 5);
        const energyScore = energyDiff >= 0 && energyDiff <= 2 ? 5 : Math.max(0, 3 - Math.abs(energyDiff));

        // Weighted score: harmonic (60%) + tempo (25%) + energy (15%)
        const score = keyScore * 0.6 + bpmScore * 0.25 + energyScore * 0.15;

        if (score > bestScore) {
          bestScore = score;
          bestTrack = track;
        }
      }

      if (!bestTrack) {
        bestTrack = tracks.find((t) => !used.has(t.id)) ?? null;
      }

      if (!bestTrack) break;

      sorted.push(bestTrack);
      used.add(bestTrack.id);
      current = bestTrack;
    }

    return sorted;
  }

  async autoOrderPlaylist(playlistId: string): Promise<Playlist> {
    const playlistWithTracks = await this.playlistRepository.getByIdWithTracks(playlistId);
    if (!playlistWithTracks) throw new Error(`Playlist not found: ${playlistId}`);

    const tracks = await this.trackRepository.getByPlaylistId(playlistId);
    if (tracks.length === 0) return playlistWithTracks;

    const sorted = await this.computeHarmonicOrder(tracks);
    const order = sorted.map((t, i) => ({ trackId: t.id, position: i }));
    return this.reorderPlaylistTracks(playlistId, order);
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    await this.playlistRepository.delete(playlistId);
    logger.info(`Playlist deleted: ${playlistId}`);
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    return this.playlistRepository.getAll();
  }
}
