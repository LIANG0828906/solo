import { useEffect, useRef } from 'react';

interface WaveformCanvasProps {
  data: number[];
  progress?: number;
  color?: string;
  progressColor?: string;
  bgColor?: string;
  width?: number;
  height?: number;
  barWidth?: number;
  gap?: number;
}

export default function WaveformCanvas({
  data,
  progress = 0,
  color = '#64B5F6',
  progressColor = '#FFFFFF',
  bgColor = 'transparent',
  width,
  height = 40,
  barWidth = 2,
  gap = 1,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = width ?? container.clientWidth;
    const displayHeight = height;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, displayWidth, displayHeight);
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, displayWidth, displayHeight);
    }

    if (!data || data.length === 0) return;

    const totalBarWidth = barWidth + gap;
    const barCount = Math.min(data.length, Math.floor(displayWidth / totalBarWidth));
    const step = Math.max(1, Math.floor(data.length / barCount));
    const centerY = displayHeight / 2;

    for (let i = 0; i < barCount; i++) {
      const idx = Math.min(i * step, data.length - 1);
      const amp = Math.max(0.05, Math.min(1, data[idx] || 0));
      const barH = Math.max(2, amp * (displayHeight - 4));
      const x = i * totalBarWidth;
      const y = centerY - barH / 2;
      const ratio = i / barCount;
      ctx.fillStyle = ratio <= progress ? progressColor : color;
      ctx.fillRect(x, y, barWidth, barH);
    }
  }, [data, progress, color, progressColor, bgColor, width, height, barWidth, gap]);

  return (
    <div ref={containerRef} style={{ width: width ?? '100%', height }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
