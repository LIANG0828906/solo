import { Bullet, Player, Effect, Star, generateStars } from './entities';
import { distance, degToRad, randomRange } from './utils';

export type GameStatus = 'menu' | 'playing' | 'gameover';
export type WaveNumber = 1 | 2 | 3;

export interface GameStats {
  score: number;
  surviveTime: number;
  grazeCount: number;
  maxCombo: number;
  hitCount: number;
}

export class Game {
  width: number;
  height: number;
  player: Player;
  bullets: Bullet[];
  effects: Effect[];
  stars: Star[];
  status: GameStatus;
  score: number;
  combo: number;
  grazeCount: number;
  hitCount: number;
  currentWave: WaveNumber;
  waveTimer: number;
  waveTransitionTimer: number;
  scoreTimer: number;
  totalFrames: number;
  mouseX: number;
  mouseY: number;
  waveMessage: string;
  waveMessageTimer: number;
  waveMessageAlpha: number;
  comboMilestone10: boolean;
  comboMilestone20: boolean;
  scoreAnimTimer: number;
  stats: GameStats;

  static readonly WAVE1_DURATION = 20 * 60;
  static readonly WAVE2_DURATION = 30 * 60;
  static readonly MAX_BULLETS = 300;
  static readonly CANVAS_WIDTH = 800;
  static readonly CANVAS_HEIGHT = 600;
  static readonly SCORE_ANIM_DURATION = 9;

