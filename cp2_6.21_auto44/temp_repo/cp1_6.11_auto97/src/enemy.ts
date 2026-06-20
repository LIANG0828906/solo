import { GameMap, CELL_PX, GRID_SIZE, CANVAS_PX } from './map';
import { SlowField } from './player';

export type EnemyType = 'normal' | 'assassin' | 'tank';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  baseSpeed: number;
  damage: number;
  size: number;
  slowTimer: number;
  lastHitTime: number;
}

export class EnemyManager {
  enemies: Enemy[] = [];
  wave = 0;
  waveTimer = 15;
  waveInterval = 15;
  baseCount = 6;
  perWaveAdd = 3;
  maxPerWave = 30;
  private idCounter = 0;
  private currentTime = 0;

  constructor(private map: GameMap) {}

  static createEnemy(type: EnemyType, x: number, y: number): Enemy {
    let hp: number, baseSpeed: number, damage: number, size: number;
    switch (type) {
      case 'normal':
        hp = 20;
        baseSpeed = 1.5;
        damage = 5;
        size = 6;
        break;
      case 'assassin':
        hp = 10;
        baseSpeed = 2.5;
        damage = 3;
        size = 10;
        break;
      case 'tank':
        hp = 60;
        baseSpeed = 0.8;
        damage = 10;
        size = 14;
        break;
    }
    return {
      id: -1,
      type,
      x,
      y,
      hp,
      maxHp: hp,
      baseSpeed,
      damage,
      size,
      slowTimer: 0,
      lastHitTime: -999,
    };
  }

  spawnNextWave(): void {
    this.wave += 1;
    const count = Math.min(this.maxPerWave, this.baseCount + (this.wave - 1) * this.perWaveAdd);

    for (let i = 0; i < count; i++) {
      const rand = Math.random() * 10;
      let type: EnemyType;
      if (rand < 5) {
        type = 'normal';
      } else if (rand < 8) {
        type = 'assassin';
      } else {
        type = 'tank';
      }

      let x: number, y: number;
      const edge = Math.floor(Math.random() * 4);
      switch (edge) {
        case 0:
          x = Math.random() * CANVAS_PX;
          y = -30;
          break;
        case 1:
          x = Math.random() * CANVAS_PX;
          y = CANVAS_PX + 30;
          break;
        case 2:
          x = -30;
          y = Math.random() * CANVAS_PX;
          break;
        default:
          x = CANVAS_PX + 30;
          y = Math.random() * CANVAS_PX;
          break;
      }

      const enemy = EnemyManager.createEnemy(type, x, y);
      enemy.id = this.idCounter++;
      this.enemies.push(enemy);
    }

    this.waveTimer = this.waveInterval;
  }

  update(
    dt: number,
    playerX: number,
    playerY: number,
    slowFields: SlowField[]
  ): { touches: number[]; damageDealt: number } {
    this.currentTime += dt;
    const touches: number[] = [];
    let damageDealt = 0;

    for (const enemy of this.enemies) {
      const dx = playerX - enemy.x;
      const dy = playerY - enemy.y;
      const dist = Math.hypot(dx, dy);
      let dirX = 0;
      let dirY = 0;
      if (dist > 0) {
        dirX = dx / dist;
        dirY = dy / dist;
      }

      let inSlowField = false;
      for (const sf of slowFields) {
        const sd = Math.hypot(enemy.x - sf.x, enemy.y - sf.y);
        if (sd <= sf.radius) {
          inSlowField = true;
          break;
        }
      }
      if (inSlowField) {
        enemy.slowTimer = 0.2;
      }

      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      const speed = enemy.slowTimer > 0 ? enemy.baseSpeed * 0.5 : enemy.baseSpeed;
      const stepLen = speed * 60 * dt;
      let stepX = dirX * stepLen;
      let stepY = dirY * stepLen;

      let moved = false;
      const newX = enemy.x + stepX;
      if (this.map.isWalkableWorld(newX, enemy.y)) {
        enemy.x = newX;
        moved = true;
      }

      const newY = enemy.y + stepY;
      if (this.map.isWalkableWorld(enemy.x, newY)) {
        enemy.y = newY;
        moved = true;
      }

      if (!moved) {
        const altDirX = dirY;
        const altDirY = dirX;
        const altStepX = altDirX * stepLen;
        const altStepY = altDirY * stepLen;

        const altNewX = enemy.x + altStepX;
        if (this.map.isWalkableWorld(altNewX, enemy.y)) {
          enemy.x = altNewX;
        }

        const altNewY = enemy.y + altStepY;
        if (this.map.isWalkableWorld(enemy.x, altNewY)) {
          enemy.y = altNewY;
        }
      }

      enemy.x = Math.max(-50, Math.min(CANVAS_PX + 50, enemy.x));
      enemy.y = Math.max(-50, Math.min(CANVAS_PX + 50, enemy.y));

      const playerDist = Math.hypot(enemy.x - playerX, enemy.y - playerY);
      if (playerDist < enemy.size + 6) {
        if (this.currentTime - enemy.lastHitTime > 0.5) {
          touches.push(enemy.id);
          damageDealt += enemy.damage;
          enemy.lastHitTime = this.currentTime;
        }

        if (playerDist > 0) {
          const pushX = -(playerX - enemy.x) / playerDist;
          const pushY = -(playerY - enemy.y) / playerDist;
          const pushNewX = enemy.x + pushX * 8;
          const pushNewY = enemy.y + pushY * 8;
          if (this.map.isWalkableWorld(pushNewX, enemy.y)) {
            enemy.x = pushNewX;
          }
          if (this.map.isWalkableWorld(enemy.x, pushNewY)) {
            enemy.y = pushNewY;
          }
        }
      }
    }

    return { touches, damageDealt };
  }

