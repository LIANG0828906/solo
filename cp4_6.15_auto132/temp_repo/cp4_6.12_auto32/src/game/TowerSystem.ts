import { Point, HexCoord } from './PathManager';

export type TowerType = 'arrow' | 'magic' | 'cannon';

export interface TowerConfig {
  type: TowerType;
  name: string;
  damage: number;
  range: number;
  attackSpeed: number;
  cost: number;
  color: string;
}

export interface Tower {
  id: number;
  type: TowerType;
  hexCoord: HexCoord;
  position: Point;
  damage: number;
  range: number;
  attackSpeed: number;
  lastAttackTime: number;
  angle: number;
  targetId: number | null;
  level: number;
}

export interface Projectile {
  id: number;
  position: Point;
  targetId: number;
  damage: number;
  speed: number;
  color: string;
  towerType: TowerType;
}

export interface Enemy {
  id: number;
  position: Point;
  health: number;
}

export interface ExplosionParticle {
  position: Point;
  velocity: Point;
  life: number;
  color: string;
  size: number;
}

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  arrow: {
    type: 'arrow',
    name: 'Arrow Tower',
    damage: 15,
    range: 120,
    attackSpeed: 1.5,
    cost: 50,
    color: '#4A3728',
  },
  magic: {
    type: 'magic',
    name: 'Magic Tower',
    damage: 40,
    range: 100,
    attackSpeed: 3.0,
    cost: 100,
    color: '#8B5CF6',
  },
  cannon: {
    type: 'cannon',
    name: 'Cannon Tower',
    damage: 60,
    range: 80,
    attackSpeed: 4.0,
    cost: 150,
    color: '#DC2626',
  },
};

const PROJECTILE_SPEEDS: Record<TowerType, number> = {
  arrow: 400,
  magic: 350,
  cannon: 300,
};

export class TowerSystem {
  public towers: Tower[];
  public projectiles: Projectile[];
  public selectedTowerId: number | null;

  private nextTowerId: number;
  private nextProjectileId: number;
  private maxProjectiles: number = 200;
  private explosionParticles: ExplosionParticle[];

  constructor() {
    this.towers = [];
    this.projectiles = [];
    this.selectedTowerId = null;
    this.nextTowerId = 1;
    this.nextProjectileId = 1;
    this.explosionParticles = [];
  }

  public addTower(type: TowerType, hex: HexCoord, position: Point): Tower | null {
    if (this.projectiles.length >= this.maxProjectiles) {
      return null;
    }

    const config = TOWER_CONFIGS[type];
    const tower: Tower = {
      id: this.nextTowerId++,
      type,
      hexCoord: { ...hex },
      position: { ...position },
      damage: config.damage,
      range: config.range,
      attackSpeed: config.attackSpeed,
      lastAttackTime: 0,
      angle: 0,
      targetId: null,
      level: 1,
    };

    this.towers.push(tower);
    return tower;
  }

  public removeTower(id: number): boolean {
    const index = this.towers.findIndex((t) => t.id === id);
    if (index === -1) {
      return false;
    }
    this.towers.splice(index, 1);
    if (this.selectedTowerId === id) {
      this.selectedTowerId = null;
    }
    return true;
  }

  public getTowerAtHex(hex: HexCoord): Tower | undefined {
    return this.towers.find(
      (t) => t.hexCoord.q === hex.q && t.hexCoord.r === hex.r
    );
  }

  public selectTower(id: number | null): void {
    this.selectedTowerId = id;
  }

  public getTowerById(id: number): Tower | undefined {
    return this.towers.find((t) => t.id === id);
  }

  public update(
    deltaTime: number,
    enemies: Enemy[],
    now: number,
    onHit: (enemyId: number, damage: number) => void
  ): void {
    for (const tower of this.towers) {
      const cooldown = 1000 / tower.attackSpeed;
      if (now - tower.lastAttackTime < cooldown) {
        continue;
      }

      const target = this.findTarget(tower, enemies);
      if (!target) {
        tower.targetId = null;
        continue;
      }

      tower.targetId = target.id;
      const dx = target.position.x - tower.position.x;
      const dy = target.position.y - tower.position.y;
      tower.angle = Math.atan2(dy, dx);

      this.fireProjectile(tower, target);
      tower.lastAttackTime = now;
    }

    this.updateProjectiles(deltaTime, enemies, onHit);
  }

  private findTarget(tower: Tower, enemies: Enemy[]): Enemy | null {
    let closestEnemy: Enemy | null = null;
    let closestDistance = Infinity;

    for (const enemy of enemies) {
      if (enemy.health <= 0) {
        continue;
      }

      const dx = enemy.position.x - tower.position.x;
      const dy = enemy.position.y - tower.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= tower.range && distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }

    return closestEnemy;
  }

  private fireProjectile(tower: Tower, target: Enemy): void {
    if (this.projectiles.length >= this.maxProjectiles) {
      return;
    }

    const config = TOWER_CONFIGS[tower.type];
    const projectile: Projectile = {
      id: this.nextProjectileId++,
      position: { ...tower.position },
      targetId: target.id,
      damage: tower.damage,
      speed: PROJECTILE_SPEEDS[tower.type],
      color: config.color,
      towerType: tower.type,
    };

    this.projectiles.push(projectile);
  }

  private updateProjectiles(
    deltaTime: number,
    enemies: Enemy[],
    onHit: (enemyId: number, damage: number) => void
  ): void {
    const enemiesMap = new Map<number, Enemy>();
    for (const enemy of enemies) {
      enemiesMap.set(enemy.id, enemy);
    }

    const activeProjectiles: Projectile[] = [];

    for (const projectile of this.projectiles) {
      const target = enemiesMap.get(projectile.targetId);

      if (!target || target.health <= 0) {
        continue;
      }

      const dx = target.position.x - projectile.position.x;
      const dy = target.position.y - projectile.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 5) {
        onHit(target.id, projectile.damage);
        this.createExplosionParticles(projectile.position);
        continue;
      }

      const moveDistance = projectile.speed * deltaTime;
      const ratio = moveDistance / distance;

      projectile.position.x += dx * ratio;
      projectile.position.y += dy * ratio;

      if (distance > 500) {
        continue;
      }

      activeProjectiles.push(projectile);
    }

    this.projectiles = activeProjectiles;
  }

  private createExplosionParticles(position: Point): void {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const speed = 80 + Math.random() * 40;
      this.explosionParticles.push({
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        life: 0.3,
        color: '#ffffff',
        size: 3,
      });
    }
  }

  public getExplosionParticles(): ExplosionParticle[] {
    const particles = this.explosionParticles;
    this.explosionParticles = [];
    return particles;
  }
}
