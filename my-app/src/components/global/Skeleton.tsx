interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = "h-10 w-full", count = 1 }: SkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${className} bg-gradient-to-r from-background-elevated via-background-elevated/50 to-background-elevated animate-pulse rounded-lg`}
        />
      ))}
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 5 }: SkeletonTableProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-3">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="flex-1 h-8 bg-gradient-to-r from-background-elevated via-background-elevated/50 to-background-elevated animate-pulse rounded-lg"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface SkeletonWaveformProps {
  width?: string;
  height?: string;
}

export function SkeletonWaveform({ width = "w-20", height = "h-5" }: SkeletonWaveformProps) {
  return (
    <div
      className={`${width} ${height} bg-gradient-to-r from-background-elevated via-background-elevated/50 to-background-elevated animate-pulse rounded`}
    />
  );
}
