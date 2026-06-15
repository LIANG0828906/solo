export const COLLECTIBLE_CONFIG = {
  RADIUS: 10,
  SPAWN_MIN: 2000,
  SPAWN_MAX: 3000,
  BREATH_CYCLE: 2000,
  SCORE_PER_COLLECT: 10,
  PARTICLE_COUNT: 5,
  PARTICLE_DURATION: 500,
} as const;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
}

export class Collectible {
  x: number;
  y: number;
  radius: number;
  scale: number;
  collected: boolean;
  private breathTimer: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.radius = COLLECTIBLE_CONFIG.RADIUS;
    this.scale = 1;
    this.collected = false;
    this.breathTimer = Math.random() * COLLECTIBLE_CONFIG.BREATH_CYCLE;
  }

  update(dt: number): void {
    this.breathTimer += dt * 1000;
    const breathPhase = (this.breathTimer % COLLECTIBLE_CONFIG.BREATH_CYCLE) / COLLECTIBLE_CONFIG.BREATH_CYCLE;
    this.scale = 0.85 + Math.sin(breathPhase * Math.PI * 2) * 0.15;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
    gradient.addColorStop(0, '#fff8dc');
    gradient.addColorStop(0.3, '#ffd700');
    gradient.addColorStop(0.7, '#ffb347');
    gradient.addColorStop(1, '#ff8c00');

    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#fffacd';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  getRadius(): number {
    return this.radius * this.scale;
  }
}

class ParticleSystem {
  private particles: Particle[];

  constructor() {
    this.particles = [];
  }

  emit(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 80 + Math.random() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: COLLECTIBLE_CONFIG.PARTICLE_DURATION,
        maxLife: COLLECTIBLE_CONFIG.PARTICLE_DURATION,
        radius: 3 + Math.random() * 3,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt * 1000;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;

      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.5, '#ffd700');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  reset(): void {
    this.particles = [];
  }
}

export class CollectibleManager {
  collectibles: Collectible[];
  private particles: ParticleSystem;
  private spawnTimer: number;
  private nextSpawnTime: number;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.collectibles = [];
    this.particles = new ParticleSystem();
    this.spawnTimer = 0;
    this.nextSpawnTime = 0;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.setNextSpawnTime();
  }

  private setNextSpawnTime(): void {
    this.nextSpawnTime = COLLECTIBLE_CONFIG.SPAWN_MIN +
      Math.random() * (COLLECTIBLE_CONFIG.SPAWN_MAX - COLLECTIBLE_CONFIG.SPAWN_MIN);
  }

  spawn(): void {
    const margin = 50;
    const x = margin + Math.random() * (this.canvasWidth - margin * 2);
    const y = margin + Math.random() * (this.canvasHeight - margin * 2);
    this.collectibles.push(new Collectible(x, y));
  }

  update(dt: number): void {
    this.spawnTimer += dt * 1000;
    if (this.spawnTimer >= this.nextSpawnTime) {
      this.spawn();
      this.spawnTimer = 0;
      this.setNextSpawnTime();
    }

    for (const collectible of this.collectibles) {
      collectible.update(dt);
    }

    this.collectibles = this.collectibles.filter(c => !c.collected);

    this.particles.update(dt);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const collectible of this.collectibles) {
      collectible.draw(ctx);
    }
    this.particles.draw(ctx);
  }

  collect(collectible: Collectible): number {
    collectible.collected = true;
    this.particles.emit(collectible.x, collectible.y, COLLECTIBLE_CONFIG.PARTICLE_COUNT);
    return COLLECTIBLE_CONFIG.SCORE_PER_COLLECT;
  }

  reset(): void {
    this.collectibles = [];
    this.particles.reset();
    this.spawnTimer = 0;
    this.setNextSpawnTime();
  }
}
