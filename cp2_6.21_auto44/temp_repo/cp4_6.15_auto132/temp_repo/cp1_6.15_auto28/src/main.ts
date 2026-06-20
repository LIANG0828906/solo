import * as PIXI from 'pixi.js';
import { OrderManager } from './OrderManager';
import { UIManager } from './UIManager';
import { SoundManager } from './SoundManager';
import { GameScene } from './GameScene';

class Game {
  private app: PIXI.Application;
  private orderManager: OrderManager;
  private uiManager: UIManager;
  private soundManager: SoundManager;
  private gameScene: GameScene;
  private lastTime: number = 0;

  constructor() {
    this.app = new PIXI.Application({
      width: 1280,
      height: 720,
      backgroundColor: 0x1a0f0a,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    const container = document.getElementById('game-container');
    if (container) {
      container.appendChild(this.app.view as HTMLCanvasElement);
    }

    this.soundManager = new SoundManager();
    this.orderManager = new OrderManager();
    this.uiManager = new UIManager(this.app, this.soundManager);
    this.gameScene = new GameScene(this.orderManager, this.uiManager, this.soundManager);

    this.setup();
  }

  private setup(): void {
    this.app.stage.addChild(this.uiManager.getContainer());
    this.uiManager.init();

    this.lastTime = performance.now();
    this.app.ticker.add(this.update.bind(this));

    window.addEventListener('resize', this.onResize.bind(this));
    this.onResize();

    document.addEventListener('click', () => {
      // Unlock audio context on first user interaction
    }, { once: true });
  }

  private update(delta: number): void {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    this.gameScene.update(deltaTime, now);
  }

  private onResize(): void {
    const container = document.getElementById('game-container');
    if (!container) return;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const gameWidth = 1280;
    const gameHeight = 720;

    const scale = Math.min(windowWidth / gameWidth, windowHeight / gameHeight);
    const scaledWidth = gameWidth * scale;
    const scaledHeight = gameHeight * scale;

    const canvas = this.app.view as HTMLCanvasElement;
    canvas.style.width = `${scaledWidth}px`;
    canvas.style.height = `${scaledHeight}px`;
    canvas.style.position = 'absolute';
    canvas.style.left = `${(windowWidth - scaledWidth) / 2}px`;
    canvas.style.top = `${(windowHeight - scaledHeight) / 2}px`;
  }

  public start(): void {
    // Game is started via UI interactions
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
