import { AudioAnalyzer, generateTestBeatAudio, BeatEvent } from './audioAnalyzer';
import { ParticleSystem } from './particleSystem';
import { useGameStore, GameState } from './store';

interface Player {
  x: number;
  y: number;
  baseY: number;
  radius: number;
  vy: number;
  isJumping: boolean;
  scaleX: number;
  scaleY: number;
  color: string;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  fadeInStart: number;
  scored: boolean;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioAnalyzer: AudioAnalyzer;
  private particleSystem: ParticleSystem;
  private player: Player;
  private obstacles: Obstacle[] = [];
  private animationId: number = 0;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private gameTime: number = 0;
  private difficultyPhaseDuration: number = 30000;
  private baseSpeed: number = 4;
  private obstacleSpeed: number = 5;
  private jumpHeight: number = 80;
  private jumpDuration: number = 18;
  private gravity: number = 0.06;
  private groundY: number = 0;
  private flashTimer: number = 0;
  private keys: Set<string> = new Set();
  private onStateChange: ((state: GameState) => void) | null = null;
  private onScoreChange: ((score: number) => void) | null = null;
  private onLivesChange: ((lives: number) => void) | null = null;
  private onProgressChange: ((progress: number) => void) | null = null;
  private onFlashRed: ((flash: boolean) => void) | null = null;
  private onBpmChange: ((bpm: number) => void) | null = null;
  private beatCooldown: number = 0;
  private invincibleFrames: number = 0;
  private bpm: number = 150;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.audioAnalyzer = new AudioAnalyzer(0.3);
    this.particleSystem = new ParticleSystem();

    this.groundY = this.canvas.height - 80;

