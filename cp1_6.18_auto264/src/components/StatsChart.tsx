import { useEffect, useRef, useState } from 'react';
import type { StudentStats } from '../types';

interface Props {
  stats: StudentStats[];
}

interface Tooltip {
  x: number;
  y: number;
  studentName: string;
  date: string;
  rate: number;
}

const StatsChart = ({ stats }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 320;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const padding = { top: 30, right: 30, bottom: 50, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    let frameCount = 0;
    const totalFrames = 20;

    const draw = () => {
      frameCount++;
      const progress = Math.min(frameCount / totalFrames, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#2A2A2A';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        ctx.fillStyle = '#B0B0B0';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${100 - i * 20}%`, padding.left - 10, y + 4);
      }

      const days = 7;
      for (let i = 0; i < days; i++) {
        const x = padding.left + (chartW / (days - 1)) * i;
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const label = `${date.getMonth() + 1}/${date.getDate()}`;

        ctx.fillStyle = '#B0B0B0';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, height - padding.bottom + 25);
      }

      stats.forEach((student) => {
        const points: { x: number; y: number }[] = [];

        student.weekData.forEach((d, i) => {
          const x = padding.left + (chartW / (days - 1)) * i;
          const y = padding.top + chartH * (1 - (d.completionRate / 100) * easeProgress);
          points.push({ x, y });
        });

        ctx.strokeStyle = student.color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        points.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#1A1A1A';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = student.color;
          ctx.stroke();
        });
      });

      if (progress < 1) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [stats]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = { top: 30, right: 30, bottom: 50, left: 50 };
    const chartW = rect.width - padding.left - padding.right;
    const chartH = 320 - padding.top - padding.bottom;
    const days = 7;

    let found: Tooltip | null = null;
    let minDist = Infinity;

    stats.forEach((student) => {
      student.weekData.forEach((d, i) => {
        const px = padding.left + (chartW / (days - 1)) * i;
        const py = padding.top + chartH * (1 - d.completionRate / 100);
        const dist = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));

        if (dist < 10 && dist < minDist) {
          minDist = dist;
          const date = new Date(d.date);
          found = {
            x: px,
            y: py,
            studentName: student.studentName,
            date: `${date.getMonth() + 1}月${date.getDate()}日`,
            rate: d.completionRate
          };
        }
      });
    });

    setTooltip(found);
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    backgroundColor: '#1A1A1A',
    borderRadius: '8px',
    padding: '12px',
    width: '100%'
  };

  const legendStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginTop: '16px',
    justifyContent: 'center'
  };

  const legendItemStyle = (color: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#B0B0B0',
    fontSize: '13px'
  });

  return (
    <div style={containerStyle} ref={containerRef}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block', borderRadius: '4px' }}
      />
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 12,
            top: tooltip.y - 30,
            backgroundColor: '#2A2A2A',
            border: '1px solid #3A3A3A',
            borderRadius: '6px',
            padding: '8px 12px',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ color: '#E0E0E0', fontSize: '13px', fontWeight: 600 }}>
            {tooltip.studentName}
          </div>
          <div style={{ color: '#B0B0B0', fontSize: '12px' }}>{tooltip.date}</div>
          <div style={{ color: '#4CAF50', fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>
            {tooltip.rate}%
          </div>
        </div>
      )}
      <div style={legendStyle}>
        {stats.map((s) => (
          <div key={s.studentName} style={legendItemStyle(s.color)}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: s.color,
                display: 'inline-block'
              }}
            />
            {s.studentName}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsChart;
