import { useRef, useEffect, useCallback } from 'react';

interface ScopeDisplayProps {
  leftChannelData: Float32Array | null;
  rightChannelData: Float32Array | null;
}

export default function ScopeDisplay({ leftChannelData, rightChannelData }: ScopeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const leftRef = useRef<Float32Array | null>(null);
  const rightRef = useRef<Float32Array | null>(null);

  leftRef.current = leftChannelData;
  rightRef.current = rightChannelData;

  const draw = useCallback((ctx: CanvasRenderingContext2D, size: number, dpr: number) => {
    const s = size / dpr;
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2 - 4, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, s, s);

    const drawLissajous = (
      data: Float32Array | null,
      offsetX: number,
      halfWidth: number
    ) => {
      ctx.beginPath();
      const centerY = s / 2;

      if (!data || data.length < 2) {
        ctx.moveTo(offsetX, centerY);
        ctx.lineTo(offsetX + halfWidth, centerY);
        ctx.strokeStyle = 'rgba(255, 107, 53, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        return;
      }

      const gradient = ctx.createLinearGradient(offsetX, 0, offsetX + halfWidth, 0);
      gradient.addColorStop(0, '#ff6b35');
      gradient.addColorStop(1, '#00b4d8');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;

      const points = Math.min(data.length, 512);
      const step = Math.max(1, Math.floor(data.length / points));

      for (let i = 0; i < points - 1; i++) {
        const idx = i * step;
        const nextIdx = (i + 1) * step;
        const x = offsetX + (i / points) * halfWidth;
        const y = centerY + data[idx] * centerY * 0.8;
        const nextX = offsetX + ((i + 1) / points) * halfWidth;
        const nextY = centerY + (nextIdx < data.length ? data[nextIdx] : 0) * centerY * 0.8;

        if (i === 0) {
          ctx.moveTo(x, y);
        }
        ctx.lineTo(nextX, nextY);
      }
      ctx.stroke();
    };

    const halfW = s / 2;
    drawLissajous(leftRef.current, 0, halfW);
    drawLissajous(rightRef.current, halfW, halfW);

    ctx.restore();

    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2 - 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(233, 69, 96, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2 - 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(233, 69, 96, 0.08)';
    ctx.lineWidth = 8;
    ctx.stroke();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const parentWidth = parent.clientWidth;
    const canvasSize = Math.min(parentWidth, 400);

    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      draw(ctx, canvas.width, dpr);
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const canvasSize = Math.min(parent.clientWidth, 400);
      canvas.width = canvasSize * dpr;
      canvas.height = canvasSize * dpr;
      canvas.style.width = `${canvasSize}px`;
      canvas.style.height = `${canvasSize}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx, canvas.width, dpr);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <div className="flex items-center justify-center w-full">
      <canvas
        ref={canvasRef}
        className="rounded-full"
        style={{ maxWidth: '400px', maxHeight: '400px' }}
      />
    </div>
  );
}
