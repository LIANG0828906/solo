import { eventBus } from './EventBus';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  alpha: number;
  active: boolean;
}

interface EmitConfig {
  x: number;
  y: number;
  count: number;
  color: string;
  speed?: number;
  size?: number;
  life?: number;
  spread?: number;
  upward?: boolean;
}

type ParticleEffectType = 'smoke' | 'fountain' | 'decay' | 'material_add';

class ParticleSystem {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private pool: Particle[] = [];
  private poolSize: number = 300;
  private animationId: number = 0;
  private lastTime: number = 0;
  private centerX: number = 0;
  private centerY: number = 0;
  private smokeTimer: number = 0;
  private isRunning: boolean = false;

  constructor() {
    this.initPool();
  }

  private initPool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      this.pool.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        color: '#ffffff',
        size: 2,
        alpha: 1,
        active: false,
      });
    }
  }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    this.bindEvents();
  }

  private bindEvents(): void {
    eventBus.on('particle:emit', (config: EmitConfig) => {
      this.emitParticles(config);
    });

    eventBus.on('particle:effect', (type: ParticleEffectType, data?: any) => {
      this.playEffect(type, data);
    });

    eventBus.on('reset', () => {
      this.reset();
    });
  }

  private getParticle(): Particle | null {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }
    const newParticle: Particle = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      color: '#ffffff',
      size: 2,
      alpha: 1,
      active: false,
    };
    this.pool.push(newParticle);
    return newParticle;
  }

  emitParticles(config: EmitConfig): void {
    const {
      x,
      y,
      count,
      color,
      speed = 2,
      size = 3,
      life = 60,
      spread = Math.PI * 2,
      upward = false,
    } = config;

    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) break;

      let angle: number;
      if (upward) {
        angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
      } else {
        angle = Math.random() * spread;
      }

      const velocity = speed * (0.5 + Math.random() * 0.5);

      particle.x = x + (Math.random() - 0.5) * 20;
      particle.y = y + (Math.random() - 0.5) * 10;
      particle.vx = Math.cos(angle) * velocity;
      particle.vy = Math.sin(angle) * velocity;
      particle.life = life * (0.7 + Math.random() * 0.3);
      particle.maxLife = particle.life;
      particle.color = color;
      particle.size = size * (0.7 + Math.random() * 0.3);
      particle.alpha = 1;
      particle.active = true;

      this.particles.push(particle);
    }
  }

  private playEffect(type: ParticleEffectType, data?: any): void {
    switch (type) {
      case 'smoke':
        this.playSmokeEffect();
        break;
      case 'fountain':
        this.playFountainEffect(data?.color || '#9B59B6', data?.duration || 2000);
        break;
      case 'decay':
        this.playDecayEffect(data?.duration || 1000);
        break;
      case 'material_add':
        this.playMaterialAddEffect(data?.color || '#ffffff');
        break;
    }
  }

  private playSmokeEffect(): void {
    this.emitParticles({
      x: this.centerX,
      y: this.centerY - 20,
      count: 3,
      color: 'rgba(180, 150, 220, 0.4)',
      speed: 0.8,
      size: 15,
      life: 120,
      spread: Math.PI * 0.5,
      upward: true,
    });
  }

  private playFountainEffect(color: string, duration: number): void {
    const startTime = Date.now();
    const emitInterval = 30;
    let particleCount = 50;

    const emit = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) return;

      const progress = elapsed / duration;
      particleCount = Math.floor(50 + progress * 150);

      const colors = [
        color,
        this.lightenColor(color, 30),
        this.darkenColor(color, 20),
      ];

      for (let i = 0; i < 5; i++) {
        this.emitParticles({
          x: this.centerX,
          y: this.centerY,
          count: Math.floor(particleCount / 10),
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: 3 + Math.random() * 4,
          size: 3 + Math.random() * 4,
          life: 80 + Math.random() * 40,
          spread: Math.PI * 0.8,
          upward: true,
        });
      }

      setTimeout(emit, emitInterval);
    };

    emit();
  }

  private playDecayEffect(duration: number): void {
    const startTime = Date.now();
    const targetCount = 20;

    this.particles.forEach((p) => {
      p.color = '#666666';
    });

    const reduce = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) return;

      const activeParticles = this.particles.filter((p) => p.active);
      if (activeParticles.length > targetCount) {
        const toRemove = activeParticles.slice(0, 3);
        toRemove.forEach((p) => {
          p.life = Math.min(p.life, 20);
        });
      }

      requestAnimationFrame(reduce);
    };

    reduce();
  }

  private playMaterialAddEffect(color: string): void {
    this.emitParticles({
      x: this.centerX,
      y: this.centerY,
      count: 15,
      color: color,
      speed: 2,
      size: 4,
      life: 50,
      spread: Math.PI * 2,
      upward: false,
    });
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `rgb(${R}, ${G}, ${B})`;
  }

  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return `rgb(${R}, ${G}, ${B})`;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private loop = (): void => {
    if (!this.isRunning || !this.ctx || !this.canvas) return;

    const now = performance.now();
    const delta = (now - this.lastTime) / 16.67;
    this.lastTime = now;

    this.update(delta);
    this.render();

    this.smokeTimer += delta;
    if (this.smokeTimer > 20) {
      this.smokeTimer = 0;
      this.playSmokeEffect();
    }

    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p.active) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.vy += 0.02 * delta;
      p.vx *= 0.99;
      p.life -= delta;

      if (p.life <= 0) {
        p.active = false;
        this.particles.splice(i, 1);
      } else {
        p.alpha = p.life / p.maxLife;
        p.size *= 0.995;
      }
    }
  }

  private render(): void {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      if (!p.active) continue;

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha * 0.8;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  reset(): void {
    this.particles.forEach((p) => {
      p.active = false;
    });
    this.particles = [];
    this.smokeTimer = 0;
  }

  getParticleCount(): number {
    return this.particles.filter((p) => p.active).length;
  }
}

export const particleSystem = new ParticleSystem();
export default ParticleSystem;
