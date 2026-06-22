import { useEffect, useRef } from 'react';

interface SpectrumAnalyzerProps {
  spectrumDataRef: React.RefObject<Uint8Array>;
  isPlaying: boolean;
}

const BAR_COUNT = 32;
const BAR_WIDTH = 8;
const BAR_GAP = 4;
const HEIGHT = 150;

export default function SpectrumAnalyzer({ spectrumDataRef, isPlaying }: SpectrumAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const smoothedRef = useRef<Float32Array>(new Float32Array(BAR_COUNT));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      const data = spectrumDataRef.current;
      const totalBarWidth = BAR_COUNT * BAR_WIDTH + (BAR_COUNT - 1) * BAR_GAP;
      const startX = (displayWidth - totalBarWidth) / 2;

      for (let i = 0; i < BAR_COUNT; i++) {
        let raw = 0;
        if (isPlaying && data && data.length > 0) {
          const dataIndex = Math.floor((i / BAR_COUNT) * data.length);
          raw = (data[dataIndex] || 0) / 255;
        }

        const target = raw;
        smoothedRef.current[i] += (target - smoothedRef.current[i]) * 0.3;
        const value = smoothedRef.current[i];

        const barHeight = Math.max(2, value * (HEIGHT - 20));
        const x = startX + i * (BAR_WIDTH + BAR_GAP);
        const y = HEIGHT - barHeight - 5;

        const gradient = ctx.createLinearGradient(x, HEIGHT - 5, x, y);
        gradient.addColorStop(0, '#8B5CF6');
        gradient.addColorStop(1, '#F472B6');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.roundRect(x, y, BAR_WIDTH, barHeight, 2);
        ctx.fill();

        if (value > 0.5) {
          ctx.shadowColor = '#F472B6';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, spectrumDataRef]);

  return (
    <div
      style={{
        height: HEIGHT,
        background: '#1E1E1E',
        position: 'relative',
        borderTop: '1px solid #333333',
      }}
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
