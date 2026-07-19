import { AudioAnalysis } from "../types/index.js";
import { logger } from "../logger.js";
import fs from "fs";

/**
 * Mock audio analyzer - replace with real implementation using:
 * - ffprobe for metadata extraction
 * - essentia.js or librosa bindings for BPM/key detection
 * - waveform.js for waveform generation
 */

// Camelot wheel mapping: position -> note
const CAMELOT_NOTES: Record<number, string> = {
  0: "B", 1: "F#", 2: "C#", 3: "G#", 4: "D#", 5: "A#",
  6: "F", 7: "C", 8: "G", 9: "D", 10: "A", 11: "E",
};

function estimateKeyFromFile(filePath: string): { camelot: string; note: string } {
  // Mock: use file name or hash to generate deterministic key
  const hash = filePath.split("/").pop()?.charCodeAt(0) ?? 0;
  const keyIndex = hash % 12;
  const majorMinor = hash % 2 === 0 ? "B" : "A"; // 50/50 major/minor
  const camelotNum = (keyIndex % 12) + 1;
  const camelot = `${camelotNum}${majorMinor}`;
  const note = CAMELOT_NOTES[keyIndex] || "C";

  return { camelot, note };
}

function estimateBpmFromFile(filePath: string): number {
  // Mock: generate BPM between 100-140 deterministically
  const hash = filePath.charCodeAt(filePath.length - 1);
  return 100 + (hash % 41);
}

function estimateEnergyFromFile(filePath: string): number {
  // Mock: generate energy 1-10 based on file attributes
  const stats = fs.statSync(filePath);
  return Math.max(1, Math.min(10, Math.floor((stats.size / 5000000) * 10)));
}

export async function analyzeAudio(filePath: string): Promise<AudioAnalysis> {
  try {
    const stats = fs.statSync(filePath);

    if (!stats.isFile()) {
      throw new Error("File does not exist");
    }

    logger.debug(`Analyzing audio: ${filePath}`);

    // Mock analysis - replace with real implementation
    const { camelot, note } = estimateKeyFromFile(filePath);
    const bpm = estimateBpmFromFile(filePath);
    const energy = estimateEnergyFromFile(filePath);
    const duration_ms = Math.floor(Math.random() * 300000) + 120000; // 2-7 min

    // TODO: Generate actual waveform data using audio library
    const waveform_data = generateMockWaveform();

    logger.debug(`Analysis complete: ${filePath} - ${camelot} ${bpm}BPM Energy:${energy}`);

    return {
      bpm,
      key_camelot: camelot,
      key_note: note,
      energy_level: energy,
      duration_ms,
      waveform_data,
    };
  } catch (error) {
    logger.error(`Audio analysis failed for ${filePath}:`, error);
    throw new Error(`Failed to analyze audio: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function generateMockWaveform(): string {
  // Generate 100 points of mock waveform data (base64 encoded for efficiency)
  const peaks = Array.from({ length: 100 }, () =>
    Math.floor(Math.random() * 255)
  );
  return Buffer.from(peaks).toString("base64");
}

/**
 * Calculate harmonic compatibility between two keys
 * Returns 0-12, where 0-2 = compatible, 3+ = less compatible
 */
export function calculateKeyDistance(key1: string, key2: string): number {
  const extractNum = (k: string) => parseInt(k.slice(0, -1), 10);
  const num1 = extractNum(key1);
  const num2 = extractNum(key2);
  const distance = Math.abs(num1 - num2);
  return Math.min(distance, 12 - distance);
}

/**
 * Check if two tracks are harmonically compatible
 * Compatible if: same key, adjacent keys, or same number different mode
 */
export function areKeysCompatible(key1: string, key2: string): boolean {
  const distance = calculateKeyDistance(key1, key2);
  return distance <= 1 || (key1.slice(0, -1) === key2.slice(0, -1)); // Adjacent or same number
}

/**
 * Calculate optimal mixing BPM between two tracks
 * Returns target BPM to beatmatch without extreme time-stretching
 */
export function calculateMixBpm(bpm1: number, bpm2: number): { targetBpm: number; ratio: number } {
  const ratio = bpm2 / bpm1;
  // Ideal ratio: 0.95-1.05 (no more than 5% tempo change)
  if (ratio >= 0.95 && ratio <= 1.05) {
    return { targetBpm: bpm2, ratio };
  }
  // Allow half/double if needed
  if (ratio >= 0.45 && ratio <= 0.55) {
    return { targetBpm: bpm2 * 2, ratio: ratio * 2 };
  }
  if (ratio >= 1.9 && ratio <= 2.1) {
    return { targetBpm: bpm2 / 2, ratio: ratio / 2 };
  }
  // Otherwise return as-is
  return { targetBpm: bpm2, ratio };
}
