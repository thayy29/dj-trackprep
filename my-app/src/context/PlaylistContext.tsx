import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { Track, Playlist, PlaylistDraft } from "../types/index.js";
import { api } from "../services/api.js";

interface PlaylistContextType {
  tracks: Track[];
  playlist: Playlist | null;
  isLoading: boolean;
  error: string | null;

  // Track operations
  addTracks: (tracks: Track[]) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  reorderTracks: (newOrder: Track[]) => void;

  // Playlist operations
  setPlaylist: (playlist: Playlist | null) => void;
  autoOrderPlaylist: () => Promise<void>;

  // Selection
  selectedIds: Set<string>;
  toggleSelection: (trackId: string) => void;
  selectAll: (tracks: Track[]) => void;
  clearSelection: () => void;

  // Draft persistence
  saveDraft: () => void;
  loadDraft: () => void;
  clearDraft: () => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem("playlistDraft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft) as PlaylistDraft;
        setPlaylist({
          id: parsed.id,
          title: parsed.title,
          description: parsed.description,
          total_duration_ms: 0,
          total_tracks: parsed.trackIds.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Fetch tracks from server
        Promise.all(parsed.trackIds.map((id) => api.getTrack(id)))
          .then((results) => {
            const loadedTracks = results.map((r) => r.track);
            setTracks(loadedTracks);
          })
          .catch((err) => {
            console.error("Failed to restore tracks from draft:", err);
          });
      } catch (err) {
        console.error("Failed to parse draft:", err);
      }
    }
  }, []);

  const addTracks = useCallback((newTracks: Track[]) => {
    setTracks((prev) => [...prev, ...newTracks]);
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    });
  }, []);

  const updateTrack = useCallback((trackId: string, updates: Partial<Track>) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, ...updates } : t))
    );
  }, []);

  const reorderTracks = useCallback((newOrder: Track[]) => {
    setTracks(newOrder);
  }, []);

  const toggleSelection = useCallback((trackId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((tracksToSelect: Track[]) => {
    setSelectedIds(new Set(tracksToSelect.map((t) => t.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const autoOrderPlaylist = useCallback(async () => {
    if (!playlist) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.autoOrderPlaylist(playlist.id);
      if (result.playlist.tracks) {
        setTracks(result.playlist.tracks);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to auto-order playlist"
      );
    } finally {
      setIsLoading(false);
    }
  }, [playlist]);

  const saveDraft = useCallback(() => {
    if (tracks.length === 0) return;
    const draft: PlaylistDraft = {
      id: playlist?.id || `draft-${Date.now()}`,
      title: playlist?.title || "Untitled Set",
      description: playlist?.description,
      trackIds: tracks.map((t) => t.id),
      updatedAt: Date.now(),
    };
    localStorage.setItem("playlistDraft", JSON.stringify(draft));
  }, [tracks, playlist]);

  // Auto-save draft when tracks or playlist changes
  useEffect(() => {
    if (tracks.length > 0) {
      saveDraft();
    }
  }, [tracks, playlist, saveDraft]);

  const loadDraft = useCallback(() => {
    // This is now called automatically on mount via the useEffect above
    const draft = localStorage.getItem("playlistDraft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft) as PlaylistDraft;
        console.log(`Loaded draft: ${parsed.title} (${parsed.trackIds.length} tracks)`);
      } catch (err) {
        console.error("Failed to load draft:", err);
      }
    }
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem("playlistDraft");
  }, []);

  const value = useMemo(
    () => ({
      tracks,
      playlist,
      isLoading,
      error,
      addTracks,
      removeTrack,
      updateTrack,
      reorderTracks,
      setPlaylist,
      autoOrderPlaylist,
      selectedIds,
      toggleSelection,
      selectAll,
      clearSelection,
      saveDraft,
      loadDraft,
      clearDraft,
    }),
    [
      tracks,
      playlist,
      isLoading,
      error,
      addTracks,
      removeTrack,
      updateTrack,
      reorderTracks,
      setPlaylist,
      autoOrderPlaylist,
      selectedIds,
      toggleSelection,
      selectAll,
      clearSelection,
      saveDraft,
      loadDraft,
      clearDraft,
    ]
  );

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error("usePlaylist must be used within PlaylistProvider");
  }
  return context;
}
