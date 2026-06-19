import React, { useRef, useEffect, useState, useCallback } from 'react';

interface WaveformCanvasProps {
  waveformData: number[];
  duration: number;
  startTime: number;
  endTime: number;
  onSelectionChange: (start: number, end: number) => void;
  playbackPosition?: number;
  isPlaying?: boolean;
  height?: number;
}

interface HoverInfo {
  x: number;
  y: number;
  time: number;
  amplitude: number;
}

const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  waveformData,
  duration,
  startTime,
  endTime,
  onSelectionChange,
  playbackPosition = 0,
  isPlaying = false,
  height = 220,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [activeHandle, setActiveHandle] = useState<'start' | 'end' | null>(null);
  const animationRef = useRef<number>();

  const BAR_WIDTH = 2;
  const BAR_GAP = 1;
  const BAR_TOTAL = BAR_WIDTH + BAR_GAP;
  const HANDLE_SIZE = 16;

  const lerp = (a: string, b: string, t: number): string => {
    const ah = parseInt(a.replace('#', ''), 16);
    const bh = parseInt(b.replace('#', ''), 16);
    const ar = (ah >> 16) & 0xff;
    const ag = (ah >> 8) & 0xff;
    const ab = ah & 0xff;
    const br = (bh >> 16) & 0xff;
    const bg = (bh >> 8) & 0xff;
    const bb = bh & 0xff;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return `rgb(${rr},${rg},${rb})`;
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.clearRect(0, 0, width, h);
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(0, 0, width, h);

    if (waveformData.length === 0) {
      ctx.fillStyle = '#A0A0AA';
      ctx.font = '14px Space Grotesk';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('上传音频以显示波形', width / 2, h / 2);
      return;
    }

    const visibleBars = Math.floor(width / BAR_TOTAL);
    const step = waveformData.length / visibleBars;
    const centerY = h / 2;
    const maxBarHeight = h * 0.42;

    const startX = (startTime / Math.max(duration, 0.01)) * width;
    const endX = (endTime / Math.max(duration, 0.01)) * width;
    const playX = (playbackPosition / Math.max(duration, 0.01)) * width;

    if (isPlaying) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
      ctx.fillRect(0, 0, Math.min(playX, width), h);
    }

    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.fillRect(startX, 0, endX - startX, h);

    for (let i = 0; i < visibleBars; i++) {
      const dataIndex = Math.floor(i * step);
      const amplitude = waveformData[dataIndex] || 0;
      const barHeight = Math.max(2, amplitude * maxBarHeight);
      const x = i * BAR_TOTAL;
      const t = i / Math.max(visibleBars - 1, 1);
      const inSelection = x >= startX && x <= endX;
      const inPlayed = isPlaying && x <= playX;

      let color: string;
      if (inPlayed) {
        color = 'rgba(255, 215, 0, 0.85)';
      } else if (inSelection) {
        color = lerp('#FFE066', '#FF8C42', t);
      } else {
        color = lerp('#6A5ACD', '#FF6347', t);
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, centerY - barHeight / 2, BAR_WIDTH, barHeight);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    if (duration > 0) {
      const drawHandle = (xPos: number, isActive: boolean) => {
        ctx.fillStyle = isActive ? '#FFD700' : '#FFFFFF';
        ctx.shadowColor = isActive ? 'rgba(255,215,0,0.6)' : 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = isActive ? 12 : 4;
        ctx.beginPath();
        ctx.arc(xPos, centerY, HANDLE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = isActive ? '#FFD700' : '#6A5ACD';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xPos, 4);
        ctx.lineTo(xPos, h - 4);
        ctx.stroke();
      };

      drawHandle(startX, activeHandle === 'start');
      drawHandle(endX, activeHandle === 'end');
    }

    if (isPlaying && duration > 0) {
      ctx.strokeStyle = '#FF6347';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255,99,71,0.6)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(playX, 4);
      ctx.lineTo(playX, h - 4);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [waveformData, duration, startTime, endTime, playbackPosition, isPlaying, activeHandle, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw, height]);

  useEffect(() => {
    let frame = 0;
    const animate = () => {
      draw();
      frame++;
      animationRef.current = requestAnimationFrame(animate);
    };
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      draw();
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [draw, isPlaying]);

  const getTimeFromX = (clientX: number): number => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return 0;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * duration;
  };

  const getAmplitudeAtX = (clientX: number): number => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return 0;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = x / rect.width;
    const idx = Math.floor(ratio * waveformData.length);
    return waveformData[idx] || 0;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (duration <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const startX = (startTime / duration) * rect.width;
    const endX = (endTime / duration) * rect.width;
    const distStart = Math.abs(x - startX);
    const distEnd = Math.abs(x - endX);
    const threshold = HANDLE_SIZE;

    if (distStart <= threshold && distStart <= distEnd) {
      setDragging('start');
      setActiveHandle('start');
    } else if (distEnd <= threshold) {
      setDragging('end');
      setActiveHandle('end');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setHoverInfo({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      time: getTimeFromX(e.clientX),
      amplitude: getAmplitudeAtX(e.clientX),
    });

    if (!dragging) return;
    const time = getTimeFromX(e.clientX);
    if (dragging === 'start') {
      onSelectionChange(Math.min(time, endTime), endTime);
    } else if (dragging === 'end') {
      onSelectionChange(startTime, Math.max(time, startTime));
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setTimeout(() => setActiveHandle(null), 200);
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
    setDragging(null);
    setActiveHandle(null);
  };

  const formatTime = (t: number): string => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const exportPNG = useCallback((exportWidth = 1024, exportHeight = 300): string | null => {
    const offCanvas = document.createElement('canvas');
    const dpr = 1;
    offCanvas.width = exportWidth * dpr;
    offCanvas.height = exportHeight * dpr;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    if (waveformData.length === 0) return offCanvas.toDataURL('image/png');

    const padding = { top: 30, right: 20, bottom: 40, left: 20 };
    const chartW = exportWidth - padding.left - padding.right;
    const chartH = exportHeight - padding.top - padding.bottom;
    const centerY = padding.top + chartH / 2;
    const maxBarHeight = chartH * 0.42;
    const visibleBars = Math.floor(chartW / BAR_TOTAL);
    const step = waveformData.length / visibleBars;

    for (let i = 0; i < visibleBars; i++) {
      const dataIndex = Math.floor(i * step);
      const amplitude = waveformData[dataIndex] || 0;
      const barHeight = Math.max(2, amplitude * maxBarHeight);
      const x = padding.left + i * BAR_TOTAL;
      const t = i / Math.max(visibleBars - 1, 1);
      ctx.fillStyle = lerp('#6A5ACD', '#FF6347', t);
      ctx.fillRect(x, centerY - barHeight / 2, BAR_WIDTH, barHeight);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, centerY);
    ctx.lineTo(exportWidth - padding.right, centerY);
    ctx.stroke();

    ctx.fillStyle = '#555';
    ctx.font = '11px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const ticks = 6;
    for (let i = 0; i <= ticks; i++) {
      const x = padding.left + (i / ticks) * chartW;
      const t = (i / ticks) * duration;
      ctx.fillText(formatTime(t), x, exportHeight - padding.bottom + 12);
    }

    ctx.fillStyle = '#555';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const dbLevels = [0, -12, -24, -36, -48];
    const dbPositions = [centerY - maxBarHeight, centerY - maxBarHeight / 2, centerY, centerY + maxBarHeight / 2, centerY + maxBarHeight];
    dbLevels.forEach((db, i) => {
      ctx.fillText(`${db} dB`, padding.left - 6, dbPositions[i]);
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.moveTo(padding.left, dbPositions[i]);
      ctx.lineTo(exportWidth - padding.right, dbPositions[i]);
      ctx.stroke();
    });

    return offCanvas.toDataURL('image/png');
  }, [waveformData, duration]);

  (WaveformCanvas as any).exportPNG = exportPNG;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: dragging ? 'grabbing' : 'crosshair',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} />
      {hoverInfo && duration > 0 && (
        <div
          style={{
            position: 'absolute',
            left: hoverInfo.x + 12,
            top: hoverInfo.y - 40,
            background: 'rgba(30, 30, 36, 0.95)',
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 12,
            fontFamily: 'JetBrains Mono, monospace',
            pointerEvents: 'none',
            zIndex: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            whiteSpace: 'nowrap',
          }}
        >
          <div>时间: {formatTime(hoverInfo.time)}</div>
          <div>振幅: {(hoverInfo.amplitude * 100).toFixed(1)}%</div>
        </div>
      )}
    </div>
  );
};

export default WaveformCanvas;
