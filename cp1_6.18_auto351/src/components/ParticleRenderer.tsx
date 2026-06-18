import { useEffect, useRef } from 'react';
import type { EmotionCoords, Particle, EmotionType } from '../types';
import { emotionToColor } from '../store/diaryStore';

interface ParticleRendererProps {
  emotionCoords: EmotionCoords;
  emotionType?: EmotionType;
  particleCount?: number;
  width?: number;
  height?: number;
  className?: string;
}

export default function ParticleRenderer({
  emotionCoords,
  emotionType = 'calm',
  particleCount = 80,
  width = 280,
  height = 200,
  className,
}: ParticleRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseColor = emotionToColor(emotionType);
    const moveSpeedFactor = 0.3 + (emotionCoords.arousal / 100) * 1.5;
    const rotationSpeedFactor = 0.005 + (emotionCoords.valence / 100) * 0.03;

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 255, g: 255, b: 255 };
    };

    const lerpColor = (t: number) => {
      const c1 = hexToRgb(baseColor);
      const c2 = { r: 255, g: 255, b: 255 };
      const r = Math.round(c1.r + (c2.r - c1.r) * t);
      const g = Math.round(c1.g + (c2.g - c1.g) * t);
      const b = Math.round(c1.b + (c2.b - c1.b) * t);
      return `rgba(${r},${g},${b},`;
    };

    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 4 + 1,
        color: lerpColor(Math.random()),
        alpha: Math.random() * 0.6 + 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.04,
      }));
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(26, 26, 46, 0.15)';
      ctx.fillRect(0, 0, width, height);

      particlesRef.current.forEach((p) => {
        p.x += p.vx * moveSpeedFactor;
        p.y += p.vy * moveSpeedFactor;
        p.rotation += p.rotationSpeed * rotationSpeedFactor * 10;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.fill();
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [emotionCoords, emotionType, particleCount, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ display: 'block', borderRadius: '8px 8px 0 0' }}
    />
  );
}
