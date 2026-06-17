import { useGameStore } from '../store/gameStore';
import { RiverGenerator } from './RiverGenerator';

const BASE_SCROLL_SPEED = 150;
const PLAYER_SPEED = 400;
const BOAT_HALF_WIDTH = 10;
const BOAT_HALF_HEIGHT = 15;
const ROCK_RADIUS = 12;
const DRIFTWOOD_HALF_W = 8;
const DRIFTWOOD_HALF_H = 12;
const COIN_RADIUS = 8;
const TOTAL_LIVES = 3;
const FLASH_COUNT = 3;
const FLASH_DURATION_PER = 0.1;
const GAME_OVER_FADE_DURATION = 2;
const SCORE_PER_COIN = 10;
const MILESTONE_INTERVAL = 100;

export class Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private riverGen: RiverGenerator;
  private animId = 0;
  private lastTime = 0;
  private running = false;

  private cameraDistance = 0;
  private elapsedTime = 0;
  private speedMultiplier = 1;

  private playerX = 0;
  private playerTilt = 0;
  private targetTilt = 0;
  private isFlashing = false;
  private flashTimer = 0;
  private flashCount = 0;

  private isGameOver = false;
  private gameOverOpacity = 0;
  private gameOverTimer = 0;

  private flashOpacity = 0;
  private flashTimer2 = 0;
  private lastMilestone = 0;

  private keysDown: Set<string> = new Set();
  private mouseX: number | null = null;
  private isMouseDown = false;
  private canvasWidth = 0;
  private canvasHeight = 0;

  private ripplePhase = 0;

  private unsubscribe: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d')!;
    this.ctx = ctx;
    this.riverGen = new RiverGenerator();
    this.resize();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', this.handleTouchEnd);
    canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
  }

  private handleResize = () => this.resize();

  private resize() {
    this.canvasWidth = window.innerWidth;
    this.canvasHeight = window.innerHeight;
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keysDown.add(e.key);
    if (e.key === 'Escape') {
      const store = useGameStore.getState();
      if (!store.isGameOver) {
        useGameStore.getState().togglePause();
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysDown.delete(e.key);
  };

  private handleMouseDown = (e: MouseEvent) => {
    this.isMouseDown = true;
    this.mouseX = e.clientX;
  };

  private handleMouseUp = () => {
    this.isMouseDown = false;
    this.mouseX = null;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (this.isMouseDown) {
      this.mouseX = e.clientX;
    }
  };

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    this.isMouseDown = true;
    this.mouseX = e.touches[0].clientX;
  };

  private handleTouchEnd = () => {
    this.isMouseDown = false;
    this.mouseX = null;
  };

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (this.isMouseDown) {
      this.mouseX = e.touches[0].clientX;
    }
  };

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    if (this.unsubscribe) this.unsubscribe();
  }

  restart() {
    this.cameraDistance = 0;
    this.elapsedTime = 0;
    this.speedMultiplier = 1;
    this.playerX = 0;
    this.playerTilt = 0;
    this.targetTilt = 0;
    this.isFlashing = false;
    this.flashTimer = 0;
    this.flashCount = 0;
    this.isGameOver = false;
    this.gameOverOpacity = 0;
    this.gameOverTimer = 0;
    this.flashOpacity = 0;
    this.flashTimer2 = 0;
    this.lastMilestone = 0;
    this.ripplePhase = 0;
    this.keysDown.clear();
    this.mouseX = null;
    this.isMouseDown = false;
    this.riverGen.reset();
    useGameStore.getState().restart();
  }

  private loop = (timestamp: number) => {
    if (!this.running) return;

    const rawDt = (timestamp - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.05);
    this.lastTime = timestamp;

    const store = useGameStore.getState();

    if (!store.isPaused && !this.isGameOver) {
      this.update(dt);
    } else if (this.isGameOver) {
      this.updateGameOver(dt);
    }

    this.render();
    this.animId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.elapsedTime += dt;
    useGameStore.getState().setElapsedTime(this.elapsedTime);

    // Fix #4: speed multiplier with cap of 2.5x
    const newSpeed = 1 + Math.floor(this.elapsedTime / 15) * 0.1;
    this.speedMultiplier = Math.min(newSpeed, 2.5);
    useGameStore.getState().setSpeedMultiplier(this.speedMultiplier);

    this.cameraDistance += BASE_SCROLL_SPEED * this.speedMultiplier * dt;

    this.riverGen.update(dt, this.cameraDistance, this.elapsedTime, this.speedMultiplier);

    this.updatePlayer(dt);
    this.checkCollisions();

    this.updateFlashing(dt);
    this.updateFlashEffect(dt);
    this.ripplePhase += dt * Math.PI;
  }

  private updatePlayer(dt: number) {
    const riverWidth = this.riverGen.getRiverWidth(this.elapsedTime);
    const halfWidth = riverWidth / 2;
    const centerOffset = this.riverGen.getCenterOffset(this.cameraDistance);

    let moveDir = 0;
    if (this.keysDown.has('ArrowLeft') || this.keysDown.has('a') || this.keysDown.has('A')) {
      moveDir -= 1;
    }
    if (this.keysDown.has('ArrowRight') || this.keysDown.has('d') || this.keysDown.has('D')) {
      moveDir += 1;
    }

    if (this.isMouseDown && this.mouseX !== null) {
      const targetWorldX = this.mouseX - this.canvasWidth / 2 - centerOffset;
      const diff = targetWorldX - this.playerX;
      const maxStep = PLAYER_SPEED * dt;
      if (Math.abs(diff) > maxStep) {
        moveDir = Math.sign(diff);
      } else {
        this.playerX = targetWorldX;
        moveDir = 0;
      }
    }

    if (moveDir !== 0) {
      this.playerX += moveDir * PLAYER_SPEED * dt;
    }

    this.playerX = Math.max(-halfWidth + BOAT_HALF_WIDTH, Math.min(halfWidth - BOAT_HALF_WIDTH, this.playerX));

    this.targetTilt = moveDir * 1;
    const tiltSpeed = 1 / 0.1;
    this.playerTilt += (this.targetTilt - this.playerTilt) * Math.min(dt * tiltSpeed, 1);
  }

  private checkCollisions() {
    const centerOffset = this.riverGen.getCenterOffset(this.cameraDistance);
    const boatWorldX = centerOffset + this.playerX;

    for (const obs of this.riverGen.getObstacles()) {
      if (!obs.active) continue;
      const obsCenterOffset = this.riverGen.getCenterOffset(obs.distance);
      const obsWorldX = obsCenterOffset + obs.lateralOffset * this.riverGen.getRiverWidth(this.elapsedTime);
      const dy = Math.abs(obs.distance - this.cameraDistance);

      if (dy > 30) continue;

      const dx = Math.abs(boatWorldX - obsWorldX);

      if (obs.type === 'rock') {
        if (dx < BOAT_HALF_WIDTH + ROCK_RADIUS && dy < BOAT_HALF_HEIGHT + ROCK_RADIUS) {
          this.onCollision(obs);
        }
      } else {
        if (dx < BOAT_HALF_WIDTH + DRIFTWOOD_HALF_W && dy < BOAT_HALF_HEIGHT + DRIFTWOOD_HALF_H) {
          this.onCollision(obs);
        }
      }
    }

    for (const coin of this.riverGen.getCoins()) {
      if (!coin.active || coin.collected) continue;
      const coinCenterOffset = this.riverGen.getCenterOffset(coin.distance);
      const coinWorldX = coinCenterOffset + coin.lateralOffset * this.riverGen.getRiverWidth(this.elapsedTime);
      const dy = Math.abs(coin.distance - this.cameraDistance);

      if (dy > 20) continue;

      const dx = Math.abs(boatWorldX - coinWorldX);
      if (dx < BOAT_HALF_WIDTH + COIN_RADIUS && dy < BOAT_HALF_HEIGHT + COIN_RADIUS) {
        coin.collected = true;
        coin.collectAnimProgress = 0;
        useGameStore.getState().addScore(SCORE_PER_COIN);

        const score = useGameStore.getState().score;
        const milestone = Math.floor(score / MILESTONE_INTERVAL) * MILESTONE_INTERVAL;
        if (milestone > this.lastMilestone) {
          this.lastMilestone = milestone;
          this.flashOpacity = 0.2;
          this.flashTimer2 = 0.15;
        }
      }
    }
  }

  private onCollision(obs: import('./RiverGenerator').ObstacleData) {
    obs.active = false;

    // Fix #2: 3 flashes, each 0.1s, total 0.3s
    if (!this.isFlashing) {
      this.isFlashing = true;
      this.flashTimer = 0;
      this.flashCount = 0;
    }

    useGameStore.getState().loseLife();

    const lives = useGameStore.getState().lives;
    if (lives <= 0) {
      this.isGameOver = true;
      this.gameOverTimer = 0;
      this.gameOverOpacity = 0;
      useGameStore.getState().setGameOver(true);
    }
  }

  // Fix #2: Proper flash timing - 3 flashes of 0.1s each
  private updateFlashing(dt: number) {
    if (!this.isFlashing) return;

    this.flashTimer += dt;
    const totalFlashTime = FLASH_COUNT * FLASH_DURATION_PER;

    if (this.flashTimer >= totalFlashTime) {
      this.isFlashing = false;
      this.flashTimer = 0;
      this.flashCount = 0;
      return;
    }

    this.flashCount = Math.floor(this.flashTimer / FLASH_DURATION_PER);
  }

  private isCurrentlyFlashingRed(): boolean {
    if (!this.isFlashing) return false;
    return this.flashCount % 2 === 0;
  }

  private updateFlashEffect(dt: number) {
    if (this.flashTimer2 > 0) {
      this.flashTimer2 -= dt;
      if (this.flashTimer2 <= 0) {
        this.flashOpacity = 0;
        this.flashTimer2 = 0;
      }
    }
  }

  private updateGameOver(dt: number) {
    this.gameOverTimer += dt;
    this.gameOverOpacity = Math.min(this.gameOverTimer / GAME_OVER_FADE_DURATION, 1);
    useGameStore.getState().setGameOverOpacity(this.gameOverOpacity);
  }

  private render() {
    const ctx = this.ctx;
    const W = this.canvasWidth;
    const H = this.canvasHeight;

    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#0A0A1A';
    ctx.fillRect(0, 0, W, H);

    this.renderRiver(ctx, W, H);
    this.renderObstacles(ctx, W, H);
    this.renderCoins(ctx, W, H);
    this.renderPlayer(ctx, W, H);
    this.renderFlashEffect(ctx, W, H);
  }

  private renderRiver(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const riverWidth = this.riverGen.getRiverWidth(this.elapsedTime);
    const step = 4;

    const leftPoints: { x: number; y: number }[] = [];
    const rightPoints: { x: number; y: number }[] = [];

    for (let sy = 0; sy <= H; sy += step) {
      const worldDist = this.cameraDistance + (H - sy);
      const centerOff = this.riverGen.getCenterOffset(worldDist);

      const rippleOffset = Math.sin(this.ripplePhase * 0.5 + sy * 0.02) * 3;

      const cx = W / 2 + centerOff;
      const hw = riverWidth / 2;

      leftPoints.push({ x: cx - hw + rippleOffset, y: sy });
      rightPoints.push({ x: cx + hw + rippleOffset, y: sy });
    }

    ctx.beginPath();
    ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
    for (let i = 1; i < leftPoints.length; i++) {
      ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
    }
    for (let i = rightPoints.length - 1; i >= 0; i--) {
      ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
    }
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#10487A');
    grad.addColorStop(1, '#0A2E5A');
    ctx.fillStyle = grad;
    ctx.fill();

    // Fix #5: River border glow with shadowBlur
    ctx.save();
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
    for (let i = 1; i < leftPoints.length; i++) {
      ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightPoints[0].x, rightPoints[0].y);
    for (let i = 1; i < rightPoints.length; i++) {
      ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
    }
    ctx.stroke();
    ctx.restore();

    this.renderWaterRipples(ctx, W, H, leftPoints, rightPoints);
  }

  private renderWaterRipples(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    leftPoints: { x: number; y: number }[],
    rightPoints: { x: number; y: number }[]
  ) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 1;

    for (let i = 0; i < leftPoints.length; i += 12) {
      if (i >= rightPoints.length) break;
      const ly = leftPoints[i].y;
      const lx = leftPoints[i].x;
      const rx = rightPoints[i].x;
      const waveOff = Math.sin(this.ripplePhase * 0.5 + i * 0.3) * 10;

      ctx.beginPath();
      ctx.moveTo(lx + 10, ly);
      ctx.quadraticCurveTo((lx + rx) / 2 + waveOff, ly + 6, rx - 10, ly);
      ctx.stroke();
    }

    ctx.restore();
  }

  private worldToScreen(worldX: number, worldDist: number): { x: number; y: number } {
    const sy = this.canvasHeight - (worldDist - this.cameraDistance);
    const sx = this.canvasWidth / 2 + worldX;
    return { x: sx, y: sy };
  }

  private renderObstacles(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const riverWidth = this.riverGen.getRiverWidth(this.elapsedTime);

    for (const obs of this.riverGen.getObstacles()) {
      if (!obs.active) continue;
      if (obs.distance < this.cameraDistance - 50 || obs.distance > this.cameraDistance + H + 50) continue;

      const centerOff = this.riverGen.getCenterOffset(obs.distance);
      const worldX = centerOff + obs.lateralOffset * riverWidth;
      const pos = this.worldToScreen(worldX, obs.distance);

      if (obs.type === 'rock') {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ROCK_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#666666';
        ctx.fill();
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-DRIFTWOOD_HALF_W, -DRIFTWOOD_HALF_H, DRIFTWOOD_HALF_W * 2, DRIFTWOOD_HALF_H * 2);
        ctx.restore();
      }
    }
  }

  private renderCoins(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const riverWidth = this.riverGen.getRiverWidth(this.elapsedTime);

    for (const coin of this.riverGen.getCoins()) {
      if (coin.distance < this.cameraDistance - 50 || coin.distance > this.cameraDistance + H + 50) continue;
      if (coin.collected && coin.collectAnimProgress >= 1) continue;

      const centerOff = this.riverGen.getCenterOffset(coin.distance);
      const worldX = centerOff + coin.lateralOffset * riverWidth;
      const pos = this.worldToScreen(worldX, coin.distance);

      // Fix #3: Coin collect animation 0.3s from scale 1 to 0
      let scale = 1;
      if (coin.collected) {
        scale = 1 - coin.collectAnimProgress;
        if (scale <= 0) continue;
      }

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.scale(scale, scale);
      ctx.rotate((coin.rotation * Math.PI) / 180);

      const r = COIN_RADIUS;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8 - Math.PI / 8;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const centerOff = this.riverGen.getCenterOffset(this.cameraDistance);
    const worldX = centerOff + this.playerX;
    const pos = this.worldToScreen(worldX, this.cameraDistance);

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate((this.playerTilt * Math.PI) / 180);

    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(0, -BOAT_HALF_HEIGHT);
    ctx.lineTo(-BOAT_HALF_WIDTH, BOAT_HALF_HEIGHT);
    ctx.lineTo(BOAT_HALF_WIDTH, BOAT_HALF_HEIGHT);
    ctx.closePath();

    if (this.isCurrentlyFlashingRed()) {
      ctx.fillStyle = '#FF0000';
    } else {
      ctx.fillStyle = '#FFD700';
    }
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.restore();
  }

  private renderFlashEffect(ctx: CanvasRenderingContext2D, W: number, H: number) {
    if (this.flashOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashOpacity;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }
}
