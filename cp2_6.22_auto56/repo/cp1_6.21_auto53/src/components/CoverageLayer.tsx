import { memo } from 'react';
import type { CoverageArea, CoverageStats, Point } from '../types';

interface CoverageLayerProps {
  areas: CoverageArea[];
  stats: CoverageStats | null;
  path: Point[];
  cellSize: number;
}

const CoverageLayer = memo(function CoverageLayer({
  areas,
  stats,
  path,
  cellSize,
}: CoverageLayerProps) {
  const coveredSet = new Set(
    (stats?.coveredPoints || []).map((p) => `${p.x},${p.y}`)
  );

  return (
    <svg className="svg-layer">
      {areas.map((area) => {
        const cx = area.center.x * cellSize + cellSize / 2;
        const cy = area.center.y * cellSize + cellSize / 2;
        const r = area.radius * cellSize;

        return (
          <circle
            key={area.towerId}
            className="coverage-area"
            cx={cx}
            cy={cy}
            r={r}
            fill={`${area.color}20`}
            stroke={`${area.color}40`}
          />
        );
      })}

      {path.map((point, index) => {
        const key = `${point.x},${point.y}`;
        if (!coveredSet.has(key)) return null;

        const cx = point.x * cellSize + cellSize / 2;
        const cy = point.y * cellSize + cellSize / 2;
        const r = cellSize * 0.35;

        return (
          <circle
            key={`highlight-${index}`}
            className="coverage-highlight"
            cx={cx}
            cy={cy}
            r={r}
          />
        );
      })}

      {stats !== null && stats.totalPathLength > 0 && (
        <text
          x="50%"
          y="24"
          textAnchor="middle"
          className="coverage-percent-text"
          style={{
            fontSize: '14px',
            fill: '#333',
            fontWeight: 'bold',
            fontFamily: 'Georgia, serif',
          }}
        >
          火力覆盖: {stats.coveragePercent}%
        </text>
      )}
    </svg>
  );
});

export default CoverageLayer;
