export interface Vec2 {
  x: number;
  y: number;
}

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export class Ball {
  public id: number;
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public radius: number;
  public color: string;
  public initialX: number;
  public initialY: number;
  public initialVx: number;
  public initialVy: number;
  public glowIntensity: number = 0;
  public glowTimer: number = 0;
  public ripples: Ripple[] = [];
  public isResetting: boolean = false;
  public resetProgress: number = 0;
  public resetFromX: number = 0;
  public resetFromY: number = 0;

  private static nextId = 0;

  constructor(x: number, y: number, radius: number, color: string, vx: number = 0, vy: number = 0) {
    this.id = Ball.nextId++;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.color = color;
    this.initialX = x;
    this.initialY = y;
    this.initialVx = vx;
    this.initialVy = vy;
  }

  public saveInitial(): void {
    this.initialX = this.x;
    this.initialY = this.y;
    this.initialVx = this.vx;
    this.initialVy = this.vy;
  }

  public startResetAnimation(): void {
    this.isResetting = true;
    this.resetProgress = 0;
    this.resetFromX = this.x;
    this.resetFromY = this.y;
    this.vx = 0;
    this.vy = 0;
  }

  private cubicBezier(t: number): number {
    const p1 = 0.68;
    const p2 = -0.55;
    const p3 = 0.27;
    const p4 = 1.55;
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    return 3 * mt2 * t * p2 + 3 * mt * t2 * p3 + t3 * p4 + mt3 * p1;
  }

  public updateReset(dt: number): void {
    if (!this.isResetting) return;
    this.resetProgress += dt / 0.5;
    if (this.resetProgress >= 1) {
      this.resetProgress = 1;
      this.isResetting = false;
      this.x = this.initialX;
      this.y = this.initialY;
      this.vx = this.initialVx;
      this.vy = this.initialVy;
      this.glowIntensity = 0;
      this.glowTimer = 0;
      this.ripples = [];
      return;
    }
    const eased = this.cubicBezier(this.resetProgress);
    this.x = this.resetFromX + (this.initialX - this.resetFromX) * eased;
    this.y = this.resetFromY + (this.initialY - this.resetFromY) * eased;
  }

  public triggerCollisionEffect(): void {
    this.glowIntensity = 1;
    this.glowTimer = 0.2;
    this.ripples.push({
      x: this.x,
      y: this.y,
      radius: this.radius,
      maxRadius: this.radius + 50,
      alpha: 0.4,
      color: this.color,
    });
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 255, g: 255, b: 255 };
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }

  private lightenColor(hex: string, amount: number): string {
    const { r, g, b } = this.hexToRgb(hex);
    const nr = Math.min(255, Math.round(r + (255 - r) * amount));
    const ng = Math.min(255, Math.round(g + (255 - g) * amount));
    const nb = Math.min(255, Math.round(b + (255 - b) * amount));
    return `rgb(${nr}, ${ng}, ${nb})`;
  }

  public update(dt: number, gravity: number, drag: number, canvasWidth: number, canvasHeight: number, balls: Ball[]): void {
    if (this.isResetting) {
      this.updateReset(dt);
      this.updateEffects(dt);
      return;
    }

    this.vy += gravity * 50 * dt;

    this.vx *= 1 - drag;
    this.vy *= 1 - drag;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = -this.vx;
      this.triggerCollisionEffect();
    } else if (this.x + this.radius > canvasWidth) {
      this.x = canvasWidth - this.radius;
      this.vx = -this.vx;
      this.triggerCollisionEffect();
    }

    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy = -this.vy;
      this.triggerCollisionEffect();
    } else if (this.y + this.radius > canvasHeight) {
      this.y = canvasHeight - this.radius;
      this.vy = -this.vy;
      this.triggerCollisionEffect();
    }

    for (const other of balls) {
      if (other.id === this.id) continue;
      this.checkAndResolveCollision(other);
    }

    this.updateEffects(dt);
  }

  private updateEffects(dt: number): void {
    if (this.glowTimer > 0) {
      this.glowTimer -= dt;
      this.glowIntensity = Math.max(0, this.glowTimer / 0.2);
    }

    this.ripples = this.ripples.filter((ripple) => {
      ripple.radius += (ripple.maxRadius - ripple.radius) * dt * 5;
      ripple.alpha = 0.4 * (1 - (ripple.radius - this.radius) / 50);
      return ripple.radius < ripple.maxRadius && ripple.alpha > 0;
    });
  }

  public checkAndResolveCollision(other: Ball): void {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = this.radius + other.radius;

    if (dist < minDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;

      const overlap = minDist - dist;
      const totalMass = this.radius * this.radius + other.radius * other.radius;
      const thisMass = this.radius * this.radius;
      const otherMass = other.radius * other.radius;

      this.x -= nx * overlap * (otherMass / totalMass);
      this.y -= ny * overlap * (otherMass / totalMass);
      other.x += nx * overlap * (thisMass / totalMass);
      other.y += ny * overlap * (thisMass / totalMass);

      const dvx = this.vx - other.vx;
      const dvy = this.vy - other.vy;
      const dvDotN = dvx * nx + dvy * ny;

      if (dvDotN > 0) {
        const m1 = thisMass;
        const m2 = otherMass;
        const impulse = (2 * dvDotN) / (m1 + m2);

        this.vx -= impulse * m2 * nx;
        this.vy -= impulse * m2 * ny;
        other.vx += impulse * m1 * nx;
        other.vy += impulse * m1 * ny;

        this.triggerCollisionEffect();
        other.triggerCollisionEffect();
      }
    }
  }

  public clone(): Ball {
    const clone = new Ball(this.x, this.y, this.radius, this.color, this.vx, this.vy);
    return clone;
  }

  public draw(ctx: CanvasRenderingContext2D, isSelected: boolean = false): void {
    for (const ripple of this.ripples) {
      const { r, g, b } = this.hexToRgb(ripple.color);
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, ripple.alpha)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const glowBoost = this.glowIntensity * 0.3;
    const baseColor = this.lightenColor(this.color, glowBoost);

    if (isSelected || glowBoost > 0) {
      ctx.save();
      ctx.shadowColor = baseColor;
      ctx.shadowBlur = isSelected ? 16 : 12 * this.glowIntensity;
    }

    const gradient = ctx.createRadialGradient(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      0,
      this.x,
      this.y,
      this.radius
    );
    const rgb = this.hexToRgb(this.color);
    const lighterRgb = this.hexToRgb(this.lightenColor(this.color, 0.2 + glowBoost));
    gradient.addColorStop(0, `rgb(${lighterRgb.r}, ${lighterRgb.g}, ${lighterRgb.b})`);
    gradient.addColorStop(0.7, baseColor);
    gradient.addColorStop(1, `rgb(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)})`);

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (isSelected || glowBoost > 0) {
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      this.radius * 0.25,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fill();
  }

  public drawVelocityArrow(ctx: CanvasRenderingContext2D, targetVx: number, targetVy: number): void {
    const speed = Math.sqrt(targetVx * targetVx + targetVy * targetVy);
    if (speed < 1) return;

    const clampedSpeed = Math.min(speed, 200);
    const arrowLength = (clampedSpeed / 200) * 120;

    const nx = targetVx / speed;
    const ny = targetVy / speed;

    const startX = this.x;
    const startY = this.y;
    const endX = this.x + nx * arrowLength;
    const endY = this.y + ny * arrowLength;

    const rgb = this.hexToRgb(this.color);
    const arrowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = arrowColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    const headLength = 12;
    const angle = Math.atan2(ny, nx);
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.strokeStyle = arrowColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  public containsPoint(px: number, py: number): boolean {
    const dx = px - this.x;
    const dy = py - this.y;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }
}
