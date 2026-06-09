import { TowerType, TowerConfig, TOWER_CONFIGS, CELL_SIZE, MAX_TOWER_LEVEL } from './types';
import { Enemy } from './enemy';
import { Bullet } from './bullet';
import { Particle } from './particle';

export class Tower {
  type: TowerType;
  config: TowerConfig;
  level: number;
  gridX: number;
  gridY: number;
  x: number;
  y: number;
  damage: number;
  range: number;
  fireRate: number;
  lastFireTime: number;
  target: Enemy | null = null;
  targetAngle: number = 0;
  buildProgress: number = 0;
  isBuilding: boolean = true;
  rotationAngle: number = 0;
  rotationSpeed: number = 0;

  constructor(gridX: number, gridY: number, type: TowerType) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = gridX * CELL_SIZE + CELL_SIZE / 2;
    this.y = gridY * CELL_SIZE + CELL_SIZE / 2;
    this.type = type;
    this.config = TOWER_CONFIGS[type];
    this.level = 1;
    this.damage = this.config.damage;
    this.range = this.config.range;
    this.fireRate = this.config.fireRate;
    this.lastFireTime = 0;
  }

  update(enemies: Enemy[], currentTime: number, deltaTime: number): Bullet | null {
    if (this.isBuilding) {
      this.buildProgress += deltaTime / 500;
      if (this.buildProgress >= 1) {
        this.buildProgress = 1;
        this.isBuilding = false;
      }
      return null;
    }

    if (this.level > 1) {
      this.rotationAngle += this.rotationSpeed * deltaTime / 16.67;
    }

    this.target = this.findTarget(enemies);
    
    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      this.targetAngle = Math.atan2(dy, dx);
      
      if (currentTime - this.lastFireTime >= this.fireRate) {
        this.lastFireTime = currentTime;
        return this.fire();
      }
    }

    return null;
  }

  private findTarget(enemies: Enemy[]): Enemy | null {
    let bestTarget: Enemy | null = null;
    let bestProgress = -1;

    for (const enemy of enemies) {
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distSq = dx * dx + dy * dy;
      
      if (distSq <= this.range * this.range) {
        if (enemy.pathIndex > bestProgress) {
          bestProgress = enemy.pathIndex;
          bestTarget = enemy;
        }
      }
    }

    return bestTarget;
  }

  private fire(): Bullet {
    if (!this.target) {
      throw new Error('No target to fire at');
    }

    return Bullet.create(
      this.x,
      this.y - 8,
      this.target.x,
      this.target.y,
      this.type,
      this.damage,
      this.config.bulletSpeed,
      this.config.isPiercing,
      this.config.splashRadius
    );
  }

  createMuzzleFlash(): Particle[] {
    const muzzleX = this.x + Math.cos(this.targetAngle) * 16;
    const muzzleY = this.y - 8 + Math.sin(this.targetAngle) * 16;
    return Particle.createMuzzleFlash(muzzleX, muzzleY, this.targetAngle);
  }

  upgrade(): boolean {
    if (this.level >= MAX_TOWER_LEVEL) return false;
    
    this.level++;
    this.damage = Math.floor(this.config.damage * (1 + 0.1 * (this.level - 1)));
    this.range = Math.floor(this.config.range * (1 + 0.05 * (this.level - 1)));
    this.rotationSpeed = this.level * 0.05;
    
    return true;
  }

  getUpgradeCost(): number {
    return Math.floor(this.config.cost * 0.6 * this.level);
  }

  canUpgrade(): boolean {
    return this.level < MAX_TOWER_LEVEL;
  }

  getTotalDamage(): number {
    return this.damage;
  }

  getBuildHeight(): number {
    return CELL_SIZE * 0.8 * this.buildProgress;
  }
}

export class TowerManager {
  private towers: Tower[] = [];

  add(tower: Tower): void {
    this.towers.push(tower);
  }

  update(enemies: Enemy[], currentTime: number, deltaTime: number): Bullet[] {
    const bullets: Bullet[] = [];
    
    for (const tower of this.towers) {
      const bullet = tower.update(enemies, currentTime, deltaTime);
      if (bullet) {
        bullets.push(bullet);
      }
    }

    return bullets;
  }

  getAll(): Tower[] {
    return this.towers;
  }

  getAt(gridX: number, gridY: number): Tower | undefined {
    return this.towers.find(t => t.gridX === gridX && t.gridY === gridY);
  }

  hasTowerAt(gridX: number, gridY: number): boolean {
    return this.towers.some(t => t.gridX === gridX && t.gridY === gridY);
  }

  clear(): void {
    this.towers = [];
  }

  getCount(): number {
    return this.towers.length;
  }
}
