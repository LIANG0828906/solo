import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface CelebrationParticlesProps {
  trigger: number;
}

const COLORS = [
  '#FFD700', '#FFA500', '#FF6347', '#FF69B4',
  '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C',
  '#7C5CFC', '#FFB6C1', '#FFFF00', '#00CED1',
];

export function CelebrationParticles({ trigger }: CelebrationParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (trigger === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const PARTICLE_COUNT = 120;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.3;
      const speed = 3 + Math.random() * 6;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 0,
        maxLife: 60 + Math.random() * 60,
      });
    }

    const startTime = Date.now();
    const DURATION = 2000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const fadeStart = DURATION * 0.6;
      const globalAlpha = elapsed > fadeStart ? Math.max(0, 1 - (elapsed - fadeStart) / (DURATION - fadeStart)) : 1;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = globalAlpha;

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.vx *= 0.99;
        p.vy *= 0.99;

        const particleAlpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * particleAlpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = globalAlpha * particleAlpha;
        ctx.fill();

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      if (elapsed < DURATION || particles.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particlesRef.current = [];
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      particlesRef.current = [];
    };
  }, [trigger]);

  return <canvas ref={canvasRef} className="particles-canvas" />;
}