  constructor(width: number = Game.CANVAS_WIDTH, height: number = Game.CANVAS_HEIGHT) {
    this.width = width;
    this.height = height;
    this.player = new Player(width / 2, height / 2);
    this.bullets = [];
    this.effects = [];
    this.stars = generateStars(150, width, height);
    this.status = 'playing';
    this.score = 0;
    this.combo = 0;
    this.grazeCount = 0;
    this.hitCount = 0;
    this.currentWave = 1;
    this.waveTimer = 0;
    this.waveTransitionTimer = 0;
    this.scoreTimer = 0;
    this.totalFrames = 0;
    this.mouseX = width / 2;
    this.mouseY = height / 2;
    this.waveMessage = '第 1 波';
    this.waveMessageTimer = 120;
    this.waveMessageAlpha = 0;
    this.comboMilestone10 = false;
    this.comboMilestone20 = false;
    this.scoreAnimTimer = 0;
    this.stats = {
      score: 0,
      surviveTime: 0,
      grazeCount: 0,
      maxCombo: 0,
      hitCount: 0
    };
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  reset(): void {
    this.player = new Player(this.width / 2, this.height / 2);
    this.bullets = [];
    this.effects = [];
    this.status = 'playing';
    this.score = 0;
    this.combo = 0;
    this.grazeCount = 0;
    this.hitCount = 0;
    this.currentWave = 1;
    this.waveTimer = 0;
    this.waveTransitionTimer = 0;
    this.scoreTimer = 0;
    this.totalFrames = 0;
    this.waveMessage = '第 1 波';
    this.waveMessageTimer = 120;
    this.waveMessageAlpha = 0;
    this.comboMilestone10 = false;
    this.comboMilestone20 = false;
    this.scoreAnimTimer = 0;
    this.stats = {
      score: 0,
      surviveTime: 0,
      grazeCount: 0,
      maxCombo: 0,
      hitCount: 0
    };
  }

  getSurviveTime(): number {
    return this.totalFrames / 60;
  }

  private spawnFanBullet(): void {
    if (this.bullets.length >= Game.MAX_BULLETS) return;

    const centers = [this.width * 0.3, this.width * 0.7];
    const spreadAngle = degToRad(40);
    const bulletCount: number = 8;
    const baseSpeed = 2;

    for (const cx of centers) {
      const baseAngle = Math.PI / 2;
      for (let i = 0; i < bulletCount; i++) {
        const t = bulletCount === 1 ? 0.5 : i / (bulletCount - 1);
        const angle = baseAngle - spreadAngle / 2 + spreadAngle * t;
        const vx = Math.cos(angle) * baseSpeed;
        const vy = Math.sin(angle) * baseSpeed;
        this.bullets.push(new Bullet(cx, -10, vx, vy, 'fan', '#FF4444', 4));
      }
    }
  }

  private spawnSineBullet(): void {
    if (this.bullets.length >= Game.MAX_BULLETS) return;

    const sides = ['left', 'right'] as const;
    const bulletCount: number = 12;
    const baseSpeed = 2.5;

    for (const side of sides) {
      const startX = side === 'left' ? -10 : this.width + 10;
      const dirX = side === 'left' ? 1 : -1;
      const startY = this.height * 0.2;
      const endY = this.height * 0.8;

      for (let i = 0; i < bulletCount; i++) {
        const t = bulletCount === 1 ? 0.5 : i / (bulletCount - 1);
        const y = startY + (endY - startY) * t;
        const vx = dirX * baseSpeed;
        const vy = 0;
        const bullet = new Bullet(startX, y, vx, vy, 'sine', '#4488FF', 4);
        bullet.state.sineAmplitude = 30;
        bullet.state.sineFrequency = 0.05 + randomRange(-0.01, 0.01);
        this.bullets.push(bullet);
      }
    }
  }

  private spawnNShapeBullet(): void {
    if (this.bullets.length >= Game.MAX_BULLETS) return;

    const corners = [
      { x: 0, y: 0, tx: 1, ty: 1 },
      { x: this.width, y: 0, tx: -1, ty: 1 },
      { x: 0, y: this.height, tx: 1, ty: -1 },
      { x: this.width, y: this.height, tx: -1, ty: -1 }
    ];
    const bulletCount = 6;
    const baseSpeed = 1;

    for (const corner of corners) {
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      const dirX = centerX - corner.x;
      const dirY = centerY - corner.y;
      const len = Math.sqrt(dirX * dirX + dirY * dirY);
      const nx = dirX / len;
      const ny = dirY / len;

      for (let i = 0; i < bulletCount; i++) {
        const perpX = -ny;
        const perpY = nx;
        const offset = (i - (bulletCount - 1) / 2) * 15;
        const startX = corner.x + perpX * offset;
        const startY = corner.y + perpY * offset;

        const bullet = new Bullet(
          startX, startY,
          nx * baseSpeed, ny * baseSpeed,
          'nshape', '#AA44FF', 4
        );
        bullet.state.baseVx = nx;
        bullet.state.baseVy = ny;
        this.bullets.push(bullet);
      }
    }
  }

  private updateWaveGeneration(): void {
    if (this.waveTransitionTimer > 0) {
      this.waveTransitionTimer -= 1;
      return;
    }

    const frame = this.waveTimer;

    if (this.currentWave === 1 || this.currentWave >= 2) {
      if (frame % 45 === 0) {
        this.spawnFanBullet();
      }
    }

    if (this.currentWave >= 2) {
      if (frame % 60 === 30) {
        this.spawnSineBullet();
      }
    }

    if (this.currentWave === 3) {
      if (frame % 90 === 45) {
        this.spawnNShapeBullet();
      }
    }
  }

  private updateWaveProgress(): void {
    if (this.waveTransitionTimer > 0) return;

    this.waveTimer += 1;

    if (this.currentWave === 1 && this.waveTimer >= Game.WAVE1_DURATION) {
      this.advanceWave(2);
    } else if (this.currentWave === 2 && this.waveTimer >= Game.WAVE1_DURATION + Game.WAVE2_DURATION) {
      this.advanceWave(3);
    }
  }

  private advanceWave(nextWave: WaveNumber): void {
    this.currentWave = nextWave;
    this.waveTransitionTimer = 18;
    this.effects.push(new Effect(this.width / 2, this.height / 2, 'screenFlash', 18, 0, '#FFFFFF'));
    this.bullets = [];
    this.comboMilestone10 = false;
    this.comboMilestone20 = false;

    this.waveMessage = `第 ${nextWave} 波`;
    this.waveMessageTimer = 150;
    this.waveMessageAlpha = 0;
  }

  private handleCollisions(): void {
    const bulletsToRemove = new Set<number>();

    for (let i = 0; i < this.bullets.length; i++) {
      const bullet = this.bullets[i];
      if (!bullet.active) {
        bulletsToRemove.add(i);
        continue;
      }

      if (this.player.tryShieldHit(bullet)) {
        this.score += 5;
        this.effects.push(new Effect(bullet.x, bullet.y, 'graze', 18, 25, '#66AAFF'));
        if (this.player.shieldFlashTimer === 0) {
          this.player.takeShieldHit();
          this.player.destroyShield();
          this.effects.push(new Effect(this.player.x, this.player.y, 'shieldBreak', 30, 60, '#66AAFF'));
        }
        bullet.active = false;
        bulletsToRemove.add(i);
        continue;
      }

      if (this.player.tryGraze(bullet)) {
        this.combo += 1;
        this.grazeCount += 1;
        this.addScore(3);
        if (this.combo > this.stats.maxCombo) {
          this.stats.maxCombo = this.combo;
        }
        this.effects.push(new Effect(bullet.x, bullet.y, 'graze', 18, 25, '#FFD700'));

        if (this.combo === 10 && !this.comboMilestone10) {
          this.comboMilestone10 = true;
          this.addScore(20);
          this.effects.push(new Effect(this.width / 2, this.height / 2, 'comboBurst', 6, 0, '#FFFFFF'));
        }

        if (this.combo === 20 && !this.comboMilestone20) {
          this.comboMilestone20 = true;
          this.effects.push(new Effect(this.player.x, this.player.y, 'shockwave', 30, 200, '#FFFFFF'));
          this.applyShockwavePush(this.player.x, this.player.y, 200);
        }
        continue;
      }

      if (this.player.tryBodyHit(bullet)) {
        this.combo = 0;
        this.hitCount += 1;
        this.player.takeDamage();
        this.effects.push(new Effect(bullet.x, bullet.y, 'hitFlash', 20, 30, '#FF4444'));
        this.effects.push(new Effect(this.width / 2, this.height / 2, 'screenFlash', 10, 0, '#FF0000'));
        bullet.active = false;
        bulletsToRemove.add(i);

        if (!this.player.isAlive()) {
          this.endGame();
        }
        continue;
      }
    }

    if (bulletsToRemove.size > 0) {
      this.bullets = this.bullets.filter((_, idx) => !bulletsToRemove.has(idx));
    }
  }

  private applyShockwavePush(cx: number, cy: number, maxRadius: number): void {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      const d = distance(cx, cy, bullet.x, bullet.y);
      if (d <= maxRadius && d > 0) {
        const dx = (bullet.x - cx) / d;
        const dy = (bullet.y - cy) / d;
        const force = (1 - d / maxRadius) * 8;
        bullet.applyPush(dx * force, dy * force, 30);
      }
    }
  }

