import { useMemo, useRef, useState, useEffect } from 'react';
import { useNotesStore } from '@/store/useNotesStore';

interface DataPoint {
  x: number;
  y: number;
  value: number;
  label: string;
}

export const ResonanceCurve = () => {
  const notes = useNotesStore(state => state.notes);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const dataPoints = useMemo<DataPoint[]>(() => {
    if (notes.length === 0) return [];

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const hours = 12;
    const points: { hour: number; value: number }[] = [];

    for (let i = hours; i >= 0; i--) {
      points.push({ hour: i, value: 0 });
    }

    notes.forEach(note => {
      const age = now - note.createdAt;
      const hoursAgo = Math.floor(age / (60 * 60 * 1000));
      const interactionScore = note.likes + note.comments.length * 2;

      note.likeHistory.forEach(record => {
        const recordAge = now - record.timestamp;
        const recordHoursAgo = Math.floor(recordAge / (60 * 60 * 1000));
        const idx = points.findIndex(p => p.hour === recordHoursAgo);
        if (idx !== -1) {
          points[idx].value += 1;
        }
      });

      const idx = points.findIndex(p => p.hour === hoursAgo);
      if (idx !== -1) {
        points[idx].value += interactionScore * 0.5;
      }
    });

    const width = 180;
    const height = 240;
    const padding = { top: 20, right: 10, bottom: 24, left: 30 };
    const maxValue = Math.max(...points.map(p => p.value), 1);

    return points
      .slice()
      .reverse()
      .map((p, i) => ({
        x: padding.left + (i / (points.length - 1)) * (width - padding.left - padding.right),
        y: padding.top + (1 - p.value / maxValue) * (height - padding.top - padding.bottom),
        value: p.value,
        label: `${p.hour}h前`,
      }));
  }, [notes]);

  const pathD = useMemo(() => {
    if (dataPoints.length < 2) return '';
    return dataPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
  }, [dataPoints]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    if (dataPoints.length === 0 || !svgRef.current) return;
    let closest: DataPoint | null = null;
    let minDist = Infinity;
    dataPoints.forEach(p => {
      const dist = Math.sqrt(Math.pow(p.x - mousePos.x, 2) + Math.pow(p.y - mousePos.y, 2));
      if (dist < minDist && dist < 20) {
        minDist = dist;
        closest = p;
      }
    });
    setHoveredPoint(closest);
  }, [mousePos, dataPoints]);

  const width = 200;
  const height = 300;

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: 'var(--panel-bg)',
        borderRadius: '16px',
        border: '1px solid var(--card-border)',
        padding: '16px',
        opacity: 0.95,
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
          共鸣曲线
        </h3>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          社区互动热度趋势
        </p>
      </div>

      <div style={{ position: 'relative' }}>
        <svg
          ref={svgRef}
          width={width - 32}
          height={height - 70}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          style={{ display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FF6B6B" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map(ratio => (
            <line
              key={ratio}
              x1={30}
              x2={170}
              y1={20 + ratio * 220}
              y2={20 + ratio * 220}
              stroke="var(--card-border)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          ))}

          {pathD && (
            <>
              <path
                d={`${pathD} L 170 260 L 30 260 Z`}
                fill="url(#curveGradient)"
              />
              <path
                d={pathD}
                fill="none"
                stroke="#FF6B6B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {dataPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredPoint === p ? 8 : 6}
              fill="#FF6B6B"
              stroke="var(--panel-bg)"
              strokeWidth="2"
              style={{
                transition: 'r 200ms ease',
                cursor: 'pointer',
              }}
            />
          ))}

          <text x={30} y={280} fontSize="10" fill="var(--text-secondary)">
            {dataPoints.length > 0 ? dataPoints[0].label : ''}
          </text>
          <text x={150} y={280} fontSize="10" fill="var(--text-secondary)" textAnchor="end">
            {dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].label : ''}
          </text>
        </svg>

        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(Math.max(hoveredPoint.x - 40, 0), 120),
              top: hoveredPoint.y - 44,
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            <div style={{ fontWeight: 600 }}>热度: {hoveredPoint.value.toFixed(1)}</div>
            <div style={{ opacity: 0.8 }}>{hoveredPoint.label}</div>
          </div>
        )}
      </div>
    </div>
  );
};
