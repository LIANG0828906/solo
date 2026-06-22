import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import type { StrokePoint, Stroke, DeviationMarker, StylePreset } from '../types';

export interface PaperCanvasHandle {
  resetCanvas: () => void;
  stopReplay: () => void;
  addCompletedStroke: (points: StrokePoint[], markers?: DeviationMarker[]) => void;
}

interface PaperCanvasProps {
  currentPoints: StrokePoint[];
  isDrawing: boolean;
  onPointerDown: (x: number, y: number) => void;
  onPointerMove: (x: number, y: number) => void;
  onPointerUp: () => void;
  replayStroke: Stroke | null;
  isReplaying: boolean;
  onReplayEnd: () => void;
  referenceStyle: StylePreset;
  width?: number;
  height?: number;
}

interface DryingSegment {
  points: StrokePoint[];
  startAt: number;
  duration: number;
}

const GRID_SIZE = 30;
const GRID_COLOR = 'rgba(214, 203, 176, 0.4)';
const PAPER_COLOR = '#f5f0e1';
const INK_WET = '#1a1a1a';
const INK_DRY = '#0d0d0d';

const calcBrushWidth = (index: number, total: number, speed: number): number => {
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const bell = Math.sin(t * Math.PI);
  const base = 4 + bell * 12;
  const speedFactor = Math.max(0.6, Math.min(1.4, 1.2 - speed * 0.08));
  return base * speedFactor;
};

const renderStrokeToContext = (
  ctx: CanvasRenderingContext2D,
  points: StrokePoint[],
  alpha: number,
  color: string,
  feather: number = 0
) => {
  if (points.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const avgSpeed = (prev.speed + curr.speed) / 2;
    const w0 = calcBrushWidth(i - 1, points.length, prev.speed);
    const w1 = calcBrushWidth(i, points.length, avgSpeed);
    const avgW = (w0 + w1) / 2;
    ctx.strokeStyle = color;
    ctx.lineWidth = avgW + feather * 2;
    ctx.globalAlpha = alpha * (feather > 0 ? 0.18 : 1);
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = avgW;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.stroke();
  }
  ctx.restore();
};

const buildReplayPoints = (all: StrokePoint[], progress: number): StrokePoint[] => {
  if (all.length === 0) return [];
  const n = all.length - 1;
  const p = Math.max(0, Math.min(1, progress));
  const floatIdx = p * n;
  const idx = Math.floor(floatIdx);
  const frac = floatIdx - idx;
  const result = all.slice(0, idx + 1);
  if (frac > 0 && idx < n) {
    const a = all[idx];
    const b = all[idx + 1];
    result.push({
      x: a.x + (b.x - a.x) * frac,
      y: a.y + (b.y - a.y) * frac,
      timestamp: a.timestamp + (b.timestamp - a.timestamp) * frac,
      speed: a.speed + (b.speed - a.speed) * frac,
    });
  }
  return result;
};

