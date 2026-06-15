import type {
  GameState,
  Player,
  Obstacle,
  Particle,
  GameConfig,
  VoiceCommand,
  ObstacleType
} from './types';
import { Renderer } from './render';

const DEFAULT_CONFIG: GameConfig = {
  canvasWidth: 640,
  canvasHeight: 480,
  gravity: 0.8,
  groundY: 400,
  playerStartX: 100,
  volumeJumpMin: 30,
  volumeJumpMax: 80,
  jumpHeightMin: 50,
  jumpHeightMax: 200,
  superJumpThreshold: 80,
  superJumpHeight: 300,
  superJumpTransitionBand: 10,
  confidenceThreshold: 0.8,
  initialLives: 3,
  hurtDuration: 0.3,
  dashDuration: 1.0,
  crouchDuration: 1.0,
  scrollSpeedMin: 2,
  scrollSpeedMax: 8,
  spawnIntervalMinMs: 1500,
  spawnIntervalMaxMs: 3000,
  difficultyRampSeconds: 180,
  fpsLowThreshold: 30,
  fpsRecoverThreshold: 38,
  fpsSampleWindow: 60,
  fpsSmoothFactor: 0.1
};

export class Game {
  private config: GameConfig;
  private state: GameState;
  private player: Player;
  private obstacles: Obstacle[] = [];
  private particles: Particle[] = [];
  private renderer: Renderer;
  private spawnTimer: number = 0;
  private gameTime: number = 0;
  private lastFrameTime: number = 0;
  private fpsSamples: number[] = [];
  private lowFpsMode: boolean = false;
  private lowFpsCoolDown: number = 0;
  private smoothedFps: number = 60;
  private waveBuffer: number[] = [];
  private onScoreUpdate?: (score: number, isNewHigh: boolean) => void;
  private onGameOver?: (score: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.config = { ...DEFAULT_CONFIG };

    this.state = {
      status: 'idle',
      score: 0,
      lives: this.config.initialLives,
      volume: 0,
      confidence: 0,
      lastCommand: null,
      scrollSpeed: this.config.scrollSpeedMin,
      scrollSpeedMin: this.config.scrollSpeedMin,
      scrollSpeedMax: this.config.scrollSpeedMax,
      difficulty: 0,
      spawnInterval: this.config.spawnIntervalMaxMs,
      spawnIntervalMin: this.config.spawnIntervalMinMs,
      spawnIntervalMax: this.config.spawnIntervalMaxMs,
      backgroundProgress: 0,
      fps: 60,
      waveData: []
    };

    this.player = {
      x: this.config.playerStartX,
      y: this.config.groundY,
      width: 32,
      height: 48,
      velocityY: 0,
      isJumping: false,
      isCrouching: false,
      isDashing: false,
      isHurt: false,
      hurtTimer: 0,
      animFrame: 0,
      animTimer: 0,
      dashTimer: 0,
      crouchTimer: 0
    };

    for (let i = 0; i < 64; i++) {
      this.waveBuffer.push(0);
    }

    this.renderer = new Renderer(canvas, this.config);
  }

  start(): void {
    this.state.status = 'playing';
    this.resetGame();
  }

  private resetGame(): void {
    this.state.score = 0;
    this.state.lives = this.config.initialLives;
    this.state.scrollSpeed = this.config.scrollSpeedMin;
    this.state.spawnInterval = this.config.spawnIntervalMaxMs;
    this.state.difficulty = 0;
    this.state.backgroundProgress = 0;
    this.gameTime = 0;
    this.spawnTimer = 0;
    this.obstacles = [];
    this.particles = [];
    this.smoothedFps = 60;
    this.lowFpsMode = false;
    this.lowFpsCoolDown = 0;
    this.fpsSamples = [];
    this.player.x = this.config.playerStartX;
    this.player.y = this.config.groundY;
    this.player.velocityY = 0;
    this.player.isJumping = false;
    this.player.isCrouching = false;
    this.player.isDashing = false;
    this.player.isHurt = false;
    this.player.hurtTimer = 0;
  }

  update(deltaTime: number): void {
    if (this.state.status !== 'playing') {
      this.renderer.render(this.state, this.player, this.obstacles, this.particles);
      return;
    }

    this.updateFPS(deltaTime);
    this.gameTime += deltaTime;
    this.updateDifficulty();
    this.updatePlayer(deltaTime);
    this.updateObstacles(deltaTime);
    this.checkCollisions();
    this.updateParticles(deltaTime);
    this.updateWaveBuffer();
    this.state.score += Math.floor(this.state.scrollSpeed * deltaTime * 10);

    this.spawnTimer += deltaTime * 1000;
    const effectiveInterval = this.lowFpsMode ? this.state.spawnInterval * 2 : this.state.spawnInterval;
    if (this.spawnTimer >= effectiveInterval) {
      this.spawnTimer = 0;
      this.spawnObstacle();
    }

    this.renderer.render(this.state, this.player, this.obstacles, this.particles);
  }

