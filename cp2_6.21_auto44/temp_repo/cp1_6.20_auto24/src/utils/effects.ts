export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type?: 'splash' | 'steam' | 'star' | 'explosion';
}

const MAX_PARTICLES = 200;

export class ParticleSystem {
  private particles: Particle[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private starParticles: Particle[] = [];
  private starAngle: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.initStarField();
  }

  private initStarField(): void {
    this.starParticles = [];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 100 + Math.random() * 300;
      this.starParticles.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        life: 1,
        maxLife: 1,
        color: `rgba(255, 255, 255, ${0.3 + Math.random() * 0.7})`,
        size: 0.5 + Math.random() * 1.5,
        type: 'star',
      });
    }
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public addSplashParticles(x: number, y: number, color: string): void {
    const count = 20;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        maxLife: 1,
        color,
        size: 3 + Math.random() * 4,
        type: 'splash',
      });
    }
  }

  public addSteamParticle(x: number, y: number, color: string = 'rgba(200, 200, 220, 0.4)'): void {
    if (this.particles.length >= MAX_PARTICLES) return;
    this.particles.push({
      x: x + (Math.random() - 0.5) * 30,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.5 - Math.random() * 1,
      life: 1,
      maxLife: 1,
      color,
      size: 8 + Math.random() * 12,
      type: 'steam',
    });
  }

  public addExplosionParticles(x: number, y: number, color: string): void {
    const count = 40;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 3 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
        size: 4 + Math.random() * 6,
        type: 'explosion',
      });
    }
  }

  private update(deltaTime: number): void {
    const dt = deltaTime / 16.67;

    this.starAngle += 0.0008 * dt;

    this.particles = this.particles.filter((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'splash' || p.type === 'explosion') {
        p.vy += 0.15 * dt;
      }

      p.life -= (0.02 + (p.type === 'steam' ? 0.008 : 0.02)) * dt;

      if (p.type === 'steam') {
        p.size += 0.1 * dt;
      }

      return p.life > 0;
    });
  }

  private render(): void {
    const { ctx, canvas } = this;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.starAngle);

    for (const star of this.starParticles) {
      const brightness = 0.5 + 0.5 * Math.sin(Date.now() * 0.002 + star.x * 0.01);
      ctx.globalAlpha = brightness * 0.8;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;

      if (p.type === 'steam') {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'rgba(200, 200, 220, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    ctx.globalAlpha = 1;
  }

  public start(): void {
    if (this.animationId !== null) return;

    const animate = (time: number) => {
      const deltaTime = this.lastTime ? time - this.lastTime : 16.67;
      this.lastTime = time;

      this.update(deltaTime);
      this.render();

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public getParticleCount(): number {
    return this.particles.length + this.starParticles.length;
  }
}
