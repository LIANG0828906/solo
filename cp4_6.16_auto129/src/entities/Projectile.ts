import Phaser from 'phaser';
import type { Rune, TowerType } from '../types';
import { TOWER_CONFIGS } from '../types';

console.log('[TRACE] 初始化 Projectile 模块...');

export interface ProjectileConfig {
  id: string;
  scene: Phaser.Scene;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  targetId: string;
  damage: number;
  speed: number;
  towerType: TowerType;
  runes: Rune[];
  onHit: (targetId: string, damage: number, runes: Rune[], x: number, y: number) => void;
  onSplash?: (x: number, y: number, radius: number, damage: number, runes: Rune[]) => void;
}

export class Projectile {
  public id: string;
  public active: boolean = true;
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private sprite: Phaser.GameObjects.Shape;
  private trail: Phaser.GameObjects.Graphics | null = null;
  private targetId: string;
  private targetX: number;
  private targetY: number;
  private damage: number;
  private speed: number;
  private towerType: TowerType;
  private runes: Rune[];
  private onHit: (targetId: string, damage: number, runes: Rune[], x: number, y: number) => void;
  private onSplash?: (x: number, y: number, radius: number, damage: number, runes: Rune[]) => void;
  private trailPoints: { x: number; y: number; alpha: number }[] = [];
  private maxTrailLength: number = 10;

  constructor(config: ProjectileConfig) {
    this.id = config.id;
    this.scene = config.scene;
    this.targetId = config.targetId;
    this.targetX = config.targetX;
    this.targetY = config.targetY;
    this.damage = config.damage;
    this.speed = config.speed;
    this.towerType = config.towerType;
    this.runes = config.runes;
    this.onHit = config.onHit;
    this.onSplash = config.onSplash;

    this.container = this.scene.add.container(config.x, config.y);
    this.container.setDepth(50);

    this.sprite = this.createProjectileSprite();
    this.container.add(this.sprite);

    this.trail = this.scene.add.graphics();
    this.trail.setDepth(49);

    console.log('[TRACE] 创建投射物:', this.towerType, 'ID:', this.id, '伤害:', this.damage);
  }

  private createProjectileSprite(): Phaser.GameObjects.Shape {
    const config = TOWER_CONFIGS[this.towerType];
    let sprite: Phaser.GameObjects.Shape;

    switch (this.towerType) {
      case 'arrow':
        sprite = this.scene.add.triangle(0, 0, 8, 0, -4, -4, -4, 4, config.color);
        sprite.setStrokeStyle(1, 0xffffff, 0.8);
        break;
      case 'frost':
        sprite = this.scene.add.star(0, 0, 6, 8, 4, config.color);
        sprite.setStrokeStyle(1, 0xffffff, 0.9);
        break;
      case 'fire':
        sprite = this.scene.add.circle(0, 0, 6, config.color);
        sprite.setStrokeStyle(2, 0xFCD34D, 0.9);
        break;
      case 'electric':
        sprite = this.scene.add.polygon(0, 0, '0, -8 4, 0 0, 8 -4, 0', config.color);
        sprite.setStrokeStyle(1, 0xffffff, 0.9);
        break;
      default:
        sprite = this.scene.add.circle(0, 0, 5, config.color);
    }

    return sprite;
  }

  public updateTargetPosition(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
  }

  public setCallbacks(
    onHit: (targetId: string, damage: number, runes: Rune[], x: number, y: number) => void,
    onSplash?: (x: number, y: number, radius: number, damage: number, runes: Rune[]) => void
  ) {
    this.onHit = onHit;
    this.onSplash = onSplash;
  }

  public update(deltaTime: number): boolean {
    if (!this.active) return false;

    const dx = this.targetX - this.container.x;
    const dy = this.targetY - this.container.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) {
      this.hit();
      return false;
    }

    const moveDistance = (this.speed * deltaTime) / 1000;
    const ratio = moveDistance / distance;

    this.container.x += dx * ratio;
    this.container.y += dy * ratio;

    const angle = Math.atan2(dy, dx);
    this.container.setRotation(angle);

    this.updateTrail();
    this.updateVisualEffects(deltaTime);

    return true;
  }

  private updateTrail() {
    if (!this.trail) return;

    this.trailPoints.unshift({
      x: this.container.x,
      y: this.container.y,
      alpha: 1
    });

    if (this.trailPoints.length > this.maxTrailLength) {
      this.trailPoints.pop();
    }

    this.trail.clear();

    const config = TOWER_CONFIGS[this.towerType];
    for (let i = 0; i < this.trailPoints.length - 1; i++) {
      const p1 = this.trailPoints[i];
      const p2 = this.trailPoints[i + 1];
      const alpha = (1 - i / this.maxTrailLength) * 0.6;

      this.trail.lineStyle(3 - i * 0.2, config.color, alpha);
      this.trail.beginPath();
      this.trail.moveTo(p1.x, p1.y);
      this.trail.lineTo(p2.x, p2.y);
      this.trail.stroke();
    }
  }

  private updateVisualEffects(deltaTime: number) {
    if (this.towerType === 'fire') {
      this.sprite.setScale(0.9 + Math.sin(Date.now() / 50) * 0.1);
    } else if (this.towerType === 'electric') {
      this.sprite.setRotation(this.sprite.rotation + deltaTime * 0.01);
    }
  }

  private hit() {
    console.log('[TRACE] 投射物命中目标:', this.targetId, '伤害:', this.damage);

    this.active = false;

    const splashRune = this.runes.find(r => r.type === 'splash');
    if (splashRune && this.onSplash) {
      console.log('[TRACE] 触发溅射效果，半径:', splashRune.effect);
      this.onSplash(
        this.container.x,
        this.container.y,
        splashRune.effect,
        this.damage * 0.5,
        this.runes
      );
    }

    this.onHit(this.targetId, this.damage, this.runes, this.container.x, this.container.y);

    this.destroy();
  }

  public getX(): number {
    return this.container.x;
  }

  public getY(): number {
    return this.container.y;
  }

  public getTargetId(): string {
    return this.targetId;
  }

  public destroy() {
    console.log('[TRACE] 销毁投射物:', this.id);
    if (this.trail) {
      this.trail.destroy();
      this.trail = null;
    }
    this.container.destroy();
    this.active = false;
  }
}

export class ProjectilePool {
  private scene: Phaser.Scene;
  private pool: Projectile[] = [];
  private maxSize: number = 200;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    console.log('[TRACE] 初始化投射物对象池，最大容量:', this.maxSize);
  }

  public get(config: Omit<ProjectileConfig, 'scene'>): Projectile | null {
    if (this.pool.length >= this.maxSize) {
      console.log('[TRACE] 投射物池已满，移除最旧的投射物');
      const oldest = this.pool.shift();
      if (oldest) oldest.destroy();
    }

    const projectile = new Projectile({
      ...config,
      scene: this.scene
    });

    this.pool.push(projectile);
    return projectile;
  }

  public update(deltaTime: number) {
    this.pool = this.pool.filter(p => {
      if (!p.active) return false;
      return p.update(deltaTime);
    });
  }

  public getActiveCount(): number {
    return this.pool.filter(p => p.active).length;
  }

  public updateProjectileTarget(targetId: string, x: number, y: number) {
    for (const projectile of this.pool) {
      if (projectile.active && projectile.getTargetId() === targetId) {
        projectile.updateTargetPosition(x, y);
      }
    }
  }

  public clear() {
    console.log('[TRACE] 清空投射物池');
    this.pool.forEach(p => p.destroy());
    this.pool = [];
  }
}