  private updateFPS(deltaTime: number): void {
    const currentFps = 1 / deltaTime;
    this.fpsSamples.push(currentFps);
    if (this.fpsSamples.length > this.config.fpsSampleWindow) {
      this.fpsSamples.shift();
    }

    const avgFps = this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length;
    this.smoothedFps = this.smoothedFps * (1 - this.config.fpsSmoothFactor) + avgFps * this.config.fpsSmoothFactor;
    this.state.fps = this.smoothedFps;

    if (this.lowFpsCoolDown > 0) {
      this.lowFpsCoolDown -= deltaTime;
    }

    if (!this.lowFpsMode && this.smoothedFps < this.config.fpsLowThreshold) {
      this.lowFpsMode = true;
      this.lowFpsCoolDown = 2.0;
    } else if (this.lowFpsMode && this.lowFpsCoolDown <= 0 && this.smoothedFps >= this.config.fpsRecoverThreshold) {
      this.lowFpsMode = false;
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private easeOutSine(t: number): number {
    return Math.sin((t * Math.PI) / 2);
  }

  private updateDifficulty(): void {
    const linearProgress = Math.min(1, this.gameTime / this.config.difficultyRampSeconds);
    const smoothProgress = this.easeInOutCubic(linearProgress);
    this.state.difficulty = smoothProgress;
    this.state.scrollSpeed = this.config.scrollSpeedMin + (this.config.scrollSpeedMax - this.config.scrollSpeedMin) * smoothProgress;
    this.state.spawnInterval = this.config.spawnIntervalMaxMs - (this.config.spawnIntervalMaxMs - this.config.spawnIntervalMinMs) * smoothProgress;
    this.state.backgroundProgress = this.easeOutSine(linearProgress);
  }

  private updatePlayer(deltaTime: number): void {
    this.player.velocityY += this.config.gravity;
    this.player.y += this.player.velocityY;

    const groundY = this.player.isCrouching ? this.config.groundY + 20 : this.config.groundY;
    if (this.player.y >= groundY) {
      this.player.y = groundY;
      this.player.velocityY = 0;
      this.player.isJumping = false;
    }

    if (this.player.isHurt) {
      this.player.hurtTimer -= deltaTime;
      if (this.player.hurtTimer <= 0) {
        this.player.isHurt = false;
      }
    }

    if (this.player.isDashing) {
      this.player.dashTimer -= deltaTime;
      if (this.player.dashTimer <= 0) {
        this.player.isDashing = false;
      }
    }

    if (this.player.isCrouching) {
      this.player.crouchTimer -= deltaTime;
      if (this.player.crouchTimer <= 0) {
        this.player.isCrouching = false;
      }
    }

    this.player.animTimer += deltaTime;
    if (this.player.animTimer >= 0.1) {
      this.player.animTimer = 0;
      this.player.animFrame = (this.player.animFrame + 1) % 4;
    }

    if (this.player.isDashing && Math.random() < 0.5) {
      this.addDashParticle();
    }
  }

  private updateObstacles(deltaTime: number): void {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      this.obstacles[i].x -= this.state.scrollSpeed;
      if (this.obstacles[i].x + this.obstacles[i].width < 0) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private spawnObstacle(): void {
    const types: ObstacleType[] = ['box', 'spike', 'barrier'];
    const type = types[Math.floor(Math.random() * types.length)];

    let width = 30;
    let height = 30 + Math.random() * 120;

    switch (type) {
      case 'box':
        width = 30 + Math.random() * 20;
        height = 30 + Math.random() * 120;
        break;
      case 'spike':
        width = 20 + Math.random() * 15;
        height = 25 + Math.random() * 30;
        break;
      case 'barrier':
        width = 40 + Math.random() * 20;
        height = 20 + Math.random() * 30;
        break;
    }

    const obstacle: Obstacle = {
      type,
      x: this.config.canvasWidth + 20,
      y: this.config.groundY - height + 48,
      width,
      height
    };

    if (type === 'barrier') {
      obstacle.y = this.config.groundY - height + 48;
    }

    this.obstacles.push(obstacle);
  }

  private checkCollisions(): void {
    if (this.player.isHurt) return;

    const playerBox = {
      x: this.player.x + 4,
      y: this.player.y + 4,
      width: this.player.width - 8,
      height: (this.player.isCrouching ? this.player.height * 0.6 : this.player.height) - 8
    };

    for (const obstacle of this.obstacles) {
      if (
        playerBox.x < obstacle.x + obstacle.width &&
        playerBox.x + playerBox.width > obstacle.x &&
        playerBox.y < obstacle.y + obstacle.height &&
        playerBox.y + playerBox.height > obstacle.y
      ) {
        this.takeDamage();
        break;
      }
    }
  }

  private takeDamage(): void {
    this.state.lives--;
    this.player.isHurt = true;
    this.player.hurtTimer = this.config.hurtDuration;

    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        life: 0.5,
        maxLife: 0.5,
        color: '#e74c3c',
        size: 3 + Math.random() * 3
      });
    }

    if (this.state.lives <= 0) {
      this.state.status = 'gameover';
      if (this.onGameOver) {
        this.onGameOver(this.state.score);
      }
    }
  }