  damageEnemy(id: number, dmg: number): boolean {
    const idx = this.enemies.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.enemies[idx].hp -= dmg;
    if (this.enemies[idx].hp <= 0) {
      this.enemies.splice(idx, 1);
      return true;
    }
    return false;
  }

  getAliveEnemies(): Enemy[] {
    return this.enemies;
  }

  getAliveCount(): number {
    return this.enemies.length;
  }

  getWave(): number {
    return this.wave;
  }

  getWaveProgress(): number {
    return 1 - this.waveTimer / this.waveInterval;
  }

  render(ctx: CanvasRenderingContext2D, timeMs: number, playerX: number, playerY: number): void {
    for (const enemy of this.enemies) {
      ctx.save();

      switch (enemy.type) {
        case 'normal':
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
          ctx.fillStyle = '#E63946';
          ctx.fill();
          break;

        case 'assassin': {
          const adx = playerX - enemy.x;
          const ady = playerY - enemy.y;
          const angle = Math.atan2(ady, adx);
          ctx.translate(enemy.x, enemy.y);
          ctx.rotate(angle);
          ctx.beginPath();
          const s = enemy.size;
          ctx.moveTo(s * 0.6, 0);
          ctx.lineTo(-s * 0.3, -s * 0.5);
          ctx.lineTo(-s * 0.3, s * 0.5);
          ctx.closePath();
          ctx.fillStyle = '#FFC300';
          ctx.fill();
          break;
        }

        case 'tank': {
          const half = enemy.size / 2;
          ctx.fillStyle = '#5A189A';
          ctx.fillRect(enemy.x - half, enemy.y - half, enemy.size, enemy.size);
          ctx.strokeStyle = '#2D0C5E';
          ctx.lineWidth = 2;
          ctx.strokeRect(enemy.x - half, enemy.y - half, enemy.size, enemy.size);
          break;
        }
      }

      ctx.restore();

      if (enemy.slowTimer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(68, 170, 255, 0.3)';
        switch (enemy.type) {
          case 'normal':
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'assassin': {
            const adx = playerX - enemy.x;
            const ady = playerY - enemy.y;
            const angle = Math.atan2(ady, adx);
            ctx.translate(enemy.x, enemy.y);
            ctx.rotate(angle);
            ctx.beginPath();
            const s = enemy.size;
            ctx.moveTo(s * 0.6, 0);
            ctx.lineTo(-s * 0.3, -s * 0.5);
            ctx.lineTo(-s * 0.3, s * 0.5);
            ctx.closePath();
            ctx.fill();
            break;
          }
          case 'tank': {
            const half = enemy.size / 2;
            ctx.fillRect(enemy.x - half, enemy.y - half, enemy.size, enemy.size);
            break;
          }
        }
        ctx.restore();
      }

      const hpPct = enemy.hp / enemy.maxHp;
      const barW = 20;
      const barH = 3;
      const barX = enemy.x - barW / 2;
      const barY = enemy.y - enemy.size - 8;
      ctx.fillStyle = '#22AA22';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#E63946';
      ctx.fillRect(barX, barY, barW * hpPct, barH);
    }
  }
}
