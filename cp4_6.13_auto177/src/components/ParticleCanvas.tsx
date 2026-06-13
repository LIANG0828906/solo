import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  colorStart: string;
  colorEnd: string;
}

interface ParticleCanvasProps {
  particleEvents: Array<{ id: string; x: number; y: number }>;
  onEventConsumed?: (id: string) => void;
}

const COLOR_START = '#e74c3c';
const COLOR_END = '#f1c40f';
const PARTICLE_COUNT = 30;
const MAX_LIFE = 800;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function ParticleCanvas({ particleEvents, onEventConsumed }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const processedEventsRef = useRef<Set<string>>(new Set());

  const spawnParticles = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.3;
      const speed = 2 + Math.random() * 5;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: MAX_LIFE,
        maxLife: MAX_LIFE,
        size: 3 + Math.random() * 4,
        colorStart: COLOR_START,
        colorEnd: COLOR_END,
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = (timestamp: number) => {
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const aliveParticles: Particle[] = [];
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        p.life -= delta;

        if (p.life <= 0) continue;

        p.vy += 0.08;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;

        const lifeRatio = p.life / p.maxLife;
        const colorT = 1 - lifeRatio;
        const alpha = lifeRatio;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = lerpColor(p.colorStart, p.colorEnd, colorT);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * lifeRatio * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        aliveParticles.push(p);
      }
      particlesRef.current = aliveParticles;

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (particleEvents.length === 0) return;

    for (let i = 0; i < particleEvents.length; i++) {
      const event = particleEvents[i];
      if (!processedEventsRef.current.has(event.id)) {
        processedEventsRef.current.add(event.id);
        spawnParticles(event.x, event.y);
        if (onEventConsumed) {
          onEventConsumed(event.id);
        }
      }
    }
  }, [particleEvents, spawnParticles, onEventConsumed]);

  return <canvas ref={canvasRef} className="particle-canvas" />;
}
