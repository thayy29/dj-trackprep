import { useEffect, useRef } from "react";

interface WaveformProps {
  data?: string; // base64 encoded waveform data
  height?: number;
  onClick?: () => void;
  className?: string;
}

export function Waveform({ data, height = 40, onClick, className = "" }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const h = height;

    // Clear
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, width, h);

    // Generate or use provided waveform data
    let peaks: number[] = [];
    if (data) {
      try {
        const decoded = atob(data);
        peaks = Array.from(decoded).map((c) => c.charCodeAt(0));
      } catch {
        peaks = generateRandomWaveform(100);
      }
    } else {
      peaks = generateRandomWaveform(100);
    }

    // Draw waveform
    ctx.strokeStyle = "#1DB954";
    ctx.lineWidth = 1;
    ctx.beginPath();

    const barWidth = width / peaks.length;
    peaks.forEach((peak, i) => {
      const x = i * barWidth + barWidth / 2;
      const y = h / 2 - (peak / 255) * (h / 2);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Fill area
    ctx.lineTo(width, h / 2);
    ctx.lineTo(0, h / 2);
    ctx.closePath();
    ctx.fillStyle = "rgba(29,185,84,0.1)";
    ctx.fill();
  }, [data, height]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={height}
      onClick={onClick}
      className={`w-full cursor-pointer ${className}`}
    />
  );
}

function generateRandomWaveform(count: number): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const value = Math.sin(angle) * 100 + 128;
    peaks.push(Math.max(0, Math.min(255, value)));
  }
  return peaks;
}
