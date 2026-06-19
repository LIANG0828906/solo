import React, { useRef, useEffect, useState, useCallback } from 'react';

export type DrawPoint = {
  x: number;
  y: number;
  color: string;
  size: number;
  timestamp: number;
};

interface CanvasProps {
  currentColor: string;
  currentSize: number;
  userId: string;
  onStrokeComplete: (strokeId: string, points: DrawPoint[]) => void;
  remoteStrokes: Map<string, { userId: string; points: DrawPoint[]; alpha?: number }>;
}

interface GlowStroke {
  points: DrawPoint[];
  startTime: number;
}

const MAX_SEGMENTS = 20;

function easeOutQuad(t: number): number {
  return t * (2 - t);
}

function lerpPoint(a: DrawPoint, b: DrawPoint, t: number): DrawPoint {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    color: a.color,
    size: a.size,
    timestamp: a.timestamp + (b.timestamp - a.timestamp) * t,
  };
}

function bezierInterpolate(points: DrawPoint[]): DrawPoint[] {
  if (points.length < 2) return points;

  const result: DrawPoint[] = [];

  if (points.length === 2) {
    const segs = MAX_SEGMENTS;
    for (let t = 0; t <= segs; t++) {
      result.push(lerpPoint(points[0], points[1], t / segs));
    }
    return result;
  }

  result.push({ ...points[0] });

  for (let i = 0; i < points.length - 2; i++) {
    const a = points[i];
    const b = points[i + 1];
    const c = points[i + 2];

    const startX = (a.x + b.x) / 2;
    const startY = (a.y + b.y) / 2;
    const cpX = b.x;
    const cpY = b.y;
    const endX = (b.x + c.x) / 2;
    const endY = (b.y + c.y) / 2;

    const segs = MAX_SEGMENTS;

    for (let t = 1; t <= segs; t++) {
      const tt = t / segs;
      const mt = 1 - tt;

      const x = mt * mt * startX + 2 * mt * tt * cpX + tt * tt * endX;
      const y = mt * mt * startY + 2 * mt * tt * cpY + tt * tt * endY;

      const startTs = a.timestamp + (b.timestamp - a.timestamp) * 0.5;
      const endTs = b.timestamp + (c.timestamp - b.timestamp) * 0.5;

      result.push({
        x,
        y,
        color: b.color,
        size: b.size,
        timestamp: startTs + (endTs - startTs) * tt,
      });
    }
  }

  const lastIdx = points.length - 1;
  const secondLast = points[lastIdx - 1];
  const last = points[lastIdx];
  const midX = (secondLast.x + last.x) / 2;
  const midY = (secondLast.y + last.y) / 2;
  const segs = MAX_SEGMENTS;

  for (let t = 1; t <= segs; t++) {
    result.push(lerpPoint(
      { ...secondLast, x: midX, y: midY },
      last,
      t / segs
    ));
  }

  return result;
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const GLOW_INITIAL_BLUR = 20;

function drawBezierPath(
  ctx: CanvasRenderingContext2D,
  points: DrawPoint[],
  glowIntensity: number = 0,
  alpha: number = 1
) {
  if (points.length === 0) return;

  const smoothPoints = bezierInterpolate(points);

  ctx.save();
  ctx.globalAlpha = alpha;

  if (smoothPoints.length < 2) {
    const p = smoothPoints[0];
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    if (glowIntensity > 0) {
      const eased = easeOutQuad(glowIntensity);
      ctx.shadowColor = hexToRgba(p.color, 0.3 + 0.5 * eased);
      ctx.shadowBlur = GLOW_INITIAL_BLUR * eased;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.restore();
    return;
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = smoothPoints[0].color;
  ctx.lineWidth = smoothPoints[0].size;

  if (glowIntensity > 0) {
    const eased = easeOutQuad(glowIntensity);
    ctx.shadowColor = hexToRgba(smoothPoints[0].color, 0.3 + 0.5 * eased);
    ctx.shadowBlur = GLOW_INITIAL_BLUR * eased;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  ctx.beginPath();
  ctx.moveTo(smoothPoints[0].x, smoothPoints[0].y);

  for (let i = 1; i < smoothPoints.length; i++) {
    ctx.lineTo(smoothPoints[i].x, smoothPoints[i].y);
  }

  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.restore();
}

export default function Canvas({
  currentColor,
  currentSize,
  userId,
  onStrokeComplete,
  remoteStrokes,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [glowStrokes, setGlowStrokes] = useState<GlowStroke[]>([]);
  const currentPointsRef = useRef<DrawPoint[]>([]);
  const animationRef = useRef<number>(0);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent): DrawPoint | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        color: currentColor,
        size: currentSize,
        timestamp: Date.now(),
      };
    },
    [currentColor, currentSize]
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    remoteStrokes.forEach((stroke) => {
      drawBezierPath(ctx, stroke.points, 0, stroke.alpha ?? 1);
    });

    const now = Date.now();
    const activeGlows: GlowStroke[] = [];
    glowStrokes.forEach((gs) => {
      const elapsed = now - gs.startTime;
      if (elapsed < 200) {
        const linearProgress = elapsed / 200;
        const intensity = 1 - easeOutQuad(linearProgress);
        drawBezierPath(ctx, gs.points, intensity);
        drawBezierPath(ctx, gs.points, 0);
        activeGlows.push(gs);
      } else {
        drawBezierPath(ctx, gs.points, 0);
      }
    });
    if (activeGlows.length !== glowStrokes.length) {
      setGlowStrokes(activeGlows);
    }

    if (currentPointsRef.current.length > 0) {
      drawBezierPath(ctx, currentPointsRef.current, 0);
    }
  }, [remoteStrokes, glowStrokes]);

  useEffect(() => {
    const animate = () => {
      redraw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    if (!point) return;

    setIsDrawing(true);
    currentPointsRef.current = [point];
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    if (!isDrawing) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    currentPointsRef.current.push(point);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    const points = currentPointsRef.current;
    currentPointsRef.current = [];
    setIsDrawing(false);

    if (points.length > 0) {
      const strokeId = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setGlowStrokes((prev) => [...prev, { points, startTime: Date.now() }]);
      onStrokeComplete(strokeId, points);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    if (isDrawing) {
      handleMouseUp();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        background: '#ffffff',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full cursor-crosshair"
      />
      {mousePos && !isDrawing && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: mousePos.x - currentSize / 2,
            top: mousePos.y - currentSize / 2,
            width: currentSize,
            height: currentSize,
            backgroundColor: currentColor,
            opacity: 0.6,
          }}
        />
      )}
    </div>
  );
}
