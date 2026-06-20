interface TrackCell {
  type: 'empty' | 'obstacle' | 'boost' | 'platform' | 'start' | 'finish';
  height?: number;
  boostMultiplier?: number;
}

interface TrackData {
  grid: TrackCell[][];
  width: number;
  height: number;
}

interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isJumping: boolean;
  isOnGround: boolean;
  jumpHoldTime: number;
  maxJumpHoldTime: number;
  skinColor: string;
  accessory: Record<string, unknown>;
  runFrame: number;
  onPlatform: boolean;
}

interface AfterImage {
  x: number;
  y: number;
  alpha: number;
  frame: number;
}

interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  elapsedTime: number;
  currentSpeed: number;
}

const GRID_WIDTH = 20;
const GRID_HEIGHT = 10;
const CELL_SIZE = 30;
const GRAVITY = 0.6;
const MAX_JUMP_HOLD_TIME = 20;
const BASE_SPEED = 5;
const GROUND_Y = GRID_HEIGHT - 1;

const MIN_JUMP_HEIGHT_CELLS = 1;
const MAX_JUMP_HEIGHT_CELLS = 6;
const MIN_JUMP_HEIGHT = MIN_JUMP_HEIGHT_CELLS * CELL_SIZE;
const MAX_JUMP_HEIGHT = MAX_JUMP_HEIGHT_CELLS * CELL_SIZE;

