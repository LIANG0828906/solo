import { useEffect, useRef } from 'react';
import type { Mood } from '../../shared/types';

interface Props {
  mood: Mood;
  isPlaying: boolean;
  lyricLines?: string[];
}

const MOOD_COLORS: Record<Mood, { from: [number, number, number]; to: [number, number, number] }> = {
  happy: { from: [249, 115, 22], to: [236, 72, 153] },
  sad: { from: [99, 102, 241], to: [168, 85, 247] },
  romantic: { from: [236, 72, 153], to: [244, 114, 182] },
  passionate: { from: [239, 68, 68], to: [249, 115, 22] },
};

export default function SpectrumVisualizer({ mood, isPlaying, lyricLines = [] }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<number[]>([]);
  const animationRef = useRef<number>(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const BAR_COUNT = 48;
    barsRef.current = new Array(BAR_COUNT).fill(0);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      phaseRef.current += isPlaying ? 0.08 : 0.02;
      
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const barWidth = (w / BAR_COUNT) * 0.7;
      const gap = (w / BAR_COUNT) * 0.3;
      const colors = MOOD_COLORS[mood];

      ctx.clearRect(0, 0, w, h);

      const baseIntensity = isPlaying ? 1 : 0.3;
      const lineIntensity = lyricLines.length > 0 ? Math.min(lyricLines.length / 4, 1) : 0.5;

      for (let i = 0; i < BAR_COUNT; i++) {
        const x = i * (barWidth + gap) + gap / 2;
        
        const targetHeight = 
          (Math.sin(phaseRef.current + i * 0.15) * 0.3 +
           Math.sin(phaseRef.current * 1.7 + i * 0.08) * 0.2 +
           Math.sin(phaseRef.current * 0.5 + i * 0.3) * 0.2 +
           0.5) *
          h * 0.75 * baseIntensity * lineIntensity;

        barsRef.current[i] += (targetHeight - barsRef.current[i]) * 0.12;
        const barHeight = barsRef.current[i];

        const y = h - barHeight;

        const t = i / BAR_COUNT;
        const r = Math.round(colors.from[0] + (colors.to[0] - colors.from[0]) * t);
        const g = Math.round(colors.from[1] + (colors.to[1] - colors.from[1]) * t);
        const b = Math.round(colors.from[2] + (colors.to[2] - colors.from[2]) * t);

        const gradient = ctx.createLinearGradient(0, y, 0, h);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.6)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.1)`);

        const radius = Math.min(barWidth / 2, 6);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, h);
        ctx.lineTo(x, h);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x + barWidth / 2, y, barWidth * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * baseIntensity})`;
        ctx.fill();

        if (i < BAR_COUNT - 1) {
          const nextHeight = barsRef.current[i + 1];
          const midX = x + barWidth + gap / 2;
          const midYTop = h - (barHeight + nextHeight) / 2;
          
          ctx.beginPath();
          ctx.moveTo(x + barWidth, h - barHeight);
          ctx.quadraticCurveTo(midX, midYTop - 5, midX + barWidth / 2 - gap / 2, h - nextHeight);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      const mirrorY = h;
      ctx.save();
      ctx.translate(0, mirrorY * 2);
      ctx.scale(1, -1);
      ctx.globalAlpha = 0.15;

      for (let i = 0; i < BAR_COUNT; i++) {
        const x = i * (barWidth + gap) + gap / 2;
        const barHeight = barsRef.current[i] * 0.4;
        const y = h - barHeight;

        const t = i / BAR_COUNT;
        const r = Math.round(colors.from[0] + (colors.to[0] - colors.from[0]) * t);
        const g = Math.round(colors.from[1] + (colors.to[1] - colors.from[1]) * t);
        const b = Math.round(colors.from[2] + (colors.to[2] - colors.from[2]) * t);

        const gradient = ctx.createLinearGradient(0, y, 0, h);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [mood, isPlaying, lyricLines.length]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
    />
  );
}
