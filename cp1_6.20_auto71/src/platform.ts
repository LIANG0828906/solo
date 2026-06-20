import type { PlatformType, PlatformMaterial, AABB } from './types';
import { random, randomInt, checkAABB } from './utils';
import type { ParticlePool } from './utils';

const MATERIAL_COLORS: Record<PlatformMaterial, { base: string; dark: string; light: string }> = {
  rock: { base: '#8B8B8B', dark: '#6B6B6B', light: '#ABABAB' },
  wood: { base: '#8B5A2B', dark: '#6B4220', light: '#A67C52' },
  ice: { base: '#B8E0F0', dark: '#8FC8E0', light: '#D0F0FF' },
};

export class Platform implements AABB {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  material: PlatformMaterial;
  originalX: number;
  originalY: number;
  moveRange: number;
  moveSpeed: number;
  moveOffset: number = 0;
  fragileTimer: number = 0;
  isFragileTriggered: boolean = false;
  isBroken: boolean = false;
  breakProgress: number = 0;
  lastSafeX: number = 0;
  lastSafeY: number = 0;

  constructor(
    type: PlatformType,
    material: PlatformMaterial,
    x: number,
    y: number,
    width: number,
    height: number,
    moveRange: number = 0,
    moveSpeed: number = 0
  ) {
    this.x = x;
    this.y = y;
    this.originalX = x;
    this.originalY = y;
    this.lastSafeX = x;
    this.lastSafeY = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.material = material;
    this.moveRange = moveRange;
    this.moveSpeed = moveSpeed;
  }

  update(dt: number, particlePool: ParticlePool): void {
    this.lastSafeX = this.x;
    this.lastSafeY = this.y;

    if (this.type === 'moving-horizontal') {
      this.moveOffset += dt * this.moveSpeed;
      this.x = this.originalX + Math.sin(this.moveOffset) * this.moveRange;
    } else if (this.type === 'moving-vertical') {
      this.moveOffset += dt * this.moveSpeed;
      this.y = this.originalY + Math.sin(this.moveOffset) * this.moveRange;
    }

    if (this.type === 'fragile' && this.isFragileTriggered && !this.isBroken) {
      this.fragileTimer -= dt;
      this.breakProgress = Math.min(1, (1.5 - this.fragileTimer) / 1.5);
      if (this.fragileTimer <= 0) {
        this.breakApart(particlePool);
      }
    }
  }

  triggerFragile(): void {
    if (this.type === 'fragile' && !this.isFragileTriggered) {
      this.isFragileTriggered = true;
      this.fragileTimer = 1.5;
    }
  }

  private breakApart(particlePool: ParticlePool): void {
    this.isBroken = true;
    const colors = MATERIAL_COLORS[this.material];
    const shardCount = Math.floor(this.width / 10);
    
    for (let i = 0; i < shardCount; i++) {
      const sx = this.x + random(0, this.width);
      const sy = this.y + random(0, this.height);
      particlePool.emit(
        sx, sy, 1,
        i % 2 === 0 ? colors.base : colors.dark,
        50, 150, 3, 6, 1.5
      );
    }
  }

  getAABB(): AABB {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  collidesWith(other: AABB): boolean {
    if (this.isBroken) return false;
    return checkAABB(this, other);
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (this.isBroken) return;

    const colors = MATERIAL_COLORS[this.material];
    const px = this.x - cameraX;
    const py = this.y - cameraY;

    ctx.save();

    if (this.type === 'fragile' && this.isFragileTriggered) {
      const shake = Math.sin(this.breakProgress * Math.PI * 10) * this.breakProgress * 2;
      ctx.translate(shake, 0);
      ctx.globalAlpha = 1 - this.breakProgress * 0.5;
    }

    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(px + radius, py);
    ctx.lineTo(px + this.width - radius, py);
    ctx.quadraticCurveTo(px + this.width, py, px + this.width, py + radius);
    ctx.lineTo(px + this.width, py + this.height - radius);
    ctx.quadraticCurveTo(px + this.width, py + this.height, px + this.width - radius, py + this.height);
    ctx.lineTo(px + radius, py + this.height);
    ctx.quadraticCurveTo(px, py + this.height, px, py + this.height - radius);
    ctx.lineTo(px, py + radius);
    ctx.quadraticCurveTo(px, py, px + radius, py);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(px, py, px, py + this.height);
    gradient.addColorStop(0, colors.light);
    gradient.addColorStop(0.5, colors.base);
    gradient.addColorStop(1, colors.dark);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = colors.dark;
    ctx.lineWidth = 2;
    ctx.stroke();

    this.renderTexture(ctx, px, py, colors);

    if (this.type === 'moving-horizontal' || this.type === 'moving-vertical') {
      const arrowColor = 'rgba(255, 255, 255, 0.6)';
      ctx.strokeStyle = arrowColor;
      ctx.lineWidth = 2;
      const cx = px + this.width / 2;
      const cy = py + this.height / 2;
      
      if (this.type === 'moving-horizontal') {
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy);
        ctx.lineTo(cx + 12, cy);
        ctx.moveTo(cx + 8, cy - 4);
        ctx.lineTo(cx + 12, cy);
        ctx.lineTo(cx + 8, cy + 4);
        ctx.moveTo(cx - 8, cy - 4);
        ctx.lineTo(cx - 12, cy);
        ctx.lineTo(cx - 8, cy + 4);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(cx, cy - 12);
        ctx.lineTo(cx, cy + 12);
        ctx.moveTo(cx - 4, cy - 8);
        ctx.lineTo(cx, cy - 12);
        ctx.lineTo(cx + 4, cy - 8);
        ctx.moveTo(cx - 4, cy + 8);
        ctx.lineTo(cx, cy + 12);
        ctx.lineTo(cx + 4, cy + 8);
        ctx.stroke();
      }
    }

    if (this.type === 'fragile') {
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(px + 2, py + 2, this.width - 4, this.height - 4);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  private renderTexture(ctx: CanvasRenderingContext2D, px: number, py: number, colors: typeof MATERIAL_COLORS[PlatformMaterial]): void {
    ctx.save();
    ctx.clip();

    if (this.material === 'rock') {
      ctx.fillStyle = colors.dark;
      for (let i = 0; i < this.width; i += 15) {
        for (let j = 0; j < this.height; j += 10) {
          if (Math.random() > 0.6) {
            ctx.fillRect(px + i + random(0, 5), py + j + random(0, 3), random(2, 4), random(1, 3));
          }
        }
      }
    } else if (this.material === 'wood') {
      ctx.strokeStyle = colors.dark;
      ctx.lineWidth = 1;
      for (let i = 0; i < this.height; i += 4) {
        ctx.beginPath();
        ctx.moveTo(px, py + i);
        ctx.lineTo(px + this.width, py + i + random(-1, 1));
        ctx.stroke();
      }
    } else if (this.material === 'ice') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(px + random(0, this.width - 10), py + random(0, this.height - 3), random(5, 10), random(1, 2));
      }
    }

    ctx.restore();
  }

