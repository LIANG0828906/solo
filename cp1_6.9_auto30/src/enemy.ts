import { EnemyType, EnemyConfig, Position, PATH_POINTS, CELL_SIZE, ENEMY_CONFIGS } from './types';
import { Particle } from './particle';

let enemyIdCounter = 0;

export class Enemy {
  readonly id: number;
  type: EnemyType;
  config: EnemyConfig;
  health: number;
  maxHealth: number;
  speed: number;
  baseSpeed: number;
  pathIndex: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isHit: boolean;
  hitTimer: number;
  walkFrame: number;
  walkTimer: number;
  active: boolean = true;
  reachedEnd: boolean = false;

  constructor(type: EnemyType, waveMultiplier: number = 1) {
    this.id = enemyIdCounter++;
    this.type = type;
    this.config = ENEMY_CONFIGS[type];
    this.maxHealth = Math.floor(this.config.health * waveMultiplier);
    this.health = this.maxHealth;
    this.baseSpeed = this.config.speed;
    this.speed = this.baseSpeed;
    this.pathIndex = 0;
    this.isHit = false;
    this.hitTimer = 0;
    this.walkFrame = 0;
    this.walkTimer = 0;
    
    const startPoint = PATH_POINTS[0];
    this.x = startPoint.x * CELL_SIZE + CELL_SIZE / 2;
    this.y = startPoint.y * CELL_SIZE + CELL_SIZE / 2;
    this.targetX = this.x;
    this.targetY = this.y;
    this.updateTarget();
  }

  private updateTarget(): void {
    if (this.pathIndex < PATH_POINTS.length - 1) {
      const nextPoint = PATH_POINTS[this.pathIndex + 1];
      this.targetX = nextPoint.x * CELL_SIZE + CELL_SIZE / 2;
      this.targetY = nextPoint.y * CELL_SIZE + CELL_SIZE / 2;
    }
  }

  update(deltaTime: number): boolean {
    if (!this.active) return false;

    if (this.isHit) {
      this.hitTimer -= deltaTime;
      if (this.hitTimer <= 0) {
        this.isHit = false;
      }
    }

    this.walkTimer += deltaTime;
    if (this.walkTimer > 200) {
      this.walkTimer = 0;
      this.walkFrame = (this.walkFrame + 1) % 2;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.speed * 2) {
      this.pathIndex++;
      if (this.pathIndex >= PATH_POINTS.length - 1) {
        this.reachedEnd = true;
        this.active = false;
        return false;
      }
      this.updateTarget();
    } else {
      const moveSpeed = this.speed * deltaTime / 16.67;
      this.x += (dx / dist) * moveSpeed;
      this.y += (dy / dist) * moveSpeed;
    }

    return true;
  }

  takeDamage(damage: number): boolean {
    this.health -= damage;
    this.isHit = true;
    this.hitTimer = 150;
    
    if (this.health <= 0) {
      this.active = false;
      return true;
    }
    return false;
  }

  getPosition(): Position {
    return { x: this.x, y: this.y };
  }

  getDeathParticles(): Particle[] {
    return Particle.createDebris(this.x, this.y, this.config.color);
  }

  getGoldReward(): number {
    return this.config.gold;
  }

  getSize(): number {
    return this.type === 'heavy' ? 14 : this.type === 'fast' ? 8 : 10;
  }
}

export class EnemyManager {
  private enemies: Enemy[] = [];

  add(enemy: Enemy): void {
    this.enemies.push(enemy);
  }

  update(deltaTime: number): { reachedEnd: Enemy[]; dead: Enemy[] } {
    const reachedEnd: Enemy[] = [];
    const dead: Enemy[] = [];
    
    this.enemies = this.enemies.filter(enemy => {
      const stillActive = enemy.update(deltaTime);
      if (!stillActive) {
        if (enemy.reachedEnd) {
          reachedEnd.push(enemy);
        } else {
          dead.push(enemy);
        }
        return false;
      }
      return true;
    });

    return { reachedEnd, dead };
  }

  getAll(): Enemy[] {
    return this.enemies;
  }

  getCount(): number {
    return this.enemies.length;
  }

  clear(): void {
    this.enemies = [];
  }

  getEnemiesInRange(x: number, y: number, range: number): Enemy[] {
    const result: Enemy[] = [];
    for (const enemy of this.enemies) {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      if (dx * dx + dy * dy <= range * range) {
        result.push(enemy);
      }
    }
    return result;
  }

  getClosestEnemy(x: number, y: number, range: number): Enemy | null {
    let closest: Enemy | null = null;
    let closestDist = range * range;
    
    for (const enemy of this.enemies) {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq <= closestDist) {
        closestDist = distSq;
        closest = enemy;
      }
    }
    
    return closest;
  }
}
