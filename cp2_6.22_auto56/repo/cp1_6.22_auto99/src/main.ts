import { Ball, Pocket, createRack, createPockets, checkPocketed, pocketBall, resetCueBall, isAllStopped, updateBallScales, TABLE_WIDTH, TABLE_HEIGHT } from './balls';
import { ParticlePool } from './particles';
import { updatePhysics, shootCueBall, CollisionEvent, WallCollisionEvent } from './physics';
import { Renderer, ScoreEntry, WallGlow, updateWallGlows, createWallGlow } from './renderer';

class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private balls: Ball[];
  private pockets: Pocket[];
  private particles: ParticlePool;
  private scoreEntries: ScoreEntry[];
  private shotCount: number;
  private isAiming: boolean;
  private aimStart: { x: number; y: number };
  private aimEnd: { x: number; y: number };
  private power: number;
  private allStopped: boolean;
  private wallGlows: WallGlow[];
  private lastTime: number;
  private animationId: number | null;
  private maxPower: number;
  private cueBall: Ball;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.balls = createRack();
    this.pockets = createPockets();
    this.particles = new ParticlePool(500);
    this.scoreEntries = [];
    this.shotCount = 0;
    this.isAiming = false;
    this.aimStart = { x: 0, y: 0 };
    this.aimEnd = { x: 0, y: 0 };
    this.power = 0;
    this.allStopped = true;
    this.wallGlows = [];
    this.lastTime = 0;
    this.animationId = null;
    this.maxPower = 200;
    this.cueBall = this.balls[0];

    this.setupEventListeners();
    this.startGameLoop();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
  }

  private getMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private onMouseDown(e: MouseEvent): void {
    if (!this.allStopped) return;
    if (this.cueBall.pocketed) return;

    const pos = this.getMousePos(e);
    const dx = pos.x - this.cueBall.x;
    const dy = pos.y - this.cueBall.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.cueBall.radius * 3) {
      this.isAiming = true;
      this.aimStart = { x: this.cueBall.x, y: this.cueBall.y };
      this.aimEnd = pos;
      this.updatePower();
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isAiming) return;

    const pos = this.getMousePos(e);
    this.aimEnd = pos;
    this.updatePower();
  }

  private onMouseUp(): void {
    if (!this.isAiming) return;

    if (this.power > 5) {
      this.shoot();
    }

    this.isAiming = false;
    this.power = 0;
  }

  private updatePower(): void {
    const dx = this.aimStart.x - this.aimEnd.x;
    const dy = this.aimStart.y - this.aimEnd.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.power = Math.min(dist, this.maxPower);
  }

  private shoot(): void {
    const dx = this.aimStart.x - this.aimEnd.x;
    const dy = this.aimStart.y - this.aimEnd.y;
    const angle = Math.atan2(dy, dx);

    shootCueBall(this.cueBall, angle, this.power);
    this.shotCount++;
    this.allStopped = false;
  }

  private startGameLoop(): void {
    this.lastTime = performance.now();
    this.loop();
  }

  private loop(): void {
    const currentTime = performance.now();
    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    deltaTime = Math.min(deltaTime, 0.033);

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(() => this.loop());
  }

  private update(deltaTime: number): void {
    this.particles.update(deltaTime);
    updateBallScales(this.balls, deltaTime);
    this.wallGlows = updateWallGlows(this.wallGlows, deltaTime);

    for (const entry of this.scoreEntries) {
      if (entry.slideProgress < 1) {
        entry.slideProgress = Math.min(1, entry.slideProgress + deltaTime * 5);
      }
    }

    if (!this.allStopped) {
      const { ballCollisions, wallCollisions } = updatePhysics(this.balls, deltaTime);

      for (const collision of ballCollisions) {
        this.handleBallCollision(collision);
      }

      for (const collision of wallCollisions) {
        this.handleWallCollision(collision);
      }

      for (const ball of this.balls) {
        if (ball.pocketed) continue;
        const pocket = checkPocketed(ball, this.pockets);
        if (pocket) {
          this.handlePocketed(ball, pocket);
        }
      }

      if (isAllStopped(this.balls)) {
        this.allStopped = true;
        if (this.cueBall.pocketed) {
          setTimeout(() => {
            resetCueBall(this.cueBall);
          }, 300);
        }
      }
    }
  }

  private handleBallCollision(collision: CollisionEvent): void {
    const { ball1, ball2, x, y } = collision;
    this.particles.emitCollision(x, y, ball1.color, ball2.color);
  }

  private handleWallCollision(collision: WallCollisionEvent): void {
    this.wallGlows.push(createWallGlow(collision));
  }

  private handlePocketed(ball: Ball, pocket: Pocket): void {
    pocketBall(ball);

    const colors = ball.stripeColor
      ? [ball.color, ball.stripeColor]
      : [ball.color];

    this.particles.emitVortex(pocket.x, pocket.y, colors);

    if (ball.type !== 'cue') {
      this.scoreEntries.unshift({
        ball: { ...ball },
        time: Date.now(),
        slideProgress: 0,
      });
    }
  }

  private render(): void {
    this.renderer.render({
      balls: this.balls,
      pockets: this.pockets,
      particles: this.particles.getActiveParticles(),
      scoreEntries: this.scoreEntries,
      shotCount: this.shotCount,
      isAiming: this.isAiming,
      aimStart: this.aimStart,
      aimEnd: this.aimEnd,
      power: this.power,
      wallGlows: this.wallGlows,
    });
  }

  public destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  canvas.width = TABLE_WIDTH + 190;
  canvas.height = TABLE_HEIGHT;

  const game = new Game(canvas);

  (window as unknown as { game?: Game }).game = game;
});
