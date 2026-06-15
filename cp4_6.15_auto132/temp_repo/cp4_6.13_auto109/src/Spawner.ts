import { Enemy, EnemyType } from './Enemy';

export class PowerUp {
  x: number;
  y: number;
  size = 15;
  speed = 80;
  time = 0;
  active = true;

  constructor(x: number) {
    this.x = x;
    this.y = -20;
  }

  update(dt: number): void {
    this.y += this.speed * dt;
    this.time += dt;
  }

  isOffScreen(canvasHeight: number): boolean {
    return this.y - this.size > canvasHeight;
  }

  getRadius(): number {
    return this.size;
  }
}

export class Spawner {
  enemySpawnTimer = 0;
  enemySpawnInterval = 1500;
  powerUpSpawnTimer = 0;
  powerUpSpawnInterval = 15000;
  difficulty = 1;
  difficultyTimer = 0;

  update(dt: number, enemies: Enemy[], powerUps: PowerUp[], canvasWidth: number): void {
    const dtMs = dt * 1000;

    this.enemySpawnTimer += dtMs;
    if (this.enemySpawnTimer >= this.enemySpawnInterval) {
      this.enemySpawnTimer -= this.enemySpawnInterval;
      this.spawnEnemy(enemies, canvasWidth);
    }

    this.powerUpSpawnTimer += dtMs;
    if (this.powerUpSpawnTimer >= this.powerUpSpawnInterval) {
      this.powerUpSpawnTimer -= this.powerUpSpawnInterval;
      powerUps.push(new PowerUp(Math.random() * (canvasWidth - 60) + 30));
    }

    this.difficultyTimer += dtMs;
    if (this.difficultyTimer >= 10000) {
      this.difficultyTimer -= 10000;
      this.difficulty += 0.25;
      this.enemySpawnInterval = Math.max(350, 1500 - this.difficulty * 120);
    }
  }

  private spawnEnemy(enemies: Enemy[], canvasWidth: number): void {
    const x = Math.random() * (canvasWidth - 80) + 40;
    const r = Math.random();
    let type: EnemyType;
    if (r < 0.5) type = EnemyType.NORMAL;
    else if (r < 0.8) type = EnemyType.FAST;
    else type = EnemyType.HEAVY;
    enemies.push(new Enemy(x, type));
  }

  reset(): void {
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 1500;
    this.powerUpSpawnTimer = 0;
    this.difficulty = 1;
    this.difficultyTimer = 0;
  }
}
