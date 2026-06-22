import { Airship, Bullet } from './airship';
import { Enemy, DebrisManager, Debris } from './enemy';
import { Cloud, LightningSystem } from './cloud';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const MAX_ENEMIES = 5;
const MAX_OBJECTS = 100;
const WIN_SCORE = 5000;

type GameState = 'start' | 'playing' | 'gameover' | 'victory';

class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  state: GameState = 'start';
  airship: Airship;
  enemies: Enemy[] = [];
  clouds: Cloud[] = [];
  lightning: LightningSystem;
  debrisManager: DebrisManager;
  keys: Set<string> = new Set();
  score: number = 0;
  comboCount: number = 0;
  comboTimer: number = 0;
  scoreDisplayScale: number = 1;
  scoreScaleTimer: number = 0;
  enemySpawnTimer: number = 2;
  cloudSpawnTimer: number = 0;
  targetCloudCount: number = 6;
  gameOverAlpha: number = 0;
  victoryParticles: VictoryParticle[] = [];
  lastTime: number = 0;
  mountainPoints: number[] = [];
  rivetPositions: { x: number; y: number }[] = [];

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.airship = new Airship(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.lightning = new LightningSystem(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.debrisManager = new DebrisManager();

    this.generateMountains();
    this.generateRivets();

    this.lightning.setPlayerHitCallback(() => {
      this.airship.applyLightningHit();
      for (const cloud of this.clouds) {
        cloud.darken(3);
      }
    });

    this.initInput();
  }

  private generateMountains(): void {
    this.mountainPoints = [];
    let x = 0;
    while (x <= CANVAS_WIDTH) {
      this.mountainPoints.push(40 + Math.random() * 20);
      x += 30 + Math.random() * 20;
    }
  }

  private generateRivets(): void {
    this.rivetPositions = [];
    const bw = 8;
    const spacing = 40;
    for (let x = spacing / 2; x < CANVAS_WIDTH; x += spacing) {
      this.rivetPositions.push({ x: x, y: bw / 2 });
      this.rivetPositions.push({ x: x, y: CANVAS_HEIGHT - bw / 2 });
    }
    for (let y = spacing / 2; y < CANVAS_HEIGHT; y += spacing) {
      this.rivetPositions.push({ x: bw / 2, y: y });
      this.rivetPositions.push({ x: CANVAS_WIDTH - bw / 2, y: y });
    }
  }

  private initInput(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key);

      if (this.state === 'start' && e.key === ' ') {
        e.preventDefault();
        this.startGame();
      }
      if ((this.state === 'gameover' || this.state === 'victory') && (e.key === 'r' || e.key === 'R')) {
        this.resetGame();
      }
      if (e.key === ' ') {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });
  }

  private startGame(): void {
    this.state = 'playing';
    this.airship = new Airship(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.enemies = [];
    this.clouds = [];
    this.debrisManager = new DebrisManager();
    this.lightning = new LightningSystem(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.score = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.gameOverAlpha = 0;
    this.victoryParticles = [];
    this.enemySpawnTimer = 2;

    this.lightning.setPlayerHitCallback(() => {
      this.airship.applyLightningHit();
      for (const cloud of this.clouds) {
        cloud.darken(3);
      }
    });

    for (let i = 0; i < 5; i++) {
      const cloud = new Cloud(CANVAS_WIDTH, CANVAS_HEIGHT);
      cloud.x = Math.random() * CANVAS_WIDTH;
      this.clouds.push(cloud);
    }
  }

  private resetGame(): void {
    this.state = 'start';
    this.keys.clear();
  }

  run(): void {
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const dt = Math.min((time - this.lastTime) / 1000, 0.05);
      this.lastTime = time;

      this.update(dt);
      this.draw();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private update(dt: number): void {
    if (this.state !== 'playing') return;

    this.airship.update(dt, this.keys, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0 && this.enemies.length < MAX_ENEMIES) {
      const totalActive = this.getTotalActiveObjects();
      if (totalActive < MAX_OBJECTS) {
        this.enemies.push(new Enemy(CANVAS_WIDTH, CANVAS_HEIGHT));
      }
      this.enemySpawnTimer = 2 + Math.random() * 2;
    }

    for (const enemy of this.enemies) {
      enemy.update(dt, this.airship.x, this.airship.y);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].isOffScreen()) {
        this.enemies.splice(i, 1);
      }
    }

    for (let i = this.clouds.length - 1; i >= 0; i--) {
      this.clouds[i].update(dt);
      if (this.clouds[i].isOffScreen()) {
        this.clouds.splice(i, 1);
      }
    }

    this.targetCloudCount = 5 + Math.floor(Math.random() * 4);
    if (this.clouds.length < this.targetCloudCount) {
      this.clouds.push(new Cloud(CANVAS_WIDTH, CANVAS_HEIGHT));
    }

    this.lightning.update(
      dt,
      this.airship.x, this.airship.y,
      this.airship.width, this.airship.height
    );

    this.debrisManager.update(dt);

    this.checkCollisions();

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    if (this.scoreScaleTimer > 0) {
      this.scoreScaleTimer -= dt;
      if (this.scoreScaleTimer <= 0) {
        this.scoreDisplayScale = 1;
      } else {
        const t = this.scoreScaleTimer / 0.3;
        this.scoreDisplayScale = 1 + 0.2 * Math.sin(t * Math.PI);
      }
    }

    if (this.airship.health <= 0) {
      this.state = 'gameover';
    }

    if (this.score >= WIN_SCORE && this.state === 'playing') {
      this.state = 'victory';
      this.spawnVictoryParticles();
    }
  }

  private getTotalActiveObjects(): number {
    let total = this.airship.bullets.length;
    for (const e of this.enemies) {
      total += 1 + e.bullets.length;
    }
    total += this.debrisManager.debris.length;
    return total;
  }

  private checkCollisions(): void {
    for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
      const enemy = this.enemies[ei];
      if (!enemy.active) continue;

      for (let bi = this.airship.bullets.length - 1; bi >= 0; bi--) {
        const bullet = this.airship.bullets[bi];
        if (!bullet.active) continue;

        if (this.aabbCollision(bullet.getBounds(), enemy.getBounds())) {
          bullet.active = false;
          this.airship.bullets.splice(bi, 1);

          const destroyed = enemy.takeDamage();
          if (destroyed) {
            const debris = Enemy.createDebris(enemy);
            this.debrisManager.addDebris(debris);
            this.comboCount++;
            this.comboTimer = 5;
            const bonus = Math.min(100 + (this.comboCount - 1) * 50, 300);
            this.score += bonus;
            this.scoreDisplayScale = 1.2;
            this.scoreScaleTimer = 0.3;
            this.enemies.splice(ei, 1);
          }
          break;
        }
      }
    }

    for (const enemy of this.enemies) {
      for (let bi = enemy.bullets.length - 1; bi >= 0; bi--) {
        const bullet = enemy.bullets[bi];
        if (this.aabbCollision(bullet.getBounds(), this.airship.getBounds())) {
          this.airship.takeDamage(10);
          enemy.bullets.splice(bi, 1);
          break;
        }
      }
    }
  }

  private aabbCollision(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number }
  ): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private spawnVictoryParticles(): void {
    for (let i = 0; i < 60; i++) {
      this.victoryParticles.push({
        x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 400,
        y: CANVAS_HEIGHT / 2 - 60,
        vx: (Math.random() - 0.5) * 100,
        vy: -(30 + Math.random() * 80),
        size: 2 + Math.random() * 4,
        life: 2 + Math.random() * 3,
        maxLife: 2 + Math.random() * 3,
        color: Math.random() < 0.5 ? '#FFD700' : '#B87333',
      });
    }
  }

  private draw(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (this.state === 'start') {
      this.drawStartScreen(ctx);
      return;
    }

    this.drawSky(ctx);
    this.drawMountains(ctx);

    for (const cloud of this.clouds) {
      cloud.draw(ctx);
    }

    this.lightning.draw(ctx);

    this.airship.draw(ctx);

    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }

    this.debrisManager.draw(ctx);

    this.drawHealthGauge(ctx);
    this.drawScore(ctx);

    if (this.state === 'gameover') {
      this.drawGameOver(ctx);
    }

    if (this.state === 'victory') {
      this.drawVictory(ctx);
    }
  }

  private drawSky(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#4A6B7A');
    gradient.addColorStop(1, '#D4A574');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private drawMountains(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1E3B2A';
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);

    let x = 0;
    for (let i = 0; i < this.mountainPoints.length; i++) {
      const h = this.mountainPoints[i];
      ctx.lineTo(x, CANVAS_HEIGHT - 60 + (60 - h));
      x += 30 + (i < this.mountainPoints.length - 1 ? 0 : 0);
      if (i < this.mountainPoints.length - 1) {
        ctx.lineTo(x, CANVAS_HEIGHT - 60 + (60 - this.mountainPoints[i] * 0.3));
      }
      x += 20;
    }

    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 40);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  private drawHealthGauge(ctx: CanvasRenderingContext2D): void {
    const cx = 55;
    const cy = 55;
    const radius = 30;

    ctx.save();

    ctx.strokeStyle = '#B87333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#2A1F1A';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const healthRatio = this.airship.health / this.airship.maxHealth;
    const fillAngle = startAngle + (endAngle - startAngle) * healthRatio;

    const r = Math.floor(255 * (1 - healthRatio));
    const g = Math.floor(255 * healthRatio);
    const arcColor = `rgb(${r},${g},0)`;

    ctx.strokeStyle = arcColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 5, startAngle, fillAngle);
    ctx.stroke();

    const needleAngle = startAngle + (endAngle - startAngle) * healthRatio;
    const nx = cx + Math.cos(needleAngle) * (radius - 10);
    const ny = cy + Math.sin(needleAngle) * (radius - 10);

    ctx.strokeStyle = '#B87333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.stroke();

    ctx.fillStyle = '#B87333';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#B87333';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`HP:${this.airship.health}`, cx, cy + radius + 16);

    ctx.restore();
  }

  private drawScore(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const cx = CANVAS_WIDTH - 80;
    const cy = 55;

    ctx.strokeStyle = '#B87333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#2A1F1A';
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(this.scoreDisplayScale, this.scoreDisplayScale);
    ctx.fillStyle = '#B87333';
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.score}`, 0, 0);
    ctx.restore();

    if (this.comboCount > 1) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 12px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(`x${this.comboCount} COMBO`, cx, cy + 44);
    }

    ctx.fillStyle = '#B87333';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('SCORE', cx, cy + 30 + 18);

    ctx.restore();
  }

  private drawGameOver(ctx: CanvasRenderingContext2D): void {
    this.gameOverAlpha = Math.min(this.gameOverAlpha + 0.02, 1);
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${this.gameOverAlpha * 0.6})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.globalAlpha = this.gameOverAlpha;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '48px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.fillStyle = '#B87333';
    ctx.font = '20px Georgia';
    ctx.fillText(`最终得分: ${this.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

    ctx.fillStyle = '#D4A574';
    ctx.font = '16px Georgia';
    ctx.fillText('按 R 键重新开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    ctx.restore();
  }

  private drawVictory(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let i = this.victoryParticles.length - 1; i >= 0; i--) {
      const p = this.victoryParticles[i];
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      p.vy += 20 * 0.016;
      p.life -= 0.016;

      if (p.life <= 0) {
        this.victoryParticles.splice(i, 1);
        continue;
      }

      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }

    if (Math.random() < 0.3) {
      this.victoryParticles.push({
        x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 400,
        y: CANVAS_HEIGHT / 2 - 80,
        vx: (Math.random() - 0.5) * 100,
        vy: -(30 + Math.random() * 80),
        size: 2 + Math.random() * 4,
        life: 2 + Math.random() * 2,
        maxLife: 2 + Math.random() * 2,
        color: Math.random() < 0.5 ? '#FFD700' : '#B87333',
      });
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#FFD700';
    ctx.font = '48px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.fillText('VICTORY', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#D4A574';
    ctx.font = '20px Georgia';
    ctx.fillText(`最终得分: ${this.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

    ctx.fillStyle = '#B87333';
    ctx.font = '16px Georgia';
    ctx.fillText('按 R 键重新开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    ctx.restore();
  }

  private drawStartScreen(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#3B2F2A');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.fillStyle = '#B87333';
    ctx.strokeStyle = '#B87333';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2 - 180, CANVAS_HEIGHT / 2 - 60, 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2 + 180, CANVAS_HEIGHT / 2 - 60, 40, 0, Math.PI * 2);
    ctx.stroke();

    const gearCx = CANVAS_WIDTH / 2 - 180;
    const gearCy = CANVAS_HEIGHT / 2 - 60;
    const teeth = 8;
    const innerR = 25;
    const outerR = 38;
    const angleOffset = (Date.now() * 0.001) % (Math.PI * 2);
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = angleOffset + (i * Math.PI) / teeth;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = gearCx + Math.cos(angle) * r;
      const py = gearCy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    const gear2Cx = CANVAS_WIDTH / 2 + 180;
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = -angleOffset + (i * Math.PI) / teeth;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = gear2Cx + Math.cos(angle) * r;
      const py = gearCy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = '#D4A574';
    ctx.font = '64px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#B87333';
    ctx.shadowBlur = 15;
    ctx.fillText('蒸汽飞艇空战', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    ctx.shadowBlur = 0;

    const blinkAlpha = 0.3 + 0.7 * Math.abs(Math.sin(Date.now() * 0.001 * Math.PI));
    ctx.fillStyle = `rgba(212,165,116,${blinkAlpha})`;
    ctx.font = '24px Georgia';
    ctx.fillText('按空格键开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);

    ctx.fillStyle = '#8B7355';
    ctx.font = '14px Georgia';
    ctx.fillText('WASD 移动 | 空格 射击 | 躲避雷电与敌弹', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);

    ctx.restore();
  }
}

interface VictoryParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

const game = new Game();
game.run();
