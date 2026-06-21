import { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  frequencyData: number[];
  isPlaying: boolean;
}

export default function AudioVisualizer({ frequencyData, isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const displayDataRef = useRef<number[]>(new Array(20).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const barCount = 20;
      const gap = 4;
      const totalGap = gap * (barCount - 1);
      let barWidth = (width - totalGap) / barCount;

      if (window.innerWidth < 480) {
        barWidth = Math.max(6, barWidth * 0.7);
      }

      for (let i = 0; i < barCount; i++) {
        const targetValue = isPlaying ? frequencyData[i] || 0 : 0;
        displayDataRef.current[i] = displayDataRef.current[i] * 0.85 + targetValue * 0.15;

        const value = displayDataRef.current[i];
        const barHeight = Math.max(4, value * height * 0.9);
        const x = (width - (barCount * barWidth + totalGap)) / 2 + i * (barWidth + gap);
        const y = height - barHeight;

        const gradient = ctx.createLinearGradient(x, height, x, y);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, '#c084fc');

        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(139, 92, 246, 0.6)';
        ctx.shadowBlur = 12;

        const radius = Math.min(barWidth / 2, 4);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, height - radius);
        ctx.quadraticCurveTo(x + barWidth, height, x + barWidth - radius, height);
        ctx.lineTo(x + radius, height);
        ctx.quadraticCurveTo(x, height, x, height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
      }

      rafIdRef.current = requestAnimationFrame(draw);
    };

    rafIdRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [frequencyData, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: 120,
        display: 'block',
      }}
    />
  );
}
