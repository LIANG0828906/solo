import { Bullet, Asteroid, ExplosionFragment, AsteroidSize, AsteroidType, GameConfig } from './entities';

const CONFIG: GameConfig = {
  canvasWidth: 800,
  canvasHeight: 600
};

const COMBO_TIME_WINDOW = 500;
const MAX_DIFFICULTY_LEVEL = 5;

export class BulletManager {
  pool: Bullet[] = [];
  maxBullets: number = 50;

  constructor() {
    for (let i = 0; i < this.maxBullets; i++) {
      this.pool.push(new Bullet());
    }
  }

  fire(x: number, y: number): void {
    const bullet = this.pool.find(b => !b.active);
    if (bullet) {
      bullet.init(x, y);
    }
  }

  update(): void {
    this.pool.forEach(bullet => {
      if (bullet.active) {
        bullet.update();
      }
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.pool.forEach(bullet => {
      if (bullet.active) {
        bullet.render(ctx);
      }
    });
  }

  getActiveBullets(): Bullet[] {
    return this.pool.filter(b => b.active);
  }

  reset(): void {
    this.pool.forEach(bullet => {
      bullet.active = false;
    });
  }
}

export class AsteroidManager {
  pool: Asteroid[] = [];
  fragmentPool: ExplosionFragment[] = [];
  maxAsteroids: number = 200;
  maxFragments: number = 100;

  spawnRate: number = 0.02;
  baseSpeed: number = 2;
  difficultyLevel: number = 1;

  lastHitTime: number = 0;
  comboCount: number = 0;

  spawnTimer: number = 0;
  baseSpawnInterval: number = 50;

  constructor() {
    for (let i = 0; i < this.maxAsteroids; i++) {
      this.pool.push(new Asteroid());
    }
    for (let i = 0; i < this.maxFragments; i++) {
      this.fragmentPool.push(new ExplosionFragment());
    }
  }

  spawn(): void {
    const activeCount = this.pool.filter(a => a.active).length;
    if (activeCount >= this.maxAsteroids) return;

    const asteroid = this.pool.find(a => !a.active);
    if (!asteroid) return;

    const sizeRoll = Math.random();
    let size: AsteroidSize;
    if (sizeRoll < 0.2) {
      size = AsteroidSize.LARGE;
    } else if (sizeRoll < 0.55) {
      size = AsteroidSize.MEDIUM;
    } else {
      size = AsteroidSize.SMALL;
    }

    let type = AsteroidType.NORMAL;
    if (this.difficultyLevel >= 2 && Math.random() < 0.1 * (this.difficultyLevel - 1)) {
      type = AsteroidType.EXPLOSIVE;
    }

    const x = CONFIG.canvasWidth + 50;
    const y = 60 + Math.random() * (CONFIG.canvasHeight - 120);

    asteroid.init(x, y, size, type);
    asteroid.vx *= (1 + (this.difficultyLevel - 1) * 0.1);
  }

  update(): void {
    this.spawnTimer++;
    const adjustedInterval = this.baseSpawnInterval / (1 + (this.difficultyLevel - 1) * 0.15);
    if (this.spawnTimer >= adjustedInterval) {
      this.spawn();
      this.spawnTimer = 0;
    }

    this.pool.forEach(asteroid => {
      if (asteroid.active) {
        asteroid.update();
      }
    });

    this.fragmentPool.forEach(fragment => {
      if (fragment.active) {
        fragment.update();
      }
    });

    if (Date.now() - this.lastHitTime > COMBO_TIME_WINDOW && this.comboCount > 0) {
      this.comboCount = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.pool.forEach(asteroid => {
      if (asteroid.active) {
        asteroid.render(ctx);
      }
    });

    this.fragmentPool.forEach(fragment => {
      if (fragment.active) {
        fragment.render(ctx);
      }
    });
  }

  checkBulletCollisions(bullets: Bullet[], onScore: (points: number) => void): void {
    const activeBullets = bullets.filter(b => b.active);
    const activeAsteroids = this.pool.filter(a => a.active);

    for (const bullet of activeBullets) {
      for (const asteroid of activeAsteroids) {
        if (!bullet.active || !asteroid.active) continue;

        const bulletBounds = bullet.getBounds();
        if (asteroid.collidesWithRect(bulletBounds)) {
          bullet.active = false;

          if (asteroid.hit(1)) {
            const baseScore = asteroid.scoreValue;
            const comboBonus = this.calculateComboBonus();
            const totalScore = baseScore + comboBonus;
            onScore(totalScore);

            this.lastHitTime = Date.now();
            this.comboCount++;

            if (asteroid.type === AsteroidType.EXPLOSIVE) {
              this.triggerExplosion(asteroid.x, asteroid.y);
            } else {
              this.splitAsteroid(asteroid);
            }

            asteroid.active = false;
          }
          break;
        }
      }
    }
  }

  checkPlayerCollision(player: { getBounds: () => { left: number; right: number; top: number; bottom: number }; isInvincible: boolean; hit: () => boolean }): boolean {
    if (player.isInvincible) return true;

    const playerBounds = player.getBounds();

    for (const asteroid of this.pool) {
      if (!asteroid.active) continue;
      if (asteroid.collidesWithRect(playerBounds)) {
        return player.hit();
      }
    }

    for (const fragment of this.fragmentPool) {
      if (!fragment.active) continue;
      if (fragment.collidesWithRect(playerBounds)) {
        return player.hit();
      }
    }

    return true;
  }

  splitAsteroid(asteroid: Asteroid): void {
    if (asteroid.size === AsteroidSize.SMALL) return;

    const activeCount = this.pool.filter(a => a.active).length;

    if (asteroid.size === AsteroidSize.LARGE) {
      if (activeCount + 2 <= this.maxAsteroids) {
        const offsets = [-1, 1];
        offsets.forEach(offset => {
          const newAsteroid = this.pool.find(a => !a.active);
          if (newAsteroid) {
            newAsteroid.init(asteroid.x, asteroid.y, AsteroidSize.MEDIUM);
            newAsteroid.vx = asteroid.vx * 0.8;
            newAsteroid.vy = offset * 1.5;
          }
        });
      }
    } else if (asteroid.size === AsteroidSize.MEDIUM) {
      if (activeCount + 3 <= this.maxAsteroids) {
        const angles = [120, 180, 240].map(deg => (deg * Math.PI) / 180);
        angles.forEach(angle => {
          const newAsteroid = this.pool.find(a => !a.active);
          if (newAsteroid) {
            newAsteroid.init(asteroid.x, asteroid.y, AsteroidSize.SMALL);
            newAsteroid.vx = Math.cos(angle) * 2 + asteroid.vx * 0.5;
            newAsteroid.vy = Math.sin(angle) * 2;
          }
        });
      }
    }
  }

  triggerExplosion(x: number, y: number): void {
    const fragmentCount = 10;
    const angleStep = (Math.PI * 2) / fragmentCount;

    for (let i = 0; i < fragmentCount; i++) {
      const fragment = this.fragmentPool.find(f => !f.active);
      if (fragment) {
        const angle = i * angleStep + Math.random() * 0.3;
        fragment.init(x, y, angle);
      }
    }
  }

  calculateComboBonus(): number {
    if (this.comboCount < 1) return 0;

    const comboLevel = this.comboCount;
    if (comboLevel === 1) return 5;
    if (comboLevel === 2) return 10;
    if (comboLevel === 3) return 20;
    return 40;
  }

  increaseDifficulty(): void {
    if (this.difficultyLevel < MAX_DIFFICULTY_LEVEL) {
      this.difficultyLevel++;
    }
  }

  getComboCount(): number {
    return this.comboCount;
  }

  getActiveAsteroids(): Asteroid[] {
    return this.pool.filter(a => a.active);
  }

  reset(): void {
    this.pool.forEach(asteroid => {
      asteroid.active = false;
    });
    this.fragmentPool.forEach(fragment => {
      fragment.active = false;
    });
    this.difficultyLevel = 1;
    this.comboCount = 0;
    this.lastHitTime = 0;
    this.spawnTimer = 0;
  }
}