const JUMP_INITIAL_VELOCITY = -6.3;
const JUMP_BOOST_STRENGTH = 1.0853;

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private track: TrackData;
  private player: PlayerState;
  private gameState: GameState;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly fixedTimeStep: number = 1000 / 60;
  private finishCallbacks: Array<(time: number) => void> = [];
  private afterImages: AfterImage[] = [];
  private boostActive: boolean = false;
  private boostTimer: number = 0;
  private keys: { space: boolean; spacePressed: boolean } = {
    space: false,
    spacePressed: false,
  };

  constructor(canvas: HTMLCanvasElement, trackData: TrackData) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;

    this.track = trackData;

    this.player = this.createInitialPlayer();

    this.gameState = {
      isRunning: false,
      isPaused: false,
      isFinished: false,
      elapsedTime: 0,
      currentSpeed: BASE_SPEED,
    };

    this.setupEventListeners();
  }

  private createInitialPlayer(): PlayerState {
    return {
      x: 1 * CELL_SIZE,
      y: GROUND_Y * CELL_SIZE,
      vx: BASE_SPEED,
      vy: 0,
      width: 24,
      height: 36,
      isJumping: false,
      isOnGround: true,
      jumpHoldTime: 0,
      maxJumpHoldTime: MAX_JUMP_HOLD_TIME,
      skinColor: '#00d9ff',
      accessory: {},
      runFrame: 0,
      onPlatform: false,
    };
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private removeEventListeners(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      this.keys.space = true;
      this.keys.spacePressed = true;
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (e.code === 'Space') {
      e.preventDefault();
      this.keys.space = false;
    }
  };

  start(): void {
    if (this.gameState.isRunning) return;

    this.gameState.isRunning = true;
    this.gameState.isPaused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.gameLoop();
  }

  stop(): void {
    this.gameState.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  reset(): void {
    this.stop();
    this.player = this.createInitialPlayer();
    this.gameState = {
      isRunning: false,
      isPaused: false,
      isFinished: false,
      elapsedTime: 0,
      currentSpeed: BASE_SPEED,
    };
    this.afterImages = [];
    this.boostActive = false;
    this.boostTimer = 0;
    this.keys.space = false;
    this.keys.spacePressed = false;
    this.render();
  }

  setSkin(color: string, accessory: Record<string, unknown> = {}): void {
    this.player.skinColor = color;
    this.player.accessory = accessory;
  }

  onFinish(callback: (time: number) => void): void {
    this.finishCallbacks.push(callback);
  }

  getElapsedTime(): number {
    return this.gameState.elapsedTime;
  }

  getCurrentSpeed(): number {
    return this.gameState.currentSpeed;
  }

  private gameLoop = (): void => {
    if (!this.gameState.isRunning) return;

    const currentTime = performance.now();
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (deltaTime > 100) {
      deltaTime = 100;
    }

    this.accumulator += deltaTime;

    while (this.accumulator >= this.fixedTimeStep) {
      this.update(this.fixedTimeStep / 1000);
      this.accumulator -= this.fixedTimeStep;
    }

    this.render();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(dt: number): void {
    if (this.gameState.isFinished || this.gameState.isPaused) return;

    this.gameState.elapsedTime += dt;

    this.updateJump();
    this.updatePhysics();
    this.checkCollisions();
    this.updateAfterImages();
    this.checkFinish();

    this.player.runFrame += dt * 10;
  }

  private updateJump(): void {
    if (this.keys.spacePressed && this.player.isOnGround) {
      this.player.isJumping = true;
      this.player.isOnGround = false;
      this.player.jumpHoldTime = 0;
      this.player.vy = JUMP_INITIAL_VELOCITY;
    }
    this.keys.spacePressed = false;

    if (this.keys.space && this.player.isJumping && this.player.jumpHoldTime < this.player.maxJumpHoldTime && this.player.vy < 0) {
      const jumpProgress = this.player.jumpHoldTime / this.player.maxJumpHoldTime;
      const extraBoost = -JUMP_BOOST_STRENGTH * (1 - jumpProgress);
      this.player.vy += extraBoost;
      this.player.jumpHoldTime++;
    }

    if (!this.keys.space || this.player.vy >= 0) {
      this.player.isJumping = false;
    }
  }

  private updatePhysics(): void {
    this.player.vy += GRAVITY;

    if (this.boostActive) {
      this.boostTimer--;
      if (this.boostTimer <= 0) {
        this.boostActive = false;
      }
    }

    const speedMultiplier = this.boostActive ? 2 : 1;
    this.player.vx = BASE_SPEED * speedMultiplier;
    this.gameState.currentSpeed = this.player.vx;

    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    const groundPixelY = GROUND_Y * CELL_SIZE;
    if (this.player.y >= groundPixelY) {
      this.player.y = groundPixelY;
      this.player.vy = 0;
      this.player.isOnGround = true;
      this.player.isJumping = false;
      this.player.onPlatform = false;
    }
  }

  private checkCollisions(): void {
    const playerGridX = Math.floor(this.player.x / CELL_SIZE);
    const playerGridY = Math.floor((this.player.y + this.player.height) / CELL_SIZE);
    const playerGridTop = Math.floor(this.player.y / CELL_SIZE);
    const playerGridRight = Math.floor((this.player.x + this.player.width) / CELL_SIZE);

    for (let gx = playerGridX; gx <= playerGridRight; gx++) {
      if (gx < 0 || gx >= this.track.width) continue;

      for (let gy = playerGridTop; gy <= playerGridY; gy++) {
        if (gy < 0 || gy >= this.track.height) continue;

        const cell = this.track.grid[gy][gx];
        if (!cell) continue;

        switch (cell.type) {
          case 'obstacle':
            this.handleObstacleCollision(gx, gy, cell);
            break;
          case 'boost':
            this.handleBoostCollision(gx, gy, cell);
            break;
          case 'platform':
            this.handlePlatformCollision(gx, gy);
            break;
        }
      }
    }
  }

  private handleObstacleCollision(gx: number, gy: number, cell: TrackCell): void {
    const height = cell.height || 1;
    const obstacleTop = (gy + 1 - height) * CELL_SIZE;
    const obstacleBottom = (gy + 1) * CELL_SIZE;
    const obstacleLeft = gx * CELL_SIZE;
    const obstacleRight = (gx + 1) * CELL_SIZE;

    const playerRight = this.player.x + this.player.width;
    const playerBottom = this.player.y + this.player.height;
    const playerTop = this.player.y;

    if (
      playerRight > obstacleLeft &&
      this.player.x < obstacleRight &&
      playerBottom > obstacleTop &&
      playerTop < obstacleBottom
    ) {
      if (this.player.vx > 0) {
        this.player.x = obstacleLeft - this.player.width;
        this.gameState.currentSpeed = 0;
      }
    }
  }

  private handleBoostCollision(gx: number, gy: number, cell: TrackCell): void {
    const boostLeft = gx * CELL_SIZE;
    const boostRight = (gx + 1) * CELL_SIZE;
    const playerCenterX = this.player.x + this.player.width / 2;

    if (playerCenterX >= boostLeft && playerCenterX <= boostRight) {
      const multiplier = cell.boostMultiplier || 2;
      if (!this.boostActive || multiplier > 1.5) {
        this.boostActive = true;
        this.boostTimer = 30;
      }
    }
  }

  private handlePlatformCollision(gx: number, gy: number): void {
    const platformTop = gy * CELL_SIZE;
    const platformLeft = gx * CELL_SIZE;
    const platformRight = (gx + 1) * CELL_SIZE;

    const playerBottom = this.player.y + this.player.height;
    const playerRight = this.player.x + this.player.width;

    if (
      this.player.vy >= 0 &&
      playerBottom >= platformTop &&
      playerBottom <= platformTop + CELL_SIZE / 2 &&
      playerRight > platformLeft &&
      this.player.x < platformRight
    ) {
      this.player.y = platformTop - this.player.height;
      this.player.vy = 0;
      this.player.isOnGround = true;
      this.player.isJumping = false;
      this.player.onPlatform = true;
    }
  }

  private updateAfterImages(): void {
    if (this.boostActive) {
      if (this.afterImages.length < 5) {
        this.afterImages.push({
          x: this.player.x,
          y: this.player.y,
          alpha: 0.6,
          frame: Math.floor(this.player.runFrame),
        });
      }
    }

    this.afterImages = this.afterImages.filter((img) => {
      img.alpha -= 0.08;
      return img.alpha > 0;
    });
  }

  private checkFinish(): void {
    const finishGridX = this.track.width - 1;
    const playerCenterX = this.player.x + this.player.width / 2;

    if (playerCenterX >= finishGridX * CELL_SIZE) {
      this.gameState.isFinished = true;
      this.gameState.isRunning = false;

      for (const callback of this.finishCallbacks) {
        callback(this.gameState.elapsedTime);
      }
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const canvas = this.canvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.drawTrack();
    this.drawAfterImages();
    this.drawPlayer();
  }

  private drawTrack(): void {
    const ctx = this.ctx;

    for (let y = 0; y < this.track.height; y++) {
      for (let x = 0; x < this.track.width; x++) {
        const cell = this.track.grid[y][x];
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        const depthScale = 0.3 + (y / this.track.height) * 0.7;
        const offsetX = (y / this.track.height) * 20;

        const drawX = px + offsetX;
        const drawW = CELL_SIZE * depthScale;
        const drawH = CELL_SIZE * 0.6;

        if (cell.type === 'empty') {
          ctx.fillStyle = y >= GROUND_Y ? '#1a1a2e' : '#16213e';
          ctx.fillRect(drawX, py, drawW, drawH);
        } else if (cell.type === 'start') {
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(drawX, py, drawW, drawH);
        } else if (cell.type === 'finish') {
          this.drawFinishLine(drawX, py, drawW, drawH);
        } else if (cell.type === 'obstacle') {
          this.drawObstacle(drawX, py, drawW, drawH, cell.height || 1);
        } else if (cell.type === 'boost') {
          this.drawBoost(drawX, py, drawW, drawH, cell.boostMultiplier || 2);
        } else if (cell.type === 'platform') {
          this.drawPlatform(drawX, py, drawW, drawH);
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeRect(drawX, py, drawW, drawH);
      }
    }
  }

  private drawFinishLine(x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;
    const stripeCount = 4;
    const stripeWidth = w / stripeCount;

    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
      ctx.fillRect(x + i * stripeWidth, y, stripeWidth, h);
    }

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('终点', x + w / 2, y + h / 2 + 3);
  }

  private drawObstacle(x: number, y: number, w: number, h: number, height: number): void {
    const ctx = this.ctx;
    const obstacleHeight = h * height;
    const obstacleY = y + h - obstacleHeight;

    const gradient = ctx.createLinearGradient(x, obstacleY, x + w, obstacleY);
    gradient.addColorStop(0, '#ff006e');
    gradient.addColorStop(1, '#ff4d94');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, obstacleY, w, obstacleHeight);

    ctx.strokeStyle = '#ff6b9d';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, obstacleY, w, obstacleHeight);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x + 2, obstacleY + 2, w - 4, 3);
  }

  private drawBoost(x: number, y: number, w: number, h: number, multiplier: number): void {
    const ctx = this.ctx;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rx = w * 0.4;
    const ry = h * 0.35;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    gradient.addColorStop(0, '#00f5d4');
    gradient.addColorStop(0.5, '#00d4b8');
    gradient.addColorStop(1, 'rgba(0, 245, 212, 0.3)');

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);

    ctx.fillStyle = gradient;
    ctx.fillRect(-rx, -ry, rx * 2, ry * 2);

    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 1;
    ctx.strokeRect(-rx, -ry, rx * 2, ry * 2);

    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${multiplier.toFixed(1)}x`, cx, cy + 3);
  }

  private drawPlatform(x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;

    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, y + h);
    ctx.lineTo(x + w * 0.2, y);
    ctx.lineTo(x + w * 0.8, y);
    ctx.lineTo(x + w * 0.9, y + h);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    gradient.addColorStop(0, '#b5179e');
    gradient.addColorStop(1, '#7209b7');

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#d946ef';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawAfterImages(): void {
    const ctx = this.ctx;

    for (const img of this.afterImages) {
      ctx.save();
      ctx.globalAlpha = img.alpha * 0.5;
      this.drawPlayerBody(img.x, img.y, img.frame, true);
      ctx.restore();
    }
  }

  private drawPlayer(): void {
    this.drawPlayerBody(this.player.x, this.player.y, Math.floor(this.player.runFrame), false);
  }

  private drawPlayerBody(x: number, y: number, frame: number, isAfterImage: boolean): void {
    const ctx = this.ctx;
    const color = isAfterImage ? '#00f5d4' : this.player.skinColor;

    const bodyWidth = this.player.width;
    const bodyHeight = this.player.height;

    const headSize = 10;
    const headX = x + bodyWidth / 2 - headSize / 2;
    const headY = y;

    const bodyW = 16;
    const bodyH = 14;
    const bodyX = x + bodyWidth / 2 - bodyW / 2;
    const bodyY = y + headSize + 2;

    const legOffset = Math.sin(frame * 0.8) * 4;
    const legY = bodyY + bodyH;

    const armOffset = Math.sin(frame * 0.8 + Math.PI) * 3;
    const armY = bodyY + 2;

    if (!isAfterImage && this.player.accessory) {
      this.drawCape(x, bodyY, bodyW, bodyH);
    }

    ctx.fillStyle = color;

    ctx.fillRect(headX, headY, headSize, headSize);

    ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

    const legW = 5;
    ctx.fillRect(x + bodyWidth / 2 - 6, legY, legW, 10 + legOffset);
    ctx.fillRect(x + bodyWidth / 2 + 1, legY, legW, 10 - legOffset);

    const armW = 4;
    ctx.fillRect(bodyX - 3, armY + armOffset, armW, 8);
    ctx.fillRect(bodyX + bodyW - 1, armY - armOffset, armW, 8);

    if (!isAfterImage) {
      ctx.fillStyle = '#ffffff';

      ctx.fillRect(headX + 2, headY + 3, 2, 2);
      ctx.fillRect(headX + 6, headY + 3, 2, 2);

      ctx.fillRect(x + bodyWidth / 2 - 1, bodyY + bodyH / 2 - 1, 2, 2);

      ctx.fillRect(x + bodyWidth / 2 - 6, legY, legW, 2);
      ctx.fillRect(x + bodyWidth / 2 + 1, legY, legW, 2);

      ctx.fillRect(bodyX - 3, armY, armW, 2);
      ctx.fillRect(bodyX + bodyW - 1, armY, armW, 2);

      if (this.player.accessory) {
        this.drawAccessory(headX, headY, headSize);
      }
    }
  }

  private drawCape(x: number, bodyY: number, bodyW: number, bodyH: number): void {
    const ctx = this.ctx;
    const accessory = this.player.accessory;
    const capeStyle = accessory.cape;

    if (!capeStyle) return;

    const capeColor = '#7209b7';
    ctx.fillStyle = capeColor;
    ctx.shadowColor = capeColor;
    ctx.shadowBlur = 3;

    const centerX = x + this.player.width / 2;

    if (capeStyle === 'style1') {
      ctx.beginPath();
      ctx.moveTo(centerX - bodyW / 2 - 2, bodyY + 2);
      ctx.lineTo(centerX - bodyW / 2 - 5, bodyY + bodyH + 5);
      ctx.lineTo(centerX + bodyW / 2 + 5, bodyY + bodyH + 5);
      ctx.lineTo(centerX + bodyW / 2 + 2, bodyY + 2);
      ctx.closePath();
      ctx.fill();
    } else if (capeStyle === 'style2') {
      ctx.beginPath();
      ctx.moveTo(centerX - bodyW / 2 - 2, bodyY + 2);
      ctx.lineTo(centerX - bodyW / 2 - 7, bodyY + bodyH + 15);
      ctx.lineTo(centerX + bodyW / 2 + 7, bodyY + bodyH + 15);
      ctx.lineTo(centerX + bodyW / 2 + 2, bodyY + 2);
      ctx.closePath();
      ctx.fill();
    } else if (capeStyle === 'style3') {
      ctx.beginPath();
      ctx.moveTo(centerX - bodyW / 2 - 2, bodyY + 4);
      ctx.lineTo(centerX - bodyW / 2 - 12, bodyY + bodyH - 2);
      ctx.lineTo(centerX - bodyW / 2 - 7, bodyY + bodyH + 8);
      ctx.lineTo(centerX + bodyW / 2 + 7, bodyY + bodyH + 8);
      ctx.lineTo(centerX + bodyW / 2 + 12, bodyY + bodyH - 2);
      ctx.lineTo(centerX + bodyW / 2 + 2, bodyY + 4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  private drawAccessory(headX: number, headY: number, headSize: number): void {
    const ctx = this.ctx;
    const accessory = this.player.accessory;

    const cx = headX + headSize / 2;
    const cy = headY + headSize / 2;

    if (accessory.glasses) {
      this.drawGlasses(cx, cy, accessory.glasses as string);
    }

    if (accessory.helmet) {
      this.drawHelmet(cx, cy, headSize, accessory.helmet as string);
    }
  }

  private drawGlasses(cx: number, cy: number, style: string): void {
    const ctx = this.ctx;
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = 3;

    if (style === 'style1') {
      ctx.beginPath();
      ctx.arc(cx - 2.5, cy - 1, 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 2.5, cy - 1, 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 0.5, cy - 1);
      ctx.lineTo(cx + 0.5, cy - 1);
      ctx.stroke();
    } else if (style === 'style2') {
      ctx.strokeRect(cx - 5, cy - 3, 4, 4);
      ctx.strokeRect(cx + 1, cy - 3, 4, 4);
      ctx.beginPath();
      ctx.moveTo(cx - 1, cy - 1);
      ctx.lineTo(cx + 1, cy - 1);
      ctx.stroke();
    } else if (style === 'style3') {
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 1);
      ctx.lineTo(cx - 2, cy - 3);
      ctx.lineTo(cx - 0.5, cy - 1);
      ctx.lineTo(cx - 3, cy + 1);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 5, cy - 1);
      ctx.lineTo(cx + 2, cy - 3);
      ctx.lineTo(cx + 0.5, cy - 1);
      ctx.lineTo(cx + 3, cy + 1);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }

  private drawHelmet(cx: number, cy: number, headSize: number, style: string): void {
    const ctx = this.ctx;

    if (style === 'style1') {
      const helmetColor = '#8338ec';
      ctx.fillStyle = helmetColor;
      ctx.shadowColor = helmetColor;
      ctx.shadowBlur = 3;

      ctx.beginPath();
      ctx.arc(cx, cy - 1, headSize / 2 + 1.5, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(cx - headSize / 2 - 1.5, cy - 1, headSize + 3, 2.5);
    } else if (style === 'style2') {
      const helmetColor = '#8338ec';
      ctx.fillStyle = helmetColor;
      ctx.shadowColor = helmetColor;
      ctx.shadowBlur = 3;

      ctx.beginPath();
      ctx.arc(cx, cy - 1, headSize / 2 + 1.5, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(cx - headSize / 2 - 1.5, cy - 1, headSize + 3, 2.5);

      ctx.fillStyle = '#ff006e';
      ctx.shadowColor = '#ff006e';
      ctx.beginPath();
      ctx.moveTo(cx - headSize / 2 - 1, cy - headSize / 2 - 1);
      ctx.lineTo(cx - headSize / 2 - 3.5, cy - headSize / 2 - 6);
      ctx.lineTo(cx - headSize / 2 + 1, cy - headSize / 2 - 2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + headSize / 2 + 1, cy - headSize / 2 - 1);
      ctx.lineTo(cx + headSize / 2 + 3.5, cy - headSize / 2 - 6);
      ctx.lineTo(cx + headSize / 2 - 1, cy - headSize / 2 - 2);
      ctx.closePath();
      ctx.fill();
    } else if (style === 'style3') {
      ctx.fillStyle = '#ffbe0b';
      ctx.shadowColor = '#ffbe0b';
      ctx.shadowBlur = 4;

      ctx.beginPath();
      ctx.moveTo(cx - headSize / 2, cy - 1);
      ctx.lineTo(cx - headSize / 2, cy - headSize / 2 - 2);
      ctx.lineTo(cx - headSize / 4, cy - headSize / 2 + 1);
      ctx.lineTo(cx, cy - headSize / 2 - 5);
      ctx.lineTo(cx + headSize / 4, cy - headSize / 2 + 1);
      ctx.lineTo(cx + headSize / 2, cy - headSize / 2 - 2);
      ctx.lineTo(cx + headSize / 2, cy - 1);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fb5607';
      ctx.shadowColor = '#fb5607';
      ctx.beginPath();
      ctx.arc(cx, cy - headSize / 2 - 1, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  destroy(): void {
    this.stop();
    this.removeEventListeners();
    this.finishCallbacks = [];
  }
}

export type { TrackData, TrackCell };
