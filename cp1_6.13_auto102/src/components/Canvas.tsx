import React, { useEffect, useRef, useCallback } from 'react';
import { particleSystem } from './ParticleSystem';
import { audioEngine } from './AudioEngine';

export interface StrokeData {
  userId: string;
  x: number;
  y: number;
  color: string;
  size: number;
  alpha: number;
}

export interface RemoteStroke {
  userId: string;
  color: string;
  size: number;
  alpha: number;
  points: { x: number; y: number; timestamp: number }[];
  isDrawing: boolean;
}

interface CanvasProps {
  brushColor: string;
  brushSize: number;
  brushAlpha: number;
  userId: string;
  onStroke: (data: StrokeData) => void;
  onStrokeEnd: () => void;
  remoteStrokes: Map<string, RemoteStroke>;
  clearTrigger: number;
}

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

const Canvas: React.FC<CanvasProps> = ({
  brushColor,
  brushSize,
  brushAlpha,
  userId,
  onStroke,
  onStrokeEnd,
  remoteStrokes,
  clearTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const localPoints = useRef<Point[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastParticleEmit = useRef(0);
  const lastAudioPlay = useRef(0);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    gradient.addColorStop(0, '#1a1a4e');
    gradient.addColorStop(0.5, '#2d1b69');
    gradient.addColorStop(1, '#0f0a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }, []);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const drawStrokeSegment = useCallback((
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    color: string,
    size: number,
    alpha: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = hexToRgba(color, alpha);
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, []);

  const drawTrail = useCallback((
    ctx: CanvasRenderingContext2D,
    points: Point[],
    color: string,
    size: number
  ) => {
    const now = performance.now();
    const trailDuration = 500;

    for (let i = 1; i < points.length; i++) {
      const age = now - points[i].timestamp;
      if (age > trailDuration) continue;

      const alpha = 1 - age / trailDuration;
      drawStrokeSegment(ctx, points[i - 1], points[i], color, size * alpha, alpha * 0.6);
    }
  }, [drawStrokeSegment]);

  const renderLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    drawBackground(ctx, w, h);

    const now = performance.now();

    remoteStrokes.forEach((stroke) => {
      const points = stroke.points;
      for (let i = 1; i < points.length; i++) {
        drawStrokeSegment(ctx, points[i - 1], points[i], stroke.color, stroke.size, stroke.alpha);
      }
      if (stroke.isDrawing) {
        drawTrail(ctx, points, stroke.color, stroke.size);
      }
    });

    if (isDrawing.current && localPoints.current.length > 0) {
      const points = localPoints.current;
      for (let i = 1; i < points.length; i++) {
        drawStrokeSegment(ctx, points[i - 1], points[i], brushColor, brushSize, brushAlpha);
      }
      drawTrail(ctx, points, brushColor, brushSize);
    }

    particleSystem.updateAndDraw(ctx);

    animFrameRef.current = requestAnimationFrame(renderLoop);
  }, [brushColor, brushSize, brushAlpha, remoteStrokes, drawBackground, drawStrokeSegment, drawTrail]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderLoop]);

  useEffect(() => {
    localPoints.current = [];
    particleSystem.clear();
  }, [clearTrigger]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
        timestamp: performance.now(),
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      timestamp: performance.now(),
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    audioEngine.resume();
    isDrawing.current = true;
    const pos = getPos(e);
    lastPoint.current = pos;
    localPoints.current = [pos];
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !lastPoint.current) return;

    const pos = getPos(e);
    const dx = pos.x - lastPoint.current.x;
    const dy = pos.y - lastPoint.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dt = pos.timestamp - lastPoint.current.timestamp;
    const speed = dt > 0 ? dist / (dt / 16) : 0;

    localPoints.current.push(pos);
    const now = performance.now();

    if (now - lastParticleEmit.current > 50) {
      particleSystem.createWave(pos.x, pos.y, brushColor);
      lastParticleEmit.current = now;
    }

    if (now - lastAudioPlay.current > 100 && dist > 2) {
      const freq = audioEngine.calculateFrequency(brushColor, speed);
      audioEngine.playTone(freq, 0.15);
      lastAudioPlay.current = now;
    }

    localPoints.current = localPoints.current.filter(p => now - p.timestamp < 600);

    onStroke({
      userId,
      x: pos.x,
      y: pos.y,
      color: brushColor,
      size: brushSize,
      alpha: brushAlpha,
    });

    lastPoint.current = pos;
  };

  const handleEnd = () => {
    isDrawing.current = false;
    lastPoint.current = null;
    localPoints.current = [];
    onStrokeEnd();
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', cursor: 'crosshair', touchAction: 'none' }}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    />
  );
};

export default Canvas;
