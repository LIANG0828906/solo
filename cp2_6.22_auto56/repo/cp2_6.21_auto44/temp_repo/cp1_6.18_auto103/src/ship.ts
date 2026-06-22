import { lerp, distance, clamp, colorLerp } from './utils';

export interface ShipOptions {
  x: number;
  y: number;
  color: string;
  cockpitColor: string;
  size?: number;
  isPlayer?: boolean;
}

export interface Laser {
  x: number;
  y: number;
  angle: number;
  speed: number;
  length: number;
  width: number;
  color: string;
  damage: number;
  isPlayer: boolean;
}

export class Ship {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  cockpitColor: string;
  size: number;
  isPlayer: boolean;

  shield: number;
  maxShield: number;
  health: number;
  maxHealth: number;

  moveSpeed: number;
  moveDuration: number;
  moveProgress: number;
  isMoving: boolean;
  startX: number;
  startY: number;

  fireRate: number;
  fireTimer: number;
  isFiring: boolean;
  targetShip: Ship | null;

  laserLength: number;
  laserWidth: number;
  laserColor: string;
  laserDamage: number;

  hitFlash: number;
  hitFlashDuration: number;

  constructor(options: ShipOptions) {
    const { x, y, color, cockpitColor, size = 25, isPlayer = false } = options;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.color = color;
    this.cockpitColor = cockpitColor;
    this.size = size;
    this.isPlayer = isPlayer;

    this.shield = 100;
    this.maxShield = 100;
    this.health = 100;
    this.maxHealth = 100;

    this.moveSpeed = 150;
    this.moveDuration = 0.4;
    this.moveProgress = 0;
    this.isMoving = false;
    this.startX = x;
    this.startY = y;

    this.fireRate = 0.2;
    this.fireTimer = 0;
    this.isFiring = false;
    this.targetShip = null;

    this.laserLength = 40;
    this.laserWidth = 3;
    this.laserColor = '#66FCF1';
    this.laserDamage = 20;

    this.hitFlash = 0;
    this.hitFlashDuration = 0.15;
  }

  moveTo(x: number, y: number): void {
    this.startX = this.x;
    this.startY = this.y;
    this.targetX = x;
    this.targetY = y;
    this.isMoving = true;
    this.moveProgress = 0;
  }

  startFiring(target: Ship): void {
    this.isFiring = true;
    this.targetShip = target;
    this.fireTimer = 0;
  }

  stopFiring(): void {
    this.isFiring = false;
    this.targetShip = null;
  }

  takeDamage(damage: number): boolean {
    this.hitFlash = this.hitFlashDuration;

    if (this.shield > 0) {
      this.shield = Math.max(0, this.shield - damage);
    } else {
      this.health = Math.max(0, this.health - damage);
    }

    return this.health <= 0;
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): Laser | null {
    if (this.isMoving) {
      this.moveProgress += deltaTime / this.moveDuration;
      const t = clamp(this.moveProgress, 0, 1);
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      this.x = lerp(this.startX, this.targetX, easeT);
      this.y = lerp(this.startY, this.targetY, easeT);

      if (this.moveProgress >= 1) {
        this.isMoving = false;
        this.x = this.targetX;
        this.y = this.targetY;
      }
    }

    const margin = this.size + 10;
    this.x = clamp(this.x, margin, canvasWidth - margin);
    this.y = clamp(this.y, margin, canvasHeight - margin);

    if (this.hitFlash > 0) {
      this.hitFlash -= deltaTime;
    }

    let laser: Laser | null = null;
    if (this.isFiring && this.targetShip) {
      this.fireTimer -= deltaTime;
      if (this.fireTimer <= 0) {
        this.fireTimer = this.fireRate;
        const dx = this.targetShip.x - this.x;
        const dy = this.targetShip.y - this.y;
        const angle = Math.atan2(dy, dx);
        laser = {
          x: this.x + Math.cos(angle) * this.size,
          y: this.y + Math.sin(angle) * this.size,
          angle,
          speed: 800,
          length: this.laserLength,
          width: this.laserWidth,
          color: this.laserColor,
          damage: this.laserDamage,
          isPlayer: this.isPlayer,
        };
      }
    }

    return laser;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);

    const sides = 16;
    const flashIntensity = this.hitFlash > 0 ? this.hitFlash / this.hitFlashDuration : 0;

    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;

    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * this.size;
      const py = Math.sin(angle) * this.size;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();

    if (flashIntensity > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + flashIntensity * 0.5})`;
    } else {
      ctx.fillStyle = this.color;
    }
    ctx.fill();

    ctx.strokeStyle = this.cockpitColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;

    const cockpitRadius = 8;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cockpitRadius);
    gradient.addColorStop(0, this.cockpitColor);
    gradient.addColorStop(0.7, this.cockpitColor + 'AA');
    gradient.addColorStop(1, this.cockpitColor + '00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, cockpitRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    this.renderHealthBar(ctx);
  }

  renderHealthBar(ctx: CanvasRenderingContext2D): void {
    const barWidth = 60;
    const barHeight = 6;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.size - 20;
    const gap = 4;

    const shieldRatio = this.shield / this.maxShield;
    const shieldColor = colorLerp('#45A29E', '#FFFFFF', shieldRatio);
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const shieldGrad = ctx.createLinearGradient(barX, barY, barX + barWidth * shieldRatio, barY);
    shieldGrad.addColorStop(0, '#FFFFFF');
    shieldGrad.addColorStop(1, '#45A29E');
    ctx.fillStyle = shieldGrad;
    ctx.fillRect(barX, barY, barWidth * shieldRatio, barHeight);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    const healthRatio = this.health / this.maxHealth;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY + barHeight + gap, barWidth, barHeight);
    const healthGrad = ctx.createLinearGradient(barX, barY + barHeight + gap, barX + barWidth * healthRatio, barY + barHeight + gap);
    healthGrad.addColorStop(0, '#C3073F');
    healthGrad.addColorStop(1, '#4CAF50');
    ctx.fillStyle = healthGrad;
    ctx.fillRect(barX, barY + barHeight + gap, barWidth * healthRatio, barHeight);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY + barHeight + gap, barWidth, barHeight);
  }

  containsPoint(px: number, py: number): boolean {
    return distance(px, py, this.x, this.y) <= this.size;
  }
}