export const PaperCanvas = forwardRef<PaperCanvasHandle, PaperCanvasProps>(function PaperCanvas(
  {
    currentPoints,
    isDrawing,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    replayStroke,
    isReplaying,
    onReplayEnd,
    referenceStyle,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const completedStrokesRef = useRef<{ points: StrokePoint[]; markers: DeviationMarker[] }[]>([]);
  const dryingRef = useRef<DryingSegment[]>([]);
  const replayStateRef = useRef<{
    startTs: number;
    duration: number;
    stroke: Stroke | null;
  }>({ startTs: 0, duration: 0, stroke: null });
  const markerTimersRef = useRef<DeviationMarker[]>([]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = PAPER_COLOR;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cssW = canvas.width / (window.devicePixelRatio || 1);
    const cssH = canvas.height / (window.devicePixelRatio || 1);

    drawGrid(ctx, cssW, cssH);

    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 1.5;
    const ref = referenceStyle.referencePath;
    if (ref.length > 1) {
      ctx.beginPath();
      ctx.moveTo(ref[0].x, ref[0].y);
      for (let i = 1; i < ref.length; i++) {
        ctx.lineTo(ref[i].x, ref[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();

    const now = Date.now();
    const activeDryings: DryingSegment[] = [];
    for (const d of dryingRef.current) {
      const elapsed = now - d.startAt;
      const progress = Math.min(1, elapsed / d.duration);
      const dryAlpha = 0.78 + 0.22 * progress;
      const feather = (1 - progress) * 2.5;
      const color = progress < 0.5 ? INK_WET : INK_DRY;
      renderStrokeToContext(ctx, d.points, dryAlpha, color, feather);
      if (progress < 1) activeDryings.push(d);
    }
    dryingRef.current = activeDryings;

    for (const s of completedStrokesRef.current) {
      renderStrokeToContext(ctx, s.points, 1, INK_DRY, 0.4);
    }

    if (isReplaying && replayStateRef.current.stroke) {
      const rs = replayStateRef.current;
      const elapsed = now - rs.startTs;
      const progress = Math.min(1, elapsed / rs.duration);
      const rpts = buildReplayPoints(rs.stroke.points, progress);
      for (let i = 0; i < rpts.length; i++) {
        const alphaFactor = Math.max(0.3, i / Math.max(1, rpts.length - 1));
        const sub = rpts.slice(Math.max(0, i - 1), i + 1);
        if (sub.length === 2) {
          const wetPts: StrokePoint[] = [
            { ...sub[0], speed: sub[0].speed },
            { ...sub[1], speed: sub[1].speed },
          ];
          const idx0 = Math.floor(i - 1 + progress * (rs.stroke.points.length - 1));
          const fadeIn = Math.min(1, 0.25 + alphaFactor * 1.2);
          renderStrokeToContext(ctx, wetPts, fadeIn * 0.98, INK_WET, 1.5);
        }
      }
      if (progress >= 1) {
        replayStateRef.current = { startTs: 0, duration: 0, stroke: null };
        onReplayEnd();
      }
    }

    if (currentPoints.length > 0) {
      renderStrokeToContext(ctx, currentPoints, 1, INK_WET, 1);
    }

    const activeMarkers: DeviationMarker[] = [];
    for (const m of markerTimersRef.current) {
      const age = now - m.createdAt;
      if (age < 1500) {
        const alpha = 1 - age / 1500;
        ctx.save();
        ctx.globalAlpha = alpha * 0.65;
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b71c1c';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        activeMarkers.push(m);
      }
    }
    for (const s of completedStrokesRef.current) {
      for (const m of s.markers) {
        const age = now - m.createdAt;
        if (age < 1500) {
          const alpha = 1 - age / 1500;
          ctx.save();
          ctx.globalAlpha = alpha * 0.65;
          ctx.fillStyle = '#e53935';
          ctx.beginPath();
          ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          activeMarkers.push(m);
        }
      }
    }
    markerTimersRef.current = activeMarkers;

    rafRef.current = requestAnimationFrame(render);
  }, [drawGrid, currentPoints, isReplaying, onReplayEnd, referenceStyle]);

  useImperativeHandle(ref, () => ({
    resetCanvas: () => {
      completedStrokesRef.current = [];
      dryingRef.current = [];
      markerTimersRef.current = [];
    },
    stopReplay: () => {
      replayStateRef.current = { startTs: 0, duration: 0, stroke: null };
      onReplayEnd();
    },
    addCompletedStroke: (points: StrokePoint[], markers: DeviationMarker[] = []) => {
      if (points.length < 2) return;
      dryingRef.current.push({
        points,
        startAt: Date.now(),
        duration: 300,
      });
      setTimeout(() => {
        completedStrokesRef.current.push({ points, markers });
        markerTimersRef.current.push(...markers);
      }, 310);
    },
  }));

  useEffect(() => {
    resizeCanvas();
    const handler = () => resizeCanvas();
    window.addEventListener('resize', handler);
    rafRef.current = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', handler);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [resizeCanvas, render]);

  useEffect(() => {
    if (isReplaying && replayStroke) {
      const totalLen = replayStroke.points.reduce((acc, p, i) => {
        if (i === 0) return 0;
        const prev = replayStroke.points[i - 1];
        return acc + Math.sqrt((p.x - prev.x) ** 2 + (p.y - prev.y) ** 2);
      }, 0);
      const baseSpeed = 1.5;
      const pxPerSec = 260 * baseSpeed;
      let duration = (totalLen / pxPerSec) * 1000;
      if (duration < 1000) duration = 1000;
      if (duration > 4000) duration = 4000;
      replayStateRef.current = {
        startTs: Date.now(),
        duration,
        stroke: replayStroke,
      };
    }
  }, [isReplaying, replayStroke]);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isReplaying) return;
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    const { x, y } = getCanvasPoint(e);
    onPointerDown(x, y);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isReplaying) return;
    const { x, y } = getCanvasPoint(e);
    onPointerMove(x, y);
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isReplaying) return;
    try {
      (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    onPointerUp();
  };

  return (
    <div ref={containerRef} className="paper-canvas-container">
      <canvas
        ref={canvasRef}
        className={`paper-canvas ${isReplaying ? 'replaying' : ''}`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        onPointerLeave={(e) => {
          if (!isReplaying) handleCanvasPointerUp(e);
        }}
      />
    </div>
  );
});
