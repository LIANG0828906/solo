import type { AABB } from './types';
import { checkAABB } from './utils';
import type { ParticlePool } from './utils';

export class Star {
  x: number;
  y: number;
  radius: number = 15;
  rotation: number = 0;
  rotationSpeed: number = 2;
  collected: boolean = false;
  collectAnimation: number = 0;
  glowIntensity: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number): void {
    if (this.collected) {
      this.collectAnimation += dt * 3;
      return;
    }
    this.rotation += dt * this.rotationSpeed;
    this.glowIntensity = (Math.sin(Date.now() / 300) + 1) / 2;
  }

  checkCollision(player: AABB): boolean {
    if (this.collected) return false;
    
    const starAABB: AABB = {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };

    return checkAABB(player, starAABB);
  }

  collect(particlePool: ParticlePool): void {
    if (this.collected) return;
    this.collected = true;
    this.collectAnimation = 0;
    
    const colors = ['#F5A623', '#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4'];
    for (let i = 0; i < 5; i++) {
      particlePool.emit(
        this.x, this.y, 4,
        colors[i % colors.length],
        100, 300, 3, 6, 1.2
      );
    }
  }

  isCollectAnimationDone(): boolean {
    return this.collectAnimation >= 1;
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const px = this.x - cameraX;
    const py = this.y - cameraY;

    ctx.save();
    ctx.translate(px, py);

    if (!this.collected) {
      const glowRadius = this.radius * (1.5 + this.glowIntensity * 0.5);
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
      gradient.addColorStop(0, 'rgba(245, 166, 35, 0.4)');
      gradient.addColorStop(0.5, 'rgba(245, 166, 35, 0.2)');
      gradient.addColorStop(1, 'rgba(245, 166, 35, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.rotate(this.rotation);

    let scale = 1;
    let alpha = 1;
    if (this.collected) {
      const t = Math.min(1, this.collectAnimation);
      scale = 1 + t * 1.5;
      alpha = 1 - t;
      ctx.globalAlpha = alpha;
      ctx.scale(scale, scale);
    }

    this.drawStar(ctx, 0, 0, 5, this.radius, this.radius * 0.5);

    ctx.fillStyle = '#F5A623';
    ctx.fill();
    
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.stroke();

    const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 0.5);
    innerGradient.addColorStop(0, '#FFFF80');
    innerGradient.addColorStop(1, '#F5A623');
    ctx.fillStyle = innerGradient;
    this.drawStar(ctx, 0, 0, 5, this.radius * 0.6, this.radius * 0.3);
    ctx.fill();

    ctx.restore();
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  isOnScreen(cameraX: number, cameraY: number, screenWidth: number, screenHeight: number): boolean {
    return (
      this.x + this.radius > cameraX &&
      this.x - this.radius < cameraX + screenWidth &&
      this.y + this.radius > cameraY &&
      this.y - this.radius < cameraY + screenHeight
    );
  }
}

export class GoalRing {
  x: number;
  y: number;
  radius: number = 40;
  rotation: number = 0;
  pulsePhase: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number): void {
    this.rotation += dt * 1.5;
    this.pulsePhase += dt * 3;
  }

  checkCollision(player: AABB): boolean {
    const ringAABB: AABB = {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
    return checkAABB(player, ringAABB);
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const px = this.x - cameraX;
    const py = this.y - cameraY;
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.1;

    ctx.save();
    ctx.translate(px, py);
    ctx.scale(pulseScale, pulseScale);

    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 2);
    glowGradient.addColorStop(0, 'rgba(74, 144, 217, 0.4)');
    glowGradient.addColorStop(0.5, 'rgba(123, 89, 196, 0.2)');
    glowGradient.addColorStop(1, 'rgba(123, 89, 196, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(this.rotation);

    for (let i = 3; i >= 0; i--) {
      const r = this.radius - i * 8;
      const gradient = ctx.createLinearGradient(-r, -r, r, r);
      gradient.addColorStop(0, i % 2 === 0 ? '#4A90D9' : '#7B59C4');
      gradient.addColorStop(1, i % 2 === 0 ? '#7B59C4' : '#4A90D9');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4 - i * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.rotate(-this.rotation * 2);
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const innerR = this.radius + 5;
      const outerR = this.radius + 15;
      
      ctx.strokeStyle = 'rgba(245, 166, 35, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.stroke();
    }

    ctx.fillStyle = '#F5A623';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
    coreGradient.addColorStop(0, '#FFFFFF');
    coreGradient.addColorStop(1, '#F5A623');
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
