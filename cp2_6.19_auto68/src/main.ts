import {
  GameState,
  Particle,
  PHYSICS_CONSTANTS,
  applyPowerUp,
  checkBrickCollision,
  checkPaddleCollision,
  checkPowerUpCollision,
  createBall,
  createParticles,
  createPaddle,
  isBallLost,
  spawnSplitBalls,
  updateBall,
  updateCelebrationParticles,
  updatePaddle,
  updateParticles,
  updatePowerUps
} from './engine/physics';
import { generateLevel, maybeSpawnPowerUp, BRICK_HP_COLORS } from './engine/levelGenerator';
import { Renderer } from './engine/renderer';
import { AudioManager } from './engine/audioManager';

type ScreenState = 'title' | 'playing' | 'gameover' | 'levelcomplete';

const FIXED_DT = 16 / 1000;
const { CANVAS_WIDTH, CANVAS_HEIGHT } = PHYSICS_CONSTANTS;

class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private audio: AudioManager;
  private state: GameState;
  private screen: ScreenState = 'title';
  private mouseX: number = CANVAS_WIDTH / 2;
  private mouseY: number = CANVAS_HEIGHT / 2;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private time: number = 0;
  private paused: boolean = false;
  private celebrationParticles: Particle[] = [];
  private levelTransitionTimer: number = 0;
  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.audio = new AudioManager();

    this.state = this.createInitialState();
    this.bindEvents();
  }

  private createInitialState(): GameState {
    return {
      balls: [],
      paddle: createPaddle(),
      bricks: [],
      powerUps: [],
      particles: [],
      score: 0,
      lives: 3,
      level: 1,
      scorePopup: null,
      multiballTimer: 0
    };
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      if (this.screen === 'title') {
        this.audio.init();
        this.startGame();
      } else if (this.screen === 'gameover') {
        if (this.renderer.isButtonClicked(mx, my)) {
          this.startGame();
        }
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.paused = true;
      } else {
        this.paused = false;
        this.lastTime = performance.now();
      }
    });

    window.addEventListener('blur', () => {
      this.paused = true;
    });
    window.addEventListener('focus', () => {
      this.paused = false;
      this.lastTime = performance.now();
    });
  }

  private startGame(): void {
    this.state = this.createInitialState();
    this.state.bricks = generateLevel(1);
    this.spawnBall();
    this.screen = 'playing';
    this.celebrationParticles = [];
    this.levelTransitionTimer = 0;
  }

  private spawnBall(): void {
    const paddle = this.state.paddle;
    const ball = createBall(
      paddle.x + paddle.width / 2,
      paddle.y - 15,
      -Math.PI / 2 + (Math.random() - 0.5) * 0.3
    );
    this.state.balls.push(ball);
  }

  private resetBall(): void {
    this.state.balls = [];
    this.state.powerUps = [];
    this.state.multiballTimer = 0;
    this.state.paddle = createPaddle();
    this.spawnBall();
  }

  private onMultiballSplit(): void {
    const activeBalls = this.state.balls.filter(b => b.active);
    if (activeBalls.length === 0) return;
    const primary = activeBalls[0];
    const newBalls = spawnSplitBalls(primary);
    this.state.balls.push(...newBalls);
  }

  private nextLevel(): void {
    this.state.level += 1;
    this.state.bricks = generateLevel(this.state.level);
    this.state.powerUps = [];
    this.state.particles = [];
    this.state.multiballTimer = 0;
    this.celebrationParticles = [];
    this.levelTransitionTimer = 0;
    this.resetBall();
    this.screen = 'playing';
  }

  private spawnCelebrationParticles(): void {
    const colors = ['#ef4444', '#f97316', '#facc15', '#4ade80', '#3b82f6', '#a855f7', '#ffffff', '#fb7185', '#22d3ee'];
    for (let i = 0; i < 150; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 220;
      const maxLife = 1.5 + Math.random() * 1.2;
      this.celebrationParticles.push({
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: maxLife,
        maxLife,
        size: 3 + Math.random() * 6,
        celebration: true
      });
    }
    const activeBalls = this.state.balls.filter(b => b.active);
    for (const ball of activeBalls) {
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 260;
        const maxLife = 1.3 + Math.random() * 1.2;
        this.celebrationParticles.push({
          x: ball.x,
          y: ball.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 60,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: maxLife,
          maxLife,
          size: 3 + Math.random() * 5,
          celebration: true
        });
      }
    }
  }

  private update(dt: number): void {
    if (this.paused) return;

    if (this.screen === 'playing') {
      this.updatePlaying(dt);
    } else if (this.screen === 'levelcomplete') {
      this.levelTransitionTimer += dt;
      this.celebrationParticles = updateCelebrationParticles(this.celebrationParticles, dt);
      const TOTAL_DURATION = 1.5 + 2.0 + 1.5;
      if (this.levelTransitionTimer > TOTAL_DURATION) {
        this.nextLevel();
      }
    }

    if (this.state.scorePopup) {
      this.state.scorePopup.life -= dt;
      this.state.scorePopup.scale = Math.max(0, this.state.scorePopup.scale - dt * 2);
      if (this.state.scorePopup.life <= 0) {
        this.state.scorePopup = null;
      }
    }
  }

  private updatePlaying(dt: number): void {
    updatePaddle(this.state.paddle, this.mouseX, dt);

    for (const ball of this.state.balls) {
      updateBall(ball, dt);
    }

    for (const ball of this.state.balls) {
      if (!ball.active) continue;

      if (checkPaddleCollision(ball, this.state.paddle)) {
        this.audio.playPaddleHit();
      }

      const hitBrick = checkBrickCollision(ball, this.state.bricks);
      if (hitBrick) {
        hitBrick.hp -= 1;
        this.audio.playBrickHit(hitBrick.hp + 1);

        const colors = BRICK_HP_COLORS[Math.min(hitBrick.maxHp, 3)];
        const particleColor = colors[hitBrick.hp >= 0 ? Math.min(hitBrick.hp, 1) : 0];
        this.state.particles.push(
          ...createParticles(
            hitBrick.x + hitBrick.width / 2,
            hitBrick.y + hitBrick.height / 2,
            particleColor,
            6
          )
        );

        if (hitBrick.hp <= 0) {
          hitBrick.active = false;
          const points = hitBrick.maxHp * 10;
          this.state.score += points;
          this.state.scorePopup = {
            value: points,
            x: hitBrick.x + hitBrick.width / 2,
            y: hitBrick.y + hitBrick.height / 2,
            scale: 1,
            life: 0.8
          };

          const powerUp = maybeSpawnPowerUp(
            hitBrick.x + hitBrick.width / 2,
            hitBrick.y + hitBrick.height / 2
          );
          if (powerUp) {
            this.state.powerUps.push(powerUp);
          }
        } else {
          this.state.score += 5;
        }
      }

      if (isBallLost(ball)) {
        ball.active = false;
      }
    }

    this.state.balls = this.state.balls.filter(b => b.active);

    if (this.state.balls.length === 0) {
      this.state.lives -= 1;
      this.audio.playLoseLife();
      if (this.state.lives <= 0) {
        this.screen = 'gameover';
        this.audio.playGameOver();
        return;
      }
      this.resetBall();
    }

    this.state.powerUps = updatePowerUps(this.state.powerUps, dt);

    for (const powerUp of this.state.powerUps) {
      if (!powerUp.active) continue;
      if (checkPowerUpCollision(powerUp, this.state.paddle)) {
        powerUp.active = false;
        this.audio.playPowerUp();
        applyPowerUp(powerUp, this.state, () => this.onMultiballSplit());
      }
    }

    this.state.powerUps = this.state.powerUps.filter(p => p.active);
    this.state.particles = updateParticles(this.state.particles, dt);

    if (this.state.multiballTimer > 0) {
      this.state.multiballTimer -= dt;
    }

    const remainingBricks = this.state.bricks.filter(b => b.active).length;
    if (remainingBricks === 0) {
      this.screen = 'levelcomplete';
      this.audio.playLevelComplete();
      this.spawnCelebrationParticles();
      this.levelTransitionTimer = 0;
    }
  }

  private render(): void {
    switch (this.screen) {
      case 'title':
        this.renderer.drawTitleScreen(this.time);
        break;
      case 'playing':
        this.renderer.render(this.state, this.time);
        break;
      case 'gameover':
        this.renderer.drawGameOver(this.state.score, this.time);
        if (this.renderer.isButtonHovered(this.mouseX, this.mouseY)) {
          this.canvas.style.cursor = 'pointer';
        } else {
          this.canvas.style.cursor = 'default';
        }
        break;
      case 'levelcomplete':
        const PARTICLES_DURATION = 1.5;
        const TEXT_DURATION = 2.0;
        const PREVIEW_DURATION = 1.5;
        let phase: 'particles' | 'text' | 'preview';
        let phaseProgress: number;
        let nextLevel = this.state.level + 1;

        if (this.levelTransitionTimer < PARTICLES_DURATION) {
          phase = 'particles';
          phaseProgress = this.levelTransitionTimer / PARTICLES_DURATION;
        } else if (this.levelTransitionTimer < PARTICLES_DURATION + TEXT_DURATION) {
          phase = 'text';
          phaseProgress = (this.levelTransitionTimer - PARTICLES_DURATION) / TEXT_DURATION;
        } else {
          phase = 'preview';
          phaseProgress = (this.levelTransitionTimer - PARTICLES_DURATION - TEXT_DURATION) / PREVIEW_DURATION;
        }
        this.renderer.drawLevelComplete(
          this.state,
          this.time,
          this.celebrationParticles,
          phase,
          phaseProgress,
          nextLevel
        );
        break;
    }
  }

  private loop = (timestamp: number): void => {
    requestAnimationFrame(this.loop);

    if (this.lastTime === 0) {
      this.lastTime = timestamp;
    }

    let frameDt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (frameDt > 0.1) frameDt = 0.1;

    this.time += frameDt;

    if (!this.paused) {
      this.accumulator += frameDt;

      while (this.accumulator >= FIXED_DT) {
        this.update(FIXED_DT);
        this.accumulator -= FIXED_DT;
      }
    }

    this.render();
  };

  start(): void {
    this.lastTime = 0;
    this.accumulator = 0;
    this.time = 0;
    requestAnimationFrame(this.loop);
  }
}

const game = new Game();
game.start();
