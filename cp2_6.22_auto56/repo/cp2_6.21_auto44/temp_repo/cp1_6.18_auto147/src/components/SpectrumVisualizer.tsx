import { useRef, useEffect } from 'react';

interface SpectrumVisualizerProps {
  data: number[];
  barCount?: number;
}

export default function SpectrumVisualizer({
  data,
  barCount = 32,
}: SpectrumVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 360;
    const height = 80;
    canvas.width = width;
    canvas.height = height;

    const draw = (timestamp: number) => {
      if (timestamp - lastFrameTimeRef.current < 33) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameTimeRef.current = timestamp;

      ctx.clearRect(0, 0, width, height);

      const displayData = data.slice(0, barCount);
      const barWidth = (width - (displayData.length - 1) * 2) / displayData.length;
      const gap = 2;

      displayData.forEach((value, index) => {
        const normalizedValue = value / 255;
        const barHeight = Math.max(2, normalizedValue * (height - 4));
        const x = index * (barWidth + gap);
        const y = height - barHeight;

        const gradient = ctx.createLinearGradient(0, y, 0, height);
        gradient.addColorStop(0, '#E94560');
        gradient.addColorStop(1, '#0F3460');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, barCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '360px', height: '80px' }}
      className="rounded-lg"
    />
  );
}