  private updateScore(): void {
    this.scoreTimer += 1;
    if (this.scoreTimer >= 30) {
      this.scoreTimer = 0;
      this.addScore(1);
    }
    if (this.scoreAnimTimer > 0) {
      this.scoreAnimTimer -= 1;
    }
  }

  private addScore(amount: number): void {
    this.score += amount;
    this.scoreAnimTimer = Game.SCORE_ANIM_DURATION;
  }

  private updateWaveMessage(): void {
    if (this.waveMessageTimer > 0) {
      this.waveMessageTimer -= 1;
      if (this.waveMessageTimer > 90) {
        this.waveMessageAlpha = Math.min(1, this.waveMessageAlpha + 1 / 30);
      } else if (this.waveMessageTimer < 18) {
        this.waveMessageAlpha = Math.max(0, this.waveMessageAlpha - 1 / 18);
      }
    }
  }

  private endGame(): void {
    this.status = 'gameover';
    this.stats = {
      score: this.score,
      surviveTime: this.getSurviveTime(),
      grazeCount: this.grazeCount,
      maxCombo: this.stats.maxCombo,
      hitCount: this.hitCount
    };
  }

  update(): void {
    if (this.status !== 'playing') return;

    this.totalFrames += 1;

    this.player.update(this.mouseX, this.mouseY, this.width, this.height);

    this.updateWaveProgress();
    this.updateWaveGeneration();
    this.updateScore();
    this.updateWaveMessage();

    for (const bullet of this.bullets) {
      bullet.update(this.width, this.height);
    }

    this.bullets = this.bullets.filter(b => b.active);

    this.handleCollisions();

    for (const effect of this.effects) {
      effect.update();
    }
    this.effects = this.effects.filter(e => e.active);
  }
}
