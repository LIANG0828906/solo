export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  startTime: number;
}

export interface GlowEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

export class EffectManager {
  private particles: Particle[] = [];
  private shakes: ScreenShake[] = [];
  private glows: GlowEffect[] = [];
  private flashAlpha = 0;
  private flashColor = '#00e5ff';
  private screenTint: { color: string; alpha: number; duration: number; startTime: number } | null = null;

  addParticles(x: number, y: number, count: number, color: string, speed = 200): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * speed + speed * 0.3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.2,
        color,
        size: 2 + Math.random() * 4
      });
    }
  }

  addShake(intensity: number, duration: number, currentTime: number): void {
    this.shakes.push({ intensity, duration, startTime: currentTime });
  }

  addGlow(x: number, y: number, maxRadius: number, color: string, life = 0.5): void {
    this.glows.push({
      x,
      y,
      radius: 5,
      maxRadius,
      life,
      maxLife: life,
      color
    });
  }

  triggerFlash(color: string, alpha = 0.6): void {
    this.flashColor = color;
    this.flashAlpha = alpha;
  }

  triggerTint(color: string, alpha: number, duration: number, currentTime: number): void {
    this.screenTint = { color, alpha, duration, startTime: currentTime };
  }

  getShakeOffset(currentTime: number): { x: number; y: number } {
    let totalIntensity = 0;
    for (let i = this.shakes.length - 1; i >= 0; i--) {
      const shake = this.shakes[i];
      const elapsed = currentTime - shake.startTime;
      if (elapsed >= shake.duration) {
        this.shakes.splice(i, 1);
        continue;
      }
      const progress = elapsed / shake.duration;
      totalIntensity += shake.intensity * (1 - progress);
    }
    return {
      x: (Math.random() - 0.5) * totalIntensity * 2,
      y: (Math.random() - 0.5) * totalIntensity * 2
    };
  }

  update(dt: number, currentTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
    }

    for (let i = this.glows.length - 1; i >= 0; i--) {
      const g = this.glows[i];
      g.life -= dt;
      if (g.life <= 0) {
        this.glows.splice(i, 1);
        continue;
      }
      const t = 1 - g.life / g.maxLife;
      g.radius = 5 + (g.maxRadius - 5) * t;
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2);
    }

    if (this.screenTint) {
      const elapsed = currentTime - this.screenTint.startTime;
      if (elapsed >= this.screenTint.duration) {
        this.screenTint = null;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    for (const g of this.glows) {
      const alpha = g.life / g.maxLife;
      const gradient = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.radius);
      gradient.addColorStop(0, g.color + Math.floor(alpha * 200).toString(16).padStart(2, '0'));
      gradient.addColorStop(0.5, g.color + Math.floor(alpha * 80).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, g.color + '00');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.screenTint) {
      const t = this.screenTint;
      ctx.fillStyle = t.color;
      ctx.globalAlpha = t.alpha;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    }

    if (this.flashAlpha > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    }
  }
}
