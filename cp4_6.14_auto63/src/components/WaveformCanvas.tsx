import { useRef, useEffect, useCallback } from 'react';

interface WaveformCanvasProps {
  waveformData: Float32Array | null;
  duration: number;
  currentTime: number;
  height?: number;
  selectionStart?: number | null;
  selectionEnd?: number | null;
  onSelectionChange?: (start: number, end: number) => void;
  onSeek?: (time: number) => void;
  trackId?: string;
}

export function WaveformCanvas({
  waveformData,
  duration,
  currentTime,
  height = 80,
  selectionStart = null,
  selectionEnd = null,
  onSelectionChange,
  onSeek,
  trackId,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isSelectingRef = useRef(false);
  const selectionStartRef = useRef<number | null>(null);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const h = height;

    canvas.width = width * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, width, h);

    if (!waveformData || waveformData.length === 0 || duration === 0) {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(width, h / 2);
      ctx.stroke();
      return;
    }

    if (selectionStart !== null && selectionEnd !== null) {
      const selX1 = (selectionStart / duration) * width;
      const selX2 = (selectionEnd / duration) * width;
      ctx.fillStyle = 'rgba(253, 230, 138, 0.3)';
      ctx.fillRect(Math.min(selX1, selX2), 0, Math.abs(selX2 - selX1), h);
    }

    ctx.fillStyle = '#6366f1';
    const samples = waveformData.length;
    const barWidth = width / samples;
    const centerY = h / 2;

    for (let i = 0; i < samples; i++) {
      const value = waveformData[i];
      const barHeight = value * h * 0.8;
      const x = i * barWidth;
      const y = centerY - barHeight / 2;

      if (barWidth > 2) {
        ctx.fillRect(x, y, barWidth - 1, barHeight || 1);
      } else {
        ctx.fillRect(x, y, 1, barHeight || 1);
      }
    }

    const playheadX = (currentTime / duration) * width;
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();
    }
  }, [waveformData, duration, currentTime, height, selectionStart, selectionEnd]);

  useEffect(() => {
    let animationId: number;
    let lastTime = 0;
    const interval = 100;

    const animate = (timestamp: number) => {
      if (timestamp - lastTime >= interval) {
        drawWaveform();
        lastTime = timestamp;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [drawWaveform]);

  const getTimeFromX = (clientX: number): number => {
    const canvas = canvasRef.current;
    if (!canvas || duration === 0) return 0;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    return ratio * duration;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onSeek && !onSelectionChange) return;

    const time = getTimeFromX(e.clientX);

    if (e.shiftKey && onSelectionChange) {
      isSelectingRef.current = true;
      selectionStartRef.current = time;
      onSelectionChange(time, time);
    } else if (onSeek) {
      isDraggingRef.current = true;
      onSeek(time);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current && !isSelectingRef.current) return;

    const time = getTimeFromX(e.clientX);

    if (isSelectingRef.current && onSelectionChange && selectionStartRef.current !== null) {
      onSelectionChange(selectionStartRef.current, time);
    } else if (isDraggingRef.current && onSeek) {
      onSeek(time);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isSelectingRef.current = false;
    selectionStartRef.current = null;
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current || isSelectingRef.current) {
      handleMouseUp();
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: '4px',
        overflow: 'hidden',
        cursor: onSeek ? 'pointer' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}
