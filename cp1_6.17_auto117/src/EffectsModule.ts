interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
}

interface GlowRing {
  startTime: number;
  duration: number;
}

export class EffectsModule {
  private particles: Particle[] = [];
  private glowRing: GlowRing | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private canvasWidth = 0;
  private canvasHeight = 0;

  bind(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.ctx = ctx;
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  triggerActivation(): void {
    this.particles = [];
    const count = 200 + Math.floor(Math.random() * 200);
    const cx = this.canvasWidth / 2;
    const cy = this.canvasHeight / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 300;
      const hue = 35 + Math.random() * 25;
      const lightness = 50 + Math.random() * 30;

      this.particles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100 - Math.random() * 100,
        ax: 0,
        ay: 400 + Math.random() * 200,
        life: 2.0 + Math.random() * 1.0,
        maxLife: 3.0,
        size: 2 + Math.random() * 5,
        color: `hsl(${hue}, 100%, ${lightness}%)`,
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    this.glowRing = {
      startTime: performance.now(),
      duration: 1500,
    };
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0 || p.life > 5) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vx += p.ax * dt;
      p.vy += p.ay * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.min(1, p.life / (p.maxLife * 0.3));
      p.rotation += p.rotationSpeed * dt;
      p.size *= 0.998;
    }

    if (this.glowRing) {
      const elapsed = performance.now() - this.glowRing.startTime;
      if (elapsed > this.glowRing.duration) {
        this.glowRing = null;
      }
    }
  }

  render(): void {
    if (!this.ctx) return;

    this.renderGlowRing();
    this.renderParticles();
  }

  private renderParticles(): void {
    if (!this.ctx) return;

    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 6;

      const hw = p.size;
      const hh = p.size * 0.6;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -hh);
      this.ctx.lineTo(hw, 0);
      this.ctx.lineTo(0, hh);
      this.ctx.lineTo(-hw, 0);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  private renderGlowRing(): void {
    if (!this.ctx || !this.glowRing) return;

    const elapsed = performance.now() - this.glowRing.startTime;
    const progress = elapsed / this.glowRing.duration;
    if (progress >= 1) return;

    const alpha = 1 - progress;
    const radius = Math.min(this.canvasWidth, this.canvasHeight) * 0.45;

    this.ctx.save();
    this.ctx.globalAlpha = alpha * 0.6;

    const gradient = this.ctx.createRadialGradient(
      this.canvasWidth / 2, this.canvasHeight / 2, radius * 0.8,
      this.canvasWidth / 2, this.canvasHeight / 2, radius + 20
    );
    gradient.addColorStop(0, "rgba(255, 215, 0, 0)");
    gradient.addColorStop(0.5, `rgba(255, 215, 0, ${0.5 * alpha})`);
    gradient.addColorStop(1, "rgba(255, 215, 0, 0)");

    this.ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(
      this.canvasWidth / 2, this.canvasHeight / 2, radius, 0, Math.PI * 2
    );
    this.ctx.stroke();

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.ctx.restore();
  }

  get isActive(): boolean {
    return this.particles.length > 0 || this.glowRing !== null;
  }

  clear(): void {
    this.particles = [];
    this.glowRing = null;
  }
}
