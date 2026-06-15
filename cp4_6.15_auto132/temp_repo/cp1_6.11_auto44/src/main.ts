import { GameState, CameraState, CollapseEvent, TileType, Direction } from './types';
import { CONFIG, MAP_WIDTH } from './constants';
import { CaveMap } from './map';
import { Player } from './player';
import { CollisionDetector } from './collision';
import { Renderer } from './renderer';
import { ParticleSystem } from './particles';
import { lerp, randomFloat, randomInt } from './utils';

class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private map: CaveMap;
  private player: Player;
  private collision: CollisionDetector;
  private particles: ParticleSystem;

  private gameState: GameState = GameState.LOADING;
  private keys: Set<string> = new Set();
  private lastTime: number = 0;
  private gameTime: number = 0;
  private loadProgress: number = 0;

  private camera: CameraState = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    shake: 0,
    shakeTime: 0,
    flashTime: 0,
    flashColor: '#FF0000'
  };

  private currentCollapse: CollapseEvent | null = null;
  private nextCollapseTime: number = 0;
  private maxDepth: number = 0;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.renderer = new Renderer(this.canvas);
    
    this.map = new CaveMap();
    this.collision = new CollisionDetector(this.map);
    
    const startX = 50 * CONFIG.TILE_SIZE - CONFIG.PLAYER_SIZE / 2;
    const startY = 2 * CONFIG.TILE_SIZE;
    this.player = new Player(startX, startY, this.collision, this.map);
    
    this.particles = new ParticleSystem();

    this.setupEventListeners();
    this.scheduleNextCollapse();
    this.startLoading();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key);
      
      if ((this.gameState === GameState.GAME_OVER || this.gameState === GameState.VICTORY) && 
          (e.key === 'r' || e.key === 'R')) {
        this.restart();
      }
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });

    window.addEventListener('resize', () => {
      this.renderer.resize();
    });
  }

  private startLoading(): void {
    const loadInterval = setInterval(() => {
      this.loadProgress += randomFloat(5, 15);
      
      const progressFill = document.getElementById('progress-fill');
      if (progressFill) {
        progressFill.style.width = `${Math.min(this.loadProgress, 100)}%`;
      }

      if (this.loadProgress >= 100) {
        clearInterval(loadInterval);
        setTimeout(() => {
          const loadingScreen = document.getElementById('loading-screen');
          if (loadingScreen) {
            loadingScreen.style.display = 'none';
          }
          this.gameState = GameState.PLAYING;
          this.startGameLoop();
        }, 500);
      }
    }, 100);
  }

  private scheduleNextCollapse(): void {
    this.nextCollapseTime = randomInt(
      CONFIG.COLLAPSE_INTERVAL_MIN,
      CONFIG.COLLAPSE_INTERVAL_MAX
    );
  }

  private startGameLoop(): void {
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private gameLoop(currentTime: number): void {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (this.gameState === GameState.PLAYING) {
      this.update(deltaTime);
    }

    this.render();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private update(deltaTime: number): void {
    this.gameTime += deltaTime / 1000;

    const moved = this.player.update(deltaTime, this.keys);
    
    if (moved) {
      const minedTile = this.player.attemptMineInDirection();
      if (minedTile && minedTile !== TileType.WALL) {
        let tileX = Math.floor(this.player.getCenterX() / CONFIG.TILE_SIZE);
        let tileY = Math.floor(this.player.getCenterY() / CONFIG.TILE_SIZE);
        
        const dir = this.player.getDirection();
        if (dir === Direction.UP) tileY--;
        else if (dir === Direction.DOWN) tileY++;
        else if (dir === Direction.LEFT) tileX--;
        else if (dir === Direction.RIGHT) tileX++;
        
        this.particles.spawnOreParticles(
          tileX * CONFIG.TILE_SIZE,
          tileY * CONFIG.TILE_SIZE,
          minedTile
        );
        this.triggerFlash();
      }
    }

    this.updateCamera(deltaTime);
    this.map.updateChunks(this.player.getY());

    const currentDepth = this.map.getCurrentDepth();
    if (currentDepth > this.maxDepth) {
      this.maxDepth = currentDepth;
    }

    this.particles.update(deltaTime);
    this.updateCollapse(deltaTime);

    if (!this.player.isAlive()) {
      this.gameState = GameState.GAME_OVER;
    }

    if (this.player.isFull()) {
      this.gameState = GameState.VICTORY;
    }
  }

  private updateCamera(deltaTime: number): void {
    const canvasWidth = this.renderer.getCanvasWidth() * 2;
    const canvasHeight = this.renderer.getCanvasHeight() * 2;

    this.camera.targetX = this.player.getCenterX() - canvasWidth / 2;
    this.camera.targetY = this.player.getCenterY() - canvasHeight / 2;

    this.camera.targetX = Math.max(0, Math.min(
      this.camera.targetX,
      MAP_WIDTH * CONFIG.TILE_SIZE - canvasWidth
    ));
    this.camera.targetY = Math.max(0, this.camera.targetY);

    this.camera.x = lerp(this.camera.x, this.camera.targetX, CONFIG.LERP_FACTOR);
    this.camera.y = lerp(this.camera.y, this.camera.targetY, CONFIG.LERP_FACTOR);

    if (this.camera.shakeTime > 0) {
      this.camera.shakeTime -= deltaTime;
    }

    if (this.camera.flashTime > 0) {
      this.camera.flashTime -= deltaTime;
    }
  }

  private updateCollapse(deltaTime: number): void {
    this.nextCollapseTime -= deltaTime;

    if (this.nextCollapseTime <= 0 && !this.currentCollapse) {
      this.triggerCollapse();
    }

    if (this.currentCollapse) {
      this.currentCollapse.timeLeft -= deltaTime;

      for (const debris of this.currentCollapse.debris) {
        debris.y += debris.vy;
        debris.vy += 0.3;
        debris.rotation += debris.rotationSpeed;
        debris.life -= deltaTime;
      }

      this.particles.addDebris(this.currentCollapse.debris.filter(d => d.life > 0));
      this.currentCollapse.debris = this.currentCollapse.debris.filter(d => d.life <= 0);

      if (!this.currentCollapse.damageDealt && this.currentCollapse.timeLeft < 1200) {
        if (this.map.isInCollapseArea(
          this.player.getCenterX(),
          this.player.getCenterY(),
          this.currentCollapse
        )) {
          this.player.takeDamage(1);
        }
        this.currentCollapse.damageDealt = true;
        this.map.applyCollapse(this.currentCollapse);
      }

      if (this.currentCollapse.timeLeft <= 0) {
        this.currentCollapse = null;
        this.scheduleNextCollapse();
      }
    }
  }

  private triggerCollapse(): void {
    const collapseX = this.player.getCenterX() + randomFloat(-200, 200);
    const collapseY = this.player.getCenterY() + randomFloat(-100, 100);

    this.currentCollapse = this.map.triggerCollapse(collapseX, collapseY);
    this.triggerShake();
  }

  private triggerShake(): void {
    this.camera.shakeTime = 300;
  }

  private triggerFlash(): void {
    this.camera.flashTime = 200;
  }

  private getShakeOffset(): { x: number; y: number } {
    if (this.camera.shakeTime > 0) {
      const intensity = 3 * (this.camera.shakeTime / 300);
      return {
        x: randomFloat(-intensity, intensity),
        y: randomFloat(-intensity, intensity)
      };
    }
    return { x: 0, y: 0 };
  }

  private render(): void {
    this.renderer.clear();

    const shakeOffset = this.getShakeOffset();
    const renderCamera = {
      ...this.camera,
      x: this.camera.x - shakeOffset.x,
      y: this.camera.y - shakeOffset.y
    };

    this.renderer.renderMap(this.map, renderCamera, this.currentCollapse);
    this.renderer.renderPlayer(this.player, renderCamera);
    this.renderer.renderParticles(this.particles, renderCamera, shakeOffset.x, shakeOffset.y);
    this.renderer.renderFlash(this.camera);

    if (this.gameState === GameState.PLAYING || this.gameState === GameState.GAME_OVER || this.gameState === GameState.VICTORY) {
      this.renderer.renderUI(
        this.maxDepth,
        this.player.getInventory(),
        this.player.getTotalOres(),
        this.player.getHealth(),
        this.player.getMaxHealth(),
        this.gameTime,
        this.player.isHeartFlashing(),
        this.player.getHeartFlashState()
      );
    }

    if (this.gameState === GameState.GAME_OVER) {
      this.renderer.renderGameOver();
    }

    if (this.gameState === GameState.VICTORY) {
      this.renderer.renderVictory(
        this.player.getInventory(),
        this.maxDepth,
        this.gameTime,
        this.map.getOreValueMultiplier()
      );
    }

    this.renderer.present();
  }

  private restart(): void {
    this.map = new CaveMap();
    this.collision = new CollisionDetector(this.map);
    
    const startX = 50 * CONFIG.TILE_SIZE - CONFIG.PLAYER_SIZE / 2;
    const startY = 2 * CONFIG.TILE_SIZE;
    this.player = new Player(startX, startY, this.collision, this.map);
    
    this.particles.clear();
    this.currentCollapse = null;
    this.gameTime = 0;
    this.maxDepth = 0;
    this.loadProgress = 0;

    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      shake: 0,
      shakeTime: 0,
      flashTime: 0,
      flashColor: '#FF0000'
    };

    this.scheduleNextCollapse();
    this.gameState = GameState.PLAYING;
  }
}

window.addEventListener('load', () => {
  new Game();
});