  handleVolume(volume: number): void {
    this.state.volume = volume;

    if (this.state.status !== 'playing') return;
    if (this.player.isJumping || this.player.isCrouching) return;

    if (volume >= this.config.volumeJumpMin) {
      this.jump(volume);
    }
  }

  handleCommand(command: VoiceCommand, confidence: number): void {
    this.state.confidence = confidence;
    this.state.lastCommand = command;

    if (this.state.status !== 'playing') return;
    if (confidence < this.config.confidenceThreshold) return;

    switch (command) {
      case 'jump':
        if (!this.player.isJumping) {
          this.jump(Math.max(this.state.volume, this.config.volumeJumpMin));
        }
        break;
      case 'crouch':
        if (!this.player.isJumping) {
          this.player.isCrouching = true;
          this.player.crouchTimer = this.config.crouchDuration;
        }
        break;
      case 'dash':
        if (!this.player.isDashing) {
          this.player.isDashing = true;
          this.player.dashTimer = this.config.dashDuration;
        }
        break;
    }
  }

  private jump(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(100, volume));

    let jumpHeight: number;
    let isSuperJump: boolean = false;

    const superJumpStart = this.config.superJumpThreshold - this.config.superJumpTransitionBand;
    const superJumpEnd = this.config.superJumpThreshold + this.config.superJumpTransitionBand;

    if (clampedVolume <= this.config.volumeJumpMin) {
      jumpHeight = this.config.jumpHeightMin;
    } else if (clampedVolume >= superJumpEnd) {
      jumpHeight = this.config.superJumpHeight;
      isSuperJump = true;
    } else if (clampedVolume <= this.config.volumeJumpMax) {
      const t = (clampedVolume - this.config.volumeJumpMin) / (this.config.volumeJumpMax - this.config.volumeJumpMin);
      const clampedT = Math.max(0, Math.min(1, t));
      jumpHeight = this.config.jumpHeightMin + (this.config.jumpHeightMax - this.config.jumpHeightMin) * clampedT;
    } else {
      const transitionT = (clampedVolume - this.config.volumeJumpMax) / (superJumpEnd - this.config.volumeJumpMax);
      const smoothT = this.easeInOutCubic(Math.max(0, Math.min(1, transitionT)));
      jumpHeight = this.config.jumpHeightMax + (this.config.superJumpHeight - this.config.jumpHeightMax) * smoothT;
      if (transitionT > 0.5) {
        isSuperJump = true;
      }
    }

    jumpHeight = Math.max(this.config.jumpHeightMin, Math.min(this.config.superJumpHeight, jumpHeight));

    if (isSuperJump) {
      this.addSuperJumpParticles();
    }

    this.player.velocityY = -Math.sqrt(2 * this.config.gravity * jumpHeight);
    this.player.isJumping = true;
    this.player.isCrouching = false;
  }

  private addSuperJumpParticles(): void {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1,
        life: 1.0,
        maxLife: 1.0,
        color: Math.random() > 0.5 ? '#FFD700' : '#FFA500',
        size: 3 + Math.random() * 4
      });
    }
  }

  private addDashParticle(): void {
    this.particles.push({
      x: this.player.x,
      y: this.player.y + this.player.height * 0.5 + Math.random() * 10,
      vx: -2 - Math.random() * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 0.3,
      maxLife: 0.3,
      color: '#3498db',
      size: 2 + Math.random() * 3
    });
  }

  private updateWaveBuffer(): void {
    this.waveBuffer.push(this.state.volume);
    if (this.waveBuffer.length > 64) {
      this.waveBuffer.shift();
    }
    this.state.waveData = [...this.waveBuffer];
  }

  getState(): Readonly<GameState> {
    return this.state;
  }

  restart(): void {
    this.start();
  }

  pause(): void {
    if (this.state.status === 'playing') {
      this.state.status = 'paused';
    }
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'playing';
    }
  }

  setOnScoreUpdate(callback: (score: number, isNewHigh: boolean) => void): void {
    this.onScoreUpdate = callback;
  }

  setOnGameOver(callback: (score: number) => void): void {
    this.onGameOver = callback;
  }

  destroy(): void {
    // cleanup
  }
}
