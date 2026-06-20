import { useEffect, useRef, useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Point } from './DataModel';
import { StrokeToPath } from './StrokeToPath';

interface CanvasCaptureProps {
  onStrokeComplete: (data: {
    points: Point[];
    pathString: string;
    bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number; centerX: number; centerY: number };
  }) => void;
  onStrokeProgress?: (previewPath: string, pointCount: number) => void;
  disabled?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
}

const THROTTLE_MS = 16;
const SIMPLIFY_THRESHOLD = 2;

export function CanvasCapture({
  onStrokeComplete,
  onStrokeProgress,
  disabled = false,
  strokeColor = '#4a9eff',
  strokeWidth = 2
}: CanvasCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<Point[]>([]);
  const lastEmitRef = useRef(0);
  const strokeProcessorRef = useRef(new StrokeToPath(SIMPLIFY_THRESHOLD));
  const overlayCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const canvasSizeRef = useRef({ width: 0, height: 0 });

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    canvasSizeRef.current = { width: rect.width, height: rect.height };
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    overlayCtxRef.current = ctx;
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const getPoint = useCallback((e: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5,
      timestamp: Date.now()
    };
  }, []);

  const drawPreview = useCallback(() => {
    const ctx = overlayCtxRef.current;
    if (!ctx) return;
    const { width, height } = canvasSizeRef.current;
    ctx.clearRect(0, 0, width, height);

    const points = pointsRef.current;
    if (points.length < 2) return;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.globalAlpha = 0.7;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [strokeColor, strokeWidth]);

  const emitProgress = useCallback(() => {
    const now = Date.now();
    if (now - lastEmitRef.current < THROTTLE_MS) return;
    lastEmitRef.current = now;

    const points = pointsRef.current;
    if (points.length < 2) return;

    const result = strokeProcessorRef.current.processPoints(points);
    onStrokeProgress?.(result.pathString, points.length);
  }, [onStrokeProgress]);

  const handlePointerDown = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    pointsRef.current = [getPoint(e)];
    drawPreview();
  }, [disabled, getPoint, drawPreview]);

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || disabled) return;
    e.preventDefault();
    const point = getPoint(e);
    const lastPoint = pointsRef.current[pointsRef.current.length - 1];
    if (!lastPoint || Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) >= 1) {
      pointsRef.current.push(point);
      drawPreview();
      emitProgress();
    }
  }, [disabled, getPoint, drawPreview, emitProgress]);

  const handlePointerUp = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    const points = pointsRef.current;
    if (points.length === 0) {
      return;
    }

    const result = strokeProcessorRef.current.processPoints(points);

    const ctx = overlayCtxRef.current;
    if (ctx) {
      const { width, height } = canvasSizeRef.current;
      ctx.clearRect(0, 0, width, height);
    }

    onStrokeComplete({
      points: result.simplifiedPoints,
      pathString: result.pathString,
      bounds: result.bounds
    });

    pointsRef.current = [];
  }, [onStrokeComplete]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        cursor: disabled ? 'default' : 'crosshair',
        touchAction: 'none',
        pointerEvents: disabled ? 'none' : 'auto'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={(e) => {
        if (isDrawingRef.current) handlePointerUp(e);
      }}
    />
  );
}
