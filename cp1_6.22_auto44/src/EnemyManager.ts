import { Enemy } from './Enemy';
import { EnemyType, BulletType, WAVE_INTERVAL, CANVAS_WIDTH, CANVAS_HEIGHT, SCORE_PER_ENEMY, SCORE_PER_ELITE } from './types';
import type { BulletManager } from './BulletManager';
import type { ParticleSystem } from './ParticleSystem';
import { randomRange } from './utils';

export interface EnemyManagerCallbacks {
  onScoreAdded: (score: number, x: number, y: number) => void;
  onEnemyKilled: (isElite: boolean) => void;
}

export class EnemyManager {
  private enemies: Enemy[];
  private poolSize: number = 20;
  private waveNumber: number;
  private lastWaveTime: number;
  private enemiesRemainingInWave: number;
  private callbacks: EnemyManagerCallbacks;
  private bulletManager: BulletManager;
  private particleSystem: ParticleSystem;

  constructor(bulletManager: BulletManager, particleSystem: ParticleSystem, callbacks: EnemyManagerCallbacks) {
    this.enemies = [];
    this.waveNumber = 0;
    this.lastWaveTime = 0;
    this.enemiesRemainingInWave = 0;
    this.callbacks = callbacks;
    this.bulletManager = bulletManager;
    this.particleSystem = particleSystem;

    for (let i = 0; i < this.poolSize; i++) {
      this.enemies.push(new Enemy());
    }
  }

  reset(): void {
    this.waveNumber = 0;
    this.lastWaveTime = 0;
    this.enemiesRemainingInWave = 0;
    for (const enemy of this.enemies) {
      enemy.active = false;
    }
  }

  start(currentTime: number): void {
    this.lastWaveTime = currentTime;
    this.waveNumber = 0;
  }

  update(dt: number, currentTime: number, playerY: number): void {
    if (currentTime - this.lastWaveTime > WAVE_INTERVAL && this.enemiesRemainingInWave === 0) {
      this.spawnWave(currentTime);
    }

    for (const enemy of this.enemies) {
      const shootResult = enemy.update(dt, currentTime, playerY);
      
      if (shootResult && shootResult.shouldShoot) {
        if (enemy.isElite()) {
          this.bulletManager.spawnDual(
            enemy.x - enemy.width / 2,
            enemy.y,
            BulletType.ENEMY,
            shootResult.targetX,
            shootResult.targetY
          );
        } else {
          this.bulletManager.spawn(
            enemy.x - enemy.width / 2,
            enemy.y,
            BulletType.ENEMY,
            shootResult.targetX,
            shootResult.targetY
          );
        }
      }

      if (!enemy.active) {
        this.enemiesRemainingInWave = Math.max(0, this.enemiesRemainingInWave - 1);
      }
    }
  }

  private spawnWave(currentTime: number): void {
    this.waveNumber++;
    this.lastWaveTime = currentTime;

    const enemyCount = 1 + this.waveNumber;
    this.enemiesRemainingInWave = enemyCount;

    const hasElite = this.waveNumber >= 5 && this.waveNumber % 2 === 1;

    for (let i = 0; i < enemyCount; i++) {
      const isElite = hasElite && i === 0;
      this.spawnEnemy(
        CANVAS_WIDTH + i * 150,
        randomRange(100, CANVAS_HEIGHT - 100),
        isElite ? EnemyType.ELITE : EnemyType.NORMAL
      );
    }
  }

  private spawnEnemy(x: number, y: number, type: EnemyType): void {
    let enemy = this.enemies.find(e => !e.active);
    
    if (!enemy) {
      enemy = new Enemy();
      this.enemies.push(enemy);
    }

    enemy.init(x, y, type, this.waveNumber);
  }

  checkCollisionsWithPlayerBullets(bulletManager: BulletManager): void {
    const playerBullets = bulletManager.getActiveBullets(BulletType.PLAYER);
    const activeEnemies = this.enemies.filter(e => e.active);

    for (const bullet of playerBullets) {
      const bulletRect = bullet.getRect();
      
      for (const enemy of activeEnemies) {
        if (!enemy.active) continue;
        
        const enemyRect = enemy.getRect();
        
        if (this.checkCollision(bulletRect, enemyRect)) {
          bullet.active = false;
          
          if (enemy.hit()) {
            enemy.active = false;
            this.enemiesRemainingInWave = Math.max(0, this.enemiesRemainingInWave - 1);
            
            const score = enemy.isElite() ? SCORE_PER_ELITE : SCORE_PER_ENEMY;
            this.callbacks.onScoreAdded(score, enemy.x, enemy.y);
            this.callbacks.onEnemyKilled(enemy.isElite());
            
            this.particleSystem.spawnExplosion(enemy.x, enemy.y, enemy.isElite() ? 25 : 15, enemy.isElite());
          }
          
          break;
        }
      }
    }
  }

  private checkCollision(a: { x: number; y: number; width: number; height: number }, 
                         b: { x: number; y: number; width: number; height: number }): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const enemy of this.enemies) {
      enemy.render(ctx);
    }
  }

  getActiveEnemies(): Enemy[] {
    return this.enemies.filter(e => e.active);
  }

  getWaveNumber(): number {
    return this.waveNumber;
  }

  clear(): void {
    for (const enemy of this.enemies) {
      enemy.active = false;
    }
  }
}
