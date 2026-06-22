export interface Vector2 {
  x: number;
  y: number;
}

export interface Vortex {
  x: number;
  y: number;
  radius: number;
  maxAngularSpeed: number;
  minAngularSpeed: number;
  createdAt: number;
  duration: number;
  fadeOutDuration: number;
  isReleasing: boolean;
  releaseStartTime: number;
  strength: number;
}

export interface FlowTrail {
  points: { x: number; y: number; vx: number; vy: number; width: number; createdAt: number }[];
  duration: number;
}

export interface Ripple {
  x: number;
  y: number;
  startRadius: number;
  endRadius: number;
  createdAt: number;
  duration: number;
}

export interface VortexParticle {
  x: number;
  y: number;
  angle: number;
  radius: number;
  speed: number;
  life: number;
}

export class FlowField {
  private width: number;
  private height: number;
  private noiseOffset: Vector2;
  private time: number;
  public vortexes: Vortex[] = [];
  public flowTrail: FlowTrail = { points: [], duration: 3000 };
  public ripples: Ripple[] = [];
  public vortexParticles: VortexParticle[] = [];
  private flowSpeedMultiplier: number = 1.0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.noiseOffset = { x: Math.random() * 1000, y: Math.random() * 1000 };
    this.time = 0;
  }

  setFlowSpeedMultiplier(multiplier: number): void {
    this.flowSpeedMultiplier = multiplier;
  }

  getFlowSpeedMultiplier(): number {
    return this.flowSpeedMultiplier;
  }

  update(): void {
    this.time += 0.005;
    this.cleanupVortexes();
    this.cleanupFlowTrail();
    this.cleanupRipples();
    this.updateVortexParticles();
  }

  private cleanupVortexes(): void {
    const now = Date.now();
    this.vortexes = this.vortexes.filter(vortex => {
      if (vortex.isReleasing) {
        const elapsed = now - vortex.releaseStartTime;
        if (elapsed >= vortex.fadeOutDuration) {
          return false;
        }
        vortex.strength = 1 - (elapsed / vortex.fadeOutDuration);
      } else {
        const elapsed = now - vortex.createdAt;
        if (elapsed >= vortex.duration) {
          return false;
        }
      }
      return true;
    });
  }

  private cleanupFlowTrail(): void {
    const now = Date.now();
    this.flowTrail.points = this.flowTrail.points.filter(
      point => now - point.createdAt < this.flowTrail.duration
    );
  }

  private cleanupRipples(): void {
    const now = Date.now();
    this.ripples = this.ripples.filter(
      ripple => now - ripple.createdAt < ripple.duration
    );
  }

  private updateVortexParticles(): void {
    for (let i = this.vortexParticles.length - 1; i >= 0; i--) {
      const p = this.vortexParticles[i];
      p.angle += p.speed;
      p.radius += 0.5;
      p.life -= 0.02;
      p.x = p.x + Math.cos(p.angle) * 1;
      p.y = p.y + Math.sin(p.angle) * 1;
      if (p.life <= 0) {
        this.vortexParticles.splice(i, 1);
      }
    }
  }

  getVelocityAt(x: number, y: number): Vector2 {
    let vx = 0;
    let vy = 0;

    const noiseAngle = this.noise(x, y) * Math.PI * 2;
    const noiseSpeed = 0.5;
    vx += Math.cos(noiseAngle) * noiseSpeed;
    vy += Math.sin(noiseAngle) * noiseSpeed;

    for (const vortex of this.vortexes) {
      const dx = x - vortex.x;
      const dy = y - vortex.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < vortex.radius) {
        const angle = Math.atan2(dy, dx);
        const t = dist / vortex.radius;
        const angularSpeed = vortex.maxAngularSpeed - (vortex.maxAngularSpeed - vortex.minAngularSpeed) * t;
        const actualSpeed = angularSpeed * vortex.strength;

        vx += -Math.sin(angle) * actualSpeed * dist * 0.1;
        vy += Math.cos(angle) * actualSpeed * dist * 0.1;

        const pullStrength = (1 - t) * 0.1 * vortex.strength;
        vx -= dx * pullStrength * 0.01;
        vy -= dy * pullStrength * 0.01;
      }
    }

    for (const point of this.flowTrail.points) {
      const dx = x - point.x;
      const dy = y - point.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const now = Date.now();
      const age = now - point.createdAt;
      const alpha = 1 - age / this.flowTrail.duration;

      if (dist < point.width) {
        const influence = (1 - dist / point.width) * alpha;
        vx += point.vx * influence;
        vy += point.vy * influence;
      }
    }

    return {
      x: vx * this.flowSpeedMultiplier,
      y: vy * this.flowSpeedMultiplier
    };
  }

  private noise(x: number, y: number): number {
    const nx = (x / this.width) * 2 * Math.PI + this.noiseOffset.x + this.time;
    const ny = (y / this.height) * 2 * Math.PI + this.noiseOffset.y + this.time * 0.7;
    return (this.sinNoise(nx, ny) + 1) / 2;
  }

  private sinNoise(x: number, y: number): number {
    return (
      Math.sin(x * 1.3) * Math.cos(y * 1.5) +
      Math.sin(x * 2.7 + y * 1.9) * 0.5 +
      Math.cos(x * 0.9 - y * 2.3) * 0.3
    );
  }

  createVortex(x: number, y: number): void {
    const now = Date.now();
    const existingVortex = this.vortexes.find(
      v => Math.abs(v.x - x) < 50 && Math.abs(v.y - y) < 50
    );

    if (existingVortex) {
      existingVortex.createdAt = now;
      existingVortex.isReleasing = false;
      existingVortex.strength = 1;
    } else {
      this.vortexes.push({
        x,
        y,
        radius: 150,
        maxAngularSpeed: 0.5,
        minAngularSpeed: 0.1,
        createdAt: now,
        duration: 2000,
        fadeOutDuration: 500,
        isReleasing: false,
        releaseStartTime: 0,
        strength: 1
      });
    }

    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 50;
      this.vortexParticles.push({
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        angle: angle,
        radius: radius,
        speed: 0.05 + Math.random() * 0.05,
        life: 1
      });
    }
  }

  releaseVortexes(): void {
    const now = Date.now();
    for (const vortex of this.vortexes) {
      if (!vortex.isReleasing) {
        vortex.isReleasing = true;
        vortex.releaseStartTime = now;
      }
    }
  }

  addFlowPoint(x: number, y: number, vx: number, vy: number, speed: number): void {
    const width = Math.min(50, Math.max(10, speed * 2));
    const now = Date.now();
    this.flowTrail.points.push({
      x,
      y,
      vx: vx * 0.8,
      vy: vy * 0.8,
      width,
      createdAt: now
    });
  }

  createRipple(x: number, y: number): void {
    this.ripples.push({
      x,
      y,
      startRadius: 5,
      endRadius: 40,
      createdAt: Date.now(),
      duration: 600
    });
  }

  drawDebug(ctx: CanvasRenderingContext2D): void {
    const now = Date.now();

    for (const vortex of this.vortexes) {
      const alpha = vortex.isReleasing
        ? 1 - (now - vortex.releaseStartTime) / vortex.fadeOutDuration
        : 1;

      ctx.save();
      ctx.strokeStyle = `rgba(100, 255, 218, ${0.2 * alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(vortex.x, vortex.y, vortex.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const p of this.vortexParticles) {
      ctx.save();
      ctx.fillStyle = `rgba(0, 255, 255, ${p.life * 0.3})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const point of this.flowTrail.points) {
      const age = now - point.createdAt;
      const alpha = 1 - age / this.flowTrail.duration;
      ctx.save();
      ctx.fillStyle = `rgba(100, 255, 218, ${alpha * 0.1})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const ripple of this.ripples) {
      const age = now - ripple.createdAt;
      const progress = age / ripple.duration;
      const radius = ripple.startRadius + (ripple.endRadius - ripple.startRadius) * progress;
      const alpha = 1 - progress;

      ctx.save();
      ctx.strokeStyle = `rgba(100, 255, 218, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
