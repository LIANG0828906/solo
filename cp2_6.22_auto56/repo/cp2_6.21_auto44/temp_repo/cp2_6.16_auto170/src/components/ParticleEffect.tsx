import React, { useEffect, useRef, useImperativeHandle, forwardRef, memo } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
}

export interface ParticleEffectHandle {
  burst: (x: number, y: number, colors: string[], count?: number) => void;
  ring: (x: number, y: number, color: string, count?: number) => void;
}

interface ParticleEffectProps {
  className?: string;
}

export const ParticleEffect = memo(
  forwardRef<ParticleEffectHandle, ParticleEffectProps>(function ParticleEffect(
    { className },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);

    useImperativeHandle(ref, () => ({
      burst(x: number, y: number, colors: string[], count = 24) {
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
          const speed = 1.5 + Math.random() * 3.5;
          particlesRef.current.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0,
            maxLife: 50 + Math.random() * 30,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 2 + Math.random() * 3,
            gravity: 0.04 + Math.random() * 0.04,
          });
        }
      },
      ring(x: number, y: number, color: string, count = 16) {
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          const speed = 2 + Math.random() * 1.5;
          particlesRef.current.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0,
            maxLife: 45,
            color,
            size: 2.5,
            gravity: 0,
          });
        }
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);

      const loop = (t: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = t;
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);

        const next: Particle[] = [];
        for (const p of particlesRef.current) {
          p.life += 1;
          if (p.life >= p.maxLife) continue;
          p.vy += p.gravity;
          p.x += p.vx;
          p.y += p.vy;
          const alpha = 1 - p.life / p.maxLife;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          next.push(p);
        }
        particlesRef.current = next;
        lastTimeRef.current = t;
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(rafRef.current);
        ro.disconnect();
      };
    }, []);

    return <canvas ref={canvasRef} className={`particle-canvas ${className ?? ''}`} />;
  })
);
