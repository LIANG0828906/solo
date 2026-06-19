import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface ParticleEffectProps {
  active: boolean;
  color: string;
  onComplete: () => void;
}

export default function ParticleEffect({ active, color, onComplete }: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  const spawnParticles = useCallback(
    (canvas: HTMLCanvasElement) => {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const particles: Particle[] = [];

      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20 + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 4;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 500,
          maxLife: 500,
          size: 3 + Math.random() * 4,
          color,
        });
      }

      particlesRef.current = particles;
    },
    [color]
  );

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    spawnParticles(canvas);

    const ctx = canvas.getContext('2d')!;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      const dt = 16;

      for (const p of particlesRef.current) {
        p.life -= dt;
        if (p.life <= 0) continue;
        alive = true;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.vx *= 0.98;

        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (alive && elapsed < 600) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete();
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, color, onComplete, spawnParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-20"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
