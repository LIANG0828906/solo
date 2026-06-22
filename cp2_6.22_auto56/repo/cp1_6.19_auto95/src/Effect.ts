export class Effect {
  particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    type: "fragment" | "glow";
    maxSize?: number;
  }[] = [];
  shakeTimer = 0;
  shakeIntensity = 0;
  flashTimer = 0;
  flashColor = "";

  addExplosionFragments(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 50;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: 2 + Math.random(),
        color: "#FFD700",
        type: "fragment",
      });
    }
  }

  addBigExplosion(x: number, y: number) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.5,
      maxLife: 0.5,
      size: 60,
      maxSize: 200,
      color: "#FFFFFF",
      type: "glow",
    });
  }

  triggerShake(intensity = 2, duration = 0.1) {
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
  }

  triggerFlash(color = "#FFFFFF", duration = 0.1) {
    this.flashTimer = duration;
    this.flashColor = color;
  }

  update(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    this.flashTimer = Math.max(0, this.flashTimer - dt);
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      if (p.type === "fragment") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "glow") {
        const radius =
          p.size + (p.maxSize! - p.size) * (1 - p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    if (this.flashTimer > 0) {
      ctx.globalAlpha = this.flashTimer;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
      );
      ctx.globalAlpha = 1;
    }
  }

  getShakeOffset(): { x: number; y: number } {
    if (this.shakeTimer > 0) {
      return {
        x: (Math.random() * 2 - 1) * this.shakeIntensity,
        y: (Math.random() * 2 - 1) * this.shakeIntensity,
      };
    }
    return { x: 0, y: 0 };
  }
}
