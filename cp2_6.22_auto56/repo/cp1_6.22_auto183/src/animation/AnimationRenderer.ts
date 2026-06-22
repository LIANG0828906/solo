import type { ElementType } from '../utils/helpers';
import { getElementColor } from '../utils/helpers';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  type: 'fire' | 'water' | 'wind' | 'earth';
  element: ElementType;
  angle?: number;
  radius?: number;
  amplitude?: number;
  phase?: number;
}

interface WaveEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
}

interface EngineEventData {
  elementActivated?: { element: ElementType; x: number; y: number };
  waveEffect?: void;
}

export class AnimationRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private waveEffects: WaveEffect[] = [];
  private animationId: number | null = null;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private readonly FPS = 30;
  private readonly FRAME_TIME = 1000 / this.FPS;
  private readonly MAX_PARTICLES = 200;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = now - this.lastTime;

    if (delta >= this.FRAME_TIME) {
      this.lastTime = now - (delta % this.FRAME_TIME);
      this.update(delta / 1000);
      this.render();
    }

    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number): void {
    this.particles = this.particles.filter(particle => {
      particle.life -= deltaTime;
      particle.opacity = Math.max(0, particle.life / particle.maxLife);

      switch (particle.type) {
        case 'fire':
          particle.x += particle.vx * deltaTime;
          particle.y += particle.vy * deltaTime;
          particle.vy -= 30 * deltaTime;
          break;

        case 'water':
          particle.phase = (particle.phase || 0) + deltaTime * Math.PI;
          particle.x += particle.vx * deltaTime;
          particle.y += Math.sin(particle.phase) * 30 * deltaTime;
          break;

        case 'wind':
          particle.angle = (particle.angle || 0) + deltaTime * 3;
          particle.radius = (particle.radius || 20) + deltaTime * 60;
          particle.x = particle.x + Math.cos(particle.angle) * deltaTime * 100;
          particle.y = particle.y + Math.sin(particle.angle) * deltaTime * 100;
          break;

        case 'earth':
          particle.phase = (particle.phase || 0) + deltaTime * 5;
          particle.y = particle.y + Math.sin(particle.phase) * (particle.amplitude || 30) * deltaTime;
          break;
      }

      return particle.life > 0;
    });

    this.waveEffects = this.waveEffects.filter(wave => {
      wave.radius += wave.speed * deltaTime;
      wave.opacity = 0.6 * (1 - wave.radius / wave.maxRadius);
      return wave.radius < wave.maxRadius;
    });
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(particle => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.opacity;
      this.ctx.fillStyle = getElementColor(particle.element);

      switch (particle.type) {
        case 'fire':
          this.ctx.beginPath();
          this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          this.ctx.fill();
          break;

        case 'water':
          this.ctx.beginPath();
          this.ctx.ellipse(particle.x, particle.y, particle.size, particle.size * 0.6, 0, 0, Math.PI * 2);
          this.ctx.fill();
          break;

        case 'wind':
          this.ctx.beginPath();
          this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          this.ctx.fill();
          break;

        case 'earth':
          this.ctx.fillRect(
            particle.x - particle.size / 2,
            particle.y - particle.size / 2,
            particle.size,
            particle.size * 1.5
          );
          break;
      }

      this.ctx.restore();
    });

    this.waveEffects.forEach(wave => {
      this.ctx.save();
      this.ctx.globalAlpha = wave.opacity;

      const gradient = this.ctx.createRadialGradient(
        wave.x, wave.y, wave.radius * 0.8,
        wave.x, wave.y, wave.radius
      );
      gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
      gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 20;
      this.ctx.beginPath();
      this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.restore();
    });
  }

  spawnElementParticles(element: ElementType, x: number, y: number): void {
    const particleConfigs = {
      fire: { count: 30, type: 'fire' as const, minSize: 6, maxSize: 12, life: 1.5 },
      water: { count: 40, type: 'water' as const, minSize: 4, maxSize: 8, life: 2 },
      wind: { count: 50, type: 'wind' as const, minSize: 2, maxSize: 4, life: 2 },
      earth: { count: 20, type: 'earth' as const, minSize: 5, maxSize: 10, life: 1.5 },
      steam: { count: 35, type: 'water' as const, minSize: 5, maxSize: 10, life: 2 },
      lava: { count: 25, type: 'fire' as const, minSize: 8, maxSize: 14, life: 1.8 }
    };

    const config = particleConfigs[element] || particleConfigs.fire;
    const spawnCount = Math.min(config.count, this.MAX_PARTICLES - this.particles.length);

    for (let i = 0; i < spawnCount; i++) {
      const particle: Particle = {
        x,
        y,
        vx: 0,
        vy: 0,
        size: config.minSize + Math.random() * (config.maxSize - config.minSize),
        opacity: 1,
        life: config.life,
        maxLife: config.life,
        type: config.type,
        element
      };

      switch (config.type) {
        case 'fire':
          const angle = Math.random() * Math.PI * 2;
          const speed = 50 + Math.random() * 100;
          particle.vx = Math.cos(angle) * speed;
          particle.vy = Math.sin(angle) * speed - 80;
          break;

        case 'water':
          particle.vx = (Math.random() - 0.5) * 60;
          particle.phase = Math.random() * Math.PI * 2;
          break;

        case 'wind':
          particle.angle = Math.random() * Math.PI * 2;
          particle.radius = 20 + Math.random() * 60;
          break;

        case 'earth':
          particle.amplitude = 20 + Math.random() * 20;
          particle.phase = Math.random() * Math.PI * 2;
          break;
      }

      this.particles.push(particle);
    }
  }

  spawnWaveEffect(x: number, y: number): void {
    this.waveEffects.push({
      x,
      y,
      radius: 0,
      maxRadius: Math.max(this.canvas.width, this.canvas.height),
      opacity: 0.6,
      speed: 500
    });
  }

  handleEngineEvent<T extends keyof EngineEventData>(event: T, data: EngineEventData[T]): void {
    if (event === 'elementActivated' && data) {
      const { element, x, y } = data as { element: ElementType; x: number; y: number };
      this.spawnElementParticles(element, x, y);
    } else if (event === 'waveEffect') {
      this.spawnWaveEffect(this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear(): void {
    this.particles = [];
    this.waveEffects = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  getParticleCount(): number {
    return this.particles.length;
  }
}