    this.player = {
      x: 120,
      y: this.groundY,
      baseY: this.groundY,
      radius: 15,
      vy: 0,
      isJumping: false,
      scaleX: 1,
      scaleY: 1,
      color: '#FF6B6B',
    };
  }

  setCallbacks(opts: {
    onStateChange?: (state: GameState) => void;
    onScoreChange?: (score: number) => void;
    onLivesChange?: (lives: number) => void;
    onProgressChange?: (progress: number) => void;
    onFlashRed?: (flash: boolean) => void;
    onBpmChange?: (bpm: number) => void;
  }): void {
    if (opts.onStateChange) this.onStateChange = opts.onStateChange;
    if (opts.onScoreChange) this.onScoreChange = opts.onScoreChange;
    if (opts.onLivesChange) this.onLivesChange = opts.onLivesChange;
    if (opts.onProgressChange) this.onProgressChange = opts.onProgressChange;
    if (opts.onFlashRed) this.onFlashRed = opts.onFlashRed;
    if (opts.onBpmChange) this.onBpmChange = opts.onBpmChange;
  }

  resize(): void {
    this.groundY = this.canvas.height - 80;
    this.player.baseY = this.groundY;
    if (!this.player.isJumping) {
      this.player.y = this.groundY;
    }
  }

  async start(): Promise<void> {
    await this.audioAnalyzer.init();

    const audioCtx = this.audioAnalyzer.getAudioContext()!;
    const testBuffer = generateTestBeatAudio(audioCtx, this.bpm, 120);
    await this.audioAnalyzer.loadAndPlay(testBuffer);

    this.audioAnalyzer.onBeat((beat: BeatEvent) => {
      this.onBeatDetected(beat);
    });

    this.player.y = this.player.baseY;
    this.obstacles = [];
    this.particleSystem.clear();
    this.gameTime = 0;
    this.frameCount = 0;
    this.invincibleFrames = 0;

    if (this.onStateChange) this.onStateChange('playing');
    if (this.onLivesChange) this.onLivesChange(3);
    if (this.onScoreChange) this.onScoreChange(0);
    if (this.onProgressChange) this.onProgressChange(0);

    this.lastTime = performance.now();
    this.gameLoop();
  }

  pause(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    if (this.onStateChange) this.onStateChange('paused');
  }

  resume(): void {
    if (this.onStateChange) this.onStateChange('playing');
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.audioAnalyzer.stop();
    if (this.onStateChange) this.onStateChange('gameover');
  }

  restart(): void {
    this.audioAnalyzer.stop();
    this.obstacles = [];
    this.particleSystem.clear();
    this.player.y = this.player.baseY;
    this.player.vy = 0;
    this.player.isJumping = false;
    this.player.scaleX = 1;
    this.player.scaleY = 1;
    this.gameTime = 0;
    this.frameCount = 0;
    this.invincibleFrames = 0;
    this.flashTimer = 0;
    this.start();
  }

  handleKeyDown(key: string): void {
    this.keys.add(key);

    const store = useGameStore.getState();
    if (store.state === 'idle' && (key === ' ' || key === 'ArrowUp')) {
      this.start();
      return;
    }

    if (store.state === 'gameover' && (key === ' ' || key === 'Enter')) {
      this.restart();
      return;
    }

    if (store.state === 'paused' && (key === ' ' || key === 'Escape')) {
      this.resume();
      return;
    }

    if (store.state === 'playing' && key === 'Escape') {
      this.pause();
      return;
    }

    if (
      store.state === 'playing' &&
      !this.player.isJumping &&
      (key === ' ' || key === 'ArrowUp')
    ) {
      this.jump();
    }
  }

  handleKeyUp(key: string): void {
    this.keys.delete(key);
  }

  private jump(): void {
    if (this.player.isJumping) return;
    this.player.isJumping = true;
    this.player.vy = -this.jumpHeight / this.jumpDuration;
    this.player.scaleX = 1.3;
    this.player.scaleY = 0.7;
  }

  private onBeatDetected(_beat: BeatEvent): void {
    if (useGameStore.getState().state !== 'playing') return;

    const obstacle: Obstacle = {
      x: this.canvas.width + 50,
      y: this.groundY - 40 + this.player.radius,
      width: 40,
      height: 40,
      color: '#4ECDC4',
      opacity: 0,
      fadeInStart: performance.now(),
      scored: false,
    };
    this.obstacles.push(obstacle);
  }

  private updatePlayer(): void {
    const store = useGameStore.getState();

    if (this.player.isJumping) {
      this.player.vy += this.gravity;
      this.player.y += this.player.vy;

      if (this.player.y >= this.player.baseY) {
        this.player.y = this.player.baseY;
        this.player.vy = 0;
        this.player.isJumping = false;
        this.player.scaleX = 0.7;
        this.player.scaleY = 1.3;
        setTimeout(() => {
          this.player.scaleX = 1;
          this.player.scaleY = 1;
        }, 80);
      }
    }

    if (this.invincibleFrames > 0) {
      this.invincibleFrames--;
    }

    this.player.scaleX += (1 - this.player.scaleX) * 0.15;
    this.player.scaleY += (1 - this.player.scaleY) * 0.15;
  }

  private updateObstacles(): void {
    const store = useGameStore.getState();
    const speedMult = store.speedMultiplier;
    const obstSpeed = this.obstacleSpeed * speedMult;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      obs.x -= obstSpeed;

      const elapsed = performance.now() - obs.fadeInStart;
      obs.opacity = Math.min(1, elapsed / 200);

      if (!obs.scored && obs.x + obs.width < this.player.x - this.player.radius) {
        obs.scored = true;
        if (this.onScoreChange) {
          const newScore = useGameStore.getState().score + 10;
          this.onScoreChange(newScore);
          useGameStore.getState().addScore(10);
        }
        this.particleSystem.emitSuccess(this.player.x, this.player.y - this.player.radius);
      }

      if (obs.x + obs.width < -50) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private checkCollisions(): void {
    if (this.invincibleFrames > 0) return;

    const store = useGameStore.getState();
    const px = this.player.x - 20;
    const py = this.player.y - 40 + this.player.radius;
    const pw = 40;
    const ph = 40;

    for (const obs of this.obstacles) {
      if (obs.opacity < 0.3) continue;

      const ox = obs.x;
      const oy = obs.y;
      const ow = obs.width;
      const oh = obs.height;

      if (px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy) {
        const newLives = store.lives - 1;
        if (this.onLivesChange) this.onLivesChange(newLives);
        useGameStore.getState().setLives(newLives);

        this.particleSystem.emitFailure(
          this.player.x - this.player.radius,
          this.player.y - this.player.radius
        );

        this.flashTimer = 6;
        if (this.onFlashRed) this.onFlashRed(true);

        this.invincibleFrames = 60;

        if (newLives <= 0) {
          this.stop();
          return;
        }

        break;
      }
    }
  }

  private updateGame(): void {
    this.frameCount++;
    this.gameTime += 16.67;

    const progress = Math.min(1, this.gameTime / this.difficultyPhaseDuration);
    if (this.onProgressChange) this.onProgressChange(progress);

    this.audioAnalyzer.detectBeat();

    this.updatePlayer();
    this.updateObstacles();
    this.checkCollisions();
    this.particleSystem.update();

    if (this.flashTimer > 0) {
      this.flashTimer--;
      if (this.flashTimer <= 0 && this.onFlashRed) {
        this.onFlashRed(false);
      }
    }
  }

  private render(): void {
    const store = useGameStore.getState();
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(0, 0, w, h);

    if (this.flashTimer > 0) {
      ctx.fillStyle = '#FF000030';
      ctx.fillRect(0, 0, w, h);
    }

    this.renderGround(ctx, w, h);

    for (const obs of this.obstacles) {
      this.renderObstacle(ctx, obs);
    }

    this.renderPlayer(ctx);

    this.particleSystem.render(ctx);

    if (store.state === 'gameover') {
      this.renderGameOver(ctx, w, h, store.score);
    }
  }

  private renderGround(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const groundTop = this.groundY + this.player.radius + 5;

    ctx.strokeStyle = '#4ECDC440';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundTop);
    ctx.lineTo(w, groundTop);
    ctx.stroke();

    const gridSpacing = 60;
    ctx.strokeStyle = '#4ECDC415';
    ctx.lineWidth = 0.5;
    for (let x = (this.frameCount * 2) % gridSpacing; x < w; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, groundTop);
      ctx.lineTo(x - 20, h);
      ctx.stroke();
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D): void {
    const p = this.player;

    ctx.save();

    if (this.invincibleFrames > 0 && Math.floor(this.invincibleFrames / 4) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    ctx.translate(p.x, p.y);
    ctx.scale(p.scaleX, p.scaleY);

    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, -p.radius, p.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-5, -p.radius - 3, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1A1A2E';
    ctx.beginPath();
    ctx.arc(-4, -p.radius - 3, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle): void {
    ctx.save();
    ctx.globalAlpha = obs.opacity;

    const distToPlayer = obs.x - this.player.x;
    if (distToPlayer > 0 && distToPlayer < 100) {
      ctx.shadowColor = '#FFE66D';
      ctx.shadowBlur = 8;
    }

    ctx.fillStyle = obs.color;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

    ctx.strokeStyle = '#3DBDB5';
    ctx.lineWidth = 1;
    ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

    ctx.shadowBlur = 0;

    ctx.restore();
  }

  private renderGameOver(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    score: number
  ): void {
    ctx.fillStyle = 'rgba(26, 26, 46, 0.85)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#FF6B6B';
    ctx.font = '2rem "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', w / 2, h / 2 - 40);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '1.2rem "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Score: ${score}`, w / 2, h / 2 + 10);

    ctx.fillStyle = '#4ECDC4';
    ctx.font = '1rem "Segoe UI", Arial, sans-serif';
    ctx.fillText('Press SPACE or ENTER to Restart', w / 2, h / 2 + 50);
  }

  private gameLoop = (): void => {
    const store = useGameStore.getState();

    if (store.state === 'playing') {
      this.updateGame();
    }

    this.render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.audioAnalyzer.destroy();
    this.particleSystem.clear();
  }
}
