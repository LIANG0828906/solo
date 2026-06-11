import { StageManager } from './StageManager';

class Game {
  private canvas: HTMLCanvasElement;
  private stage: StageManager;
  private lastTime: number = 0;
  private rafId: number = 0;
  private frameCount: number = 0;
  private fpsLastUpdate: number = 0;
  private currentFps: number = 60;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    this.stage = new StageManager(this.canvas);
    this.bindEvents();
  }

  private getCanvasCoords(e: MouseEvent | Touch): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  private bindEvents(): void {
    const canvas = this.canvas;

    canvas.addEventListener('mousemove', (e) => {
      const { x, y } = this.getCanvasCoords(e);
      this.stage.handleMouseMove(x, y);
    });

    canvas.addEventListener('mousedown', (e) => {
      const { x, y } = this.getCanvasCoords(e);
      this.stage.handleMouseDown(x, y);
    });

    canvas.addEventListener('mouseup', () => {
      this.stage.handleMouseUp();
    });

    canvas.addEventListener('mouseleave', () => {
      this.stage.handleMouseUp();
      this.stage.showButtons = false;
    });

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const { x, y } = this.getCanvasCoords(e.touches[0]);
        this.stage.handleMouseDown(x, y);
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const { x, y } = this.getCanvasCoords(e.touches[0]);
        this.stage.handleMouseMove(x, y);
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.stage.handleMouseUp();
      this.stage.showButtons = false;
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      const now = performance.now();
      if (this.stage.gameState !== 'playing') return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          this.stage.wusong.startMove(0, -40, 300, now);
          this.stage.showButtons = true;
          break;
        case 's':
        case 'arrowdown':
          this.stage.wusong.startMove(0, 40, 300, now);
          this.stage.showButtons = true;
          break;
        case 'j':
        case ' ':
          e.preventDefault();
          if (this.stage.wusong.startAttack(now)) {
            this.stage.showButtons = true;
            setTimeout(() => {
              if (this.stage.wusong.checkCollision(this.stage.tiger, 35)) {
                this.stage.tiger.takeHit(2, 60, performance.now());
                this.stage.combo++;
                this.stage.round++;
                this.stage.lastHitTime = performance.now();
                if (this.stage.combo > 3) {
                  this.stage.comboFlash.active = true;
                  this.stage.comboFlash.startTime = performance.now();
                }
                if (this.stage.tiger.hp <= 0) {
                  (this.stage as any).endGame('wusong');
                }
              }
            }, 150);
          }
          break;
        case 'k':
        case 'shift':
          this.stage.wusong.startBlock(now);
          this.stage.showButtons = true;
          break;
      }
    });
  }

  private loop(timestamp: number): void {
    if (!this.lastTime) this.lastTime = timestamp;
    const delta = Math.min(33, timestamp - this.lastTime);
    this.lastTime = timestamp;

    this.frameCount++;
    if (timestamp - this.fpsLastUpdate >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.fpsLastUpdate = timestamp;
    }

    try {
      this.stage.update(delta, timestamp);
      this.stage.draw(timestamp);
    } catch (err) {
      console.error('Game loop error:', err);
    }

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  public start(): void {
    this.lastTime = 0;
    this.rafId = requestAnimationFrame((t) => this.loop(t));
    console.log('皮影戏 · 武松打虎 启动成功');
    console.log('操作方式：鼠标悬停武松显示按钮，或使用键盘 (W/S移动 J/空格攻击 K/Shift防御)');
  }

  public stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  public getFps(): number {
    return this.currentFps;
  }
}

function bootstrap(): void {
  try {
    const game = new Game();
    game.start();
    (window as any).__shadowPuppetGame = game;
  } catch (err) {
    console.error('游戏初始化失败:', err);
    const errDiv = document.createElement('div');
    errDiv.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: #2F1B0E; color: #FF6B6B; padding: 30px 50px; border: 2px solid #FFD700;
      border-radius: 8px; font-family: KaiTi, serif; font-size: 18px; text-align: center;
    `;
    errDiv.innerHTML = `
      <div style="color: #FFD700; font-size: 24px; margin-bottom: 12px;">皮影戏启动失败</div>
      <div>${(err as Error).message}</div>
    `;
    document.body.appendChild(errDiv);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
