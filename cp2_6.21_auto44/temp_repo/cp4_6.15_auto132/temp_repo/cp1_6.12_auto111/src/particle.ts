export class Particle {
  x: number = 0;
  y: number = 0;
  vx: number = 0;
  vy: number = 0;
  color: string = '#ffffff';
  life: number = 0;
  maxLife: number = 0.4;
  size: number = 3;
  active: boolean = false;

  reset(x: number, y: number, vx: number, vy: number, color: string, maxLife: number = 0.4): void {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.maxLife = maxLife;
    this.life = maxLife;
    this.active = true;
  }

  update(deltaTime: number): void {
    if (!this.active) return;
    this.x += this.vx;
    this.y += this.vy;
    this.life -= deltaTime;
    if (this.life <= 0) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

export class ParticlePool {
  private pool: Particle[] = [];
  private maxParticles: number = 200;

  constructor(initialSize: number = 50) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new Particle());
    }
  }

  emit(
    x: number,
    y: number,
    count: number,
    color: string,
    normalAngle: number,
    spreadAngle: number = Math.PI / 3,
    speedMin: number = 2,
    speedMax: number = 5,
    life: number = 0.4
  ): void {
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) break;

      const angle = normalAngle + (Math.random() - 0.5) * spreadAngle;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      particle.reset(x, y, vx, vy, color, life);
    }
  }

  private getParticle(): Particle | null {
    for (const p of this.pool) {
      if (!p.active) return p;
    }

    if (this.pool.length < this.maxParticles) {
      const p = new Particle();
      this.pool.push(p);
      return p;
    }

    let oldestIndex = 0;
    let oldestLife = Infinity;
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].life < oldestLife) {
        oldestLife = this.pool[i].life;
        oldestIndex = i;
      }
    }
    return this.pool[oldestIndex];
  }

  update(deltaTime: number): void {
    for (const p of this.pool) {
      p.update(deltaTime);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.pool) {
      p.render(ctx);
    }
  }

  getActiveCount(): number {
    let count = 0;
    for (const p of this.pool) {
      if (p.active) count++;
    }
    return count;
  }
}
