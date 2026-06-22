interface ParticleData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  active: boolean;
}

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  active: boolean;

  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.color = '#ffffff';
    this.life = 0;
    this.maxLife = 0;
    this.size = 2;
    this.active = false;
  }

  reset(data: Partial<ParticleData>): void {
    Object.assign(this, data);
    this.active = true;
  }

  update(deltaTime: number): void {
    if (!this.active) return;

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;
    this.vy += 0.05 * deltaTime;

    if (this.life <= 0) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pool: Particle[];
  private maxParticles: number = 200;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private running: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.pool = [];
    this.initPool();
  }

  private initPool(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool.push(new Particle());
    }
  }

  private getInactiveParticle(): Particle | null {
    return this.pool.find((p) => !p.active) || null;
  }

  emit(x: number, y: number, count: number, color: string = '#ffffff'): void {
    for (let i = 0; i < count; i++) {
      const particle = this.getInactiveParticle();
      if (!particle) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      const life = Math.random() * 2 + 1;

      particle.reset({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life,
        maxLife: life,
        size: Math.random() * 3 + 1,
        active: true,
      });
    }
  }

  emitBurst(
    x: number,
    y: number,
    count: number,
    colors: string[] = ['#ffffff']
  ): void {
    for (let i = 0; i < count; i++) {
      const particle = this.getInactiveParticle();
      if (!particle) break;

      const angle = (i / count) * Math.PI * 2;
      const speed = Math.random() * 3 + 2;
      const life = Math.random() * 1.5 + 1;
      const color = colors[Math.floor(Math.random() * colors.length)];

      particle.reset({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life,
        maxLife: life,
        size: Math.random() * 4 + 2,
        active: true,
      });
    }
  }

  private update(deltaTime: number): void {
    for (const particle of this.pool) {
      particle.update(deltaTime);
    }
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const particle of this.pool) {
      particle.draw(this.ctx);
    }
  }

  private animate(currentTime: number): void {
    if (!this.running) return;

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(Math.min(deltaTime, 0.1));
    this.draw();

    this.animationId = requestAnimationFrame((t) => this.animate(t));
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame((t) => this.animate(t));
  }

  stop(): void {
    this.running = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  clear(): void {
    for (const particle of this.pool) {
      particle.active = false;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  getActiveCount(): number {
    return this.pool.filter((p) => p.active).length;
  }

  destroy(): void {
    this.stop();
    this.clear();
  }
}
