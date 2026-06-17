import { useRef, useEffect, useState, useCallback } from 'react';
import type { WaveformPoint } from '../store';

type WaveformCanvasProps = {
  waveformPoints: WaveformPoint[];
  onWaveformChange: (points: WaveformPoint[] | ((prev: WaveformPoint[]) => WaveformPoint[])) => void;
  onDrawingComplete: (points: WaveformPoint[]) => void;
  playbackProgress: number;
  isPlaying: boolean;
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  showGlow?: boolean;
  showPlayhead?: boolean;
  showHint?: boolean;
  hintText?: string;
};

export function WaveformCanvas({
  waveformPoints,
  onWaveformChange,
  onDrawingComplete,
  playbackProgress,
  isPlaying,
  width,
  height,
  strokeColor = '#00D4AA',
  strokeWidth = 3,
  showGlow = true,
  showPlayhead = true,
  showHint = true,
  hintText = 'Click and drag to draw a waveform',
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: width || rect.width,
          height: height || rect.height,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [width, height]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    if (waveformPoints.length > 1) {
      ctx.save();

      if (showGlow) {
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 15;
      }

      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const firstPoint = waveformPoints[0];
      ctx.moveTo(firstPoint.x * canvasSize.width, firstPoint.y * canvasSize.height);

      for (let i = 1; i < waveformPoints.length; i++) {
        const point = waveformPoints[i];
        ctx.lineTo(point.x * canvasSize.width, point.y * canvasSize.height);
      }

      ctx.stroke();
      ctx.restore();
    }

    if (showPlayhead && isPlaying) {
      const playheadX = playbackProgress * canvasSize.width;
      const centerY = canvasSize.height / 2;
      const playheadHeight = 100;

      ctx.save();
      ctx.shadowColor = '#FF6B6B';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(playheadX - 1, centerY - playheadHeight / 2, 2, playheadHeight);
      ctx.restore();
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(draw);
    }
  }, [waveformPoints, playbackProgress, isPlaying, canvasSize, strokeColor, strokeWidth, showGlow, showPlayhead]);

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(draw);
    } else {
      draw();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw, isPlaying]);

  const getNormalizedPoint = useCallback(
    (clientX: number, clientY: number): WaveformPoint | null => {
      if (!containerRef.current) return null;

      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      return {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const point = getNormalizedPoint(e.clientX, e.clientY);
      if (!point) return;

      setIsDrawing(true);
      onWaveformChange([point]);
    },
    [getNormalizedPoint, onWaveformChange]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDrawing) return;

      const point = getNormalizedPoint(e.clientX, e.clientY);
      if (!point) return;

      onWaveformChange((prev) => {
        const lastPoint = prev[prev.length - 1];
        if (lastPoint && Math.abs(point.x - lastPoint.x) < 0.001) {
          return prev;
        }
        return [...prev, point];
      });
    },
    [isDrawing, getNormalizedPoint, onWaveformChange]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawing && waveformPoints.length > 1) {
      onDrawingComplete(waveformPoints);
    }
    setIsDrawing(false);
  }, [isDrawing, waveformPoints, onDrawingComplete]);

  const handleMouseLeave = useCallback(() => {
    if (isDrawing && waveformPoints.length > 1) {
      onDrawingComplete(waveformPoints);
    }
    setIsDrawing(false);
  }, [isDrawing, waveformPoints, onDrawingComplete]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      const point = getNormalizedPoint(touch.clientX, touch.clientY);
      if (!point) return;

      setIsDrawing(true);
      onWaveformChange([point]);
    },
    [getNormalizedPoint, onWaveformChange]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isDrawing) return;

      const touch = e.touches[0];
      const point = getNormalizedPoint(touch.clientX, touch.clientY);
      if (!point) return;

      onWaveformChange((prev) => {
        const lastPoint = prev[prev.length - 1];
        if (lastPoint && Math.abs(point.x - lastPoint.x) < 0.001) {
          return prev;
        }
        return [...prev, point];
      });
    },
    [isDrawing, getNormalizedPoint, onWaveformChange]
  );

  const handleTouchEnd = useCallback(() => {
    if (isDrawing && waveformPoints.length > 1) {
      onDrawingComplete(waveformPoints);
    }
    setIsDrawing(false);
  }, [isDrawing, waveformPoints, onDrawingComplete]);

  return (
    <div
      ref={containerRef}
      className="waveform-canvas-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        height: height ? `${height}px` : undefined,
      }}
    >
      <canvas
        ref={canvasRef}
        className="waveform-canvas"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      />
      {showHint && waveformPoints.length === 0 && (
        <div className="hint-text">{hintText}</div>
      )}
    </div>
  );
}
