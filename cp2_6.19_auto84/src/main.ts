import { BeatDetector, type BeatEvent } from './audio/beatDetector';
import { MazeGenerator } from './maze/mazeGenerator';
import { MazeRenderer } from './maze/mazeRenderer';
import { PlayerController, type Direction } from './player/playerController';
import type { ParticleEffect } from './player/events';

class Game {
  private beatDetector: BeatDetector;
  private mazeGenerator: MazeGenerator;
  private renderer: MazeRenderer;
  private playerController: PlayerController;
  private lastFrameTime: number;
  private animationFrameId: number;
  private gameStarted: boolean;
  private canvas: HTMLCanvasElement;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    this.beatDetector = new BeatDetector();
    this.mazeGenerator = new MazeGenerator(10, Date.now());
    this.mazeGenerator.generate();
    this.renderer = new MazeRenderer(this.canvas, this.mazeGenerator.getGrid(), 10);
    this.playerController = new PlayerController(this.mazeGenerator);
    this.lastFrameTime = 0;
    this.animationFrameId = 0;
    this.gameStarted = false;

    this.setupCallbacks();
    this.setupInput();
    this.setupResize();
  }

  private setupCallbacks(): void {
    this.beatDetector.onBeat((event: BeatEvent) => {
      this.renderer.onBeat(event);
      this.playerController.onBeat(event);
    });

    this.playerController.setStateChangeCallback(() => {
    });

    this.playerController.setParticleEffectCallback((effect: ParticleEffect) => {
      this.renderer.addParticleEffect(effect);
      const p = this.playerController.getPlayer();
      let color = '#ffffff';
      if (effect.type === 'green_expand') color = '#4ade80';
      else if (effect.type === 'red_shatter') color = '#ef4444';
      else if (effect.type === 'blue_ring') color = '#60a5fa';
      else if (effect.type === 'yellow_spark') color = '#facc15';
      else if (effect.type === 'purple_twirl') color = '#a855f7';

      if (effect.type === 'green_expand') {
        this.renderer.addFloatingText('+10', p.x, p.y, color);
      } else if (effect.type === 'red_shatter') {
        this.renderer.addFloatingText('-15', p.x, p.y, color);
      } else if (effect.type === 'yellow_spark') {
        this.renderer.addFloatingText('COMBO', p.x, p.y, color);
      } else if (effect.type === 'purple_twirl') {
        this.renderer.addFloatingText('TELEPORT', p.x, p.y, color);
      }
    });

    this.playerController.setMessageCallback((msg: string) => {
      const p = this.playerController.getPlayer();
      this.renderer.addFloatingText(msg, p.x, p.y - 0.5, '#ffffff');
    });

    this.playerController.setComboChangeCallback((combo: number) => {
      this.renderer.onComboChange(combo);
    });
  }

  private setupInput(): void {
    const keyMap: Record<string, Direction> = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'w': 'up',
      'W': 'up',
      's': 'down',
      'S': 'down',
      'a': 'left',
      'A': 'left',
      'd': 'right',
      'D': 'right'
    };

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.gameStarted) return;

      const direction = keyMap[e.key];
      if (direction) {
        e.preventDefault();
        this.playerController.queueMove(direction);
      }
    });

    let touchStartX = 0;
    let touchStartY = 0;

    this.canvas.addEventListener('touchstart', (e: TouchEvent) => {
      if (!this.gameStarted) return;
      e.preventDefault();
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e: TouchEvent) => {
      if (!this.gameStarted) return;
      e.preventDefault();
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const threshold = 30;

      if (Math.max(absDx, absDy) < threshold) return;

      let direction: Direction;
      if (absDx > absDy) {
        direction = dx > 0 ? 'right' : 'left';
      } else {
        direction = dy > 0 ? 'down' : 'up';
      }
      this.playerController.queueMove(direction);
    }, { passive: false });
  }

  private setupResize(): void {
    const handleResize = () => {
      const container = document.getElementById('game-container');
      if (!container) return;
      this.renderer.handleResize();
    };

    window.addEventListener('resize', handleResize);
  }

  async start(): Promise<void> {
    await this.beatDetector.init();
    this.renderer.setBeatDetector(this.beatDetector);
    this.gameStarted = true;
    this.gameLoop(performance.now());
  }

  private gameLoop(currentTime: number): void {
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    this.playerController.update(deltaTime);
    this.playerController.checkMissedBeat();

    const player = this.playerController.getPlayer();
    this.renderer.render(player, deltaTime);

    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  destroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.beatDetector.destroy();
  }
}

let game: Game | null = null;

const initGame = async () => {
  if (game) return;
  game = new Game();

  const startOverlay = document.createElement('div');
  startOverlay.id = 'start-overlay';
  startOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 100;
    font-family: 'Courier New', monospace;
  `;

  const title = document.createElement('h1');
  title.textContent = '🎵 节奏迷宫 🎵';
  title.style.cssText = `
    color: #fbbf24;
    font-size: 48px;
    margin-bottom: 20px;
    text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
  `;

  const desc = document.createElement('p');
  desc.innerHTML = '使用 <b style="color:#60a5fa">方向键</b> 或 <b style="color:#60a5fa">WASD</b> 控制角色<br>跟随节拍移动，踩中节拍获得能量！';
  desc.style.cssText = `
    color: #e2e8f0;
    font-size: 18px;
    margin-bottom: 40px;
    text-align: center;
    line-height: 1.8;
  `;

  const btn = document.createElement('button');
  btn.textContent = '点击开始游戏';
  btn.style.cssText = `
    padding: 16px 48px;
    font-size: 20px;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.4);
    transition: transform 0.1s, box-shadow 0.2s;
  `;
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.05)';
    btn.style.boxShadow = '0 0 40px rgba(59, 130, 246, 0.6)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.4)';
  });
  btn.addEventListener('click', async () => {
    startOverlay.remove();
    await game?.start();
  });

  startOverlay.appendChild(title);
  startOverlay.appendChild(desc);
  startOverlay.appendChild(btn);
  document.body.appendChild(startOverlay);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
