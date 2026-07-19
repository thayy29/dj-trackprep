import { useEffect, useState } from "react";
import { ConvertPreset } from "../../types/index.js";
import { api } from "../../services/api.js";

interface ConvertModalProps {
  isOpen: boolean;
  trackCount: number;
  onClose: () => void;
  onSubmit: (presetId: string) => void;
  isLoading?: boolean;
}

export function ConvertModal({
  isOpen,
  trackCount,
  onClose,
  onSubmit,
  isLoading,
}: ConvertModalProps) {
  const [presets, setPresets] = useState<ConvertPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPresets();
    }
  }, [isOpen]);

  const loadPresets = async () => {
    setLoading(true);
    try {
      const result = await api.getConvertPresets();
      setPresets(result.presets);
      if (result.presets.length > 0) {
        setSelectedPreset(result.presets[0].id);
      }
    } catch (error) {
      console.error("Failed to load presets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background-surface rounded-xl p-8 max-w-md w-full mx-4 border border-border-light">
        <h2 className="text-xl font-semibold mb-2">Converter faixas</h2>
        <p className="text-sm text-text-medium mb-6">
          {trackCount} faixa{trackCount !== 1 ? "s" : ""} será{trackCount !== 1 ? "ão" : ""} convertida{trackCount !== 1 ? "s" : ""}
        </p>

        <div className="space-y-4 mb-6">
          {loading ? (
            <div className="text-center py-8 text-text-medium">
              Carregando presets...
            </div>
          ) : (
            presets.map((preset) => (
              <label
                key={preset.id}
                className="flex items-start gap-3 p-4 border border-border-light rounded-lg cursor-pointer hover:bg-background-elevated/20 transition-colors"
              >
                <input
                  type="radio"
                  name="preset"
                  value={preset.id}
                  checked={selectedPreset === preset.id}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-text-low mt-1">
                    {preset.format.toUpperCase()} · {preset.sample_rate}Hz
                    {preset.bit_depth ? ` · ${preset.bit_depth}-bit` : ""}
                    {preset.loudness_lufs ? ` · ${preset.loudness_lufs} LUFS` : ""}
                  </div>
                  {preset.description && (
                    <div className="text-xs text-text-low mt-2">
                      {preset.description}
                    </div>
                  )}
                </div>
              </label>
            ))
          )}
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
            onClick={() => onSubmit(selectedPreset)}
            disabled={!selectedPreset || isLoading}
            className="flex-1 py-2.5 px-4 bg-action-primary text-black rounded-lg text-sm font-semibold hover:bg-action-primaryHover disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Convertendo..." : "Converter"}
          </button>
        </div>
      </div>
    </div>
  );
}
