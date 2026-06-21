
import { GameMap, LOGICAL_WIDTH, LOGICAL_HEIGHT, WALL_THICKNESS } from './map';
import { Player, PLAYER_RADIUS } from './player';
import { Enemy, createEnemies } from './enemy';
import { UIRenderer, AlertLevel, ParticleSystem, EndScreenManager } from './ui';

const MIN_VIEWPORT_W = 1024;
const MIN_VIEWPORT_H = 768;

class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  viewScale: number = 1;
  viewOffsetX: number = 0;
  viewOffsetY: number = 0;

  map!: GameMap;
  player!: Player;
  enemies!: Enemy[];
  uiRenderer!: UIRenderer;
  particles!: ParticleSystem;
  endScreen!: EndScreenManager;

  alertLevel: AlertLevel = 'safe';
  dangerTimer: number = 0;
  warningTimer: number = 0;

  lastTime: number = 0;
  running: boolean = true;
  gameState: 'playing' | 'ended' = 'playing';
  particlesEmitted: boolean = false;
  restartRequested: boolean = false;

  private boundResize: () => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D Context not found');
    this.ctx = ctx;

    this.boundResize = this.handleResize.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);

    window.addEventListener('resize', this.boundResize);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('keydown', this.boundKeyDown);

    this.initGame();
    this.handleResize();
    requestAnimationFrame(this.loop.bind(this));
  }

  initGame(): void {
    this.map = new GameMap();
    const startX = WALL_THICKNESS + 80;
    const startY = LOGICAL_HEIGHT - WALL_THICKNESS - 80;
    this.player = new Player(startX, startY);
    this.enemies = createEnemies(this.map);
    this.uiRenderer = new UIRenderer();
    this.particles = new ParticleSystem();
    this.endScreen = new EndScreenManager();
    this.alertLevel = 'safe';
    this.dangerTimer = 0;
    this.warningTimer = 0;
    this.gameState = 'playing';
    this.particlesEmitted = false;
    this.restartRequested = false;
  }

  handleResize(): void {
    const dpr = window.devicePixelRatio || 1;
    const vw = Math.max(window.innerWidth, MIN_VIEWPORT_W);
    const vh = Math.max(window.innerHeight, MIN_VIEWPORT_H);
    this.canvas.width = vw * dpr;
    this.canvas.height = vh * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const scaleX = vw / LOGICAL_WIDTH;
    const scaleY = vh / LOGICAL_HEIGHT;
    this.viewScale = Math.min(scaleX, scaleY);
    const actualW = LOGICAL_WIDTH * this.viewScale;
    const actualH = LOGICAL_HEIGHT * this.viewScale;
    this.viewOffsetX = (vw - actualW) / 2;
    this.viewOffsetY = (vh - actualH) / 2;
  }

  handleMouseMove(e: MouseEvent): void {
    if (this.gameState !== 'playing') return;
    const rect = this.canvas.getBoundingClientRect();
    const vw = Math.max(window.innerWidth, MIN_VIEWPORT_W);
    const vh = Math.max(window.innerHeight, MIN_VIEWPORT_H);
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const adjustedX = canvasX * (vw / rect.width);
    const adjustedY = canvasY * (vh / rect.height);
    const worldX = (adjustedX - this.viewOffsetX) / this.viewScale;
    const worldY = (adjustedY - this.viewOffsetY) / this.viewScale;
    this.player.setMousePosition(worldX, worldY);
  }

  handleKeyDown(e: KeyboardEvent): void {
    if ((e.key === 'r' || e.key === 'R') && this.gameState === 'ended' && this.endScreen.isFinished()) {
      this.restartRequested = true;
    }
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.viewOffsetX) / this.viewScale,
      y: (sy - this.viewOffsetY) / this.viewScale,
    };
  }

  loop(now: number): void {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000 || 0);
    this.lastTime = now;
    this.update(dt);
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt: number): void {
    if (this.restartRequested) {
      this.endScreen.reset();
      this.initGame();
      return;
    }
    if (this.gameState === 'playing') {
      const t0 = performance.now();
      this.player.update(dt, this.map);
      let anySpotted = false;
      let anyCaught = false;
      for (const enemy of this.enemies) {
        const result = enemy.update(dt, this.map, { x: this.player.x, y: this.player.y, hiding: this.player.hiding });
        if (result.spotted) anySpotted = true;
        if (result.caught) anyCaught = true;
      }
      this.updateAlertLevel(dt, anySpotted);
      this.checkFileCollection(dt);
      this.uiRenderer.update(dt);
      this.particles.update(dt);
      const t1 = performance.now();
      if (t1 - t0 > 5) {
        // 偶尔超过也不处理，但保留接口用于调试
      }
      if (anyCaught) {
        this.triggerDefeat();
      }
      if (this.checkVictory() && !this.particlesEmitted) {
        this.triggerVictory();
      }
    } else {
      this.particles.update(dt);
      this.endScreen.update(dt);
    }
  }

  private updateAlertLevel(dt: number, anySpotted: boolean): void {
    if (anySpotted) {
      this.dangerTimer += dt;
      this.warningTimer += dt;
    } else {
      this.dangerTimer = Math.max(0, this.dangerTimer - dt * 0.6);
      this.warningTimer = Math.max(0, this.warningTimer - dt * 0.4);
    }
    const hasChasingEnemy = this.enemies.some(e => e.chasing);
    if (hasChasingEnemy || this.dangerTimer > 0.5) {
      this.alertLevel = 'danger';
    } else if (anySpotted || this.warningTimer > 0.3) {
      this.alertLevel = 'warning';
    } else {
      this.alertLevel = 'safe';
    }
  }

  private checkFileCollection(dt: number): void {
    for (const f of this.map.files) {
      if (!f.collected) {
        const dx = this.player.x - f.x;
        const dy = this.player.y - f.y;
        if (Math.sqrt(dx * dx + dy * dy) < PLAYER_RADIUS + 14) {
          f.collected = true;
        }
      } else if (f.collectAnim < 1) {
        f.collectAnim = Math.min(1, f.collectAnim + dt * 3);
      }
    }
  }

  private checkVictory(): boolean {
    return this.map.files.every(f => f.collected);
  }

  private triggerVictory(): void {
    this.particlesEmitted = true;
    this.particles.emitBurst(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, 120);
    setTimeout(() => {
      this.gameState = 'ended';
      this.endScreen.start(true);
    }, 2000);
  }

  private triggerDefeat(): void {
    if (this.gameState !== 'playing') return;
    this.gameState = 'ended';
    this.endScreen.start(false);
  }

  render(): void {
    const ctx = this.ctx;
    const vw = Math.max(window.innerWidth, MIN_VIEWPORT_W);
    const vh = Math.max(window.innerHeight, MIN_VIEWPORT_H);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, vw, vh);
    ctx.save();
    ctx.translate(this.viewOffsetX, this.viewOffsetY);
    ctx.scale(this.viewScale, this.viewScale);
    this.map.render(ctx);
    this.player.render(ctx, this.map);
    for (const enemy of this.enemies) {
      enemy.render(ctx, this.map);
    }
    this.particles.render(ctx);
    ctx.restore();
    const collected = this.map.files.filter(f => f.collected).length;
    this.uiRenderer.render(ctx, {
      collectedFiles: collected,
      totalFiles: this.map.files.length,
      alertLevel: this.alertLevel,
    }, vw, vh);
    if (this.gameState === 'ended') {
      this.endScreen.render(ctx, vw, vh);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
