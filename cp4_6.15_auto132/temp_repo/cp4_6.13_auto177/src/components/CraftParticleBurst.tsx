import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface CraftParticleBurstRef {
  burst: (x: number, y: number) => void;
}

interface CraftParticleBurstProps {
  width?: number;
  height?: number;
  particleCount?: number;
  duration?: number;
  colorStart?: string;
  colorEnd?: string;
}

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

function lerpColor(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }, t: number): string {
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

const CraftParticleBurst = forwardRef<CraftParticleBurstRef, CraftParticleBurstProps>(
  function CraftParticleBurst(
    {
      particleCount = 30,
      duration = 800,
      colorStart = '#e74c3c',
      colorEnd = '#f1c40f',
    }: CraftParticleBurstProps,
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const colorStartRgb = useRef(hexToRgb(colorStart));
    const colorEndRgb = useRef(hexToRgb(colorEnd));
    const containerRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        burst: (x: number, y: number) => {
          spawnParticles(x, y);
        },
      }),
      []
    );

    const spawnParticles = useCallback(
      (x: number, y: number) => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.4 - 0.2;
          const speed = 1.5 + Math.random() * 4;
          newParticles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            life: duration,
            maxLife: duration,
            size: 2.5 + Math.random() * 3.5,
          });
        }
        particlesRef.current = [...particlesRef.current, ...newParticles];

        if (animFrameRef.current === null) {
          lastTimeRef.current = performance.now();
          startLoop();
        }
      },
      [particleCount, duration]
    );

    const startLoop = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const animate = (timestamp: number) => {
        const delta = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const aliveParticles: Particle[] = [];
        const particles = particlesRef.current;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.life -= delta;

          if (p.life <= 0) continue;

          p.vy += 0.06;
          p.vx *= 0.99;
          p.vy *= 0.99;
          p.x += p.vx;
          p.y += p.vy;

          const lifeRatio = p.life / p.maxLife;
          const colorT = 1 - lifeRatio;
          const alpha = lifeRatio;
          const size = p.size * (0.5 + lifeRatio * 0.5);

          ctx.save();
          ctx.globalAlpha = alpha * 0.9;
          ctx.fillStyle = lerpColor(colorStartRgb.current, colorEndRgb.current, colorT);
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = alpha * 0.25;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          aliveParticles.push(p);
        }

        particlesRef.current = aliveParticles;

        if (aliveParticles.length > 0) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          animFrameRef.current = null;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resize = () => {
        const container = containerRef.current;
        if (container) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
        }
      };

      resize();
      window.addEventListener('resize', resize);

      return () => {
        window.removeEventListener('resize', resize);
        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
      };
    }, []);

    return (
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'hidden',
          borderRadius: 'inherit',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }
);

export default CraftParticleBurst;
