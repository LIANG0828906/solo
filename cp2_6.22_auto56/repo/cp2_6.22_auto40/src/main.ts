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

  private cameraCenterX: number = 0;
  private cameraCenterY: number = 0;
  private cameraTargetX: number = 0;
  private cameraTargetY: number = 0;
  private readonly CAMERA_LERP_SPEED: number = 8;
  private cameraLockedOnPlayer: boolean = true;

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

    const startGX = Math.floor(this.mapManager.gridWidth / 2);
    const startGY = Math.floor(this.mapManager.gridHeight / 2);
    this.cameraCenterX = startGX;
    this.cameraCenterY = startGY;
    this.cameraTargetX = startGX;
    this.cameraTargetY = startGY;

    this.uiManager = new UIManager(this.app, this.mapManager, {
      getPlayerGridPos: () => ({ x: this.player.gridX, y: this.player.gridY }),
      onMinimapClick: (gx: number, gy: number) => this.onMinimapClick(gx, gy)
    });

    this.player = new Player(this.app, this.mapManager, {
      onMove: () => {
        this.cameraLockedOnPlayer = true;
        this.uiManager.onMove();
      },
      onBlocked: () => this.uiManager.onBlocked(),
      onTreasureCollected: (_gx, _gy) => {
        this.uiManager.onTreasureCollected(this.player.treasureCount, this.mapManager.totalTreasures);
        this.checkVictory();
      }
    });

    this.setupInput();
    this.setupResize();
    this.updateUIStats();
    this.updateCameraOffset(true);

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
      this.updateCameraOffset(true);
    });
  }

  private onMinimapClick(gx: number, gy: number): void {
    this.cameraTargetX = gx;
    this.cameraTargetY = gy;
    this.cameraLockedOnPlayer = false;
  }

  private updateCameraOffset(immediate: boolean = false): void {
    if (this.cameraLockedOnPlayer) {
      this.cameraTargetX = this.player.gridX;
      this.cameraTargetY = this.player.gridY;
    }
    if (immediate) {
      this.cameraCenterX = this.cameraTargetX;
      this.cameraCenterY = this.cameraTargetY;
    }
    const frameEl = document.getElementById('game-frame');
    const availW = frameEl ? frameEl.getBoundingClientRect().width : this.app.renderer.width;
    const availH = frameEl ? frameEl.getBoundingClientRect().height : this.app.renderer.height;
    const cs = this.mapManager.cellSize;
    const mapW = cs * this.mapManager.gridWidth;
    const mapH = cs * this.mapManager.gridHeight;
    const centerWorldX = this.cameraCenterX * cs + cs / 2;
    const centerWorldY = this.cameraCenterY * cs + cs / 2;
    let offsetX = availW / 2 - centerWorldX;
    let offsetY = availH / 2 - centerWorldY;
    const maxX = 0;
    const minX = Math.min(0, availW - mapW);
    const maxY = 0;
    const minY = Math.min(0, availH - mapH);
    if (mapW < availW) {
      offsetX = (availW - mapW) / 2;
    } else {
      offsetX = Math.max(minX, Math.min(maxX, offsetX));
    }
    if (mapH < availH) {
      offsetY = (availH - mapH) / 2;
    } else {
      offsetY = Math.max(minY, Math.min(maxY, offsetY));
    }
    this.mapManager.offsetX = offsetX;
    this.mapManager.offsetY = offsetY;
    this.mapManager.terrainContainer.x = offsetX;
    this.mapManager.terrainContainer.y = offsetY;
    this.mapManager.fogContainer.x = offsetX;
    this.mapManager.fogContainer.y = offsetY;
    this.mapManager.treasureContainer.x = offsetX;
    this.mapManager.treasureContainer.y = offsetY;
    this.player.resize();
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
    const dt = delta / 60;
    this.handleMovement();

    const lerpT = Math.min(1, this.CAMERA_LERP_SPEED * dt);
    this.cameraCenterX += (this.cameraTargetX - this.cameraCenterX) * lerpT;
    this.cameraCenterY += (this.cameraTargetY - this.cameraCenterY) * lerpT;
    this.updateCameraOffset(false);

    this.mapManager.update(delta);
    this.player.update(delta);
    this.updateUIStats();
    this.uiManager.updateMinimap(
      this.player.gridX,
      this.player.gridY,
      this.cameraCenterX,
      this.cameraCenterY
    );
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
