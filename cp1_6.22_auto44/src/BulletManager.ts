import { Bullet } from './Bullet';
import { BulletType } from './types';
import type { Position, Rect } from './types';

export class BulletManager {
  private bullets: Bullet[];
  private poolSize: number = 50;

  constructor() {
    this.bullets = [];
    for (let i = 0; i < this.poolSize; i++) {
      this.bullets.push(new Bullet());
    }
  }

  spawn(x: number, y: number, type: BulletType, targetX?: number, targetY?: number): void {
    const bullet = this.bullets.find(b => !b.active);
    if (bullet) {
      bullet.init(x, y, type, targetX, targetY);
    } else {
      const newBullet = new Bullet();
      newBullet.init(x, y, type, targetX, targetY);
      this.bullets.push(newBullet);
    }
  }

  spawnDual(x: number, y: number, type: BulletType, targetX: number, targetY: number, offset: number = 15): void {
    this.spawn(x, y - offset, type, targetX, targetY);
    this.spawn(x, y + offset, type, targetX, targetY);
  }

  update(dt: number): void {
    for (const bullet of this.bullets) {
      bullet.update(dt);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const bullet of this.bullets) {
      bullet.render(ctx);
    }
  }

  getActiveBullets(type?: BulletType): Bullet[] {
    return this.bullets.filter(b => b.active && (type === undefined || b.type === type));
  }

  getPlayerBulletRects(): Rect[] {
    return this.getActiveBullets(BulletType.PLAYER).map(b => b.getRect());
  }

  getEnemyBulletRects(): Rect[] {
    return this.getActiveBullets(BulletType.ENEMY).map(b => b.getRect());
  }

  deactivateBulletAt(position: Position, type: BulletType): boolean {
    for (const bullet of this.bullets) {
      if (bullet.active && bullet.type === type && 
          bullet.x === position.x && bullet.y === position.y) {
        bullet.active = false;
        return true;
      }
    }
    return false;
  }

  deactivateBullet(bullet: Bullet): void {
    bullet.active = false;
  }

  clear(): void {
    for (const bullet of this.bullets) {
      bullet.active = false;
    }
  }
}
