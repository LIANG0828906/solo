import { Player, PlayerInput } from './player';
import { ObstaclePool, LevelGenerator, Obstacle } from './obstacle';

const CANVAS_W = 800;
const CANVAS_H = 500;
const LEVEL_LENGTH = 3000;

type GameState = 'waiting' | 'playing' | 'finished';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private obstaclePool: ObstaclePool;
  private levelGenerator: LevelGenerator;
  private playerA!: Player;
  private playerB!: Player;
  private checkpoints: { x: number; y: number; w: number; h: number }[] = [];
  private startX: number = 0;
  private startY: number = 0;
  private finishX: number = 0;

  private gameState: GameState = 'waiting';
  private startTime: number = 0;
  private elapsedA: number = 0;
  private elapsedB: number = 0;
  private winner: 'A' | 'B' | null = null;
  private finishBannerTimer: number = 0;
  private showReplayButton: boolean = false;
  private replayButton: { x: number; y: number; w: number; h: number } | null = null;
  private cameraX: number = 0;

  private keyState: Set<string> = new Set();
  private keyPressed: Set<string> = new Set();

  private redFlashA: number = 0;
  private redFlashB: number = 0;

  private lastFrameTime: number = 0;
  private fps: number = 60;
  private fpsSmooth: number = 60;
  private highDetail: boolean = true;

  private bgStars: { x: number; y: number; r: number; s: number }[] = [];

  constructor() {
    const canvasEl = document.getElementById('gameCanvas');
    if (!canvasEl || !(canvasEl instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found');
    }
    this.canvas = canvasEl;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }
    this.ctx = ctx;

    this.obstaclePool = new ObstaclePool(200);
    this.levelGenerator = new LevelGenerator(LEVEL_LENGTH, CANVAS_H);

    this.initBackground();
    this.setupEventListeners();
    this.initLevel();
    this.lastFrameTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  private initBackground(): void {
    this.bgStars = [];
    for (let i = 0; i < 80; i++) {
      this.bgStars.push({
        x: Math.random() * LEVEL_LENGTH,
        y: Math.random() * (CANVAS_H - 150) + 20,
        r: Math.random() * 1.5 + 0.5,
        s: Math.random() * 0.3 + 0.1
      });
    }
  }

  private initLevel(): void {
    const result = this.levelGenerator.generate(this.obstaclePool);
    this.checkpoints = result.checkpoints;
    this.startX = result.startX;
    this.startY = result.startY;
    this.finishX = result.finishX;

    this.playerA = new Player('A', this.startX - 15, this.startY);
    this.playerB = new Player('B', this.startX + 15, this.startY);

    this.gameState = 'waiting';
    this.winner = null;
    this.finishBannerTimer = 0;
    this.showReplayButton = false;
    this.replayButton = null;
    this.startTime = 0;
    this.elapsedA = 0;
    this.elapsedB = 0;
    this.cameraX = 0;
    this.redFlashA = 0;
    this.redFlashB = 0;
  }

  private resetGame(): void {
    this.initLevel();
  }

  private startGame(): void {
    if (this.gameState !== 'waiting') return;
    this.gameState = 'playing';
    this.startTime = performance.now();
    this.winner = null;
    this.finishBannerTimer = 0;
    this.showReplayButton = false;
    this.elapsedA = 0;
    this.elapsedB = 0;
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      const prevent = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'
      ];
      if (prevent.includes(code)) {
        e.preventDefault();
      }
      if (!this.keyState.has(code)) {
        this.keyPressed.add(code);
      }
      this.keyState.add(code);

      if (code === 'Space') {
        if (this.gameState === 'waiting') {
          this.startGame();
        } else if (this.gameState === 'finished' && this.showReplayButton) {
          this.resetGame();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keyState.delete(e.code);
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.gameState === 'finished' && this.showReplayButton && this.replayButton) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        if (
          mx >= this.replayButton.x &&
          mx <= this.replayButton.x + this.replayButton.w &&
          my >= this.replayButton.y &&
          my <= this.replayButton.y + this.replayButton.h
        ) {
          this.resetGame();
        }
      }
    });
  }

  private getPlayerInput(playerId: 'A' | 'B'): PlayerInput {
    const left = playerId === 'A' ? this.keyState.has('KeyA') : this.keyState.has('ArrowLeft');
    const right = playerId === 'A' ? this.keyState.has('KeyD') : this.keyState.has('ArrowRight');
    const jump = playerId === 'A' ? this.keyState.has('KeyW') : this.keyState.has('ArrowUp');
    const jumpPressed = playerId === 'A' ? this.keyPressed.has('KeyW') : this.keyPressed.has('ArrowUp');
    return { left, right, jump, jumpPressed };
  }

  private loop(now: number): void {
    const rawDt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    const dt = Math.min(rawDt, 1 / 30);

    const instFps = rawDt > 0 ? 1 / rawDt : 60;
    this.fpsSmooth = this.fpsSmooth * 0.92 + instFps * 0.08;
    this.fps = this.fpsSmooth;
    this.highDetail = this.fps >= 30;

    this.update(dt);
    this.render();

    this.keyPressed.clear();

    requestAnimationFrame(this.loop.bind(this));
  }

  private update(dt: number): void {
    const obstacles = this.obstaclePool.getPool();

    for (const obs of obstacles) {
      obs.update(dt, this.highDetail);
    }

    if (this.gameState === 'playing') {
      const now = performance.now();

      const inputA = this.getPlayerInput('A');
      const inputB = this.getPlayerInput('B');

      if (!this.playerA.hasFinished) {
        this.elapsedA = (now - this.startTime) / 1000;
      }
      if (!this.playerB.hasFinished) {
        this.elapsedB = (now - this.startTime) / 1000;
      }

      const resA = this.playerA.update(dt, inputA, obstacles, CANVAS_H, this.checkpoints);
      const resB = this.playerB.update(dt, inputB, obstacles, CANVAS_H, this.checkpoints);

      if (resA.died) this.redFlashA = 0.1;
      if (resB.died) this.redFlashB = 0.1;

      if (resA.hitFinish && !this.winner) {
        this.winner = 'A';
        this.playerA.finishTime = this.elapsedA;
        this.gameState = 'finished';
        this.finishBannerTimer = 2;
      }
      if (resB.hitFinish && !this.winner) {
        this.winner = 'B';
        this.playerB.finishTime = this.elapsedB;
        this.gameState = 'finished';
        this.finishBannerTimer = 2;
      }
      if (resA.hitFinish && this.winner === 'B' && !this.playerA.hasFinished) {
        this.playerA.finishTime = this.elapsedA;
      }
      if (resB.hitFinish && this.winner === 'A' && !this.playerB.hasFinished) {
        this.playerB.finishTime = this.elapsedB;
      }

      const targetCam = (this.playerA.x + this.playerB.x) / 2 - CANVAS_W / 2;
      this.cameraX += (Math.max(0, Math.min(LEVEL_LENGTH - CANVAS_W, targetCam)) - this.cameraX) * 0.1;
    } else if (this.gameState === 'finished') {
      this.finishBannerTimer -= dt;
      if (this.finishBannerTimer <= 0 && !this.showReplayButton) {
        this.showReplayButton = true;
      }
    } else if (this.gameState === 'waiting') {
      this.cameraX += ((this.startX - CANVAS_W / 2 + 100) - this.cameraX) * 0.05;
      this.cameraX = Math.max(0, this.cameraX);
    }

    if (this.redFlashA > 0) this.redFlashA -= dt;
    if (this.redFlashB > 0) this.redFlashB -= dt;
  }

  private render(): void {
    const ctx = this.ctx;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bgGrad.addColorStop(0, '#0B0C10');
    bgGrad.addColorStop(1, '#1F2833');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    this.drawBackground(ctx);

    ctx.save();
    const obstacles = this.obstaclePool.getPool();

    const visLeft = this.cameraX - 100;
    const visRight = this.cameraX + CANVAS_W + 100;

    for (const obs of obstacles) {
      if (!obs.active) continue;
      if (obs.x + obs.w < visLeft || obs.x > visRight) continue;
      obs.draw(ctx, this.cameraX, this.highDetail);
    }

    if (this.playerA.x < this.playerB.x) {
      this.playerA.draw(ctx, this.cameraX);
      this.playerB.draw(ctx, this.cameraX);
    } else {
      this.playerB.draw(ctx, this.cameraX);
      this.playerA.draw(ctx, this.cameraX);
    }

    ctx.restore();

    this.drawHUD(ctx);
    this.drawDeathFlashes(ctx);
    this.drawGameUI(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    if (this.highDetail) {
      for (const star of this.bgStars) {
        const sx = star.x - this.cameraX * star.s;
        const wrappedX = ((sx % LEVEL_LENGTH) + LEVEL_LENGTH) % LEVEL_LENGTH;
        if (wrappedX < CANVAS_W + 10) {
          const twinkle = 0.5 + 0.5 * Math.sin(performance.now() * 0.002 + star.x);
          ctx.fillStyle = `rgba(200,220,255,${0.3 + 0.4 * twinkle})`;
          ctx.fillRect(wrappedX, star.y, star.r, star.r);
        }
      }
    }

    const mountainColors = ['#1a2a3a', '#152232', '#0f1a26'];
    const mountainSpeeds = [0.08, 0.15, 0.22];
    const mountainHeights = [120, 90, 60];

    for (let m = 0; m < 3; m++) {
      ctx.fillStyle = mountainColors[m];
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_H);
      const offset = -this.cameraX * mountainSpeeds[m];
      const peakSpacing = 180 + m * 30;
      for (let x = -peakSpacing; x < CANVAS_W + peakSpacing * 2; x += 20) {
        const wx = x;
        const baseX = (x - offset) / peakSpacing;
        const wave = Math.sin(baseX * Math.PI) * 0.5 + 0.5;
        const wave2 = Math.sin(baseX * Math.PI * 2.3 + m) * 0.2;
        const y = CANVAS_H - 80 - mountainHeights[m] * (wave + wave2);
        ctx.lineTo(wx, y);
      }
      ctx.lineTo(CANVAS_W + peakSpacing * 2, CANVAS_H);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawHUD(ctx: CanvasRenderingContext2D): void {
    const timeA = this.playerA.hasFinished ? this.playerA.finishTime : (this.gameState === 'playing' ? this.elapsedA : 0);
    const timeB = this.playerB.hasFinished ? this.playerB.finishTime : (this.gameState === 'playing' ? this.elapsedB : 0);

    ctx.save();
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textBaseline = 'top';

    ctx.textAlign = 'left';
    this.drawPixelText(ctx, `玩家A: ${this.formatTime(timeA)}`, 14, 14, '#00A8FF');

    ctx.textAlign = 'right';
    this.drawPixelText(ctx, `玩家B: ${this.formatTime(timeB)}`, CANVAS_W - 14, 14, '#FF3366');

    if (this.gameState === 'waiting') {
      ctx.textAlign = 'center';
      ctx.font = 'bold 14px "Courier New", monospace';
      this.drawPixelText(ctx, '按 空格 开始游戏', CANVAS_W / 2, CANVAS_H - 50, '#C5C6C7');
    }

    ctx.restore();
  }

  private drawPixelText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds * 10) % 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  }

  private drawDeathFlashes(ctx: CanvasRenderingContext2D): void {
    if (this.redFlashA > 0) {
      const alpha = (this.redFlashA / 0.1) * 0.3;
      ctx.fillStyle = `rgba(255,0,0,${alpha})`;
      ctx.fillRect(0, 0, CANVAS_W / 2, CANVAS_H);
    }
    if (this.redFlashB > 0) {
      const alpha = (this.redFlashB / 0.1) * 0.3;
      ctx.fillStyle = `rgba(255,0,0,${alpha})`;
      ctx.fillRect(CANVAS_W / 2, 0, CANVAS_W / 2, CANVAS_H);
    }
  }

  private drawGameUI(ctx: CanvasRenderingContext2D): void {
    if (this.gameState === 'finished') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      const bannerY = 150;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.font = 'bold 32px "Courier New", monospace';
      const winText = this.winner === 'A' ? '玩家A获胜！' : '玩家B获胜！';
      const winColor = this.winner === 'A' ? '#00A8FF' : '#FF3366';

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#FFFFFF';
      ctx.strokeText(winText, CANVAS_W / 2, bannerY);
      ctx.fillStyle = '#FFD700';
      ctx.fillText(winText, CANVAS_W / 2, bannerY);

      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.lineWidth = 3;
      const at = this.formatTime(this.playerA.finishTime || this.elapsedA);
      const bt = this.formatTime(this.playerB.finishTime || this.elapsedB);

      ctx.strokeText(`A: ${at}`, CANVAS_W / 2 - 100, bannerY + 50);
      ctx.fillStyle = '#00A8FF';
      ctx.fillText(`A: ${at}`, CANVAS_W / 2 - 100, bannerY + 50);

      ctx.lineWidth = 3;
      ctx.strokeText(`B: ${bt}`, CANVAS_W / 2 + 100, bannerY + 50);
      ctx.fillStyle = '#FF3366';
      ctx.fillText(`B: ${bt}`, CANVAS_W / 2 + 100, bannerY + 50);

      if (this.showReplayButton) {
        const btnW = 180;
        const btnH = 52;
        const btnX = CANVAS_W / 2 - btnW / 2;
        const btnY = bannerY + 100;
        this.replayButton = { x: btnX, y: btnY, w: btnW, h: btnH };

        const g = ctx.createLinearGradient(0, btnY, 0, btnY + btnH);
        g.addColorStop(0, '#66BB6A');
        g.addColorStop(1, '#2E7D32');
        ctx.fillStyle = g;
        ctx.fillRect(btnX, btnY, btnW, btnH);

        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(btnX, btnY, btnW, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(btnX, btnY + btnH - 5, btnW, 5);

        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX + 1, btnY + 1, btnW - 2, btnH - 2);

        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#0D3D11';
        ctx.strokeText('再玩一局', CANVAS_W / 2, btnY + btnH / 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('再玩一局', CANVAS_W / 2, btnY + btnH / 2);

        ctx.font = '13px "Courier New", monospace';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000000';
        ctx.strokeText('(空格键)', CANVAS_W / 2, btnY + btnH + 22);
        ctx.fillStyle = '#C5C6C7';
        ctx.fillText('(空格键)', CANVAS_W / 2, btnY + btnH + 22);
      }
      ctx.restore();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    new Game();
  } catch (err) {
    console.error('Failed to initialize game:', err);
  }
});
