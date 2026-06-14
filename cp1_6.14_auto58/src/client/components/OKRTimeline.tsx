import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { KeyResult, User } from '../types';

interface TimelineKR extends KeyResult {
  color: string;
  owner?: User;
}

interface OKRTimelineProps {
  keyResults: TimelineKR[];
  weeks?: number;
}

interface TooltipData {
  x: number;
  y: number;
  week: number;
  progress: number;
  ownerName: string;
  title: string;
  color: string;
  score?: number;
}

const DEFAULT_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
];

const OKRTimeline: React.FC<OKRTimelineProps> = ({ keyResults, weeks = 13 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [visibleKRs, setVisibleKRs] = useState<Set<string>>(new Set());
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const animStartRef = useRef<number>(0);
  const hoveredPointRef = useRef<{ krId: string; week: number } | null>(null);

  const padding = useMemo(
    () => ({ top: 30, right: 40, bottom: 60, left: 60 }),
    []
  );

  const allKRIds = useMemo(() => keyResults.map((kr) => kr.id), [keyResults]);

  useEffect(() => {
    setVisibleKRs(new Set(allKRIds));
  }, [allKRIds]);

  const getPlotArea = useCallback(
    (width: number, height: number) => ({
      x: padding.left,
      y: padding.top,
      w: width - padding.left - padding.right,
      h: height - padding.top - padding.bottom,
    }),
    [padding]
  );

  const getWeekX = useCallback(
    (week: number, plotW: number, plotX: number) => {
      return plotX + ((week - 1) / (weeks - 1)) * plotW;
    },
    [weeks]
  );

  const getProgressY = useCallback(
    (progress: number, plotH: number, plotY: number) => {
      return plotY + plotH - (progress / 100) * plotH;
    },
    []
  );

  const catmullRomSpline = useCallback(
    (points: { x: number; y: number }[], segments = 20): { x: number; y: number }[] => {
      if (points.length < 2) return points;
      const result: { x: number; y: number }[] = [];
      const extended = [points[0], ...points, points[points.length - 1]];

      for (let i = 0; i < extended.length - 3; i++) {
        const p0 = extended[i];
        const p1 = extended[i + 1];
        const p2 = extended[i + 2];
        const p3 = extended[i + 3];

        for (let t = 0; t < segments; t++) {
          const s = t / segments;
          const s2 = s * s;
          const s3 = s2 * s;

          const x =
            0.5 *
            (2 * p1.x +
              (-p0.x + p2.x) * s +
              (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * s2 +
              (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * s3);
          const y =
            0.5 *
            (2 * p1.y +
              (-p0.y + p2.y) * s +
              (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * s2 +
              (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * s3);
          result.push({ x, y });
        }
      }
      result.push(points[points.length - 1]);
      return result;
    },
    []
  );

  const getKRPoints = useCallback(
    (
      kr: TimelineKR,
      plotW: number,
      plotH: number,
      plotX: number,
      plotY: number
    ) => {
      const weeklyMap = new Map(kr.weeklyProgress.map((w) => [w.week, w.progress]));
      const points: { week: number; x: number; y: number; progress: number }[] = [];

      let lastProgress = 0;
      for (let w = 1; w <= weeks; w++) {
        const wp = weeklyMap.get(w);
        const progress = wp !== undefined ? wp : lastProgress;
        lastProgress = progress;
        points.push({
          week: w,
          x: getWeekX(w, plotW, plotX),
          y: getProgressY(progress, plotH, plotY),
          progress,
        });
      }

      if (kr.progress > lastProgress) {
        points[points.length - 1].y = getProgressY(kr.progress, plotH, plotY);
        points[points.length - 1].progress = kr.progress;
      }

      return points;
    },
    [weeks, getWeekX, getProgressY]
  );

  const draw = useCallback(
    (progress: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const styles = getComputedStyle(document.documentElement);
      const bg = styles.getPropertyValue('--color-surface').trim() || '#ffffff';
      const textColor = styles.getPropertyValue('--color-text').trim() || '#0f172a';
      const textSecondary =
        styles.getPropertyValue('--color-text-secondary').trim() || '#64748b';
      const borderColor = styles.getPropertyValue('--color-border').trim() || '#e2e8f0';

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const plot = getPlotArea(width, height);

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plot.x, plot.y);
      ctx.lineTo(plot.x, plot.y + plot.h);
      ctx.lineTo(plot.x + plot.w, plot.y + plot.h);
      ctx.stroke();

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 4]);
      for (let i = 0; i <= 10; i++) {
        const yVal = i * 10;
        const y = getProgressY(yVal, plot.h, plot.y);
        ctx.beginPath();
        ctx.moveTo(plot.x, y);
        ctx.lineTo(plot.x + plot.w, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.fillStyle = textSecondary;
      ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= 10; i++) {
        const yVal = i * 10;
        const y = getProgressY(yVal, plot.h, plot.y);
        ctx.fillText(`${yVal}%`, plot.x - 10, y);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let w = 1; w <= weeks; w++) {
        const x = getWeekX(w, plot.w, plot.x);
        ctx.fillText(`W${w}`, x, plot.y + plot.h + 10);

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(x, plot.y);
        ctx.lineTo(x, plot.y + plot.h);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = textColor;
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillText('进度 (%)', plot.x - 40, plot.y + plot.h / 2);

      ctx.save();
      ctx.translate(plot.x + plot.w / 2, height - 10);
      ctx.fillText('周数', 0, 0);
      ctx.restore();

      const visibleKRList = keyResults.filter((kr) => visibleKRs.has(kr.id));
      visibleKRList.forEach((kr) => {
        const pts = getKRPoints(kr, plot.w, plot.h, plot.x, plot.y);
        const rawPts = pts.map((p) => ({ x: p.x, y: p.y }));
        const splinePts = catmullRomSpline(rawPts, 15);

        const totalPts = splinePts.length;
        const animCount = Math.floor(totalPts * progress);
        if (animCount < 2) return;

        const displayPts = splinePts.slice(0, animCount);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(displayPts[0].x, plot.y + plot.h);
        displayPts.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.lineTo(displayPts[displayPts.length - 1].x, plot.y + plot.h);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, plot.y, 0, plot.y + plot.h);
        gradient.addColorStop(0, kr.color + '33');
        gradient.addColorStop(1, kr.color + '05');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = kr.color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(displayPts[0].x, displayPts[0].y);
        for (let i = 1; i < displayPts.length; i++) {
          ctx.lineTo(displayPts[i].x, displayPts[i].y);
        }
        ctx.stroke();

        if (progress >= 0.9) {
          const lastRawIdx = Math.floor((pts.length - 1) * progress);
          for (let i = 0; i <= lastRawIdx; i++) {
            const p = pts[i];
            const isHovered =
              hoveredPointRef.current?.krId === kr.id &&
              hoveredPointRef.current?.week === p.week;

            ctx.beginPath();
            ctx.arc(p.x, p.y, isHovered ? 7 : 4.5, 0, Math.PI * 2);
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.lineWidth = isHovered ? 3 : 2;
            ctx.strokeStyle = kr.color;
            ctx.stroke();

            if (isHovered) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
              ctx.fillStyle = kr.color;
              ctx.fill();
            }
          }
        }
      });
    },
    [keyResults, visibleKRs, getPlotArea, getWeekX, getProgressY, getKRPoints, catmullRomSpline]
  );

  const animate = useCallback(
    (timestamp: number) => {
      if (animStartRef.current === 0) animStartRef.current = timestamp;
      const elapsed = timestamp - animStartRef.current;
      const duration = 1500;
      const rawProgress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - rawProgress, 3);
      setAnimationProgress(eased);
      draw(eased);
      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    },
    [draw]
  );

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    animStartRef.current = 0;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [animate]);

  useEffect(() => {
    if (animationProgress >= 1) {
      draw(1);
    }
  }, [visibleKRs, draw, animationProgress]);

  useEffect(() => {
    const handleResize = () => draw(Math.max(animationProgress, 0.01));
    window.addEventListener('resize', handleResize);
    const obs = new ResizeObserver(() => handleResize());
    if (containerRef.current) obs.observe(containerRef.current);
    return () => {
      window.removeEventListener('resize', handleResize);
      obs.disconnect();
    };
  }, [draw, animationProgress]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const plot = getPlotArea(width, height);

      if (
        mx < plot.x ||
        mx > plot.x + plot.w ||
        my < plot.y ||
        my > plot.y + plot.h
      ) {
        setTooltip(null);
        hoveredPointRef.current = null;
        draw(Math.max(animationProgress, 0.01));
        return;
      }

      let nearest: {
        kr: TimelineKR;
        point: { week: number; x: number; y: number; progress: number };
        dist: number;
      } | null = null;

      const visibleKRList = keyResults.filter((kr) => visibleKRs.has(kr.id));
      visibleKRList.forEach((kr) => {
        const pts = getKRPoints(kr, plot.w, plot.h, plot.x, plot.y);
        pts.forEach((p) => {
          const d = Math.sqrt((mx - p.x) ** 2 + (my - p.y) ** 2);
          if (d < 20 && (!nearest || d < nearest.dist)) {
            nearest = { kr, point: p, dist: d };
          }
        });
      });

      if (nearest) {
        const n = nearest as {
          kr: TimelineKR;
          point: { week: number; x: number; y: number; progress: number };
          dist: number;
        };
        hoveredPointRef.current = { krId: n.kr.id, week: n.point.week };
        setTooltip({
          x: n.point.x,
          y: n.point.y,
          week: n.point.week,
          progress: n.point.progress,
          ownerName: n.kr.owner?.name || '未知',
          title: n.kr.title,
          color: n.kr.color,
          score: n.kr.score,
        });
      } else {
        hoveredPointRef.current = null;
        setTooltip(null);
      }
      draw(Math.max(animationProgress, 0.01));
    },
    [keyResults, visibleKRs, getPlotArea, getKRPoints, draw, animationProgress]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    hoveredPointRef.current = null;
    draw(Math.max(animationProgress, 0.01));
  }, [draw, animationProgress]);

  const toggleKR = (id: string) => {
    setVisibleKRs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const displayKeyResults = keyResults.map((kr, idx) => ({
    ...kr,
    color: kr.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 420,
          position: 'relative',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
        />
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(tooltip.x + 16, (containerRef.current?.clientWidth || 800) - 200),
              top: Math.max(tooltip.y - 80, 8),
              pointerEvents: 'none',
              backgroundColor: 'var(--color-surface)',
              border: `1px solid ${tooltip.color}`,
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              fontSize: 12,
              boxShadow: 'var(--color-shadow-lg)',
              minWidth: 160,
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: tooltip.color,
                  display: 'inline-block',
                }}
              />
              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{tooltip.title}</span>
            </div>
            <div style={{ color: 'var(--color-text-secondary)', marginBottom: 4 }}>
              第 {tooltip.week} 周
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>进度</span>
              <span style={{ fontWeight: 600, color: tooltip.color }}>{tooltip.progress}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>负责人</span>
              <span style={{ color: 'var(--color-text)' }}>{tooltip.ownerName}</span>
            </div>
            {tooltip.score !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>评分</span>
                <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>
                  ★ {tooltip.score} / 5
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
        }}
      >
        {displayKeyResults.map((kr) => {
          const active = visibleKRs.has(kr.id);
          return (
            <button
              key={kr.id}
              onClick={() => toggleKR(kr.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                border: `1px solid ${active ? kr.color : 'var(--color-border)'}`,
                backgroundColor: active ? kr.color + '15' : 'var(--color-surface)',
                opacity: active ? 1 : 0.5,
                fontSize: 12,
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: kr.color,
                  display: 'inline-block',
                }}
              />
              <span style={{ color: active ? 'var(--color-text)' : 'var(--color-text-secondary)' }}>
                {kr.title.length > 16 ? kr.title.slice(0, 16) + '…' : kr.title}
              </span>
              {kr.owner && (
                <span style={{ fontSize: 14 }}>{kr.owner.avatar}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OKRTimeline;
