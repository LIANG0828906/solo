import { useEffect, useRef, useCallback } from 'react';
import type { Particle, ParticleType } from '@/types';
import { INK_COLORS } from '@/utils/constants';

interface UseParticleSystemOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  maxParticles?: number;
}

interface UseParticleSystemReturn {
  triggerInkSplash: (x: number, y: number, count?: number) => void;
  isRunning: boolean;
}

class ParticlePool {
  private pool: Particle[];
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.pool = [];
    this.initializePool();
  }

  private initializePool(): void {
    for (let i = 0; i < this.maxSize; i++) {
      this.pool.push(this.createEmptyParticle());
    }
  }

  private createEmptyParticle(): Particle {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 0,
      opacity: 0,
      life: 0,
      maxLife: 0,
      type: 'ink',
      color: '#000000',
      rotation: 0,
      rotationSpeed: 0,
    };
  }

  acquire(): Particle | null {
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].life <= 0) {
        return this.pool[i];
      }
    }

    if (this.pool.length < this.maxSize) {
      const particle = this.createEmptyParticle();
      this.pool.push(particle);
      return particle;
    }

    return null;
  }

  getActiveParticles(): Particle[] {
    return this.pool.filter((p) => p.life > 0);
  }

  getAllParticles(): Particle[] {
    return this.pool;
  }
}

const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

const randomInkColor = (): string => {
  return INK_COLORS[Math.floor(Math.random() * INK_COLORS.length)];
};

export const useParticleSystem = ({
  canvasRef,
  maxParticles = 200,
}: UseParticleSystemOptions): UseParticleSystemReturn => {
  const animationFrameRef = useRef<number | null>(null);
  const particlePoolRef = useRef<ParticlePool | null>(null);
  const isRunningRef = useRef(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const flowParticlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    particlePoolRef.current = new ParticlePool(maxParticles);
    initFlowParticles();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [maxParticles]);

  const initFlowParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const flowCount = 30;
    const particles: Particle[] = [];

    for (let i = 0; i < flowCount; i++) {
      particles.push({
        x: randomRange(0, canvas.width),
        y: randomRange(0, canvas.height),
        vx: randomRange(-0.3, 0.3),
        vy: randomRange(-0.2, 0.2),
        size: randomRange(2, 8),
        opacity: randomRange(0.05, 0.15),
        life: Infinity,
        maxLife: Infinity,
        type: 'flow',
        color: randomInkColor(),
        rotation: randomRange(0, Math.PI * 2),
        rotationSpeed: randomRange(-0.005, 0.005),
      });
    }

    flowParticlesRef.current = particles;
  }, [canvasRef]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctxRef.current = ctx;
    }

    initFlowParticles();
  }, [canvasRef, initFlowParticles]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  const createInkSplashParticle = useCallback(
    (x: number, y: number): Particle | null => {
      if (!particlePoolRef.current) return null;

      const particle = particlePoolRef.current.acquire();
      if (!particle) return null;

      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(1, 8);
      const size = randomRange(3, 15);

      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.size = size;
      particle.opacity = randomRange(0.6, 0.9);
      particle.life = randomRange(60, 120);
      particle.maxLife = particle.life;
      particle.type = 'splash';
      particle.color = randomInkColor();
      particle.rotation = randomRange(0, Math.PI * 2);
      particle.rotationSpeed = randomRange(-0.1, 0.1);

      return particle;
    },
    []
  );

  const triggerInkSplash = useCallback(
    (x: number, y: number, count: number = 30): void => {
      for (let i = 0; i < count; i++) {
        createInkSplashParticle(x, y);
      }
    },
    [createInkSplashParticle]
  );

  const updateParticle = useCallback((particle: Particle, dt: number = 1): void => {
    if (particle.life <= 0) return;

    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    if (particle.type === 'splash') {
      particle.vy += 0.15 * dt;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      particle.life -= dt;
      particle.opacity = Math.max(0, (particle.life / particle.maxLife) * 0.9);
      particle.size *= 0.995;
    } else if (particle.type === 'flow') {
      particle.vx += randomRange(-0.02, 0.02);
      particle.vy += randomRange(-0.02, 0.02);
      particle.vx = Math.max(-0.5, Math.min(0.5, particle.vx));
      particle.vy = Math.max(-0.3, Math.min(0.3, particle.vy));
    }

    particle.rotation += particle.rotationSpeed * dt;
  }, []);

  const drawParticle = useCallback(
    (ctx: CanvasRenderingContext2D, particle: Particle): void => {
      if (particle.life <= 0 || particle.opacity <= 0) return;

      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;

      if (particle.type === 'splash') {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        if (Math.random() > 0.7) {
          ctx.globalAlpha = particle.opacity * 0.5;
          ctx.beginPath();
          ctx.arc(
            particle.x + randomRange(-10, 10),
            particle.y + randomRange(-10, 10),
            particle.size * randomRange(0.2, 0.5),
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      } else if (particle.type === 'flow') {
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, particle.size, particle.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    },
    []
  );

  const wrapFlowParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    flowParticlesRef.current.forEach((particle) => {
      if (particle.x < -20) particle.x = rect.width + 20;
      if (particle.x > rect.width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = rect.height + 20;
      if (particle.y > rect.height + 20) particle.y = -20;
    });
  }, [canvasRef]);

  const animate = useCallback((): void => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !particlePoolRef.current) return;

    const rect = canvas.getBoundingClientRect();

    ctx.clearRect(0, 0, rect.width, rect.height);

    flowParticlesRef.current.forEach((particle) => {
      updateParticle(particle);
      drawParticle(ctx, particle);
    });
    wrapFlowParticles();

    particlePoolRef.current.getActiveParticles().forEach((particle) => {
      updateParticle(particle);
      drawParticle(ctx, particle);
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [canvasRef, updateParticle, drawParticle, wrapFlowParticles]);

  useEffect(() => {
    if (canvasRef.current && !isRunningRef.current) {
      isRunningRef.current = true;
      animate();
    }
  }, [canvasRef, animate]);

  return {
    triggerInkSplash,
    isRunning: isRunningRef.current,
  };
};
