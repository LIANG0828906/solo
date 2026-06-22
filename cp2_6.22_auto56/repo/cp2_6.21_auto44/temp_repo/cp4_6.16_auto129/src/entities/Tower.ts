import Phaser from 'phaser';
import { v4 as uuidv4 } from 'uuid';
import type { TowerData, TowerType, Rune } from '../types';
import { TOWER_CONFIGS, TILE_SIZE, SIDEBAR_WIDTH } from '../types';
import { ProjectilePool } from './Projectile';
import type { Enemy } from './Enemy';

console.log('[TRACE] 初始化 Tower 模块...');

export class Tower {
  public id: string;
  public data: TowerData;
  public active: boolean = true;
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private base: Phaser.GameObjects.Shape;
  private body: Phaser.GameObjects.Shape;
  private top: Phaser.GameObjects.Shape | null = null;
  private energyGlow: Phaser.GameObjects.Arc | null = null;
  private rangeCircle: Phaser.GameObjects.Arc | null = null;
  private config;
  private lastFireTime: number = 0;
  private projectilePool: ProjectilePool;
  private runeIndicators: Phaser.GameObjects.Arc[] = [];

  constructor(scene: Phaser.Scene, data: TowerData, projectilePool: ProjectilePool) {
    this.scene = scene;
    this.id = data.id;
    this.data = data;
    this.config = TOWER_CONFIGS[data.type];
    this.projectilePool = projectilePool;

    const x = data.gridX * TILE_SIZE + TILE_SIZE / 2 + SIDEBAR_WIDTH;
    const y = data.gridY * TILE_SIZE + TILE_SIZE / 2;

    console.log('[TRACE] 创建塔:', this.config.name, 'ID:', this.id, '等级:', data.level, '位置:', x, y);

    this.container = this.scene.add.container(x, y);
    this.container.setDepth(20);

    this.base = this.createBase();
    this.container.add(this.base);

    this.body = this.createBody();
    this.container.add(this.body);

    this.updateAppearanceByLevel();
    this.updateRuneIndicators();

    this.container.setInteractive(new Phaser.Geom.Circle(0, 0, 30), Phaser.Geom.Circle.Contains);
  }

  private createBase(): Phaser.GameObjects.Shape {
    const base = this.scene.add.circle(0, 0, 28, 0x1E293B, 0.9);
    base.setStrokeStyle(2, this.config.color, 0.6);
    return base;
  }

  private createBody(): Phaser.GameObjects.Shape {
    const body = this.scene.add.circle(0, 0, 18, this.config.color, 0.9);
    body.setStrokeStyle(2, 0xffffff, 0.4);
    return body;
  }

  private updateAppearanceByLevel() {
    const level = this.data.level;
    const color = this.config.color;

    console.log('[TRACE] 更新塔外观，等级:', level);

    if (this.top) {
      this.top.destroy();
      this.top = null;
    }
    if (this.energyGlow) {
      this.energyGlow.destroy();
      this.energyGlow = null;
    }

    switch (level) {
      case 1:
        this.top = this.scene.add.rectangle(0, -5, 16, 16, color, 1);
        this.top.setStrokeStyle(2, 0xffffff, 0.5);
        break;
      case 2:
        this.top = this.scene.add.rectangle(0, -8, 20, 20, color, 1);
        this.top.setStrokeStyle(2, 0xffffff, 0.6);
        this.addEnergyGlow(color, 1);
        break;
      case 3:
        this.top = this.scene.add.polygon(0, -10, this.createOctagonPoints(14), color, 1);
        this.top.setStrokeStyle(2, 0xffffff, 0.7);
        this.addEnergyGlow(color, 2);
        break;
      case 4:
        this.top = this.scene.add.polygon(0, -12, this.createDodecagonPoints(16), color, 1);
        this.top.setStrokeStyle(3, 0xFCD34D, 0.8);
        this.addEnergyGlow(color, 3);
        break;
      case 5:
        this.top = this.scene.add.polygon(0, -15, this.createIcosahedronPoints(18), color, 1);
        this.top.setStrokeStyle(3, 0xFBBF24, 0.9);
        this.addEnergyGlow(color, 5);
        break;
    }

    if (this.top) {
      this.container.add(this.top);
    }

    this.body.setScale(1 + (level - 1) * 0.1);
    this.base.setStrokeStyle(2 + level, color, 0.4 + level * 0.1);
  }

  private createOctagonPoints(size: number): string {
    const points: string[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 8;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      points.push(`${x}, ${y}`);
    }
    return points.join(' ');
  }

