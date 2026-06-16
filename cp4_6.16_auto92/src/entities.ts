import { v4 as uuidv4 } from 'uuid';

export type Rarity = 'common' | 'rare' | 'legendary';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  radius: number;
  velocity: Vector2;
}

export class Ship implements Entity {
  id: string;
  x: number;
  y: number;
  radius: number = 20;
  velocity: Vector2 = { x: 0, y: 0 };
  angle: number = 0;
  health: number = 5;
  maxHealth: number = 5;
  invincibleTime: number = 0;
  thrusterParticles: Particle[] = [];

  constructor(x: number, y: number) {
    this.id = uuidv4();
    this.x = x;
    this.y = y;
  }

  update(deltaTime: number, acceleration: Vector2) {
    this.velocity.x += acceleration.x * deltaTime;
    this.velocity.y += acceleration.y * deltaTime;
    
    const maxSpeed = 300;
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    if (speed > maxSpeed) {
      this.velocity.x = (this.velocity.x / speed) * maxSpeed;
      this.velocity.y = (this.velocity.y / speed) * maxSpeed;
    }
    
    this.velocity.x *= 0.98;
    this.velocity.y *= 0.98;
    
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;
    
    if (Math.abs(this.velocity.x) > 1 || Math.abs(this.velocity.y) > 1) {
      this.angle = Math.atan2(this.velocity.y, this.velocity.x);
    }
    
    if (this.invincibleTime > 0) {
      this.invincibleTime -= deltaTime;
    }
  }

  takeDamage(): boolean {
    if (this.invincibleTime > 0) return false;
    this.health--;
    this.invincibleTime = 1.5;
    return true;
  }
}

export class Ore implements Entity {
  id: string;
  x: number;
  y: number;
  radius: number;
  baseRadius: number;
  velocity: Vector2;
  rarity: Rarity;
  glowIntensity: number;
  harvestProgress: number = 0;
  isBeingHarvested: boolean = false;
  pulsePhase: number = 0;
  harvestParticles: Particle[] = [];

  constructor(x: number, y: number, rarity: Rarity) {
    this.id = uuidv4();
    this.x = x;
    this.y = y;
    this.rarity = rarity;
    this.velocity = { x: 0, y: 0 };
    
    switch (rarity) {
      case 'common':
        this.radius = 15 + Math.random() * 10;
        this.glowIntensity = 0.3;
        break;
      case 'rare':
        this.radius = 25 + Math.random() * 10;
        this.glowIntensity = 0.6;
        break;
      case 'legendary':
        this.radius = 35 + Math.random() * 10;
        this.glowIntensity = 1.0;
        const angle = Math.random() * Math.PI * 2;
        const speed = 20 + Math.random() * 30;
        this.velocity = {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        };
        break;
    }
    this.baseRadius = this.radius;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  getColor(): string {
    switch (this.rarity) {
      case 'common':
        return '#888888';
      case 'rare':
        return '#9b59b6';
      case 'legendary':
        return '#f1c40f';
    }
  }

  getScore(): number {
    switch (this.rarity) {
      case 'common':
        return 10;
      case 'rare':
        return 25;
      case 'legendary':
        return 80;
    }
  }

  update(deltaTime: number, worldSize: number) {
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;
    
    if (this.x < 0 || this.x > worldSize) {
      this.velocity.x *= -1;
      this.x = Math.max(0, Math.min(worldSize, this.x));
    }
    if (this.y < 0 || this.y > worldSize) {
      this.velocity.y *= -1;
      this.y = Math.max(0, Math.min(worldSize, this.y));
    }
    
    this.pulsePhase += deltaTime * 2;
    
    if (this.isBeingHarvested) {
      this.harvestProgress += deltaTime * 0.3;
      const shrinkFactor = 1 - this.harvestProgress * 0.7;
      this.radius = this.baseRadius * shrinkFactor;
    }
  }

  isHarvested(): boolean {
    return this.harvestProgress >= 1;
  }
}

export class SpaceDebris implements Entity {
  id: string;
  x: number;
  y: number;
  radius: number;
  velocity: Vector2;
  vertices: number[];
  rotationSpeed: number;
  rotation: number;
  trail: Vector2[];
  warningTime: number;
  warningDuration: number = 0.5;
  isWarning: boolean;
  warningArrowStart: Vector2;
  warningArrowEnd: Vector2;
  blinkPhase: number = 0;
  warningBlinkPeriod: number = 0.2;

  constructor(startX: number, startY: number, dirX: number, dirY: number, speed: number, worldSize: number) {
    this.id = uuidv4();
    this.x = startX;
    this.y = startY;
    this.radius = 15 + Math.random() * 10;
    this.velocity = { x: dirX * speed, y: dirY * speed };
    this.rotation = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 4;
    this.trail = [];
    this.warningTime = this.warningDuration;
    this.isWarning = true;
    
    const arrowLength = 80;
    const angle = Math.atan2(dirY, dirX);
    this.warningArrowStart = {
      x: startX - Math.cos(angle) * arrowLength,
      y: startY - Math.sin(angle) * arrowLength
    };
    this.warningArrowEnd = { x: startX, y: startY };
    
    const vertexCount = 6 + Math.floor(Math.random() * 4);
    this.vertices = [];
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2;
      const r = this.radius * (0.6 + Math.random() * 0.4);
      this.vertices.push(angle);
      this.vertices.push(r);
    }
  }

