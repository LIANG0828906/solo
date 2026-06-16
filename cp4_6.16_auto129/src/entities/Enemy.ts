import Phaser from 'phaser';
import type { EnemyData, EnemyType } from '../types';
import { ENEMY_CONFIGS, PATH_POINTS } from '../types';
import type { ParticleEffects } from '../effects/ParticleEffects';

console.log('[TRACE] 初始化 Enemy 模块...');

export class Enemy {
  public id: string;
  public data: EnemyData;
  public active: boolean = true;
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private sprite: Phaser.GameObjects.Shape;
  private spriteContainer: Phaser.GameObjects.Container;
  private healthBar: Phaser.GameObjects.Graphics;
  private healthBarBg: Phaser.GameObjects.Graphics;
  private particleEffects: ParticleEffects;
  private config;
  private isHit: boolean = false;
  private hitTimer: number = 0;
  private burnTimer: number = 0;
  private slowTimer: number = 0;
  private originalColor: number;

  constructor(scene: Phaser.Scene, data: EnemyData, particleEffects: ParticleEffects) {
    this.scene = scene;
    this.id = data.id;
    this.data = data;
    this.particleEffects = particleEffects;
    this.config = ENEMY_CONFIGS[data.type];

    console.log('[TRACE] 创建敌人:', this.config.name, 'ID:', this.id, '血量:', data.health);

    this.container = this.scene.add.container(data.x, data.y);
    this.container.setDepth(30);

    this.originalColor = this.config.color;
    this.spriteContainer = this.scene.add.container(0, 0);
    this.sprite = this.createSprite();
    this.spriteContainer.add(this.sprite);
    this.container.add(this.spriteContainer);

    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.fillStyle(0x1F2937, 0.8);
    this.healthBarBg.fillRect(-this.config.size, -this.config.size - 12, this.config.size * 2, 6);
    this.container.add(this.healthBarBg);

    this.healthBar = this.scene.add.graphics();
    this.container.add(this.healthBar);

    this.updateHealthBar();

    this.container.setInteractive(new Phaser.Geom.Circle(0, 0, this.config.size), Phaser.Geom.Circle.Contains);
  }

  private createSprite(): Phaser.GameObjects.Shape {
    const { color, size, type } = this.config;
    let sprite: Phaser.GameObjects.Shape;

    switch (type) {
      case 'grunt':
        sprite = this.scene.add.rectangle(0, 0, size * 1.5, size * 1.5, color);
        sprite.setStrokeStyle(2, 0xffffff, 0.5);
        break;
      case 'fast':
        sprite = this.scene.add.triangle(0, 0, size, -size, -size, size, -size, -size, color);
        sprite.setStrokeStyle(2, 0xffffff, 0.6);
        break;
      case 'tank':
        sprite = this.scene.add.polygon(0, 0, this.createHexagonPoints(size), color);
        sprite.setStrokeStyle(3, 0xFCD34D, 0.7);
        break;
      case 'boss':
        sprite = this.scene.add.star(0, 0, 8, size, size * 0.6, color);
        sprite.setStrokeStyle(3, 0xFBBF24, 0.8);
        break;
      default:
        sprite = this.scene.add.circle(0, 0, size, color);
    }

    return sprite;
  }

