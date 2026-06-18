import { useEffect, useRef } from 'react';
import type { SongOption, TrendDataPoint } from '../types';

interface Props {
  songs: SongOption[];
  trendData: TrendDataPoint[];
  remainingSeconds: number;
  durationSeconds: number;
}

const CANVAS_PADDING = { top: 20, right: 20, bottom: 36, left: 44 };

export default function TrendChart({
  songs,
  trendData,
  remainingSeconds,
  durationSeconds,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const renderDataRef = useRef<TrendDataPoint[]>([]);
  const rafRef = useRef<number | null>(null);
  const animStartRef = useRef<number>(0);
  const prevDataRef = useRef<TrendDataPoint[]>([]);

  const buildFullDataPoints = (): TrendDataPoint[] => {
    const points: TrendDataPoint[] = [...trendData];
    const elapsed = durationSeconds - remainingSeconds;
    if (elapsed > 0) {
      const currentVotes: Record<string, number> = {};
      songs.forEach((s) => {
        currentVotes[s.id] = s.voteCount;
      });
      const lastPoint = points[points.length - 1];
      if (
        !lastPoint ||
        Math.floor((elapsed - (lastPoint.timestamp - (durationSeconds - remainingSeconds))) / 1000) >= 0
      ) {
        points.push({
          timestamp: Date.now(),
          votes: currentVotes,
        });
      }
    }
    if (points.length < 2) {
      const initial: TrendDataPoint = {
        timestamp: Date.now() - elapsed * 1000,
        votes: songs.reduce(
          (acc, s) => ({ ...acc, [s.id]: 0 }),
          {} as Record<string, number>
        ),
      };
      points.unshift(initial);
    }
    return points;
  };

  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

  const lerpData = (
    from: TrendDataPoint[],
    to: TrendDataPoint[],
    t: number
  ): TrendDataPoint[] => {
    if (!from.length) return to;
    const len = Math.max(from.length, to.length);
    const result: TrendDataPoint[] = [];
    for (let i = 0; i < len; i++) {
      const fromPt = from[Math.min(i, from.length - 1)];
      const toPt = to[Math.min(i, to.length - 1)];
      const votes: Record<string, number> = {};
      const allKeys = new Set([
        ...Object.keys(fromPt.votes),
        ...Object.keys(toPt.votes),
      ]);
      allKeys.forEach((k) => {
        votes[k] = lerp(fromPt.votes[k] ?? 0, toPt.votes[k] ?? 0, t);
      });
      result.push({
        timestamp: lerp(fromPt.timestamp, toPt.timestamp, t),
        votes,
      });
    }
    return result;
  };

  useEffect(() => {
    const durationMs = 300;
    animStartRef.current = performance.now();
    prevDataRef.current = renderDataRef.current;

    const target = buildFullDataPoints();

    const loop = (now: number) => {
      const elapsedSinceFrame = now - lastFrameTimeRef.current;
      if (elapsedSinceFrame < 33) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      lastFrameTimeRef.current = now;

      const animElapsed = now - animStartRef.current;
      const t = Math.min(1, animElapsed / durationMs);
      const easeT = 1 - Math.pow(1 - t, 3);

      renderDataRef.current = lerpData(prevDataRef.current, target, easeT);

      draw();

      if (t < 1) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRef.current = null;
      }
    };

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [trendData, remainingSeconds, songs, durationSeconds]);

  useEffect(() => {
    const handleResize = () => {
      draw();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const draw = () => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = wrapper.getBoundingClientRect();
    const cssW = rect.width;
    const cssH = Math.max(220, Math.min(340, rect.width * 0.45));
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const plotW = cssW - CANVAS_PADDING.left - CANVAS_PADDING.right;
    const plotH = cssH - CANVAS_PADDING.top - CANVAS_PADDING.bottom;
    const data = renderDataRef.current;

    if (data.length < 2 || songs.length === 0 || plotW <= 0 || plotH <= 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '14px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        '等待数据采集...（每分钟更新一次）',
        cssW / 2,
        cssH / 2
      );
      return;
    }

    let maxVote = 0;
    data.forEach((pt) => {
      songs.forEach((s) => {
        const v = pt.votes[s.id] ?? 0;
        if (v > maxVote) maxVote = v;
      });
    });
    maxVote = Math.max(1, Math.ceil(maxVote * 1.15));

    const timeStart = data[0].timestamp;
    const timeEnd = data[data.length - 1].timestamp;
    const timeRange = Math.max(1, timeEnd - timeStart);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    const ySteps = 4;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= ySteps; i++) {
      const yRatio = i / ySteps;
      const y = CANVAS_PADDING.top + plotH * (1 - yRatio);
      ctx.beginPath();
      ctx.moveTo(CANVAS_PADDING.left, y);
      ctx.lineTo(CANVAS_PADDING.left + plotW, y);
      ctx.stroke();
      const value = Math.round(maxVote * yRatio);
      ctx.fillText(String(value), CANVAS_PADDING.left - 8, y);
    }

    const totalMin = Math.max(1, Math.round(durationSeconds / 60));
    const xSteps = Math.min(6, totalMin);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i <= xSteps; i++) {
      const xRatio = i / xSteps;
      const x = CANVAS_PADDING.left + plotW * xRatio;
      const minLabel = Math.round(totalMin * xRatio);
      ctx.fillText(`${minLabel}分`, x, CANVAS_PADDING.top + plotH + 8);
    }

    songs.forEach((song) => {
      const color = song.color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      data.forEach((pt, i) => {
        const tRatio = (pt.timestamp - timeStart) / timeRange;
        const x = CANVAS_PADDING.left + plotW * tRatio;
        const voteVal = pt.votes[song.id] ?? 0;
        const yRatio = voteVal / maxVote;
        const y = CANVAS_PADDING.top + plotH * (1 - yRatio);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      const lastPt = data[data.length - 1];
      const lastRatio = (lastPt.timestamp - timeStart) / timeRange;
      const lx = CANVAS_PADDING.left + plotW * lastRatio;
      const lastVote = lastPt.votes[song.id] ?? 0;
      const ly = CANVAS_PADDING.top + plotH * (1 - lastVote / maxVote);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  return (
    <div className="trend-card glass-card">
      <div className="trend-header">
        <h3 className="trend-title">📈 热度趋势</h3>
        <div className="trend-legend">
          {songs.map((s) => (
            <div key={s.id} className="legend-item">
              <span
                className="legend-dot"
                style={{ background: s.color }}
              />
              <span className="legend-text">{s.title}</span>
            </div>
          ))}
        </div>
      </div>
      <div
        ref={wrapperRef}
        style={{ width: '100%' }}
      >
        <canvas ref={canvasRef} />
      </div>
      <style>{`
        .trend-card {
          padding: 20px 24px;
          background: var(--trend-bg);
          border-radius: var(--trend-radius);
        }
        .trend-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .trend-title {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .trend-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 0 6px currentColor;
        }
        .legend-text {
          font-size: 0.82rem;
          color: var(--text-secondary);
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media (max-width: 767px) {
          .trend-card {
            padding: 16px;
          }
          .trend-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}
