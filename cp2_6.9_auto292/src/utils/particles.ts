interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  active: boolean;
}

const MAX_PARTICLES = 80;

abstract class ParticleSystem<T extends Particle> {
  protected pool: T[];
  protected maxParticles: number;

  constructor(maxParticles: number = MAX_PARTICLES) {
    this.maxParticles = maxParticles;
    this.pool = [];
  }

  protected abstract createParticle(): T;

  protected getInactiveParticle(): T | null {
    const inactive = this.pool.find((p) => !p.active);
    if (inactive) return inactive;
    if (this.pool.length < this.maxParticles) {
      const particle = this.createParticle();
      this.pool.push(particle);
      return particle;
    }
    return null;
  }

  emit(x?: number, y?: number): void {
    const particle = this.getInactiveParticle();
    if (particle) {
      this.resetParticle(particle, x, y);
      particle.active = true;
    }
  }

  protected abstract resetParticle(particle: T, x?: number, y?: number): void;

  update(deltaTime: number = 16): void {
    for (const particle of this.pool) {
      if (!particle.active) continue;
      this.updateParticle(particle, deltaTime);
      particle.life -= deltaTime;
      if (particle.life <= 0) {
        particle.active = false;
      }
    }
  }

  protected abstract updateParticle(particle: T, deltaTime: number): void;

  render(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.pool) {
      if (!particle.active) continue;
      this.renderParticle(ctx, particle);
    }
  }

  protected abstract renderParticle(ctx: CanvasRenderingContext2D, particle: T): void;
}

interface SteamParticle extends Particle {
  wobble: number;
  wobbleSpeed: number;
}

export class SteamParticleSystem extends ParticleSystem<SteamParticle> {
  private baseX: number;
  private baseY: number;

  constructor(baseX: number = 0, baseY: number = 0, maxParticles: number = MAX_PARTICLES) {
    super(maxParticles);
    this.baseX = baseX;
    this.baseY = baseY;
  }

  setBasePosition(x: number, y: number): void {
    this.baseX = x;
    this.baseY = y;
  }

  protected createParticle(): SteamParticle {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 2000,
      size: 0,
      opacity: 0,
      active: false,
      wobble: 0,
      wobbleSpeed: 0,
    };
  }

  protected resetParticle(particle: SteamParticle, x?: number, y?: number): void {
    particle.x = x ?? this.baseX + (Math.random() - 0.5) * 40;
    particle.y = y ?? this.baseY;
    particle.vx = (Math.random() - 0.5) * 0.3;
    particle.vy = -0.5 - Math.random() * 0.5;
    particle.life = 1500 + Math.random() * 1000;
    particle.maxLife = particle.life;
    particle.size = 8 + Math.random() * 12;
    particle.opacity = 0.6;
    particle.wobble = Math.random() * Math.PI * 2;
    particle.wobbleSpeed = 0.02 + Math.random() * 0.02;
  }

  protected updateParticle(particle: SteamParticle, deltaTime: number): void {
    particle.wobble += particle.wobbleSpeed * deltaTime;
    particle.x += particle.vx * deltaTime + Math.sin(particle.wobble) * 0.3;
    particle.y += particle.vy * deltaTime;
    particle.opacity = 0.6 * (particle.life / particle.maxLife);
    particle.size += 0.01 * deltaTime;
  }

  protected renderParticle(ctx: CanvasRenderingContext2D, particle: SteamParticle): void {
    const gradient = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, particle.size
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.opacity * 0.8})`);
    gradient.addColorStop(0.5, `rgba(255, 255, 255, ${particle.opacity * 0.4})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

interface LiquidParticle extends Particle {
  baseY: number;
}

export class LiquidParticleSystem extends ParticleSystem<LiquidParticle> {
  private centerX: number;
  private centerY: number;
  private radius: number;
  private thickness: number;

  constructor(
    centerX: number = 0,
    centerY: number = 0,
    radius: number = 0,
    thickness: number = 0.5,
    maxParticles: number = MAX_PARTICLES
  ) {
    super(maxParticles);
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.thickness = thickness;
  }

  setLiquidParams(centerX: number, centerY: number, radius: number, thickness: number): void {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.thickness = thickness;
  }

  protected createParticle(): LiquidParticle {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 3000,
      size: 0,
      opacity: 0,
      active: false,
      baseY: 0,
    };
  }

  protected resetParticle(particle: LiquidParticle): void {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * this.radius * 0.8;
    particle.x = this.centerX + Math.cos(angle) * r;
    particle.baseY = this.centerY + Math.sin(angle) * r * 0.3;
    particle.y = particle.baseY;
    particle.vx = (Math.random() - 0.5) * 0.2;
    particle.vy = 0;
    particle.life = 2000 + Math.random() * 2000;
    particle.maxLife = particle.life;
    particle.size = 3 + Math.random() * 5;
    particle.opacity = 0.3 + Math.random() * 0.3;
  }

  protected updateParticle(particle: LiquidParticle, deltaTime: number): void {
    const speedFactor = 1 - this.thickness * 0.7;
    particle.x += particle.vx * deltaTime * speedFactor;
    particle.y = particle.baseY + Math.sin(Date.now() * 0.003 + particle.x * 0.05) * 5 * speedFactor;
    particle.opacity = (0.3 + Math.random() * 0.3) * (particle.life / particle.maxLife);
  }

  protected renderParticle(ctx: CanvasRenderingContext2D, particle: LiquidParticle): void {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
    ctx.fill();
  }
}

interface PetalParticle extends Particle {
  rotation: number;
  rotationSpeed: number;
  color: string;
}

export class PetalParticleSystem extends ParticleSystem<PetalParticle> {
  private centerX: number;
  private centerY: number;
  private radius: number;
  private colors: string[];

  constructor(
    centerX: number = 0,
    centerY: number = 0,
    radius: number = 0,
    colors: string[] = ['#FFB7C5', '#FFD700', '#FF69B4'],
    maxParticles: number = MAX_PARTICLES
  ) {
    super(maxParticles);
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.colors = colors;
  }

  setParams(centerX: number, centerY: number, radius: number, colors?: string[]): void {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    if (colors) this.colors = colors;
  }

  protected createParticle(): PetalParticle {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 5000,
      size: 0,
      opacity: 0,
      active: false,
      rotation: 0,
      rotationSpeed: 0,
      color: '#FFB7C5',
    };
  }

  protected resetParticle(particle: PetalParticle): void {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * this.radius * 0.7;
    particle.x = this.centerX + Math.cos(angle) * r;
    particle.y = this.centerY + Math.sin(angle) * r * 0.5;
    particle.vx = (Math.random() - 0.5) * 0.05;
    particle.vy = (Math.random() - 0.5) * 0.05;
    particle.life = 4000 + Math.random() * 3000;
    particle.maxLife = particle.life;
    particle.size = 6 + Math.random() * 8;
    particle.opacity = 0.8;
    particle.rotation = Math.random() * Math.PI * 2;
    particle.rotationSpeed = (Math.random() - 0.5) * 0.02;
    particle.color = this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  protected updateParticle(particle: PetalParticle, deltaTime: number): void {
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime + Math.sin(Date.now() * 0.002 + particle.x) * 0.2;
    particle.rotation += particle.rotationSpeed * deltaTime;
    particle.opacity = 0.8 * (particle.life / particle.maxLife);
  }

  protected renderParticle(ctx: CanvasRenderingContext2D, particle: PetalParticle): void {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);

    ctx.beginPath();
    ctx.ellipse(0, 0, particle.size, particle.size * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.opacity;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -particle.size * 0.3);
    ctx.lineTo(0, particle.size * 0.3);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}
