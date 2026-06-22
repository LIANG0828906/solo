import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface WaveformProps {
  data: number[];
  color: string;
  height?: number;
  onSeek?: (percent: number) => void;
  currentTime?: number;
  duration?: number;
  showPlayhead?: boolean;
}

export default function Waveform({
  data,
  color,
  height = 60,
  onSeek,
  currentTime = 0,
  duration = 0,
  showPlayhead = false,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, percent)));
  };

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const barCount = data.length;
  const barWidth = barCount > 0 ? 100 / barCount : 0;

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={cn(
        'relative w-full rounded-lg overflow-hidden',
        onSeek && 'cursor-pointer'
      )}
      style={{ height }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
      >
        {data.map((value, index) => {
          const barHeight = Math.max(2, value * height * 0.9);
          const y = (height - barHeight) / 2;
          return (
            <rect
              key={index}
              x={index * barWidth + barWidth * 0.15}
              y={y}
              width={Math.max(1, barWidth * 0.7)}
              height={barHeight}
              rx={1}
              fill={color}
              opacity={0.85}
            />
          );
        })}
      </svg>
      {showPlayhead && duration > 0 && (
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-danger z-10 pointer-events-none transition-all duration-100"
          style={{ left: `${playheadPercent}%` }}
        >
          <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-danger" />
        </div>
      )}
    </div>
  );
}
