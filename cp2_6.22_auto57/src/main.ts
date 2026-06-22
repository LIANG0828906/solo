import * as PIXI from 'pixi.js';
import { MapManager } from './map/MapManager';
import { PlayerController } from './player/PlayerController';
import { ResourceSystem } from './player/ResourceSystem';
import { ParticleSystem } from './ParticleSystem';
import { GameRenderer } from './GameRenderer';
import { UIManager } from './UIManager';
import { TileType, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from './types';

type GameScene = 'menu' | 'playing' | 'gameover' | 'victory';

class Game {
  private app: PIXI.Application;
  private mapManager: MapManager;
  private playerController: PlayerController;
  private resourceSystem: ResourceSystem;
  private particleSystem: ParticleSystem;
  private gameRenderer: GameRenderer;
  private uiManager: UIManager;

  private currentScene: GameScene = 'menu';
  private lastMoveDustTime: number = 0;
  private menuParticleTimer: number = 0;
  private menuParticles: Array<{
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number; size: number; color: number;
  }> = [];

  private joystickMoveTimer: number = 0;
  private readonly JOYSTICK_MOVE_INTERVAL = 0.06;

  private readonly FRAME_GUARD_THRESHOLD_MS = 400;
  private _lastTickerTime = 0;
  private _rafFallbackId: number | null = null;
  private _rafLastTime = 0;

  constructor() {
    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x0a0a12,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: false,
      autoStart: true
    });

    const container = document.getElementById('game-container');
    if (container) {
      container.appendChild(this.app.view as HTMLCanvasElement);
    } else {
      document.body.appendChild(this.app.view as HTMLCanvasElement);
    }

    this.mapManager = new MapManager();
    this.resourceSystem = new ResourceSystem();
    this.playerController = new PlayerController(this.mapManager, this.resourceSystem);
    this.particleSystem = new ParticleSystem();
    this.gameRenderer = new GameRenderer(this.app);
    this.uiManager = new UIManager(this.app);

    this.setupCallbacks();
    this.setupInput();
    this.setupResize();
    this.setupVisibilityGuard();

    this._lastTickerTime = performance.now();
    this._rafLastTime = this._lastTickerTime;

    const self = this;
    const boundGameLoop = (delta: number) => {
      self._lastTickerTime = performance.now();
      self.gameLoop(delta);
    };
    this.app.ticker.add(boundGameLoop);

    this.setupFrameGuard();

    window.addEventListener('load', () => {
      if (!this.app.ticker.started) {
        try { this.app.ticker.start(); } catch (_e) {}
      }
      this._lastTickerTime = performance.now();
    });
  }

  private setupFrameGuard(): void {
    const self = this;

    const guardLoop = (now: number) => {
      self._rAF(guardLoop);

      if (document.hidden) return;

      const elapsed = now - self._lastTickerTime;
      if (elapsed > self.FRAME_GUARD_THRESHOLD_MS) {
        try {
          if (!self.app.ticker.started) {
            self.app.ticker.start();
          }
        } catch (_e) { /* ignore */ }

        const deltaMs = now - self._rafLastTime;
        if (deltaMs > 4) {
          const deltaFrames = Math.min(3, deltaMs / (1000 / 60));
          self._rafLastTime = now;
          self._lastTickerTime = now;
          self.gameLoop(deltaFrames);
        }
      }
    };

    this._rAF(guardLoop);
  }

  private _rAF(cb: FrameRequestCallback): number {
    const fn = window.requestAnimationFrame ||
      (window as any).webkitRequestAnimationFrame ||
      (window as any).mozRequestAnimationFrame ||
      ((cb: FrameRequestCallback) => window.setTimeout(cb, 16));
    return fn.call(window, cb);
  }

  private setupVisibilityGuard(): void {
    const resumeTicker = () => {
      if (document.hidden) return;
      this._lastTickerTime = performance.now();
      this._rafLastTime = this._lastTickerTime;
      try {
        if (!this.app.ticker.started) {
          this.app.ticker.start();
        }
      } catch (_e) {
        // ignore
      }
    };
    document.addEventListener('visibilitychange', resumeTicker);
    window.addEventListener('focus', resumeTicker);
    window.addEventListener('resize', resumeTicker);
    document.addEventListener('DOMContentLoaded', resumeTicker);
  }

  private setupCallbacks(): void {
    this.resourceSystem.onUpdate((state) => {
      this.uiManager.updateState(state);
    });

    this.resourceSystem.onGameOver((reason) => {
      this.gameOver(reason);
    });

    this.playerController.onTrapTriggered((x, y) => {
      this.gameRenderer.triggerScreenShake(10, 0.35);
      this.gameRenderer.triggerDamageFlash(0.4);
      this.gameRenderer.addTrapFlash(x, y);
      this.particleSystem.spawnTrapEffect(x * TILE_SIZE, y * TILE_SIZE);
      this.particleSystem.spawnTrapDebris(x * TILE_SIZE, y * TILE_SIZE);
    });

    this.playerController.onResourceCollected((type, x, y) => {
      if (type === TileType.CRYSTAL) {
        this.particleSystem.spawnCrystalCollect(x * TILE_SIZE, y * TILE_SIZE);
      } else if (type === TileType.ORE) {
        this.particleSystem.spawnOreCollect(x * TILE_SIZE, y * TILE_SIZE);
      }
    });

    this.playerController.onExitReached(() => {
      this.victory();
    });

    this.uiManager.onStart = () => {
      this.startGame();
    };

    this.uiManager.onRestart = () => {
      this.restartGame();
    };

    this.uiManager.onJoystickMove = (dx, dy) => {
    };

    this.uiManager.onJoystickEnd = () => {
      this.playerController.clearMoveDirection();
    };
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e) => {
      if (this.currentScene !== 'playing') return;
      this.playerController.handleKeyDown(e.key);
    });

    window.addEventListener('keyup', (e) => {
      if (this.currentScene !== 'playing') return;
      this.playerController.handleKeyUp(e.key);
    });
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
      this.gameRenderer.resize();
      this.uiManager.resize();
    });
  }

  private gameLoop(delta: number): void {
    const deltaTime = delta / 60;

    switch (this.currentScene) {
      case 'menu':
        this.updateMenu(deltaTime);
        break;
      case 'playing':
        this.updatePlaying(deltaTime);
        break;
      case 'gameover':
      case 'victory':
        this.updateEndScreen(deltaTime);
        break;
    }
  }

  private updateMenu(deltaTime: number): void {
    this.menuParticleTimer += deltaTime;
    if (this.menuParticleTimer > 0.1) {
      this.menuParticleTimer = 0;
      this.spawnMenuParticle();
    }

    for (let i = this.menuParticles.length - 1; i >= 0; i--) {
      const p = this.menuParticles[i];
      p.life -= deltaTime;
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += 5 * deltaTime;

      if (p.life <= 0) {
        this.menuParticles.splice(i, 1);
      }
    }

    this.uiManager.updateMenuParticles(this.menuParticles);
  }

  private spawnMenuParticle(): void {
    if (this.menuParticles.length >= 50) return;

    const x = Math.random() * this.app.screen.width;
    const speed = 20 + Math.random() * 30;

    this.menuParticles.push({
      x,
      y: this.app.screen.height + 10,
      vx: (Math.random() - 0.5) * 10,
      vy: -speed,
      life: 3 + Math.random() * 2,
      maxLife: 5,
      size: 2 + Math.random() * 3,
      color: 0x2a3a4c
    });
  }

  private updatePlaying(deltaTime: number): void {
    this.resourceSystem.update(deltaTime);
    this.playerController.update(deltaTime);
    this.particleSystem.update(deltaTime);

    if (this.playerController.isPlayerMoving()) {
      this.lastMoveDustTime += deltaTime;
      if (this.lastMoveDustTime > 0.08) {
        this.lastMoveDustTime = 0;
        const pos = this.playerController.getPixelPosition();
        this.particleSystem.spawnDust(pos.x, pos.y);
      }
    }

    this.updateJoystickMovement(deltaTime);

    const map = this.mapManager.getMap();
    const playerPos = this.playerController.getPosition();

    this.gameRenderer.update(deltaTime, map, playerPos);
    this.gameRenderer.updateFog(map);
    this.gameRenderer.updatePlayer(this.playerController);
    this.gameRenderer.updateParticles(this.particleSystem);
    this.gameRenderer.updateCamera(playerPos);

    this.uiManager.update(deltaTime);
  }

  private updateJoystickMovement(deltaTime: number): void {
    if (!this.uiManager.isJoystickActive()) return;

    const dir = this.uiManager.getJoystickDirection();
    const threshold = 0.3;

    this.joystickMoveTimer -= deltaTime;

    if (this.joystickMoveTimer <= 0) {
      let dx = 0;
      let dy = 0;

      if (Math.abs(dir.x) > Math.abs(dir.y)) {
        if (dir.x > threshold) dx = 1;
        else if (dir.x < -threshold) dx = -1;
      } else {
        if (dir.y > threshold) dy = 1;
        else if (dir.y < -threshold) dy = -1;
      }

      if (dx !== 0 || dy !== 0) {
        this.playerController.setMoveDirection(dx, dy);
        this.joystickMoveTimer = this.JOYSTICK_MOVE_INTERVAL;
      }
    }
  }

  private updateEndScreen(deltaTime: number): void {
    this.uiManager.update(deltaTime);
    this.particleSystem.update(deltaTime);
    this.gameRenderer.updateParticles(this.particleSystem);
  }

  private startGame(): void {
    this.currentScene = 'playing';
    this.uiManager.hideMenu();

    this.initGame();
  }

  private initGame(): void {
    const mapData = this.mapManager.generateMap();

    this.gameRenderer.initMap(mapData.map);

    this.playerController.init(mapData.entrance);
    this.resourceSystem.reset();
    this.particleSystem.clear();

    this.gameRenderer.updateCamera(mapData.entrance);
  }

  private gameOver(reason: 'health' | 'oxygen'): void {
    this.currentScene = 'gameover';
    this.uiManager.showGameOver(this.resourceSystem.getState());
  }

  private victory(): void {
    this.currentScene = 'victory';
    this.uiManager.showVictory(this.resourceSystem.getState());
  }

  private restartGame(): void {
    this.currentScene = 'playing';
    this.initGame();
  }

  public destroy(): void {
    this.app.destroy(true);
  }
}

const game = new Game();

(window as any).game = game;
