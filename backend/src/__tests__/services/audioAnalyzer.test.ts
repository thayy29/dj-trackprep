import { calculateKeyDistance, areKeysCompatible, getCompatibleKeys, calculateMixBpm } from "../../services/audioAnalyzer";

describe("Audio Analyzer - Harmonic Mixing", () => {
  describe("calculateKeyDistance", () => {
    it("should return 0 for identical keys", () => {
      expect(calculateKeyDistance("5A", "5A")).toBe(0);
      expect(calculateKeyDistance("12B", "12B")).toBe(0);
    });

    it("should return 0.5 for same number different mode", () => {
      expect(calculateKeyDistance("5A", "5B")).toBe(0.5);
      expect(calculateKeyDistance("1B", "1A")).toBe(0.5);
    });

    it("should return 1 for adjacent numbers", () => {
      expect(calculateKeyDistance("5A", "6A")).toBe(1);
      expect(calculateKeyDistance("12A", "1A")).toBe(1); // Circular
    });

    it("should handle circular distance (12->1)", () => {
      expect(calculateKeyDistance("1A", "12A")).toBe(1);
      expect(calculateKeyDistance("1A", "11A")).toBe(2);
    });

    it("should return 12 for invalid keys", () => {
      expect(calculateKeyDistance("", "5A")).toBe(12);
      expect(calculateKeyDistance("5A", "")).toBe(12);
    });
  });

  describe("areKeysCompatible", () => {
    it("should return true for identical keys", () => {
      expect(areKeysCompatible("5A", "5A")).toBe(true);
    });

    it("should return true for mode switches (distance 0.5)", () => {
      expect(areKeysCompatible("5A", "5B")).toBe(true);
    });

    it("should return true for adjacent keys (distance 1)", () => {
      expect(areKeysCompatible("5A", "6A")).toBe(true);
      expect(areKeysCompatible("5A", "4B")).toBe(true);
    });

    it("should return false for incompatible keys (distance > 1)", () => {
      expect(areKeysCompatible("5A", "7A")).toBe(false);
      expect(areKeysCompatible("1A", "6A")).toBe(false);
    });
  });

  describe("getCompatibleKeys", () => {
    it("should return compatible keys for a given key", () => {
      const compatible = getCompatibleKeys("5A");
      // Should include: 5B, 6A/B, 4A/B (at least)
      expect(compatible).toContain("5B"); // Mode switch
      expect(compatible.length).toBeGreaterThan(0);
    });

    it("should handle edge cases (key 1 and 12)", () => {
      const compatible1 = getCompatibleKeys("1A");
      expect(compatible1).toContain("1B");

      const compatible12 = getCompatibleKeys("12A");
      expect(compatible12).toContain("12B");
    });
  });

  describe("calculateMixBpm", () => {
    it("should return original BPM if already close (ratio 0.95-1.05)", () => {
      const result = calculateMixBpm(120, 122);
      expect(result.targetBpm).toBe(122);
      expect(result.ratio).toBeCloseTo(122 / 120, 2);
    });

    it("should handle half-speed BPM (ratio 0.45-0.55)", () => {
      const result = calculateMixBpm(120, 60);
      expect(result.targetBpm).toBe(120); // Double the 60 BPM
      expect(result.ratio).toBeCloseTo(1, 1);
    });

    it("should handle double-speed BPM (ratio 1.9-2.1)", () => {
      const result = calculateMixBpm(60, 120);
      expect(result.targetBpm).toBe(60); // Half the 120 BPM
      expect(result.ratio).toBeCloseTo(1, 1);
    });

    it("should return as-is for very different BPMs", () => {
      const result = calculateMixBpm(100, 140);
      expect(result.targetBpm).toBe(140);
    });
  });
});
