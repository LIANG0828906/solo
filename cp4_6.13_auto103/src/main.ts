import { Player, InputState } from './Player';
import { PlatformManager, PlatformData } from './Platform';
import { CoinManager } from './Coin';
import { Renderer, GameUIState } from './Renderer';

const BASE_WIDTH = 400;
const BASE_HEIGHT = 640;
const HIGH_SCORE_KEY = 'pixel-jumper-highscore';

interface TouchInput {
  leftTouch: boolean;
  rightTouch: boolean;
}

class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private player!: Player;
  private platformManager!: PlatformManager;
  private coinManager!: CoinManager;

  private worldWidth: number = BASE_WIDTH;
  private worldHeight: number = BASE_HEIGHT;
  private cameraY: number = 0;
  private highestCameraY: number = 0;

  private input: InputState = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
  };
  private touchInput: TouchInput = {
    leftTouch: false,
    rightTouch: false,
  };

  private ui: GameUIState;

  private _lastFrameTime: number = 0;
  private _animFrameId: number = 0;
  private running: boolean = false;
  private firstCoinSyncDone: boolean = false;

  private baseGravity: number = 0.45;
  private baseJumpForce: number = 11;
  private baseMoveSpeed: number = 3.5;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.renderer = new Renderer(this.canvas, this.worldWidth, this.worldHeight);

    const restartBtn = this.renderer.getRestartButton();
    this.ui = {
      score: 0,
      scoreAnim: 0,
      prevScore: 0,
      gameOver: false,
      gameOverAlpha: 0,
      restartBtn: { ...restartBtn, hover: false },
      highScore: this.loadHighScore(),
    };

    this.resizeCanvas();
    this.initGame();
    this.bindEvents();
    this.start();
  }

  private loadHighScore(): number {
    try {
      const v = localStorage.getItem(HIGH_SCORE_KEY);
      return v ? parseInt(v, 10) || 0 : 0;
    } catch (_e) {
      return 0;
    }
  }

  private saveHighScore(score: number): void {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(score));
    } catch (_e) {
      void _e;
    }
  }

  private resizeCanvas(): void {
    const container = this.canvas.parentElement!;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    const targetAspect = this.worldWidth / this.worldHeight;
    let w = cw;
    let h = cw / targetAspect;
    if (h > ch) {
      h = ch;
      w = ch * targetAspect;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${Math.floor(w)}px`;
    this.canvas.style.height = `${Math.floor(h)}px`;
    const ctx = this.canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.renderer.resize(this.worldWidth, this.worldHeight);
    const restartBtn = this.renderer.getRestartButton();
    this.ui.restartBtn.x = restartBtn.x;
    this.ui.restartBtn.y = restartBtn.y;
    this.ui.restartBtn.w = restartBtn.w;
    this.ui.restartBtn.h = restartBtn.h;
  }

  private computeDifficulty(): number {
    return Math.floor(this.ui.score / 10);
  }

  private initGame(): void {
    this.platformManager = new PlatformManager(this.worldWidth, this.worldHeight);
    this.coinManager = new CoinManager(this.worldWidth, this.worldHeight);

    this.platformManager.setDifficulty(0);
    this.coinManager.setDifficulty(0);
    this.platformManager.generateInitial();
    this.coinManager.generateForPlatforms(this.platformManager.getAll());
    this.firstCoinSyncDone = true;

    const startPlat = this.platformManager.getAll()[0];
    const startX = startPlat.x + startPlat.width / 2 - 8;
    const startY = startPlat.y - 16 - 2;

    this.player = new Player({
      x: startX,
      y: startY,
      width: 16,
      height: 18,
      gravity: this.baseGravity,
      jumpForce: this.baseJumpForce,
      moveSpeed: this.baseMoveSpeed,
    });

    this.cameraY = startY - this.worldHeight * 0.65;
    this.highestCameraY = this.cameraY;

    this.ui.score = 0;
    this.ui.prevScore = 0;
    this.ui.scoreAnim = 0;
    this.ui.gameOver = false;
    this.ui.gameOverAlpha = 0;
  }

  private bindEvents(): void {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === 'a' || e.key === 'ArrowLeft') this.input.left = true;
      if (k === 'd' || e.key === 'ArrowRight') this.input.right = true;
      if (k === ' ' || e.key === 'Spacebar') {
        this.input.jump = true;
        this.input.jumpPressed = true;
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || e.key === 'ArrowLeft') this.input.left = false;
      if (k === 'd' || e.key === 'ArrowRight') this.input.right = false;
      if (k === ' ' || e.key === 'Spacebar') this.input.jump = false;
    });

    window.addEventListener('resize', () => this.resizeCanvas());

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.ui.gameOver) return;
      const p = this.renderer.toWorldCoords(e.clientX, e.clientY);
      const b = this.ui.restartBtn;
      this.ui.restartBtn.hover =
        p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
      this.canvas.style.cursor = this.ui.restartBtn.hover ? 'pointer' : 'default';
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.ui.gameOver && this.ui.gameOverAlpha > 0.5) {
        const p = this.renderer.toWorldCoords(e.clientX, e.clientY);
        const b = this.ui.restartBtn;
        if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
          this.restart();
        }
      }
    });

    const updateTouch = (touches: TouchList) => {
      this.touchInput.leftTouch = false;
      this.touchInput.rightTouch = false;
      let jumpTriggered = false;

      for (let i = 0; i < touches.length; i++) {
        const t = touches[i];
        const p = this.renderer.toWorldCoords(t.clientX, t.clientY);

        if (this.ui.gameOver && this.ui.gameOverAlpha > 0.5) {
          const b = this.ui.restartBtn;
          if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
            this.restart();
            return;
          }
        }

        if (p.x < this.worldWidth * 0.33) {
          this.touchInput.leftTouch = true;
        } else if (p.x > this.worldWidth * 0.67) {
          this.touchInput.rightTouch = true;
        } else {
          if (!jumpTriggered) {
            if (!this.input.jump) {
              this.input.jumpPressed = true;
            }
            this.input.jump = true;
            jumpTriggered = true;
          }
        }
      }

      if (!jumpTriggered) {
        this.input.jump = false;
      }
    };

    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        updateTouch(e.touches);
      },
      { passive: false }
    );
    this.canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        updateTouch(e.touches);
      },
      { passive: false }
    );
    this.canvas.addEventListener(
      'touchend',
      (e) => {
        e.preventDefault();
        if (e.touches.length === 0) {
          this.touchInput.leftTouch = false;
          this.touchInput.rightTouch = false;
          this.input.jump = false;
        } else {
          updateTouch(e.touches);
        }
      },
      { passive: false }
    );
  }

  private doPlatformCollision(): void {
    if (this.player.velocityY <= 0) {
      this.player.isOnGround = false;
      return;
    }

    const pb = this.player.getBounds();
    const prevBottom = pb.bottom - this.player.velocityY;

    let landed = false;
    for (const plat of this.platformManager.getAll()) {
      if (!this.checkPlatformOverlap(pb, plat)) continue;
      if (prevBottom > plat.y + 1) continue;

      const newY = plat.y - this.player.height;
      if (newY < this.player.y) {
        this.player.y = newY;
        this.player.velocityY = 0;
        this.player.isOnGround = true;
        landed = true;
        break;
      }
    }

    if (!landed) {
      this.player.isOnGround = false;
    }
  }

  private checkPlatformOverlap(
    pb: { left: number; right: number; top: number; bottom: number },
    plat: PlatformData
  ): boolean {
    return (
      pb.right > plat.x + 2 &&
      pb.left < plat.x + plat.width - 2 &&
      pb.bottom >= plat.y &&
      pb.top <= plat.y + plat.height
    );
  }

  private syncCoinsWithPlatforms(): void {
    const existing = this.coinManager.getCoins();
    if (existing.length < this.platformManager.getAll().length * 0.35) {
      this.coinManager.generateForPlatforms(this.platformManager.getAll());
    }
  }

  private update(time: number): void {
    if (this.ui.gameOver) {
      this.ui.gameOverAlpha = Math.min(1, this.ui.gameOverAlpha + 0.025);
      return;
    }

    const diffLevel = this.computeDifficulty();
    const speedMul = 1 + diffLevel * 0.08;
    this.player['gravity'] = this.baseGravity * Math.min(speedMul, 1.6);
    this.player['jumpForce'] = this.baseJumpForce * Math.min(1 + diffLevel * 0.03, 1.3);
    this.player['moveSpeed'] = this.baseMoveSpeed * Math.min(1 + diffLevel * 0.04, 1.4);
    this.platformManager.setDifficulty(diffLevel);
    this.coinManager.setDifficulty(diffLevel);

    const effectiveInput: InputState = {
      left: this.input.left || this.touchInput.leftTouch,
      right: this.input.right || this.touchInput.rightTouch,
      jump: this.input.jump,
      jumpPressed: this.input.jumpPressed,
    };

    this.player.update(effectiveInput, this.worldWidth);
    this.input.jumpPressed = false;

    this.doPlatformCollision();

    const targetCameraY = this.player.y - this.worldHeight * 0.55;
    if (targetCameraY < this.highestCameraY) {
      this.cameraY += (targetCameraY - this.cameraY) * 0.15;
      if (this.cameraY < this.highestCameraY) {
        this.highestCameraY = this.cameraY;
      }
    } else {
      this.cameraY = this.highestCameraY;
    }

    const prevPlatformCount = this.platformManager.getAll().length;
    this.platformManager.update(this.cameraY);
    if (this.platformManager.getAll().length > prevPlatformCount || !this.firstCoinSyncDone) {
      this.syncCoinsWithPlatforms();
    }
    this.firstCoinSyncDone = true;

    const gained = this.coinManager.update(this.cameraY, this.player.getBounds());
    if (gained > 0) {
      this.ui.score += gained;
      this.ui.scoreAnim = Math.PI;
      if (this.ui.score > this.ui.highScore) {
        this.ui.highScore = this.ui.score;
        this.saveHighScore(this.ui.highScore);
      }
    }

    if (this.ui.scoreAnim > 0) {
      this.ui.scoreAnim -= 0.15;
      if (this.ui.scoreAnim < 0) this.ui.scoreAnim = 0;
    }

    const playerScreenY = this.player.y - this.cameraY;
    if (playerScreenY > this.worldHeight + 60) {
      this.ui.gameOver = true;
      this.ui.gameOverAlpha = 0;
      if (this.ui.score > this.ui.highScore) {
        this.ui.highScore = this.ui.score;
        this.saveHighScore(this.ui.highScore);
      }
    }

    void time;
  }

  private render(time: number): void {
    this.renderer.clear();
    this.renderer.drawBackground(this.cameraY, time);
    this.renderer.drawPlatforms(this.platformManager, this.cameraY);
    this.renderer.drawCoins(this.coinManager, this.cameraY);
    this.renderer.drawPlayer(this.player, this.cameraY);
    this.renderer.drawFloatingTexts(this.coinManager.getFloatingTexts(), this.cameraY);
    this.renderer.drawUI(this.ui);
    this.renderer.drawGameOver(this.ui);
  }

  private loop = (time: number): void => {
    if (!this.running) return;
    this._lastFrameTime = time;
    void this._lastFrameTime;
    this.update(time);
    this.render(time);
    this._animFrameId = requestAnimationFrame(this.loop);
  };

  public start(): void {
    this.running = true;
    this._lastFrameTime = performance.now();
    this._animFrameId = requestAnimationFrame(this.loop);
    void this._animFrameId;
  }

  public restart(): void {
    this.platformManager.clear();
    this.coinManager.clear();
    this.initGame();
  }
}

function boot(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new Game());
  } else {
    new Game();
  }
}

boot();
