import { motion } from 'framer-motion';

interface SpectrumVisualizerProps {
  data: Uint8Array;
}

export function SpectrumVisualizer({ data }: SpectrumVisualizerProps) {
  const barCount = 64;
  const barWidth = 4;
  const barGap = 2;
  const maxHeight = 60;

  const displayData = new Array(barCount).fill(0).map((_, i) => {
    if (i < data.length) {
      const normalizedValue = data[i] / 255;
      return Math.max(2, normalizedValue * maxHeight);
    }
    return 2;
  });

  return (
    <div
      className="relative overflow-hidden rounded"
      style={{
        height: maxHeight + 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '5px',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
      }}
    >
      <div
        className="flex items-end justify-center h-full gap-[2px]"
        style={{ gap: barGap }}
      >
        {displayData.map((height, i) => {
          const intensity = i / barCount;
          const r = Math.floor(0 + intensity * 255);
          const g = Math.floor(255 - intensity * 200);
          const b = Math.floor(127 - intensity * 127);
          const color = `rgb(${r}, ${g}, ${b})`;

          return (
            <motion.div
              key={i}
              className="rounded-t"
              style={{
                width: barWidth,
                backgroundColor: color,
                boxShadow: `0 0 8px ${color}40`,
                willChange: 'height',
              }}
              initial={{ height: 2 }}
              animate={{ height }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                duration: 0.1,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