  update(deltaTime: number): boolean {
    if (this.isWarning) {
      this.warningTime -= deltaTime;
      this.blinkPhase += deltaTime;
      if (this.warningTime <= 0) {
        this.isWarning = false;
      }
      return false;
    }
    
    this.rotation += this.rotationSpeed * deltaTime;
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;
    
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > 20) {
      this.trail.pop();
    }
    
    return false;
  }

  isOffScreen(screenWidth: number, screenHeight: number): boolean {
    return (
      this.x < -this.radius * 2 ||
      this.x > screenWidth + this.radius * 2 ||
      this.y < -this.radius * 2 ||
      this.y > screenHeight + this.radius * 2
    );
  }

  isWarningVisible(): boolean {
    return Math.floor(this.blinkPhase / this.warningBlinkPeriod) % 2 === 0;
  }

  getEdgeGlowIntensity(screenWidth: number, screenHeight: number, cameraX: number, cameraY: number): number {
    const screenX = this.x - cameraX + screenWidth / 2;
    const screenY = this.y - cameraY + screenHeight / 2;
    
    const margin = 100;
    const glowRange = 200;
    
    let minDist = Infinity;
    
    if (screenX < margin + glowRange) {
      minDist = Math.min(minDist, screenX - margin);
    }
    if (screenX > screenWidth - margin - glowRange) {
      minDist = Math.min(minDist, screenWidth - margin - screenX);
    }
    if (screenY < margin + glowRange) {
      minDist = Math.min(minDist, screenY - margin);
    }
    if (screenY > screenHeight - margin - glowRange) {
      minDist = Math.min(minDist, screenHeight - margin - screenY);
    }
    
    if (minDist >= glowRange) return 0;
    if (minDist <= 0) return 1;
    
    return 1 - minDist / glowRange;
  }

  getEdgeGlowPosition(screenWidth: number, screenHeight: number, cameraX: number, cameraY: number): { x: number; y: number; side: 'left' | 'right' | 'top' | 'bottom' } | null {
    const screenX = this.x - cameraX + screenWidth / 2;
    const screenY = this.y - cameraY + screenHeight / 2;
    
    const margin = 50;
    
    const distLeft = screenX;
    const distRight = screenWidth - screenX;
    const distTop = screenY;
    const distBottom = screenHeight - screenY;
    
    const minDist = Math.min(distLeft, distRight, distTop, distBottom);
    
    if (minDist > 150) return null;
    
    let x = 0, y = 0, side: 'left' | 'right' | 'top' | 'bottom' = 'left';
    
    if (distLeft === minDist) {
      x = margin;
      y = Math.max(margin, Math.min(screenHeight - margin, screenY));
      side = 'left';
    } else if (distRight === minDist) {
      x = screenWidth - margin;
      y = Math.max(margin, Math.min(screenHeight - margin, screenY));
      side = 'right';
    } else if (distTop === minDist) {
      x = Math.max(margin, Math.min(screenWidth - margin, screenX));
      y = margin;
      side = 'top';
    } else {
      x = Math.max(margin, Math.min(screenWidth - margin, screenX));
      y = screenHeight - margin;
      side = 'bottom';
    }
    
    return { x, y, side };
  }
}

export class Particle {
  id: string;
  x: number;
  y: number;
  velocity: Vector2;
  life: number;
  maxLife: number;
  size: number;
  color: string;

  constructor(x: number, y: number, vx: number, vy: number, life: number, size: number, color: string) {
    this.id = uuidv4();
    this.x = x;
    this.y = y;
    this.velocity = { x: vx, y: vy };
    this.maxLife = life;
    this.life = life;
    this.size = size;
    this.color = color;
  }

  update(deltaTime: number): boolean {
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;
    this.life -= deltaTime;
    return this.life <= 0;
  }

  getAlpha(): number {
    return this.life / this.maxLife;
  }
}

export class Shockwave {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;

  constructor(x: number, y: number, maxRadius: number, duration: number, color: string) {
    this.id = uuidv4();
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.maxRadius = maxRadius;
    this.maxLife = duration;
    this.life = duration;
    this.color = color;
  }

  update(deltaTime: number): boolean {
    this.life -= deltaTime;
    this.radius = this.maxRadius * (1 - this.life / this.maxLife);
    return this.life <= 0;
  }

  getAlpha(): number {
    return this.life / this.maxLife;
  }
}

export class NebulaLayer {
  blobs: { x: number; y: number; radius: number; color: string; alpha: number }[] = [];
  rotation: number = 0;
  rotationSpeed: number;

  constructor(blobCount: number, worldSize: number, baseColor: string, rotationSpeed: number) {
    this.rotationSpeed = rotationSpeed;
    for (let i = 0; i < blobCount; i++) {
      this.blobs.push({
        x: Math.random() * worldSize,
        y: Math.random() * worldSize,
        radius: 100 + Math.random() * 300,
        color: baseColor,
        alpha: 0.05 + Math.random() * 0.1
      });
    }
  }

  update(deltaTime: number) {
    this.rotation += this.rotationSpeed * deltaTime;
  }
}

export function checkCollision(a: Entity, b: Entity): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < a.radius + b.radius;
}

export function pointInCircle(px: number, py: number, cx: number, cy: number, radius: number): boolean {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

export function lineCircleIntersect(
  x1: number, y1: number, x2: number, y2: number,
  cx: number, cy: number, r: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;

  let discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return false;

  discriminant = Math.sqrt(discriminant);
  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);

  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}
