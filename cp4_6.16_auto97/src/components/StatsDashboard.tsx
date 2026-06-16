import { useRef, useEffect, useState, useCallback } from 'react';
import type { UserStats, Challenge } from '@/types';

interface StatsDashboardProps {
  stats: UserStats;
  challenges: Challenge[];
}

interface HoveredPoint {
  x: number;
  y: number;
  date: string;
  count: number;
}

function getLevel(solved: number): string {
  if (solved <= 1) return '新手';
  if (solved <= 3) return '学徒';
  if (solved <= 5) return '能手';
  if (solved <= 8) return '高手';
  return '大师';
}

function getLevelIcon(level: string): string {
  switch (level) {
    case '新手': return '🌱';
    case '学徒': return '📜';
    case '能手': return '⚡';
    case '高手': return '🔥';
    case '大师': return '👑';
    default: return '🌱';
  }
}

export default function StatsDashboard({ stats, challenges }: StatsDashboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);
  const pointsRef = useRef<{ x: number; y: number; date: string; count: number }[]>([]);

  const level = getLevel(stats.totalSolved);
  const last14 = stats.dailyRecords.slice(-14);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    const padTop = 24;
    const padBottom = 36;
    const padLeft = 40;
    const padRight = 20;

    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    ctx.clearRect(0, 0, w, h);

    if (last14.length === 0) {
      pointsRef.current = [];
      return;
    }

    const maxCount = Math.max(...last14.map(r => r.count), 1);
    const ySteps = Math.min(maxCount, 5);
    const yStep = chartH / ySteps;

    ctx.strokeStyle = '#45475a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= ySteps; i++) {
      const y = padTop + i * yStep;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#6c7086';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= ySteps; i++) {
      const y = padTop + i * yStep;
      const val = Math.round(maxCount - (maxCount / ySteps) * i);
      ctx.fillText(String(val), padLeft - 8, y);
    }

    const points: { x: number; y: number; date: string; count: number }[] = [];
    const gap = last14.length > 1 ? chartW / (last14.length - 1) : 0;

    last14.forEach((record, i) => {
      const x = last14.length === 1 ? padLeft + chartW / 2 : padLeft + i * gap;
      const y = padTop + chartH - (record.count / maxCount) * chartH;
      points.push({ x, y, date: record.date, count: record.count });
    });

    pointsRef.current = points;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#6c7086';
    const labelStep = last14.length <= 7 ? 1 : 2;
    points.forEach((p, i) => {
      if (i % labelStep === 0 || i === points.length - 1) {
        const dateLabel = p.date.slice(5);
        ctx.fillText(dateLabel, p.x, padTop + chartH + 8);
      }
    });

    if (points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#89b4fa';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }

    const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
    gradient.addColorStop(0, 'rgba(137, 180, 250, 0.15)');
    gradient.addColorStop(1, 'rgba(137, 180, 250, 0)');
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.lineTo(points[points.length - 1].x, padTop + chartH);
    ctx.lineTo(points[0].x, padTop + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#89b4fa';
      ctx.fill();
      ctx.strokeStyle = '#2b2b3d';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [last14]);

  useEffect(() => {
    if (last14.length === 0) return;

    let rafId: number;
    rafId = requestAnimationFrame(() => {
      drawChart();
    });

    return () => cancelAnimationFrame(rafId);
  }, [drawChart]);

  useEffect(() => {
    if (last14.length === 0) return;

    const handleResize = () => {
      requestAnimationFrame(drawChart);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawChart]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: HoveredPoint | null = null;
    const threshold = 16;

    for (const p of pointsRef.current) {
      const dx = mx - p.x;
      const dy = my - p.y;
      if (dx * dx + dy * dy < threshold * threshold) {
        found = p;
        break;
      }
    }

    setHoveredPoint(found);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredPoint(null);
  }, []);

  const cards = [
    { label: '已解决', value: stats.totalSolved, unit: '题', color: 'text-[#89b4fa]' },
    { label: '提交次数', value: stats.totalSubmissions, unit: '次', color: 'text-[#a6e3a1]' },
    { label: '通过率', value: `${Math.round(stats.passRate * 100)}`, unit: '%', color: 'text-[#f9e2af]' },
    { label: '当前等级', value: `${getLevelIcon(level)} ${level}`, unit: '', color: 'text-[#cba6f7]' },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex flex-col items-center justify-center gap-1 rounded-[12px] bg-[#2b2b3d] px-4 py-3"
          >
            <span className="text-xs text-[#6c7086]">{card.label}</span>
            <span className={`text-xl font-bold ${card.color}`}>
              {card.value}
              {card.unit && (
                <span className="ml-0.5 text-xs font-normal text-[#6c7086]">{card.unit}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-[12px] bg-[#2b2b3d] p-4">
        <h3 className="mb-3 text-sm font-medium text-[#cdd6f4]">每日解题趋势</h3>
        {last14.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-[#6c7086]">
            暂无解题记录，开始挑战吧！
          </div>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="h-[200px] w-full"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            {hoveredPoint && (
              <div
                className="pointer-events-none absolute z-10 rounded-lg bg-[#1e1e2e] px-3 py-1.5 text-xs shadow-lg ring-1 ring-[#45475a]"
                style={{
                  left: hoveredPoint.x,
                  top: hoveredPoint.y - 40,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="text-[#cdd6f4]">
                  {hoveredPoint.date}
                </div>
                <div className="text-[#89b4fa] font-bold">
                  {hoveredPoint.count} 题
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