  isOnScreen(cameraX: number, cameraY: number, screenWidth: number, screenHeight: number): boolean {
    return (
      this.x + this.width > cameraX &&
      this.x < cameraX + screenWidth &&
      this.y + this.height > cameraY &&
      this.y < cameraY + screenHeight
    );
  }
}

export class PlatformGenerator {
  private screenWidth: number;
  private screenHeight: number;

  constructor(screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  generate(platformCount: number = 20): { platforms: Platform[]; goalX: number; goalY: number } {
    const platforms: Platform[] = [];
    const startY = this.screenHeight - 100;

    platforms.push(new Platform('static', 'rock', 100, startY, 150, 20));

    let lastX = 175;
    let lastY = startY;
    let movingPlatformCount = 0;
    const maxMovingPlatforms = 5;

    for (let i = 1; i < platformCount; i++) {
      const gapX = random(80, 150);
      const gapY = random(-80, 80);
      
      let newX = lastX + gapX;
      let newY = clamp(lastY + gapY, 200, this.screenHeight - 100);

      const typeRoll = Math.random();
      let type: PlatformType;
      if (typeRoll < 0.7) {
        type = 'static';
      } else if (typeRoll < 0.85 && movingPlatformCount < maxMovingPlatforms) {
        type = 'moving-horizontal';
        movingPlatformCount++;
      } else if (typeRoll < 0.95 && movingPlatformCount < maxMovingPlatforms) {
        type = 'moving-vertical';
        movingPlatformCount++;
      } else {
        type = 'fragile';
      }

      const materialRoll = Math.random();
      let material: PlatformMaterial;
      if (materialRoll < 0.5) {
        material = 'rock';
      } else if (materialRoll < 0.8) {
        material = 'wood';
      } else {
        material = 'ice';
      }

      const width = random(60, 120);
      const height = 20;
      const moveRange = type === 'static' ? 0 : random(50, 100);
      const moveSpeed = type === 'static' ? 0 : random(1, 2);

      platforms.push(new Platform(type, material, newX, newY, width, height, moveRange, moveSpeed));

      lastX = newX + width / 2;
      lastY = newY;
    }

    const lastPlatform = platforms[platforms.length - 1];
    const goalX = lastPlatform.x + lastPlatform.width / 2;
    const goalY = lastPlatform.y - 60;

    return { platforms, goalX, goalY };
  }

  generateStars(platforms: Platform[], count: number): Array<{ x: number; y: number }> {
    const stars: Array<{ x: number; y: number }> = [];
    const shuffled = [...platforms].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(count, shuffled.length - 1); i++) {
      const platform = shuffled[i];
      const x = platform.x + random(10, platform.width - 10);
      const y = platform.y - random(40, 80);
      stars.push({ x, y });
    }

    for (let i = 0; i < Math.floor(count / 2); i++) {
      const idx1 = randomInt(0, platforms.length - 2);
      const idx2 = randomInt(idx1 + 1, platforms.length - 1);
      const p1 = platforms[idx1];
      const p2 = platforms[idx2];
      const x = (p1.x + p1.width / 2 + p2.x + p2.width / 2) / 2;
      const y = (p1.y + p2.y) / 2 - random(20, 50);
      stars.push({ x, y });
    }

    return stars;
  }

  findNearestSafePlatform(platforms: Platform[], x: number, y: number): Platform | null {
    let nearest: Platform | null = null;
    let minDist = Infinity;

    for (const platform of platforms) {
      if (platform.isBroken || platform.type === 'fragile') continue;
      
      const platTopY = platform.y;
      if (platTopY > y) continue;

      const dist = Math.hypot(
        x - (platform.x + platform.width / 2),
        y - platTopY
      );

      if (dist < minDist) {
        minDist = dist;
        nearest = platform;
      }
    }

    return nearest || platforms[0] || null;
  }

  resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
