import React, { useRef, useEffect, useState, useCallback } from 'react';

interface VoteOption {
  id: string;
  text: string;
  order: number;
}

interface VoteRecord {
  userId: string;
  nickname: string;
  optionId: string;
  timestamp: number;
}

interface Vote {
  id: string;
  title: string;
  description: string;
  options: VoteOption[];
  createdBy: string;
  creatorNickname: string;
  createdAt: number;
  ended: boolean;
  records: VoteRecord[];
}

const PIE_COLORS = [
  '#e94560',
  '#1a73e8',
  '#f39c12',
  '#27ae60',
  '#8e44ad',
  '#e67e22',
  '#16a085',
  '#c0392b',
];

interface PieChartProps {
  vote: Vote;
}

const PieChart: React.FC<PieChartProps> = ({ vote }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const getSliceData = useCallback(() => {
    const total = vote.records.length;
    return vote.options
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((opt) => {
        const count = vote.records.filter((r) => r.optionId === opt.id).length;
        const pct = total === 0 ? 0 : (count / total) * 100;
        return { id: opt.id, text: opt.text, count, pct };
      });
  }, [vote]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 280;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);

    const slices = getSliceData();
    const total = vote.records.length;

    if (total === 0) {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 100, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fill();
      ctx.fillStyle = '#555';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('暂无投票', size / 2, size / 2);
      return;
    }

    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = 100;
    let startAngle = -Math.PI / 2;

    slices.forEach((slice, i) => {
      if (slice.count === 0) return;

      const sliceAngle = (slice.count / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      const isHovered = hoveredIndex === i;
      const radius = isHovered ? baseRadius * 1.2 : baseRadius;

      const midAngle = startAngle + sliceAngle / 2;
      const offsetX = isHovered ? Math.cos(midAngle) * 8 : 0;
      const offsetY = isHovered ? Math.sin(midAngle) * 8 : 0;

      ctx.save();

      if (isHovered) {
        ctx.shadowColor = PIE_COLORS[i % PIE_COLORS.length];
        ctx.shadowBlur = 20;
      }

      ctx.beginPath();
      ctx.moveTo(cx + offsetX, cy + offsetY);
      ctx.arc(cx + offsetX, cy + offsetY, radius, startAngle, endAngle);
      ctx.closePath();

      if (vote.ended) {
        ctx.fillStyle = '#444';
      } else {
        ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length];
      }

      ctx.globalAlpha = vote.ended ? 0.5 : isHovered ? 1 : 0.85;
      ctx.fill();

      ctx.restore();

      if (sliceAngle > 0.3) {
        const labelRadius = radius * 0.65;
        const labelX = cx + offsetX + Math.cos(midAngle) * labelRadius;
        const labelY = cy + offsetY + Math.sin(midAngle) * labelRadius;

        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.font = `${isHovered ? '13' : '12'}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = vote.ended ? 0.4 : 0.95;
        ctx.fillText(`${Math.round(slice.pct)}%`, labelX, labelY);
        ctx.restore();
      }

      startAngle = endAngle;
    });
  }, [vote, hoveredIndex, getSliceData]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = 140;
      const cy = 140;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 120 || dist < 0) {
        setHoveredIndex(null);
        return;
      }

      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) {
        angle += Math.PI * 2;
      }
      angle += Math.PI / 2;
      if (angle > Math.PI * 2) {
        angle -= Math.PI * 2;
      }

      const slices = getSliceData();
      const total = vote.records.length;
      if (total === 0) {
        setHoveredIndex(null);
        return;
      }

      let cumAngle = 0;
      let found = false;
      for (let i = 0; i < slices.length; i++) {
        const sliceAngle = (slices[i].count / total) * Math.PI * 2;
        cumAngle += sliceAngle;
        if (angle <= cumAngle) {
          if (hoveredIndex !== i) {
            setHoveredIndex(i);
          }
          found = true;
          break;
        }
      }
      if (!found) {
        setHoveredIndex(null);
      }

      setMousePos({ x, y });
    },
    [vote, hoveredIndex, getSliceData]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const slices = getSliceData();
  const hoveredSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="pie-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {hoveredSlice && hoveredSlice.count > 0 && (
        <div
          className="pie-tooltip"
          style={{
            left: mousePos.x + 16,
            top: mousePos.y - 40,
          }}
        >
          <div className="tt-label">{hoveredSlice.text}</div>
          <div className="tt-stats">
            {hoveredSlice.count}票 · {Math.round(hoveredSlice.pct)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default PieChart;
