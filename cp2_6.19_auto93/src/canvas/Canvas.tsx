import React, { useRef, useEffect, useState, useCallback } from 'react';

export type DrawPoint = {
  x: number;
  y: number;
  color: string;
  size: number;
  timestamp: number;
};

export const PRESET_COLORS = [
  '#000000',
  '#e53935',
  '#fb8c00',
  '#fdd835',
  '#43a047',
  '#00acc1',
  '#1e88e5',
  '#8e24aa',
  '#ec407a',
  '#6d4c41',
  '#757575',
  '#424242',
];

interface CanvasProps {
  currentColor: string;
  currentSize: number;
  userId: string;
  onStrokeComplete: (strokeId: string, points: DrawPoint[]) => void;
  remoteStrokes: Map<string, { userId: string; points: DrawPoint[] }>;
}

interface GlowStroke {
  points: DrawPoint[];
  startTime: number;
}

function bezierInterpolate(points: DrawPoint[]): DrawPoint[] {
  if (points.length < 2) return points;

  const result: DrawPoint[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    const segments = 20;
    for (let t = 0; t <= segments; t++) {
      const tt = t / segments;
      const tt2 = tt * tt;
      const tt3 = tt2 * tt;
      const mt = 1 - tt;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;

      const x = mt3 * p1.x + 3 * mt2 * tt * cp1x + 3 * mt * tt2 * cp2x + tt3 * p2.x;
      const y = mt3 * p1.y + 3 * mt2 * tt * cp1y + 3 * mt * tt2 * cp2y + tt3 * p2.y;

      if (t > 0 || i === 0) {
        result.push({
          x,
          y,
          color: p1.color,
          size: p1.size,
          timestamp: p1.timestamp + (p2.timestamp - p1.timestamp) * tt,
        });
      }
    }
  }

  return result;
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  points: DrawPoint[],
  glowIntensity: number = 0
) {
  if (points.length < 2) {
    if (points.length === 1) {
      const p = points[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      if (glowIntensity > 0) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15 * glowIntensity;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    return;
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = points[0].color;
  ctx.lineWidth = points[0].size;

  if (glowIntensity > 0) {
    ctx.shadowColor = points[0].color;
    ctx.shadowBlur = 15 * glowIntensity;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
  ctx.shadowBlur = 0;
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
      const interpolated = bezierInterpolate(stroke.points);
      drawStroke(ctx, interpolated);
    });

    const now = Date.now();
    const activeGlows: GlowStroke[] = [];
    glowStrokes.forEach((gs) => {
      const elapsed = now - gs.startTime;
      if (elapsed < 200) {
        const intensity = 1 - elapsed / 200;
        const interpolated = bezierInterpolate(gs.points);
        drawStroke(ctx, interpolated, intensity);
        activeGlows.push(gs);
      } else {
        const interpolated = bezierInterpolate(gs.points);
        drawStroke(ctx, interpolated);
      }
    });
    if (activeGlows.length !== glowStrokes.length) {
      setGlowStrokes(activeGlows);
    }

    if (currentPointsRef.current.length > 0) {
      const interpolated = bezierInterpolate(currentPointsRef.current);
      drawStroke(ctx, interpolated);
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
        borderRadius: '4px',
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
