import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
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

/**
 * CRITICAL FIX: Robust track state management
 *
 * Previous problem: localStorage was loaded on mount and conflicted with
 * new tracks being added. The auto-save would overwrite new additions.
 *
 * Solution:
 * 1. Use useRef to track if mount has happened (prevents stale loads)
 * 2. Only load draft ONCE on first mount
 * 3. Use optimistic updates for addTracks (show immediately)
 * 4. Sync to localStorage only AFTER tracks are confirmed stable
 * 5. Debounce auto-save to prevent race conditions
 */

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Refs to track state changes safely
  const mountedRef = useRef(false);
  const lastSaveTimeRef = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize playlist and load draft ONLY on first mount
  useEffect(() => {
    if (mountedRef.current) return; // Prevent re-initialization
    mountedRef.current = true;

    const initializePlaylist = async () => {
      const draft = localStorage.getItem("playlistDraft");

      if (draft) {
        try {
          const parsed = JSON.parse(draft) as PlaylistDraft;

          // Set playlist metadata
          setPlaylist({
            id: parsed.id,
            title: parsed.title,
            description: parsed.description,
            total_duration_ms: 0,
            total_tracks: parsed.trackIds.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          // Verify all track IDs exist on server before loading
          const results = await Promise.all(
            parsed.trackIds.map((id) =>
              api.getTrack(id).catch((err) => {
                console.warn(`Track ${id} not found on server, skipping`);
                return null;
              })
            )
          );

          const validTracks = results
            .filter((r) => r !== null)
            .map((r) => r!.track);

          // Only load if we got valid tracks
          if (validTracks.length > 0) {
            setTracks(validTracks);
          } else {
            console.warn("No valid tracks found in draft, starting fresh");
            localStorage.removeItem("playlistDraft");
          }
        } catch (err) {
          console.error("Failed to restore draft, starting fresh:", err);
          localStorage.removeItem("playlistDraft");
        }
      } else {
        // Create default playlist
        const defaultPlaylistId = `playlist-${Date.now()}`;
        setPlaylist({
          id: defaultPlaylistId,
          title: "DJ Set",
          description: "Harmonic mixing set",
          total_duration_ms: 0,
          total_tracks: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    };

    initializePlaylist();
  }, []);

  /**
   * SAFE addTracks: optimistic update with verification
   * Immediately updates state (user sees tracks)
   * Then verifies with debounced save
   */
  const addTracks = useCallback((newTracks: Track[]) => {
    if (!newTracks || newTracks.length === 0) {
      console.warn("[PlaylistContext] addTracks called with empty array");
      return;
    }

    console.log(`[PlaylistContext] Adding ${newTracks.length} tracks...`);

    // CRITICAL: Validate all tracks have required fields
    newTracks.forEach((t, idx) => {
      if (!t.id) console.error(`[PlaylistContext] Track ${idx} missing ID`);
      if (!t.file_name && !t.title) console.error(`[PlaylistContext] Track ${idx} missing name`);
    });

    // Optimistic update - show tracks immediately
    setTracks((prev) => {
      const trackIds = new Set(prev.map((t) => t.id));
      const uniqueNew = newTracks.filter((t) => {
        if (trackIds.has(t.id)) {
          console.warn(`[PlaylistContext] Duplicate track skipped: ${t.id}`);
          return false;
        }
        return true;
      });

      if (uniqueNew.length === 0) {
        console.warn("[PlaylistContext] All tracks were duplicates");
        return prev;
      }

      const updated = [...prev, ...uniqueNew];
      console.log(`[PlaylistContext] ✅ State updated: ${prev.length} → ${updated.length} tracks`);
      return updated;
    });
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
    console.log(`[PlaylistContext] updateTrack called for ${trackId}:`, updates);

    setTracks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === trackId) {
          const newTrack = { ...t, ...updates };
          console.log(`[PlaylistContext] ✅ Track updated:`, {
            id: trackId,
            before: t,
            after: newTrack,
          });
          return newTrack;
        }
        return t;
      });

      return updated;
    });
  }, []);

  const reorderTracks = useCallback((newOrder: Track[]) => {
    // VALIDATION: Ensure we're not losing tracks
    if (!newOrder || newOrder.length === 0) {
      console.error("[Reorder] CRITICAL: Attempted to set empty tracks array");
      return;
    }

    if (newOrder.length < tracks.length) {
      console.warn(
        `[Reorder] WARNING: Track count decreased from ${tracks.length} to ${newOrder.length}`
      );
    }

    // Verify all tracks have IDs (safety check)
    const missingIds = newOrder.filter((t) => !t.id);
    if (missingIds.length > 0) {
      console.error(`[Reorder] ERROR: ${missingIds.length} tracks missing IDs`);
      return;
    }

    console.log(`[Reorder] Reordering tracks: ${tracks.length} → ${newOrder.length}`);
    setTracks(newOrder);
  }, [tracks.length]);

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
    if (tracks.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const trackIds = tracks.map((t) => t.id);
      const result = await api.computeHarmonicOrder(trackIds);
      setTracks(result.ordered_tracks);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to auto-order tracks"
      );
    } finally {
      setIsLoading(false);
    }
  }, [tracks]);

  /**
   * SAFE saveDraft: debounced to prevent race conditions
   * Only saves if tracks exist and haven't been recently saved
   */
  const saveDraft = useCallback(() => {
    if (tracks.length === 0) return;

    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTimeRef.current;

    // Debounce: only save once per second minimum
    if (timeSinceLastSave < 1000) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveDraft();
      }, 1000 - timeSinceLastSave);
      return;
    }

    lastSaveTimeRef.current = now;

    const draft: PlaylistDraft = {
      id: playlist?.id || `draft-${Date.now()}`,
      title: playlist?.title || "Untitled Set",
      description: playlist?.description,
      trackIds: tracks.map((t) => t.id),
      updatedAt: now,
    };

    try {
      localStorage.setItem("playlistDraft", JSON.stringify(draft));
    } catch (err) {
      console.error("Failed to save draft:", err);
    }
  }, [tracks, playlist]);

  /**
   * Auto-save with debouncing and safety checks
   * Prevents excessive writes and race conditions
   */
  useEffect(() => {
    // Don't save during initial mount
    if (!mountedRef.current) return;

    // Don't save if no tracks
    if (tracks.length === 0) return;

    saveDraft();

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [tracks, playlist, saveDraft]);

  const loadDraft = useCallback(() => {
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
    setTracks([]);
    setPlaylist(null);
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