  private createDodecagonPoints(size: number): string {
    const points: string[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 12;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      points.push(`${x}, ${y}`);
    }
    return points.join(' ');
  }

  private createIcosahedronPoints(size: number): string {
    const points: string[] = [];
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 - Math.PI / 20;
      const r = i % 2 === 0 ? size : size * 0.8;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      points.push(`${x}, ${y}`);
    }
    return points.join(' ');
  }

  private addEnergyGlow(color: number, level: number) {
    this.energyGlow = this.scene.add.circle(0, 0, 30 + level * 3, color, 0);
    this.energyGlow.setStrokeStyle(2, color, 0.3);
    this.container.addAt(this.energyGlow, 0);

    this.scene.tweens.add({
      targets: this.energyGlow,
      alpha: { from: 0, to: 0.5 },
      scale: { from: 0.8, to: 1.2 },
      duration: 1500 - level * 100,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    const energyFlow = this.scene.add.graphics();
    this.container.addAt(energyFlow, 1);

    const flowTween = this.scene.tweens.addCounter({
      from: 0,
      to: 360,
      duration: 3000 - level * 200,
      repeat: -1,
      ease: 'Linear',
      onUpdate: () => {
        if (!energyFlow.active) return;
        energyFlow.clear();
        const angle = flowTween.getValue() * Math.PI / 180;
        for (let i = 0; i < 3; i++) {
          const a = angle + (i * 2 * Math.PI / 3);
          const px = Math.cos(a) * (22 + level * 2);
          const py = Math.sin(a) * (22 + level * 2);
          energyFlow.fillStyle(color, 0.6);
          energyFlow.fillCircle(px, py, 3);
        }
      }
    });
  }

  private updateRuneIndicators() {
    this.runeIndicators.forEach(r => r.destroy());
    this.runeIndicators = [];

    const runePositions = [
      { x: -15, y: 15 },
      { x: 0, y: 18 },
      { x: 15, y: 15 }
    ];

    this.data.runeSlots.forEach((rune, index) => {
      const pos = runePositions[index];
      if (rune) {
        const indicator = this.scene.add.circle(pos.x, pos.y, 6, rune.color, 0.9);
        indicator.setStrokeStyle(1, 0xffffff, 0.8);
        this.runeIndicators.push(indicator);
        this.container.add(indicator);

        this.scene.tweens.add({
          targets: indicator,
          scale: { from: 1, to: 1.2 },
          duration: 1000 + index * 200,
          repeat: -1,
          yoyo: true
        });
      } else {
        const indicator = this.scene.add.circle(pos.x, pos.y, 5, 0x475569, 0.6);
        indicator.setStrokeStyle(1, 0x64748B, 0.5);
        this.runeIndicators.push(indicator);
        this.container.add(indicator);
      }
    });
  }

  public update(currentTime: number, enemies: Enemy[]): boolean {
    if (!this.active) return false;

    if (this.top) {
      const target = this.findTarget(enemies);
      if (target) {
        const dx = target.getX() - this.container.x;
        const dy = target.getY() - this.container.y;
        const angle = Math.atan2(dy, dx);
        this.top.setRotation(angle);

        if (currentTime - this.lastFireTime >= this.getFireRate()) {
          this.fire(target);
          this.lastFireTime = currentTime;
        }
      }
    }

    return true;
  }

  private getFireRate(): number {
    const speedRune = this.data.runeSlots.find(r => r?.type === 'speed');
    const mod = speedRune ? 1 - speedRune.effect : 1;
    return this.config.fireRate * mod;
  }

  private getRange(): number {
    const rangeRune = this.data.runeSlots.find(r => r?.type === 'range');
    const mod = rangeRune ? 1 + rangeRune.effect : 1;
    return this.config.range * mod * (1 + (this.data.level - 1) * 0.1);
  }

  private getDamage(): number {
    return this.config.damage * (1 + (this.data.level - 1) * 0.3);
  }

  private findTarget(enemies: Enemy[]): Enemy | null {
    const range = this.getRange();
    let closest: Enemy | null = null;
    let closestDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      const dx = enemy.getX() - this.container.x;
      const dy = enemy.getY() - this.container.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= range && distance < closestDist) {
        closest = enemy;
        closestDist = distance;
      }
    }

    return closest;
  }

  private fire(target: Enemy) {
    const runes = this.data.runeSlots.filter(r => r !== null) as Rune[];

    console.log('[TRACE] 塔攻击:', this.id, '目标:', target.id, '伤害:', this.getDamage());

    this.projectilePool.get({
      id: uuidv4(),
      x: this.container.x,
      y: this.container.y,
      targetX: target.getX(),
      targetY: target.getY(),
      targetId: target.id,
      damage: this.getDamage(),
      speed: this.config.projectileSpeed,
      towerType: this.data.type,
      runes,
      onHit: () => {},
      onSplash: () => {}
    });

    if (this.energyGlow) {
      this.scene.tweens.add({
        targets: this.energyGlow,
        scale: { from: 1.2, to: 1.5 },
        alpha: { from: 0.5, to: 0.8 },
        duration: 100,
        yoyo: true
      });
    }
  }

  public showRange(show: boolean) {
    if (show) {
      if (!this.rangeCircle) {
        const range = this.getRange();
        this.rangeCircle = this.scene.add.circle(
          this.container.x,
          this.container.y,
          range,
          0x7DD3FC,
          0.15
        );
        this.rangeCircle.setStrokeStyle(2, 0x7DD3FC, 0.5);
        this.rangeCircle.setDepth(10);
      }
    } else {
      if (this.rangeCircle) {
        this.rangeCircle.destroy();
        this.rangeCircle = null;
      }
    }
  }

  public upgrade() {
    if (this.data.level < 5) {
      this.data.level++;
      console.log('[TRACE] 塔升级:', this.id, '新等级:', this.data.level);
      this.updateAppearanceByLevel();
      this.updateRuneIndicators();
    }
  }

  public embedRune(slotIndex: number, rune: Rune) {
    if (slotIndex >= 0 && slotIndex < 3 && !this.data.runeSlots[slotIndex]) {
      this.data.runeSlots[slotIndex] = rune;
      console.log('[TRACE] 镶嵌符文:', rune.type, '到塔:', this.id, '槽位:', slotIndex);
      this.updateRuneIndicators();
    }
  }

  public removeRune(slotIndex: number): Rune | null {
    if (slotIndex >= 0 && slotIndex < 3 && this.data.runeSlots[slotIndex]) {
      const rune = this.data.runeSlots[slotIndex]!;
      this.data.runeSlots[slotIndex] = null;
      console.log('[TRACE] 移除符文:', rune.type, '从塔:', this.id);
      this.updateRuneIndicators();
      return rune;
    }
    return null;
  }

  public getX(): number {
    return this.container.x;
  }

  public getY(): number {
    return this.container.y;
  }

  public setPosition(x: number, y: number) {
    this.container.x = x;
    this.container.y = y;
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  public destroy() {
    console.log('[TRACE] 销毁塔:', this.id);
    this.showRange(false);
    this.container.destroy();
    this.active = false;
  }
}

