import { Enemy, EnemyType, Position, Particle, Hive } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class EnemyManager {
  private enemies: Enemy[] = [];
  private mapSize: { width: number; height: number } = { width: 1200, height: 600 };
  private hivePosition: Position = { x: 200, y: 300 };

  setMapSize(width: number, height: number): void {
    this.mapSize = { width, height };
  }

  setHivePosition(pos: Position): void {
    this.hivePosition = { ...pos };
  }

  getEnemies(): Enemy[] {
    return this.enemies;
  }

  setEnemies(enemies: Enemy[]): void {
    this.enemies = enemies;
  }

  spawnWave(waveNumber: number): Enemy[] {
    const enemyCount = Math.min(3 + Math.floor(waveNumber * 1.5), 20);
    const newEnemies: Enemy[] = [];

    for (let i = 0; i < enemyCount; i++) {
      const rand = Math.random();
      let type: EnemyType;
      if (waveNumber < 3) {
        type = rand < 0.7 ? 'wasp' : 'bumblebee';
      } else if (waveNumber < 6) {
        type = rand < 0.5 ? 'wasp' : rand < 0.85 ? 'bumblebee' : 'hornet';
      } else {
        type = rand < 0.4 ? 'wasp' : rand < 0.7 ? 'bumblebee' : 'hornet';
      }

      const enemy = this.createEnemy(type);
      newEnemies.push(enemy);
      this.enemies.push(enemy);
    }

    return newEnemies;
  }

  private createEnemy(type: EnemyType): Enemy {
    const configs = {
      wasp: { health: 30, speed: 60, damage: 50 },
      bumblebee: { health: 80, speed: 30, damage: 80 },
      hornet: { health: 60, speed: 80, damage: 70 },
    };

    const config = configs[type];
    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;

    switch (side) {
      case 0:
        x = Math.random() * this.mapSize.width;
        y = -20;
        break;
      case 1:
        x = this.mapSize.width + 20;
        y = Math.random() * this.mapSize.height;
        break;
      case 2:
        x = Math.random() * this.mapSize.width;
        y = this.mapSize.height + 20;
        break;
      default:
        x = -20;
        y = Math.random() * this.mapSize.height;
    }

    return {
      id: uuidv4(),
      type,
      position: { x, y },
      health: config.health,
      maxHealth: config.health,
      speed: config.speed,
      damage: config.damage,
      hitFlash: 0,
      knockback: { x: 0, y: 0 },
    };
  }

  update(dt: number, hive: Hive): {
    enemies: Enemy[];
    hiveDamage: number;
    particles: Particle[];
    enemiesReachedHive: string[];
  } {
    const particles: Particle[] = [];
    let hiveDamage = 0;
    const enemiesReachedHive: string[] = [];

    const updatedEnemies = this.enemies.map((enemy) => {
      let updatedEnemy = { ...enemy };

      if (updatedEnemy.hitFlash > 0) {
        updatedEnemy.hitFlash = Math.max(0, updatedEnemy.hitFlash - dt);
      }

      updatedEnemy.knockback = {
        x: updatedEnemy.knockback.x * 0.9,
        y: updatedEnemy.knockback.y * 0.9,
      };

      updatedEnemy.position.x += updatedEnemy.knockback.x * dt;
      updatedEnemy.position.y += updatedEnemy.knockback.y * dt;

      const dx = this.hivePosition.x - updatedEnemy.position.x;
      const dy = this.hivePosition.y - updatedEnemy.position.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 25) {
        hiveDamage += updatedEnemy.damage;
        enemiesReachedHive.push(updatedEnemy.id);

        for (let i = 0; i < 5; i++) {
          particles.push({
            id: uuidv4(),
            position: { ...updatedEnemy.position },
            velocity: {
              x: (Math.random() - 0.5) * 100,
              y: (Math.random() - 0.5) * 100,
            },
            life: 0.4,
            maxLife: 0.4,
            color: 'rgba(255, 100, 100, 0.8)',
            size: 3 + Math.random() * 3,
          });
        }

        return { ...updatedEnemy, health: 0 };
      }

      if (dist > 0) {
        const moveDist = updatedEnemy.speed * dt;
        const ratio = Math.min(1, moveDist / dist);
        updatedEnemy.position.x += dx * ratio;
        updatedEnemy.position.y += dy * ratio;
      }

      return updatedEnemy;
    });

    this.enemies = updatedEnemies.filter((e) => e.health > 0);

    return {
      enemies: this.enemies,
      hiveDamage,
      particles,
      enemiesReachedHive,
    };
  }

  damageEnemy(enemyId: string, damage: number): boolean {
    const enemyIndex = this.enemies.findIndex((e) => e.id === enemyId);
    if (enemyIndex === -1) return false;

    const enemy = this.enemies[enemyIndex];
    enemy.health -= damage;
    enemy.hitFlash = 0.2;

    const dx = enemy.position.x - this.hivePosition.x;
    const dy = enemy.position.y - this.hivePosition.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      enemy.knockback = {
        x: (dx / dist) * 50,
        y: (dy / dist) * 50,
      };
    }

    if (enemy.health <= 0) {
      this.enemies.splice(enemyIndex, 1);
      return true;
    }

    this.enemies[enemyIndex] = enemy;
    return false;
  }

  getEnemyCount(): number {
    return this.enemies.length;
  }
}
