import { useState, useEffect } from "react";
import { Track } from "../../types/index.js";

interface EditTrackModalProps {
  isOpen: boolean;
  track: Track | null;
  onClose: () => void;
  onSubmit: (updates: Partial<Track>) => void;
  isLoading?: boolean;
  error?: string | null;
}

const CAMELOT_KEYS = [
  "1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B", "6A", "6B",
  "7A", "7B", "8A", "8B", "9A", "9B", "10A", "10B", "11A", "11B", "12A", "12B",
];

export function EditTrackModal({
  isOpen,
  track,
  onClose,
  onSubmit,
  isLoading,
  error,
}: EditTrackModalProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("");
  const [energy, setEnergy] = useState("");

  // Sync state when track or modal opens - SAFE: only on open or track change
  useEffect(() => {
    if (isOpen && track) {
      // Pre-fill form with current track data
      setTitle(track.title || "");
      setArtist(track.artist || "");
      setBpm(track.bpm?.toString() || "");
      setKey(track.key_camelot || "");
      setEnergy(track.energy_level?.toString() || "");
      console.log("[EditModal] Pre-filled form for track:", track.id);
    } else if (!isOpen) {
      // Clear state when modal closes (prevent stale data leaking)
      setTitle("");
      setArtist("");
      setBpm("");
      setKey("");
      setEnergy("");
      console.log("[EditModal] Cleared form state");
    }
  }, [isOpen, track?.id]); // Only sync on modal open/close or track change

  const handleSubmit = () => {
    if (!track) {
      console.error("[EditModal] ERROR: No track selected for edit");
      return;
    }

    const updates: Partial<Track> = {};

    // CRITICAL FIX: Compare current values with original track values
    // Include field if it changed (even to empty string)
    const originalTitle = track.title || "";
    const originalArtist = track.artist || "";
    const originalBpm = track.bpm || 0;
    const originalKey = track.key_camelot || "";
    const originalEnergy = track.energy_level || 1;

    console.log("[EditModal] Comparing values:");
    console.log(`  Title: "${originalTitle}" → "${title}" (changed: ${originalTitle !== title})`);
    console.log(`  Artist: "${originalArtist}" → "${artist}" (changed: ${originalArtist !== artist})`);
    console.log(`  BPM: ${originalBpm} → ${bpm} (changed: ${originalBpm !== parseInt(bpm)})`);
    console.log(`  Key: "${originalKey}" → "${key}" (changed: ${originalKey !== key})`);
    console.log(`  Energy: ${originalEnergy} → ${energy} (changed: ${originalEnergy !== parseInt(energy)})`);

    // Include field if it changed (compare with original, not just if not empty)
    if (title !== originalTitle) updates.title = title;
    if (artist !== originalArtist) updates.artist = artist;
    if (bpm && parseInt(bpm) !== originalBpm) updates.bpm = parseInt(bpm);
    if (key !== originalKey) updates.key_camelot = key;
    if (energy && parseInt(energy) !== originalEnergy) updates.energy_level = parseInt(energy);

    // Only submit if there are actual changes
    if (Object.keys(updates).length === 0) {
      console.log("[EditModal] ℹ️ No changes detected");
      onClose();
      return;
    }

    console.log("[EditModal] ✅ Submitting updates:", updates);
    onSubmit(updates);
  };

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background-surface rounded-xl p-8 max-w-md w-full mx-4 border border-border-light">
        <h2 className="text-xl font-semibold mb-6">Editar faixa</h2>

        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="text-sm text-red-400">❌ {error}</div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-background-elevated border border-border-light rounded-lg text-sm text-text-high placeholder-text-low focus:border-action-primary focus:outline-none disabled:opacity-50"
              placeholder="Título da faixa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Artista</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-background-elevated border border-border-light rounded-lg text-sm text-text-high placeholder-text-low focus:border-action-primary focus:outline-none disabled:opacity-50"
              placeholder="Nome do artista"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">BPM</label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                disabled={isLoading}
                min="60"
                max="300"
                className="w-full px-3 py-2 bg-background-elevated border border-border-light rounded-lg text-sm text-text-high placeholder-text-low focus:border-action-primary focus:outline-none disabled:opacity-50"
                placeholder="128"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tom</label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-background-elevated border border-border-light rounded-lg text-sm text-text-high focus:border-action-primary focus:outline-none disabled:opacity-50"
              >
                <option value="">Selecionar...</option>
                {CAMELOT_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Energia ({energy || "—"}/10)
            </label>
            <input
              type="range"
              value={energy}
              onChange={(e) => setEnergy(e.target.value)}
              disabled={isLoading}
              min="1"
              max="10"
              className="w-full"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 border border-border-light rounded-lg text-sm font-medium hover:border-text-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 bg-action-primary text-black rounded-lg text-sm font-semibold hover:bg-action-primaryHover disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
