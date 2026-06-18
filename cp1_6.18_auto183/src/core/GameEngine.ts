import { CollectorModule } from '../collector/CollectorModule';
import { PortalModule } from '../portal/PortalModule';
import { UIRenderer } from '../ui/UIRenderer';
import { GameState, CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';

const TARGET_FPS = 60;
const FRAME_DURATION = 1000 / TARGET_FPS;
const LEVEL_TRANSITION_DELAY = 2000;

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private collectorModule: CollectorModule;
  private portalModule: PortalModule;
  private uiRenderer: UIRenderer;

  private gameState: GameState = {
    score: 0,
    level: 1,
    combo: 0,
    comboMultiplier: 1,
    isFailed: false,
    failFlashTime: 0
  };

  private lastFrameTime: number = 0;
  private accumulator: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private levelTransitionTimer: number = 0;
  private isLevelTransitioning: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取Canvas 2D上下文');
    }
    this.ctx = ctx;

    this.collectorModule = new CollectorModule(canvas);
    this.portalModule = new PortalModule(canvas);
    this.uiRenderer = new UIRenderer();

    this.setupModuleCommunication();
    this.setupResponsiveScaling();
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private setupModuleCommunication(): void {
    this.collectorModule.setCacheUpdatedCallback((cache) => {
      this.uiRenderer.updateCache(cache, this.collectorModule.getCacheLimit());
    });

    this.portalModule.setActivationCallbacks(
      () => this.onActivationSuccess(),
      () => this.onActivationFail()
    );

    this.canvas.addEventListener('portal-try-activate', () => {
      this.tryActivatePortal();
    });
  }

  private setupResponsiveScaling(): void {
    const resize = () => {
      const container = this.canvas.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;

      let displayWidth = containerWidth;
      let displayHeight = containerWidth / aspectRatio;

      if (displayHeight > containerHeight) {
        displayHeight = containerHeight;
        displayWidth = containerHeight * aspectRatio;
      }

      this.canvas.style.width = `${displayWidth}px`;
      this.canvas.style.height = `${displayHeight}px`;
    };

    window.addEventListener('resize', resize);
    resize();
  }

  private loop(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    this.accumulator += deltaTime;

    while (this.accumulator >= FRAME_DURATION) {
      this.update(FRAME_DURATION);
      this.accumulator -= FRAME_DURATION;
    }

    this.render(currentTime);

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private update(deltaTime: number): void {
    this.collectorModule.update(performance.now());
    this.portalModule.update(deltaTime);
    this.uiRenderer.update(deltaTime);

    if (this.isLevelTransitioning) {
      this.levelTransitionTimer -= deltaTime;
      if (this.levelTransitionTimer <= 0) {
        this.advanceToNextLevel();
      }
    }

    this.gameState.combo = this.portalModule.getCombo();
    this.gameState.comboMultiplier = this.portalModule.getComboMultiplier();
    this.uiRenderer.updateGameState(this.gameState);
    this.uiRenderer.updatePortalState(this.portalModule.getState());
  }

  private render(currentTime: number): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.uiRenderer.render(this.ctx, currentTime);
    this.portalModule.render(this.ctx, currentTime);
    this.collectorModule.render(this.ctx, currentTime);
  }

  private tryActivatePortal(): void {
    if (this.isLevelTransitioning) return;

    const cache = this.collectorModule.getCache();
    const success = this.portalModule.tryActivate(cache);

    if (success) {
      this.collectorModule.clearCacheForActivation();
      this.isLevelTransitioning = true;
      this.levelTransitionTimer = LEVEL_TRANSITION_DELAY;
    }
  }

  private onActivationSuccess(): void {
    const baseScore = 100;
    const multiplier = this.portalModule.getComboMultiplier();
    this.gameState.score += Math.floor(baseScore * multiplier);
  }

  private onActivationFail(): void {
    this.gameState.isFailed = true;
    this.gameState.failFlashTime = 300;
  }

  private advanceToNextLevel(): void {
    this.gameState.level++;
    this.isLevelTransitioning = false;

    this.collectorModule.setLevel(this.gameState.level);
    this.portalModule.setLevel(this.gameState.level);
    this.collectorModule.resetCache();

    this.uiRenderer.updateGameState(this.gameState);
  }
}
