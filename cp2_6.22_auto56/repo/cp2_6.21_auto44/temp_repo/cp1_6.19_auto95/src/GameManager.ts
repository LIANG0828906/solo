import { Player } from './Player';
import { Enemy } from './Enemy';
import { Bullet } from './Bullet';
import { Effect } from './Effect';

const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
const KILLS_PER_LEVEL = 40;

interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
  speed: number;
}

export class GameManager {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: Player;
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  effect: Effect;
  stars: Star[] = [];

  score = 0;
  totalKills = 0;
  level = 1;
  killCount = 0;

  spawnTimer = 0;
  baseSpawnInterval = 2.25;

  state: 'menu' | 'playing' | 'gameover' = 'menu';
  menuBreatheTimer = 0;
  gameOverDelay = 0;
  waitingForGameOver = false;

  lastTime = 0;

  keys = new Set<string>();
  restartBtnBounds: { x: number; y: number; w: number; h: number } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.player = new Player(GAME_WIDTH / 2, 420);
    this.effect = new Effect();
    this.initStars();
    this.bindInput();
  }

  initStars() {
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: 1 + Math.random(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5,
      });
    }
  }

  bindInput() {
    const gameKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
    window.addEventListener('keydown', (e) => {
      if (gameKeys.has(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (this.state === 'menu') {
        this.state = 'playing';
        this.resetGame();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    this.canvas.addEventListener('click', (e) => {
      if (this.state === 'gameover' && this.restartBtnBounds) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = GAME_WIDTH / rect.width;
        const scaleY = GAME_HEIGHT / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        const btn = this.restartBtnBounds;
        if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
          this.state = 'playing';
          this.resetGame();
        }
      }
    });
  }

  resetGame() {
    this.player = new Player(GAME_WIDTH / 2, 420);
    this.enemies = [];
    this.bullets = [];
    this.effect = new Effect();
    this.score = 0;
    this.totalKills = 0;
    this.level = 1;
    this.killCount = 0;
    this.spawnTimer = 1;
    this.waitingForGameOver = false;
    this.gameOverDelay = 0;
    this.restartBtnBounds = null;
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  loop = (time: number) => {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  };

  update(dt: number) {
    this.menuBreatheTimer += dt;
    this.updateStars(dt);

    if (this.state === 'playing') {
      this.updatePlaying(dt);
    } else if (this.state === 'gameover') {
      this.effect.update(dt);
    }
  }

  updateStars(dt: number) {
    for (const star of this.stars) {
      star.phase += dt * star.speed;
    }
  }

  updatePlaying(dt: number) {
    if (this.waitingForGameOver) {
      this.gameOverDelay -= dt;
      this.effect.update(dt);
      for (const bullet of this.bullets) bullet.update(dt);
      this.bullets = this.bullets.filter(b => b.active);
      for (const enemy of this.enemies) enemy.update(dt);
      this.enemies = this.enemies.filter(e => e.active);
      if (this.gameOverDelay <= 0) {
        this.state = 'gameover';
        this.waitingForGameOver = false;
      }
      return;
    }

    this.player.update(dt, this.keys, this.bullets);

    for (const bullet of this.bullets) {
      bullet.update(dt);
    }
    this.bullets = this.bullets.filter(b => b.active);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnEnemyBatch();
      const interval = this.baseSpawnInterval * Math.pow(0.8, this.level - 1);
      this.spawnTimer = interval * (0.7 + Math.random() * 0.6);
    }

    for (const enemy of this.enemies) {
      enemy.update(dt);
    }

    this.checkBulletEnemyCollisions();
    this.checkPlayerEnemyCollisions();

    this.enemies = this.enemies.filter(e => e.active);

    this.effect.update(dt);
  }

  checkBulletEnemyCollisions() {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      for (const enemy of this.enemies) {
        if (!enemy.active || enemy.exploding) continue;
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < enemy.size + bullet.radius) {
          bullet.active = false;
          enemy.exploding = true;
          enemy.explosionTimer = 0;
          this.effect.addExplosionFragments(
            enemy.x, enemy.y,
            4 + Math.floor(Math.random() * 5)
          );
          this.effect.triggerShake(2, 0.1);
          this.score += 10 * this.level;
          this.totalKills++;
          this.killCount++;
          if (this.killCount >= KILLS_PER_LEVEL) {
            this.levelUp();
          }
          break;
        }
      }
    }
  }

  checkPlayerEnemyCollisions() {
    if (this.player.invincible) return;
    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.exploding) continue;
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < enemy.size + 12) {
        if (this.player.hit()) {
          this.effect.triggerFlash('#FFFFFF', 0.1);
          this.effect.triggerShake(2, 0.1);
          if (this.player.isDead()) {
            this.effect.addBigExplosion(this.player.x, this.player.y);
            this.waitingForGameOver = true;
            this.gameOverDelay = 0.5;
          } else {
            this.player.resetPosition();
          }
        }
        break;
      }
    }
  }

  spawnEnemyBatch() {
    const baseMin = 3;
    const baseMax = 5;
    const levelBonus = Math.min(Math.floor((this.level - 1) * 0.5), 5);
    const count = baseMin + levelBonus + Math.floor(Math.random() * (baseMax - baseMin + 1));
    const speed = 60 + (this.level - 1) * 15;
    const spacing = 50 + Math.random() * 20;
    const centerX = 100 + Math.random() * (GAME_WIDTH - 200);

    for (let i = 0; i < count; i++) {
      const x = Math.max(30, Math.min(GAME_WIDTH - 30,
        centerX + (i - (count - 1) / 2) * spacing));
      const y = -20 - i * 25;
      this.enemies.push(new Enemy(x, y, speed));
    }
  }

  levelUp() {
    this.level++;
    this.killCount = 0;
  }

  render() {
    const ctx = this.ctx;
    const shakeOffset = this.effect.getShakeOffset();

    ctx.save();

    ctx.fillStyle = '#0B0C10';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.translate(shakeOffset.x, shakeOffset.y);

    this.drawStars(ctx);

    ctx.strokeStyle = '#FFFFFF40';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, GAME_WIDTH - 2, GAME_HEIGHT - 2);

    if (this.state === 'menu') {
      this.drawMenu(ctx);
    } else if (this.state === 'playing' || this.state === 'gameover') {
      this.drawGame(ctx);
    }

    this.effect.draw(ctx);

    if (this.state === 'gameover') {
      this.drawGameOver(ctx);
    }

    ctx.restore();
  }

  drawStars(ctx: CanvasRenderingContext2D) {
    for (const star of this.stars) {
      const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(star.phase));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawMenu(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = '#00BFFF';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00BFFF';
    ctx.shadowBlur = 30;
    ctx.fillText('星辰弹幕', GAME_WIDTH / 2, 180);
    ctx.shadowBlur = 10;
    ctx.fillText('星辰弹幕', GAME_WIDTH / 2, 180);
    ctx.shadowBlur = 0;

    const breathe = 0.5 + 0.5 * Math.sin(this.menuBreatheTimer * Math.PI / 0.8);
    const breatheAlpha = 0.15 + 0.85 * breathe;
    ctx.globalAlpha = breatheAlpha;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('按任意键开始', GAME_WIDTH / 2, 250);
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#FFFFFF80';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText('方向键移动  |  空格射击', GAME_WIDTH / 2, 300);
    ctx.restore();
  }

  drawGame(ctx: CanvasRenderingContext2D) {
    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }
    for (const bullet of this.bullets) {
      bullet.draw(ctx);
    }
    if (!this.waitingForGameOver) {
      this.player.draw(ctx);
    }
    this.drawHUD(ctx);
  }

  drawHUD(ctx: CanvasRenderingContext2D) {
    ctx.save();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const scoreStr = this.score.toString().padStart(6, '0');
    ctx.fillText(`SCORE ${scoreStr}`, 10, 10);

    for (let i = 0; i < this.player.maxLives; i++) {
      const filled = i < this.player.lives;
      this.drawHeart(ctx, GAME_WIDTH - 22 - i * 22, 16, 6, !filled);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`LEVEL ${this.level}`, 10, GAME_HEIGHT - 10);

    const progressW = 80;
    const progressH = 4;
    const progressX = 10;
    const progressY = GAME_HEIGHT - 28;
    ctx.fillStyle = '#FFFFFF20';
    ctx.fillRect(progressX, progressY, progressW, progressH);
    const ratio = this.killCount / KILLS_PER_LEVEL;
    ctx.fillStyle = '#00BFFF';
    ctx.fillRect(progressX, progressY, progressW * ratio, progressH);

    ctx.restore();
  }

  drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, empty: boolean) {
    ctx.save();
    if (empty) {
      ctx.strokeStyle = 'rgba(229,57,53,0.25)';
      ctx.lineWidth = 1;
    } else {
      ctx.fillStyle = '#E53935';
    }
    ctx.beginPath();
    const topCurveHeight = s * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    ctx.bezierCurveTo(x, y, x - s, y, x - s, y + topCurveHeight);
    ctx.bezierCurveTo(x - s, y + s * 0.75, x, y + s, x, y + s * 1.2);
    ctx.bezierCurveTo(x, y + s, x + s, y + s * 0.75, x + s, y + topCurveHeight);
    ctx.bezierCurveTo(x + s, y, x, y, x, y + topCurveHeight);
    ctx.closePath();
    if (empty) {
      ctx.stroke();
    } else {
      ctx.fill();
    }
    ctx.restore();
  }

  drawGameOver(ctx: CanvasRenderingContext2D) {
    ctx.save();

    ctx.fillStyle = 'rgba(10, 25, 47, 0.88)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#00BFFF';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00BFFF';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, 130);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Arial, sans-serif';
    ctx.fillText(`最终得分: ${this.score}`, GAME_WIDTH / 2, 195);
    ctx.fillText(`击毁敌机: ${this.totalKills}`, GAME_WIDTH / 2, 230);
    ctx.fillText(`最高关卡: ${this.level}`, GAME_WIDTH / 2, 265);

    const btnX = GAME_WIDTH / 2 - 80;
    const btnY = 310;
    const btnW = 160;
    const btnH = 44;
    const r = 8;

    ctx.fillStyle = '#00BFFF';
    ctx.beginPath();
    ctx.moveTo(btnX + r, btnY);
    ctx.lineTo(btnX + btnW - r, btnY);
    ctx.arcTo(btnX + btnW, btnY, btnX + btnW, btnY + r, r);
    ctx.lineTo(btnX + btnW, btnY + btnH - r);
    ctx.arcTo(btnX + btnW, btnY + btnH, btnX + btnW - r, btnY + btnH, r);
    ctx.lineTo(btnX + r, btnY + btnH);
    ctx.arcTo(btnX, btnY + btnH, btnX, btnY + btnH - r, r);
    ctx.lineTo(btnX, btnY + r);
    ctx.arcTo(btnX, btnY, btnX + r, btnY, r);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0A192F';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText('重新开始', GAME_WIDTH / 2, btnY + btnH / 2);

    this.restartBtnBounds = { x: btnX, y: btnY, w: btnW, h: btnH };

    ctx.restore();
  }
}
