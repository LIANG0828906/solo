import { useMemo } from 'react';
import './BookCover.css';

type BookCoverSize = 'sm' | 'md' | 'lg';

interface BookCoverProps {
  seed?: string | number;
  title?: string;
  size?: BookCoverSize;
  width?: number;
  height?: number;
  className?: string;
}

const COLORS = [
  '#1e3a5f',
  '#2c5282',
  '#3b82f6',
  '#5b21b6',
  '#7c3aed',
  '#8b5cf6',
  '#c2410c',
  '#ea580c',
  '#f97316',
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

interface Shape {
  type: 'rect' | 'circle' | 'triangle' | 'arc';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
}

const sizeMap: Record<BookCoverSize, { width: number; height: number }> = {
  sm: { width: 100, height: 140 },
  md: { width: 160, height: 220 },
  lg: { width: 220, height: 300 },
};

const BookCover = ({ seed = 'default', title, size, width, height, className = '' }: BookCoverProps) => {
  const baseSize = size ? sizeMap[size] : { width: 160, height: 220 };
  const finalWidth = width ?? baseSize.width;
  const finalHeight = height ?? baseSize.height;
  const shapes = useMemo(() => {
    const seedNum = typeof seed === 'number' ? seed : hashString(String(seed));
    const random = seededRandom(seedNum);
    const result: Shape[] = [];
    const shapeCount = 5 + Math.floor(random() * 4);

    for (let i = 0; i < shapeCount; i++) {
      const typeRandom = random();
      let type: Shape['type'];
      if (typeRandom < 0.4) type = 'rect';
      else if (typeRandom < 0.7) type = 'circle';
      else if (typeRandom < 0.9) type = 'triangle';
      else type = 'arc';

      const colorIndex = Math.floor(random() * COLORS.length);

      result.push({
        type,
        x: random() * finalWidth,
        y: random() * finalHeight,
        w: 30 + random() * (finalWidth * 0.6),
        h: 30 + random() * (finalHeight * 0.5),
        color: COLORS[colorIndex],
        rotation: random() * 360,
      });
    }

    return result;
  }, [seed, finalWidth, finalHeight]);

  const bgColor = useMemo(() => {
    const seedNum = typeof seed === 'number' ? seed : hashString(String(seed));
    const random = seededRandom(seedNum + 1);
    const bgColors = ['#f5f0e8', '#ede6db', '#e8e0d0', '#f0ebe3'];
    return bgColors[Math.floor(random() * bgColors.length)];
  }, [seed]);

  return (
    <div
      className={`book-cover ${className}`}
      style={{
        width: finalWidth,
        height: finalHeight,
        backgroundColor: bgColor,
      }}
    >
      <svg
        className="book-cover-svg"
        viewBox={`0 0 ${finalWidth} ${finalHeight}`}
        width={finalWidth}
        height={finalHeight}
      >
        <defs>
          <linearGradient id={`spine-${seed}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.15)" />
            <stop offset="30%" stopColor="rgba(0,0,0,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>
        {shapes.map((shape, index) => {
          if (shape.type === 'rect') {
            return (
              <rect
                key={index}
                x={shape.x - shape.w / 2}
                y={shape.y - shape.h / 2}
                width={shape.w}
                height={shape.h}
                fill={shape.color}
                opacity={0.85}
                transform={`rotate(${shape.rotation} ${shape.x} ${shape.y})`}
              />
            );
          } else if (shape.type === 'circle') {
            const r = Math.min(shape.w, shape.h) / 2;
            return (
              <circle
                key={index}
                cx={shape.x}
                cy={shape.y}
                r={r}
                fill={shape.color}
                opacity={0.75}
              />
            );
          } else if (shape.type === 'triangle') {
            const h = shape.h;
            const w = shape.w;
            const points = `${shape.x},${shape.y - h / 2} ${shape.x - w / 2},${shape.y + h / 2} ${shape.x + w / 2},${shape.y + h / 2}`;
            return (
              <polygon
                key={index}
                points={points}
                fill={shape.color}
                opacity={0.8}
                transform={`rotate(${shape.rotation} ${shape.x} ${shape.y})`}
              />
            );
          } else {
            const r = Math.min(shape.w, shape.h) / 2;
            return (
              <path
                key={index}
                d={`M ${shape.x} ${shape.y - r} A ${r} ${r} 0 0 1 ${shape.x} ${shape.y + r} Z`}
                fill={shape.color}
                opacity={0.7}
                transform={`rotate(${shape.rotation} ${shape.x} ${shape.y})`}
              />
            );
          }
        })}
        <rect x="0" y="0" width={finalWidth * 0.15} height={finalHeight} fill={`url(#spine-${seed})`} />
      </svg>
      {title && (
        <div className="book-cover-title">
          <span>{title}</span>
        </div>
      )}
      <div className="book-cover-spine" />
    </div>
  );
};

export default BookCover;
