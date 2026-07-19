import { Track, Playlist, ConvertPreset, Export } from "../types/index.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${API_URL}${path}`;
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();

  if (!res.ok) {
    throw new APIError(
      res.status,
      data.error?.message || "Request failed",
      data.error?.code
    );
  }

  return data;
}

export const api = {
  // Tracks
  async uploadTracks(files: File[]): Promise<{ tracks: Track[] }> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const url = `${API_URL}/tracks/upload`;
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new APIError(
        res.status,
        data.error?.message || "Upload failed",
        data.error?.code
      );
    }

    return data;
  },

  async getTracks(): Promise<{ tracks: Track[] }> {
    return request("GET", "/tracks");
  },

  async getTrack(id: string): Promise<{ track: Track }> {
    return request("GET", `/tracks/${id}`);
  },

  async updateTrack(
    id: string,
    data: Partial<Track>
  ): Promise<{ track: Track }> {
    return request("PUT", `/tracks/${id}`, data);
  },

  async deleteTrack(id: string): Promise<void> {
    await request("DELETE", `/tracks/${id}`);
  },

  async reanalyzeTrack(id: string): Promise<{ track: Track }> {
    return request("POST", `/tracks/${id}/reanalyze`);
  },

  // Playlists
  async createPlaylist(
    title: string,
    description?: string
  ): Promise<{ playlist: Playlist }> {
    return request("POST", "/playlists", { title, description });
  },

  async getPlaylist(id: string): Promise<{ playlist: Playlist }> {
    return request("GET", `/playlists/${id}`);
  },

  async addTrackToPlaylist(
    playlistId: string,
    trackId: string,
    position?: number
  ): Promise<{ playlistTrack: unknown }> {
    return request("POST", `/playlists/${playlistId}/tracks`, {
      track_id: trackId,
      position,
    });
  },

  async removeTrackFromPlaylist(
    playlistId: string,
    trackId: string
  ): Promise<void> {
    await request("DELETE", `/playlists/${playlistId}/tracks/${trackId}`);
  },

  async reorderPlaylist(
    playlistId: string,
    tracks: { track_id: string; position: number }[]
  ): Promise<{ playlist: Playlist }> {
    return request("PUT", `/playlists/${playlistId}/reorder`, { tracks });
  },

  async autoOrderPlaylist(playlistId: string): Promise<{ playlist: Playlist }> {
    return request("POST", `/playlists/${playlistId}/auto-order`);
  },

  async deletePlaylist(id: string): Promise<void> {
    await request("DELETE", `/playlists/${id}`);
  },

  // Convert Presets
  async getConvertPresets(): Promise<{ presets: ConvertPreset[] }> {
    return request("GET", "/convert/presets");
  },

  async getConvertPreset(id: string): Promise<{ preset: ConvertPreset }> {
    return request("GET", `/convert/presets/${id}`);
  },

  // Exports
  async createExport(
    playlistId: string,
    presetId: string
  ): Promise<{ export: Export }> {
    return request("POST", "/convert/exports", {
      playlist_id: playlistId,
      preset_id: presetId,
    });
  },

  async getExport(id: string): Promise<{ export: Export }> {
    return request("GET", `/convert/exports/${id}`);
  },
};

export { APIError };
