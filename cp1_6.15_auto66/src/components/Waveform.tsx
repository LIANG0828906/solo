import '../styles.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface WaveformProps {
  peaks: number[];
  width: number;
  height?: number;
  startTime?: number;
  pixelsPerSecond?: number;
  muted?: boolean;
  dimmed?: boolean;
  isDragging?: boolean;
  className?: string;
  onMouseDown?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onDragStart?: () => void;
  onDragMove?: (deltaSeconds: number) => void;
  onDragEnd?: () => void;
}

export const Waveform: React.FC<WaveformProps> = ({
  peaks,
  width,
  height = 60,
  startTime = 0,
  pixelsPerSecond = 100,
  muted = false,
  dimmed = false,
  isDragging = false,
  className = '',
  onMouseDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [internalDragging, setInternalDragging] = useState(false);
  const lastClientXRef = useRef<number>(0);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const centerY = height / 2;
    const grayColor = '#6b7280';
    const isGray = muted || dimmed;

    ctx.strokeStyle = isGray ? grayColor : 'rgba(96, 165, 250, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    if (peaks.length === 0) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (isGray) {
      gradient.addColorStop(0, grayColor);
      gradient.addColorStop(1, grayColor);
    } else {
      gradient.addColorStop(0, '#60a5fa');
      gradient.addColorStop(1, '#93c5fd');
    }

    const totalSeconds = peaks.length / pixelsPerSecond;
    const visibleStart = startTime;
    const visibleEnd = startTime + width / pixelsPerSecond;

    const startIndex = Math.max(0, Math.floor(visibleStart * pixelsPerSecond));
    const endIndex = Math.min(peaks.length, Math.ceil(visibleEnd * pixelsPerSecond));

    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = startIndex; i < endIndex; i++) {
      const peak = Math.max(0, Math.min(1, peaks[i] || 0));
      const x = (i / pixelsPerSecond - startTime) * pixelsPerSecond;
      const barHeight = peak * (height / 2 - 2);
      ctx.lineTo(x, centerY - barHeight);
    }

    for (let i = endIndex - 1; i >= startIndex; i--) {
      const peak = Math.max(0, Math.min(1, peaks[i] || 0));
      const x = (i / pixelsPerSecond - startTime) * pixelsPerSecond;
      const barHeight = peak * (height / 2 - 2);
      ctx.lineTo(x, centerY + barHeight);
    }

    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.globalAlpha = dimmed ? 0.3 : 0.7;
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = isGray ? grayColor : 'rgba(147, 197, 253, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [peaks, width, height, startTime, pixelsPerSecond, muted, dimmed]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  const getClientX = (e: MouseEvent | TouchEvent): number => {
    if ('touches' in e) {
      return e.touches.length > 0 ? e.touches[0].clientX : 0;
    }
    return e.clientX;
  };

  const handlePointerDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      onMouseDown?.(e);
      onDragStart?.();
      setInternalDragging(true);
      lastClientXRef.current = e.clientX;
    },
    [onMouseDown, onDragStart]
  );

  useEffect(() => {
    if (!isDragging && !internalDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = getClientX(e);
      const deltaX = clientX - lastClientXRef.current;
      lastClientXRef.current = clientX;
      const deltaSeconds = deltaX / pixelsPerSecond;
      onDragMove?.(deltaSeconds);
    };

    const handleEnd = () => {
      setInternalDragging(false);
      onDragEnd?.();
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [isDragging, internalDragging, pixelsPerSecond, onDragMove, onDragEnd]);

  const cursor = isDragging || internalDragging ? 'grabbing' : 'grab';

  return (
    <canvas
      ref={canvasRef}
      className={`waveform-canvas ${className}`}
      style={{ cursor, display: 'block' }}
      onMouseDown={handlePointerDown}
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          onDragStart?.();
          setInternalDragging(true);
          lastClientXRef.current = e.touches[0].clientX;
        }
      }}
    />
  );
};

export default Waveform;