  private createHexagonPoints(size: number): string {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      points.push(`${x}, ${y}`);
    }
    return points.join(' ');
  }

  public update(deltaTime: number): boolean {
    if (!this.active) return false;

    if (this.isHit) {
      this.hitTimer -= deltaTime;
      if (this.hitTimer <= 0) {
        this.isHit = false;
        this.sprite.setFillStyle(this.originalColor, 1);
      }
    }

    if (this.data.slowEffect > 0) {
      this.slowTimer -= deltaTime;
      if (this.slowTimer <= 0) {
        this.data.slowEffect = 0;
      }
    }

    if (this.data.burnDamage > 0) {
      this.burnTimer -= deltaTime;
      if (this.burnTimer <= 0) {
        this.data.health -= this.data.burnDamage;
        this.burnTimer = 1000;
        this.updateHealthBar();
        this.particleEffects.showDamageNumber(this.container.x, this.container.y - 10, this.data.burnDamage);

        if (this.data.health <= 0) {
          this.die();
          return false;
        }
      }
    }

    return this.moveAlongPath(deltaTime);
  }

  private moveAlongPath(deltaTime: number): boolean {
    if (this.data.pathIndex >= PATH_POINTS.length - 1) {
      this.reachEnd();
      return false;
    }

    const currentPoint = PATH_POINTS[this.data.pathIndex];
    const nextPoint = PATH_POINTS[this.data.pathIndex + 1];

    const dx = nextPoint.x - this.container.x;
    const dy = nextPoint.y - this.container.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const speedMod = 1 - this.data.slowEffect;
    const moveDistance = (this.config.speed * speedMod * deltaTime) / 1000;

    if (distance < moveDistance) {
      this.data.pathIndex++;
      this.container.x = nextPoint.x;
      this.container.y = nextPoint.y;
    } else {
      const ratio = moveDistance / distance;
      this.container.x += dx * ratio;
      this.container.y += dy * ratio;
    }

    this.data.x = this.container.x;
    this.data.y = this.container.y;

    const angle = Math.atan2(dy, dx);
    this.spriteContainer.setRotation(angle);

    return true;
  }

  public takeDamage(damage: number): boolean {
    if (!this.active) return false;

    this.data.health -= damage;
    this.isHit = true;
    this.hitTimer = 200;
    this.sprite.setFillStyle(0xFF0000, 1);

    this.updateHealthBar();
    this.particleEffects.showDamageNumber(this.container.x, this.container.y - 20, damage);

    if (this.data.slowEffect > 0) {
      this.slowTimer = 3000;
    }
    if (this.data.burnDamage > 0) {
      this.burnTimer = 1000;
    }

    if (this.data.health <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  private updateHealthBar() {
    this.healthBar.clear();
    const healthPercent = this.data.health / this.data.maxHealth;
    const barWidth = this.config.size * 2;
    const barHeight = 4;

    let color = 0x22C55E;
    if (healthPercent < 0.6) color = 0xFBBF24;
    if (healthPercent < 0.3) color = 0xEF4444;

    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(-this.config.size, -this.config.size - 11, barWidth * healthPercent, barHeight);
  }

  private die() {
    console.log('[TRACE] 敌人死亡:', this.id, '类型:', this.config.type);
    this.active = false;
    this.particleEffects.playDeathExplosion(this.container.x, this.container.y, this.config.color);
    this.destroy();
  }

  private reachEnd() {
    console.log('[TRACE] 敌人到达终点:', this.id);
    this.active = false;
    this.particleEffects.playScreenFlash();
    this.destroy();
  }

  public getX(): number {
    return this.container.x;
  }

  public getY(): number {
    return this.container.y;
  }

  public getHealth(): number {
    return this.data.health;
  }

  public setData(data: Partial<EnemyData>) {
    Object.assign(this.data, data);
  }

  public destroy() {
    console.log('[TRACE] 销毁敌人对象:', this.id);
    this.container.destroy();
    this.active = false;
  }
}

export class EnemyPool {
  private scene: Phaser.Scene;
  private particleEffects: ParticleEffects;
  private pool: Map<string, Enemy> = new Map();
  private maxSize: number = 100;

  constructor(scene: Phaser.Scene, particleEffects: ParticleEffects) {
    this.scene = scene;
    this.particleEffects = particleEffects;
    console.log('[TRACE] 初始化敌人对象池，最大容量:', this.maxSize);
  }

  public spawn(data: EnemyData): Enemy | null {
    if (this.pool.size >= this.maxSize) {
      console.log('[TRACE] 敌人池已满，无法生成新敌人');
      return null;
    }

    const enemy = new Enemy(this.scene, data, this.particleEffects);
    this.pool.set(data.id, enemy);
    return enemy;
  }

  public update(deltaTime: number): string[] {
    const reachedEnd: string[] = [];

    for (const [id, enemy] of this.pool) {
      if (!enemy.active) continue;

      const alive = enemy.update(deltaTime);
      if (!alive && enemy.data.pathIndex >= PATH_POINTS.length - 1) {
        reachedEnd.push(id);
      }
    }

    return reachedEnd;
  }

  public get(id: string): Enemy | undefined {
    return this.pool.get(id);
  }

  public getAll(): Enemy[] {
    return Array.from(this.pool.values()).filter(e => e.active);
  }

  public damage(id: string, damage: number): { killed: boolean } {
    const enemy = this.pool.get(id);
    if (!enemy || !enemy.active) return { killed: false };

    const killed = enemy.takeDamage(damage);
    if (killed) {
      this.pool.delete(id);
    }

    return { killed };
  }

  public applySplashDamage(x: number, y: number, radius: number, damage: number): string[] {
    const killedIds: string[] = [];

    for (const [id, enemy] of this.pool) {
      if (!enemy.active) continue;

      const dx = enemy.getX() - x;
      const dy = enemy.getY() - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= radius) {
        const killed = enemy.takeDamage(damage);
        if (killed) {
          killedIds.push(id);
          this.pool.delete(id);
        }
      }
    }

    return killedIds;
  }

  public remove(id: string) {
    const enemy = this.pool.get(id);
    if (enemy) {
      enemy.destroy();
      this.pool.delete(id);
    }
  }

  public getActiveCount(): number {
    return this.getAll().length;
  }

  public clear() {
    console.log('[TRACE] 清空敌人池');
    for (const enemy of this.pool.values()) {
      enemy.destroy();
    }
    this.pool.clear();
  }
}
