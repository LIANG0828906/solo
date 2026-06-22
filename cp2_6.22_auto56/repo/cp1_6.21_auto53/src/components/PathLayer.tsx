import { memo } from 'react';
import type { Point } from '../types';

interface PathLayerProps {
  path: Point[];
  cellSize: number;
  isBlocked: boolean;
}

const PathLayer = memo(function PathLayer({ path, cellSize, isBlocked }: PathLayerProps) {
  if (path.length < 2) return null;

  const points = path.map((p) => {
    const x = p.x * cellSize + cellSize / 2;
    const y = p.y * cellSize + cellSize / 2;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  return (
    <svg className="svg-layer">
      <polyline
        className={`path-line ${isBlocked ? 'blocked' : ''}`}
        points={points.join(' ')}
        style={{
          strokeDashoffset: 0,
        }}
      />
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={cellSize * 0.8}
      />
    </svg>
  );
});

export default PathLayer;
