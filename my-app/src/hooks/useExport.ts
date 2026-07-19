import { useState, useCallback, useEffect } from "react";
import { api, APIError } from "../services/api.js";
import { Export } from "../types/index.js";

export function useExport() {
  const [exports, setExports] = useState<Map<string, Export>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const createExport = useCallback(
    async (playlistId: string, presetId: string): Promise<Export | null> => {
      setError(null);
      try {
        const result = await api.createExport(playlistId, presetId);
        setExports((prev) => new Map(prev).set(result.export.id, result.export));

        // Poll for completion
        pollExportStatus(result.export.id);

        return result.export;
      } catch (err) {
        const message = err instanceof APIError ? err.message : "Export failed";
        setError(message);
        return null;
      }
    },
    []
  );

  const pollExportStatus = useCallback((exportId: string) => {
    const interval = setInterval(async () => {
      try {
        const result = await api.getExport(exportId);
        setExports((prev) => new Map(prev).set(exportId, result.export));

        if (
          result.export.status === "completed" ||
          result.export.status === "error"
        ) {
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Failed to poll export status:", err);
        clearInterval(interval);
      }
    }, 1000); // Poll every second
  }, []);

  const getExport = useCallback((id: string) => {
    return exports.get(id);
  }, [exports]);

  return {
    createExport,
    getExport,
    exports: Array.from(exports.values()),
    error,
  };
}
