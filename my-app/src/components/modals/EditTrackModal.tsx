import { useState } from "react";
import { Track } from "../../types/index.js";

interface EditTrackModalProps {
  isOpen: boolean;
  track: Track | null;
  onClose: () => void;
  onSubmit: (updates: Partial<Track>) => void;
  isLoading?: boolean;
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
}: EditTrackModalProps) {
  const [title, setTitle] = useState(track?.title || "");
  const [artist, setArtist] = useState(track?.artist || "");
  const [bpm, setBpm] = useState(track?.bpm?.toString() || "");
  const [key, setKey] = useState(track?.key_camelot || "");
  const [energy, setEnergy] = useState(track?.energy_level?.toString() || "");

  const handleSubmit = () => {
    const updates: Partial<Track> = {};
    if (title !== track?.title) updates.title = title;
    if (artist !== track?.artist) updates.artist = artist;
    if (bpm && parseInt(bpm) !== track?.bpm) updates.bpm = parseInt(bpm);
    if (key !== track?.key_camelot) updates.key_camelot = key;
    if (energy && parseInt(energy) !== track?.energy_level)
      updates.energy_level = parseInt(energy);

    onSubmit(updates);
  };

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background-surface rounded-xl p-8 max-w-md w-full mx-4 border border-border-light">
        <h2 className="text-xl font-semibold mb-6">Editar faixa</h2>

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
