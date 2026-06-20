import { useEffect, useRef } from 'react';
import type { Mood } from '../../shared/types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface Props {
  mood: Mood;
}

const MOOD_COLORS: Record<Mood, { from: [number, number, number]; to: [number, number, number] }> = {
  happy: { from: [249, 115, 22], to: [236, 72, 153] },
  sad: { from: [99, 102, 241], to: [168, 85, 247] },
  romantic: { from: [236, 72, 153], to: [244, 114, 182] },
  passionate: { from: [239, 68, 68], to: [249, 115, 22] },
};

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export default function ParticleBackground({ mood }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const targetMoodRef = useRef<Mood>(mood);
  const currentColorsRef = useRef(MOOD_COLORS[mood]);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    targetMoodRef.current = mood;
  }, [mood]);

  useEffect(() => {
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

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const createParticle = (): Particle => {
      const colors = currentColorsRef.current;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 3 + 1,
        alpha: 0,
        life: 0,
        maxLife: Math.random() * 300 + 200,
      };
    };

    for (let i = 0; i < 120; i++) {
      particlesRef.current.push(createParticle());
    }

    const animate = () => {
      const targetColors = MOOD_COLORS[targetMoodRef.current];
      const cur = currentColorsRef.current;
      
      currentColorsRef.current = {
        from: lerpColor(cur.from, targetColors.from, 0.02),
        to: lerpColor(cur.to, targetColors.to, 0.02),
      };

      ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const colors = currentColorsRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          const force = (150 - dist) / 150 * 0.5;
          p.vx -= (dx / dist) * force;
          p.vy -= (dy / dist) * force;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.99;

        const lifeRatio = p.life / p.maxLife;
        if (lifeRatio < 0.1) {
          p.alpha = lifeRatio * 10;
        } else if (lifeRatio > 0.9) {
          p.alpha = (1 - lifeRatio) * 10;
        } else {
          p.alpha = 0.8;
        }

        if (p.x < -50) p.x = canvas.width + 50;
        if (p.x > canvas.width + 50) p.x = -50;
        if (p.y < -50) p.y = canvas.height + 50;
        if (p.y > canvas.height + 50) p.y = -50;

        if (p.life >= p.maxLife) {
          particles[i] = createParticle();
          continue;
        }

        const colorT = (Math.sin(p.life * 0.02 + i) + 1) / 2;
        const color = lerpColor(colors.from, colors.to, colorT);

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${p.alpha})`);
        gradient.addColorStop(0.5, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${p.alpha * 0.3})`);
        gradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.9})`;
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.15 * Math.min(a.alpha, b.alpha);
            const colorT = (i + j) % 2;
            const color = colorT === 0 ? colors.from : colors.to;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)' }}
    />
  );
}
