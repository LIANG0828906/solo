import { Vec2, Bullet, distance, randRange } from './types';

export const MAX_METEORS = 15;

let globalMeteorCount = 0;

export class Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  health: number;
  maxHealth: number;
  vertices: number[];
  colorBase: string;
  colorDark: string;
  alive: boolean = true;

  constructor(x: number, y: number, vx: number, vy: number, radius: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.rotation = Math.random() * Math.PI * 2;

    const minR = 20;
    const maxR = 40;
    const sizeT = (radius - minR) / (maxR - minR);
    const baseSpeed = 2.5 - sizeT * 1.8;
    const variance = randRange(-0.4, 0.4);
    const direction = Math.random() < 0.5 ? 1 : -1;
    this.rotationSpeed = (baseSpeed + variance) * direction;

    this.health = Math.ceil(radius / 10);
    this.maxHealth = this.health;

    const vertexCount = Math.floor(randRange(7, 12));
    this.vertices = [];
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2;
      const r = radius * randRange(0.75, 1.15);
      this.vertices.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }

    const baseHue = randRange(20, 40);
    this.colorBase = `hsl(${baseHue}, 40%, ${randRange(35, 50)}%)`;
    this.colorDark = `hsl(${baseHue}, 50%, ${randRange(18, 28)}%)`;
  }

  update(dt: number): void {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.rotation += this.rotationSpeed * dt;
  }

  isOffScreen(w: number, h: number, margin: number = 100): boolean {
    return (
      this.x < -margin ||
      this.x > w + margin ||
      this.y < -margin ||
      this.y > h + margin
    );
  }

  takeDamage(dmg: number): boolean {
    this.health -= dmg;
    return this.health <= 0;
  }

  destroy(): void {
    if (this.alive) {
      this.alive = false;
      globalMeteorCount = Math.max(0, globalMeteorCount - 1);
    }
  }

  static spawnRandom(w: number, h: number): Meteor | null {
    if (globalMeteorCount >= MAX_METEORS) {
      return null;
    }
    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;
    const margin = 60;
    switch (side) {
      case 0:
        x = Math.random() * w;
        y = -margin;
        break;
      case 1:
        x = w + margin;
        y = Math.random() * h;
        break;
      case 2:
        x = Math.random() * w;
        y = h + margin;
        break;
      default:
        x = -margin;
        y = Math.random() * h;
        break;
    }

    const targetX = w / 2 + (Math.random() - 0.5) * w * 0.6;
    const targetY = h / 2 + (Math.random() - 0.5) * h * 0.6;
    const angle = Math.atan2(targetY - y, targetX - x);
    const speed = randRange(1, 3);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const radius = randRange(20, 40);

    const meteor = new Meteor(x, y, vx, vy, radius);
    globalMeteorCount++;
    return meteor;
  }

  static getGlobalCount(): number {
    return globalMeteorCount;
  }

  static resetGlobalCount(): void {
    globalMeteorCount = 0;
  }

  checkCollision(obj: { x: number; y: number; radius: number }): boolean {
    const d = distance({ x: this.x, y: this.y }, { x: obj.x, y: obj.y });
    return d < this.radius + obj.radius;
  }

  checkBullet(b: Bullet): boolean {
    const d = distance({ x: this.x, y: this.y }, { x: b.x, y: b.y });
    return d < this.radius + b.radius;
  }
}
