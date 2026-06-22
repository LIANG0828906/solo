import * as PIXI from 'pixi.js';
import { MapManager } from './MapManager';
import { Player } from './Player';
import { UIManager } from './UIManager';

class Game {
  private app: PIXI.Application;
  private mapManager: MapManager;
  private player: Player;
  private uiManager: UIManager;

  private keys: Set<string> = new Set();
  private moveCooldown: number = 0;
  private readonly MOVE_COOLDOWN_FRAMES: number = 6;
  private victoryTriggered: boolean = false;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.app = new PIXI.Application({
      view: canvas,
      resizeTo: document.getElementById('game-frame') || window,
      backgroundColor: 0x2a1a0e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    this.mapManager = new MapManager(this.app);

    this.uiManager = new UIManager(this.app, this.mapManager);

    this.player = new Player(this.app, this.mapManager, {
      onMove: () => this.uiManager.onMove(),
      onBlocked: () => this.uiManager.onBlocked(),
      onTreasureCollected: (_gx, _gy) => {
        this.uiManager.onTreasureCollected(this.player.treasureCount, this.mapManager.totalTreasures);
        this.checkVictory();
      }
    });

    this.setupInput();
    this.setupResize();
    this.updateUIStats();

    this.app.ticker.add((delta) => this.update(delta));
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.uiManager.unlockAudio();
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        this.keys.add(key);
      }
    });
    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys.delete(e.key.toLowerCase());
    });
    window.addEventListener('click', () => {
      this.uiManager.unlockAudio();
    });
    window.addEventListener('touchstart', () => {
      this.uiManager.unlockAudio();
    });
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.mapManager.resize();
      this.player.resize();
      this.uiManager.resize();
    });
  }

  private updateUIStats(): void {
    this.uiManager.updateStats(
      this.mapManager.getExploredCount(),
      this.mapManager.getTotalCells(),
      this.player.treasureCount,
      this.mapManager.totalTreasures
    );
  }

  private checkVictory(): void {
    if (this.victoryTriggered) return;
    if (this.player.treasureCount >= 2) {
      this.victoryTriggered = true;
      this.uiManager.triggerVictory();
    }
  }

  private handleMovement(): void {
    if (this.moveCooldown > 0) {
      this.moveCooldown--;
      return;
    }
    if (this.player.isMoving) return;
    if (this.victoryTriggered) return;

    let dx = 0;
    let dy = 0;

    if (this.keys.has('w') || this.keys.has('arrowup')) dy = -1;
    else if (this.keys.has('s') || this.keys.has('arrowdown')) dy = 1;
    else if (this.keys.has('a') || this.keys.has('arrowleft')) dx = -1;
    else if (this.keys.has('d') || this.keys.has('arrowright')) dx = 1;

    if (dx !== 0 || dy !== 0) {
      this.player.tryMove(dx, dy);
      this.moveCooldown = this.MOVE_COOLDOWN_FRAMES;
    }
  }

  private update(delta: number): void {
    this.handleMovement();
    this.mapManager.update(delta);
    this.player.update(delta);
    this.updateUIStats();
  }

  public destroy(): void {
    this.player.destroy();
    this.uiManager.destroy();
    this.app.destroy(true);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  (window as any).__game = game;
});
