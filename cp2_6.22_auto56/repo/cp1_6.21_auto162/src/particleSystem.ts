export interface ParticleData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  dead: boolean;

  constructor(data: ParticleData) {
    this.x = data.x;
    this.y = data.y;
    this.vx = data.vx;
    this.vy = data.vy;
    this.life = data.life;
    this.maxLife = data.maxLife;
    this.size = data.size;
    this.color = data.color;
    this.dead = false;
  }

  update(deltaTime: number): void {
    if (this.dead) return;

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;

    if (this.life <= 0) {
      this.dead = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.dead) return;

    const alpha = Math.max(0, this.life / this.maxLife);
    const currentSize = this.size * alpha;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles: number = 50;

  emitGoldBurst(centerX: number, centerY: number): void {
    const particleCount = 36;
    const availableSlots = this.maxParticles - this.particles.length;
    const count = Math.min(particleCount, availableSlots);

    if (count <= 0) return;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.2;
      const speed = 120 + Math.random() * 80;
      const life = 0.8;
      const size = 2 + Math.random() * 2;

      const particle = new Particle({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: life,
        maxLife: life,
        size: size,
        color: this.getGoldColor()
      });

      this.particles.push(particle);
    }
  }

  private getGoldColor(): string {
    const colors = ['#FFD700', '#FFA500', '#FFEC8B', '#F0E68C', '#FFC125'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update(deltaTime: number): void {
    for (const particle of this.particles) {
      particle.update(deltaTime);
    }
    this.particles = this.particles.filter(p => !p.dead);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      particle.draw(ctx);
    }
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  clear(): void {
    this.particles = [];
  }
}
