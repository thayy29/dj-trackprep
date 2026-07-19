import { useState, useCallback, useRef, useEffect } from "react";
import { Track } from "../types/index.js";
import { api, APIError } from "../services/api.js";

const POLLING_INTERVAL = 1000; // 1 segundo

export function useAudioAnalysis() {
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const pollersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Limpa todos os pollers ao desmontar
  useEffect(() => {
    return () => {
      pollersRef.current.forEach((interval) => clearInterval(interval));
      pollersRef.current.clear();
    };
  }, []);

  const stopPolling = useCallback((trackId: string) => {
    const interval = pollersRef.current.get(trackId);
    if (interval) {
      clearInterval(interval);
      pollersRef.current.delete(trackId);
    }
    setAnalyzing((prev) => {
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    });
  }, []);

  /**
   * Faz polling do status de uma faixa até que a análise termine
   * (status "analyzed" ou "error"), chamando onUpdate a cada mudança.
   */
  const pollTrackStatus = useCallback(
    (trackId: string, onUpdate: (track: Track) => void) => {
      if (pollersRef.current.has(trackId)) return;

      setAnalyzing((prev) => new Set([...prev, trackId]));

      const interval = setInterval(async () => {
        try {
          const { track } = await api.getTrack(trackId);
          onUpdate(track);

          if (track.status === "analyzed" || track.status === "error") {
            stopPolling(trackId);
          }
        } catch (err) {
          const message = err instanceof APIError ? err.message : "Failed to fetch track status";
          setError(message);
          stopPolling(trackId);
        }
      }, POLLING_INTERVAL);

      pollersRef.current.set(trackId, interval);
    },
    [stopPolling]
  );

  /**
   * Dispara uma (re)análise no backend e acompanha o progresso via polling.
   */
  const analyzeTrack = useCallback(
    async (trackId: string, onUpdate?: (track: Track) => void): Promise<void> => {
      setError(null);
      try {
        const { track } = await api.reanalyzeTrack(trackId);
        onUpdate?.(track);
      } catch (err) {
        const message = err instanceof APIError ? err.message : "Analysis failed";
        setError(message);
        return;
      }

      if (onUpdate) {
        pollTrackStatus(trackId, onUpdate);
      }
    },
    [pollTrackStatus]
  );

  const isAnalyzing = (trackId: string) => analyzing.has(trackId);

  return {
    analyzeTrack,
    pollTrackStatus,
    isAnalyzing,
    analyzing,
    error,
  };
}
