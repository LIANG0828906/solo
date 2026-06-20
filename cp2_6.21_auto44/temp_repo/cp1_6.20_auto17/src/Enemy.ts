import type { Position, Velocity, Entity, Bullet } from './Player';

export interface EnemyEntity extends Entity, Velocity {
  health: number;
  type: 'enemy' | 'asteroid';
  speed: number;
  rotation: number;
  rotationSpeed: number;
  vertices: Position[];
}

export interface Crystal extends Entity {
  glowPhase: number;
  value: number;
}

const ENEMY_POOL_SIZE = 40;
const ASTEROID_POOL_SIZE = 50;
const CRYSTAL_POOL_SIZE = 20;

export class EnemyManager {
  enemies: EnemyEntity[] = [];
  asteroids: EnemyEntity[] = [];
  crystals: Crystal[] = [];
  canvasWidth: number;
  canvasHeight: number;
  enemySpawnTimer: number = 0;
  asteroidSpawnTimer: number = 0;
  crystalSpawnTimer: number = 0;
  readonly baseEnemySpawnInterval: number = 2.5;
  readonly baseAsteroidSpawnInterval: number = 1.8;
  readonly crystalSpawnInterval: number = 4;
  readonly maxEnemies: number = 20;
  readonly maxAsteroids: number = 30;
  readonly maxCrystals: number = 10;
  difficulty: number = 0;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.initPools();
  }

  private initPools(): void {
    for (let i = 0; i < ENEMY_POOL_SIZE; i++) {
      this.enemies.push(this.createEmptyEnemy('enemy'));
    }
    for (let i = 0; i < ASTEROID_POOL_SIZE; i++) {
      this.asteroids.push(this.createEmptyEnemy('asteroid'));
    }
    for (let i = 0; i < CRYSTAL_POOL_SIZE; i++) {
      this.crystals.push({
        x: 0, y: 0, width: 20, height: 20,
        active: false, glowPhase: 0, value: 20
      });
    }
  }

  private createEmptyEnemy(type: 'enemy' | 'asteroid'): EnemyEntity {
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      width: type === 'enemy' ? 28 : 36,
      height: type === 'enemy' ? 28 : 36,
      active: false,
      health: type === 'enemy' ? 2 : 3,
      type,
      speed: 0,
      rotation: 0,
      rotationSpeed: 0,
      vertices: []
    };
  }

  private generateAsteroidVertices(size: number): Position[] {
    const vertices: Position[] = [];
    const points = 7 + Math.floor(Math.random() * 4);
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = size * (0.6 + Math.random() * 0.4);
      vertices.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      });
    }
    return vertices;
  }

  private getSpawnPosition(): Position {
    const side = Math.floor(Math.random() * 4);
    const margin = 50;
    switch (side) {
      case 0: return { x: Math.random() * this.canvasWidth, y: -margin };
      case 1: return { x: this.canvasWidth + margin, y: Math.random() * this.canvasHeight };
      case 2: return { x: Math.random() * this.canvasWidth, y: this.canvasHeight + margin };
      default: return { x: -margin, y: Math.random() * this.canvasHeight };
    }
  }

  update(dt: number, playerX: number, playerY: number, survivalTime: number, gameActive: boolean): void {
    this.difficulty = Math.min(1, survivalTime / 120);

    if (gameActive) {
      const enemyInterval = this.baseEnemySpawnInterval * (1 - this.difficulty * 0.6);
      const asteroidInterval = this.baseAsteroidSpawnInterval * (1 - this.difficulty * 0.5);

      this.enemySpawnTimer += dt;
      if (this.enemySpawnTimer >= enemyInterval) {
        this.enemySpawnTimer = 0;
        const activeCount = this.enemies.filter(e => e.active).length;
        const maxAllowed = Math.floor(this.maxEnemies * (0.4 + this.difficulty * 0.6));
        if (activeCount < maxAllowed) {
          this.spawnEnemy(playerX, playerY);
        }
      }

      this.asteroidSpawnTimer += dt;
      if (this.asteroidSpawnTimer >= asteroidInterval) {
        this.asteroidSpawnTimer = 0;
        const activeCount = this.asteroids.filter(a => a.active).length;
        const maxAllowed = Math.floor(this.maxAsteroids * (0.5 + this.difficulty * 0.5));
        if (activeCount < maxAllowed) {
          this.spawnAsteroid(playerX, playerY);
        }
      }

      this.crystalSpawnTimer += dt;
      if (this.crystalSpawnTimer >= this.crystalSpawnInterval) {
        this.crystalSpawnTimer = 0;
        const activeCount = this.crystals.filter(c => c.active).length;
        if (activeCount < this.maxCrystals) {
          this.spawnCrystal();
        }
      }
    }

    this.updateEnemies(dt, playerX, playerY);
    this.updateAsteroids(dt);
    this.updateCrystals(dt);
  }

  private spawnEnemy(playerX: number, playerY: number): void {
    const enemy = this.enemies.find(e => !e.active);
    if (!enemy) return;

    const pos = this.getSpawnPosition();
    const dx = playerX - pos.x;
    const dy = playerY - pos.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const speed = 60 + this.difficulty * 80;

    enemy.active = true;
    enemy.x = pos.x;
    enemy.y = pos.y;
    enemy.vx = (dx / len) * speed;
    enemy.vy = (dy / len) * speed;
    enemy.speed = speed;
    enemy.health = 2;
    enemy.rotation = 0;
    enemy.rotationSpeed = (Math.random() - 0.5) * 120;
  }

  private spawnAsteroid(playerX: number, playerY: number): void {
    const asteroid = this.asteroids.find(a => !a.active);
    if (!asteroid) return;

    const pos = this.getSpawnPosition();
    const targetX = playerX + (Math.random() - 0.5) * 300;
    const targetY = playerY + (Math.random() - 0.5) * 300;
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const speed = 40 + Math.random() * 60 + this.difficulty * 40;
    const size = 24 + Math.random() * 24;

    asteroid.active = true;
    asteroid.x = pos.x;
    asteroid.y = pos.y;
    asteroid.vx = (dx / len) * speed;
    asteroid.vy = (dy / len) * speed;
    asteroid.speed = speed;
    asteroid.width = size * 2;
    asteroid.height = size * 2;
    asteroid.health = Math.ceil(size / 12);
    asteroid.rotation = Math.random() * Math.PI * 2;
    asteroid.rotationSpeed = (Math.random() - 0.5) * 60;
    asteroid.vertices = this.generateAsteroidVertices(size);
  }

  private spawnCrystal(): void {
    const crystal = this.crystals.find(c => !c.active);
    if (!crystal) return;

    const margin = 80;
    crystal.active = true;
    crystal.x = margin + Math.random() * (this.canvasWidth - margin * 2);
    crystal.y = margin + 60 + Math.random() * (this.canvasHeight - margin * 2 - 60);
    crystal.glowPhase = Math.random() * Math.PI * 2;
    crystal.value = 15 + Math.floor(Math.random() * 15);
  }

  private updateEnemies(dt: number, playerX: number, playerY: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const dx = playerX - enemy.x;
      const dy = playerY - enemy.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        enemy.vx = (dx / len) * enemy.speed;
        enemy.vy = (dy / len) * enemy.speed;
      }

      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      enemy.rotation += enemy.rotationSpeed * dt;

      if (enemy.x < -100 || enemy.x > this.canvasWidth + 100 ||
          enemy.y < -100 || enemy.y > this.canvasHeight + 100) {
        enemy.active = false;
      }
    }
  }

  private updateAsteroids(dt: number): void {
    for (const asteroid of this.asteroids) {
      if (!asteroid.active) continue;

      asteroid.x += asteroid.vx * dt;
      asteroid.y += asteroid.vy * dt;
      asteroid.rotation += asteroid.rotationSpeed * dt;

      if (asteroid.x < -100 || asteroid.x > this.canvasWidth + 100 ||
          asteroid.y < -100 || asteroid.y > this.canvasHeight + 100) {
        asteroid.active = false;
      }
    }
  }

  private updateCrystals(dt: number): void {
    for (const crystal of this.crystals) {
      if (!crystal.active) continue;
      crystal.glowPhase += dt * 3;
    }
  }

  checkBulletCollisions(bullets: Bullet[], onHit: (x: number, y: number, type: string) => void): number {
    let scoreGained = 0;

    for (const bullet of bullets) {
      if (!bullet.active) continue;

      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        if (this.circleCollision(bullet, enemy)) {
          bullet.active = false;
          bullet.trail = [];
          enemy.health -= 1;
          onHit(bullet.x, bullet.y, 'enemy');
          if (enemy.health <= 0) {
            enemy.active = false;
            scoreGained += 100;
            onHit(enemy.x, enemy.y, 'enemy_destroy');
          }
          break;
        }
      }

      if (!bullet.active) continue;

      for (const asteroid of this.asteroids) {
        if (!asteroid.active) continue;
        if (this.circleCollision(bullet, asteroid)) {
          bullet.active = false;
          bullet.trail = [];
          asteroid.health -= 1;
          onHit(bullet.x, bullet.y, 'asteroid');
          if (asteroid.health <= 0) {
            asteroid.active = false;
            scoreGained += 50;
            onHit(asteroid.x, asteroid.y, 'asteroid_destroy');
          }
          break;
        }
      }
    }

    return scoreGained;
  }

  checkPlayerCollision(px: number, py: number, pRadius: number): boolean {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - px;
      const dy = enemy.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < pRadius + enemy.width / 2) {
        return true;
      }
    }
    for (const asteroid of this.asteroids) {
      if (!asteroid.active) continue;
      const dx = asteroid.x - px;
      const dy = asteroid.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < pRadius + asteroid.width / 2) {
        return true;
      }
    }
    return false;
  }

  private circleCollision(a: { x: number; y: number; width: number }, b: { x: number; y: number; width: number }): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < a.width / 2 + b.width / 2;
  }

  resize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  reset(): void {
    this.enemies.forEach(e => e.active = false);
    this.asteroids.forEach(a => a.active = false);
    this.crystals.forEach(c => c.active = false);
    this.enemySpawnTimer = 0;
    this.asteroidSpawnTimer = 0;
    this.crystalSpawnTimer = 0;
    this.difficulty = 0;
  }
}
