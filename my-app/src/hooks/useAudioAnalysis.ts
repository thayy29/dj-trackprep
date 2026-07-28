import { useState, useCallback, useRef } from "react";
import { Track } from "../types/index.js";
import { api, APIError } from "../services/api.js";

interface AnalysisResult {
  success: boolean;
  track?: Track;
  error?: string;
}

const BATCH_SIZE = 3;
const POLLING_INTERVAL = 1000;
const POLLING_TIMEOUT = 30000;

export function useAudioAnalysis() {
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const analyzeQueueRef = useRef<{ trackId: string; onAnalyzed?: (track: Track) => void }[]>([]);
  const activeAnalysisRef = useRef<Set<string>>(new Set());
  const processingRef = useRef(false);

  const pollTrackStatus = useCallback(
    async (trackId: string): Promise<Track | null> => {
      const startTime = Date.now();

      while (Date.now() - startTime < POLLING_TIMEOUT) {
        try {
          const result = await api.getTrack(trackId);
          if (result.track.status !== "analyzing") {
            return result.track;
          }
          await new Promise((r) => setTimeout(r, POLLING_INTERVAL));
        } catch (err) {
          console.error("Polling error:", err);
          return null;
        }
      }

      return null;
    },
    []
  );

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (
      analyzeQueueRef.current.length > 0 &&
      activeAnalysisRef.current.size < BATCH_SIZE
    ) {
      const item = analyzeQueueRef.current.shift();
      if (!item) break;

      const { trackId, onAnalyzed } = item;
      activeAnalysisRef.current.add(trackId);

      // For newly uploaded tracks: poll for analysis completion
      // For existing tracks: call reanalyze
      // Both will eventually call pollTrackStatus to wait for completion
      (async () => {
        try {
          // Try to get current status first
          const currentTrack = await api.getTrack(trackId);

          // If analyzing, poll for completion
          if (currentTrack.track.status === "analyzing") {
            const analyzedTrack = await pollTrackStatus(trackId);
            if (analyzedTrack && onAnalyzed) {
              onAnalyzed(analyzedTrack);
            }
          } else if (currentTrack.track.status === "analyzed" && onAnalyzed) {
            // Already analyzed, call callback immediately
            onAnalyzed(currentTrack.track);
          } else if (currentTrack.track.status === "error") {
            // If errored, trigger reanalyze
            await api.reanalyzeTrack(trackId);
            const analyzedTrack = await pollTrackStatus(trackId);
            if (analyzedTrack && onAnalyzed) {
              onAnalyzed(analyzedTrack);
            }
          }

          setAnalyzing((prev) => {
            const next = new Set(prev);
            next.delete(trackId);
            return next;
          });
        } catch (err) {
          const message = err instanceof APIError ? err.message : "Analysis failed";
          setError(message);
          setAnalyzing((prev) => {
            const next = new Set(prev);
            next.delete(trackId);
            return next;
          });
        } finally {
          activeAnalysisRef.current.delete(trackId);
        }
      })();
    }

    processingRef.current = false;
  }, [pollTrackStatus]);

  const analyzeTrack = useCallback(
    async (trackId: string, onAnalyzed?: (trackId: string, track: Track) => void): Promise<AnalysisResult> => {
      setAnalyzing((prev) => new Set([...prev, trackId]));
      setError(null);

      analyzeQueueRef.current.push({
        trackId,
        onAnalyzed: onAnalyzed ? (track) => onAnalyzed(trackId, track) : undefined,
      });

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
