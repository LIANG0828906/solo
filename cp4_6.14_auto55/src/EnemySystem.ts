import type { Direction } from './NoteSystem';

export interface Enemy {
  id: number;
  x: number;
  y: number;
  direction: Direction;
  side: 'left' | 'right';
  eyeBlinkFrame: number;
  isBlinking: boolean;
}

export interface KnockbackEffect {
  x: number;
  y: number;
  startTime: number;
  duration: number;
  maxRadius: number;
}

export interface ScreenFlashEffect {
  startTime: number;
  duration: number;
}

export class EnemySystem {
  private enemies: Enemy[] = [];
  private nextEnemyId = 0;
  private spawnInterval = 2000;
  private lastSpawnTime = 0;
  private canvasWidth = 800;
  private canvasHeight = 600;
  private playerX = 0;
  private playerY = 0;
  private enemyRadius = 30;
  private knockbackDistance = 20;
  private advanceDistance = 10;
  private hp = 100;
  private maxHp = 100;
  private directions: Direction[] = ['up', 'down', 'left', 'right'];
  private knockbackEffects: KnockbackEffect[] = [];
  private screenFlashEffects: ScreenFlashEffect[] = [];
  private gameStartTime = 0;
  private gameActive = false;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.updateCanvasSize(canvasWidth, canvasHeight);
  }

  public updateCanvasSize(canvasWidth: number, canvasHeight: number): void {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.playerX = canvasWidth / 2;
    this.playerY = canvasHeight / 2;
  }

  public start(currentTime: number): void {
    this.gameStartTime = currentTime;
    this.lastSpawnTime = currentTime - this.spawnInterval;
    this.enemies = [];
    this.nextEnemyId = 0;
    this.hp = this.maxHp;
    this.knockbackEffects = [];
    this.screenFlashEffects = [];
    this.gameActive = true;
  }

  public reset(): void {
    this.enemies = [];
    this.knockbackEffects = [];
    this.screenFlashEffects = [];
    this.nextEnemyId = 0;
    this.hp = this.maxHp;
    this.gameActive = false;
  }

  public update(currentTime: number, _deltaTime: number): void {
    if (!this.gameActive) return;

    const elapsed = currentTime - this.gameStartTime;
    const gameDuration = 30000;

    if (elapsed < gameDuration) {
      while (currentTime - this.lastSpawnTime >= this.spawnInterval) {
        this.spawnEnemy();
        this.lastSpawnTime += this.spawnInterval;
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy) continue;

      enemy.eyeBlinkFrame++;
      if (enemy.eyeBlinkFrame >= 120) {
        enemy.isBlinking = true;
        if (enemy.eyeBlinkFrame >= 126) {
          enemy.isBlinking = false;
          enemy.eyeBlinkFrame = 0;
        }
      }

      const distanceToPlayer = Math.abs(enemy.x - this.playerX);
      if (distanceToPlayer < 20) {
        this.hp -= 10;
        this.screenFlashEffects.push({
          startTime: currentTime,
          duration: 300
        });
        this.enemies.splice(i, 1);
      }
    }

    this.knockbackEffects = this.knockbackEffects.filter(effect =>
      currentTime - effect.startTime < effect.duration
    );

    this.screenFlashEffects = this.screenFlashEffects.filter(effect =>
      currentTime - effect.startTime < effect.duration
    );
  }

  private spawnEnemy(): void {
    const side = Math.random() > 0.5 ? 'left' : 'right';
    const direction = this.directions[Math.floor(Math.random() * this.directions.length)] as Direction;
    
    let x: number;
    if (side === 'left') {
      x = -this.enemyRadius;
    } else {
      x = this.canvasWidth + this.enemyRadius;
    }

    const y = this.canvasHeight / 2 + (Math.random() - 0.5) * 200;

    this.enemies.push({
      id: this.nextEnemyId++,
      x,
      y,
      direction,
      side,
      eyeBlinkFrame: Math.floor(Math.random() * 100),
      isBlinking: false
    });
  }

  public onNoteHit(hitDirection: Direction, currentTime: number): void {
    for (const enemy of this.enemies) {
      if (enemy.direction === hitDirection) {
        if (enemy.side === 'left') {
          enemy.x -= this.knockbackDistance;
        } else {
          enemy.x += this.knockbackDistance;
        }

        this.knockbackEffects.push({
          x: enemy.x,
          y: enemy.y,
          startTime: currentTime,
          duration: 200,
          maxRadius: 60
        });
      }
    }
  }

  public onNoteMiss(missDirection: Direction | null): void {
    for (const enemy of this.enemies) {
      if (missDirection === null || enemy.direction === missDirection) {
        if (enemy.side === 'left') {
          enemy.x += this.advanceDistance;
        } else {
          enemy.x -= this.advanceDistance;
        }
      }
    }
  }

  public getEnemies(): Enemy[] {
    return this.enemies;
  }

  public getHp(): number {
    return this.hp;
  }

  public getMaxHp(): number {
    return this.maxHp;
  }

  public getKnockbackEffects(): KnockbackEffect[] {
    return this.knockbackEffects;
  }

  public getScreenFlashEffects(): ScreenFlashEffect[] {
    return this.screenFlashEffects;
  }

  public isGameOver(): boolean {
    return this.hp <= 0;
  }

  public getEnemyRadius(): number {
    return this.enemyRadius;
  }

  public getPlayerPosition(): { x: number; y: number } {
    return { x: this.playerX, y: this.playerY };
  }
}