export class TowerPool {
  private scene: Phaser.Scene;
  private projectilePool: ProjectilePool;
  private pool: Map<string, Tower> = new Map();
  private maxSize: number = 50;

  constructor(scene: Phaser.Scene, projectilePool: ProjectilePool) {
    this.scene = scene;
    this.projectilePool = projectilePool;
    console.log('[TRACE] 初始化塔对象池，最大容量:', this.maxSize);
  }

  public build(data: TowerData): Tower | null {
    if (this.pool.size >= this.maxSize) {
      console.log('[TRACE] 塔池已满，无法建造新塔');
      return null;
    }

    const tower = new Tower(this.scene, data, this.projectilePool);
    this.pool.set(data.id, tower);
    return tower;
  }

  public update(currentTime: number, enemies: Enemy[]) {
    for (const tower of this.pool.values()) {
      if (tower.active) {
        tower.update(currentTime, enemies);
      }
    }
  }

  public get(id: string): Tower | undefined {
    return this.pool.get(id);
  }

  public getAll(): Tower[] {
    return Array.from(this.pool.values()).filter(t => t.active);
  }

  public upgrade(id: string) {
    const tower = this.pool.get(id);
    if (tower) {
      tower.upgrade();
    }
  }

  public embedRune(towerId: string, slotIndex: number, rune: Rune) {
    const tower = this.pool.get(towerId);
    if (tower) {
      tower.embedRune(slotIndex, rune);
    }
  }

  public removeRune(towerId: string, slotIndex: number): Rune | null {
    const tower = this.pool.get(towerId);
    return tower ? tower.removeRune(slotIndex) : null;
  }

  public remove(id: string) {
    const tower = this.pool.get(id);
    if (tower) {
      tower.destroy();
      this.pool.delete(id);
    }
  }

  public getActiveCount(): number {
    return this.getAll().length;
  }

  public clear() {
    console.log('[TRACE] 清空塔池');
    for (const tower of this.pool.values()) {
      tower.destroy();
    }
    this.pool.clear();
  }
}
