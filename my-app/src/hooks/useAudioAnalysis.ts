import { useState, useCallback, useRef } from "react";
import { Track } from "../types/index.js";
import { api, APIError } from "../services/api.js";

interface AnalysisResult {
  success: boolean;
  track?: Track;
  error?: string;
}

const BATCH_SIZE = 3; // Limita análises simultâneas
const POLLING_INTERVAL = 1000; // 1 segundo

export function useAudioAnalysis() {
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const analyzeQueueRef = useRef<string[]>([]);
  const activeAnalysisRef = useRef<Set<string>>(new Set());

  const processQueue = useCallback(async () => {
    while (
      analyzeQueueRef.current.length > 0 &&
      activeAnalysisRef.current.size < BATCH_SIZE
    ) {
      const trackId = analyzeQueueRef.current.shift();
      if (!trackId) break;

      activeAnalysisRef.current.add(trackId);

      // Análise em background sem bloquear
      api
        .reanalyzeTrack(trackId)
        .then(() => {
          setAnalyzing((prev) => {
            const next = new Set(prev);
            next.delete(trackId);
            return next;
          });
        })
        .catch((err) => {
          const message = err instanceof APIError ? err.message : "Analysis failed";
          setError(message);
          setAnalyzing((prev) => {
            const next = new Set(prev);
            next.delete(trackId);
            return next;
          });
        })
        .finally(() => {
          activeAnalysisRef.current.delete(trackId);
          // Processa próximo item da fila
          setTimeout(processQueue, 100);
        });
    }
  }, []);

  const analyzeTrack = useCallback(
    async (trackId: string): Promise<AnalysisResult> => {
      setAnalyzing((prev) => new Set([...prev, trackId]));
      setError(null);

      // Adiciona à fila ao invés de processar imediatamente
      analyzeQueueRef.current.push(trackId);
      processQueue();

      return { success: true };
    },
    [processQueue]
  );

  const isAnalyzing = (trackId: string) => analyzing.has(trackId);

  return {
    analyzeTrack,
    isAnalyzing,
    analyzing,
    error,
  };
}
