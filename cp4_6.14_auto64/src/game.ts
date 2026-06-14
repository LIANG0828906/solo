import { Renderer, GameState, Car, Particle, Debris } from './renderer';
import { InputManager } from './inputManager';

type Difficulty = 'easy' | 'normal' | 'hard';

interface DifficultyConfig {
  obstacleSpeed: number;
  spawnInterval: number;
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { obstacleSpeed: 80, spawnInterval: 1.2 },
  normal: { obstacleSpeed: 130, spawnInterval: 1.2 },
  hard: { obstacleSpeed: 180, spawnInterval: 0.8 }
};

const OBSTACLE_COLORS = ['#ef4444', '#f97316', '#a855f7'];
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 90;
const OBSTACLE_WIDTH = 50;
const OBSTACLE_HEIGHT = 90;
const BASE_SPEED = 400;
const BOOST_SPEED = 600;
const BOOST_DURATION = 1.5;
const BOOST_COOLDOWN = 3;
const INITIAL_LIVES = 3;
const FLASH_DURATION = 0.2;
const DEBRIS_DURATION = 0.4;

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private input: InputManager;
  private state: GameState;
  private lastTime: number = 0;
  private spawnTimer: number = 0;
  private distance: number = 0;
  private dodgedCount: number = 0;
  private animationId: number = 0;
  private roadBounds: { left: number; right: number };
  private onGameOverCallback?: () => void;
  private onRestartCallback?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.roadBounds = this.renderer.getRoadBounds();

    this.input.onSpacePress(() => this.tryBoost());

    this.state = this.createInitialState('normal');
  }

  private createInitialState(difficulty: Difficulty): GameState {
    return {
      score: 0,
      highScore: this.loadHighScore(),
      lives: INITIAL_LIVES,
      roadOffset: 0,
      player: {
        x: this.canvas.width / 2,
        y: this.canvas.height - 120,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        color: '#3b82f6'
      },
      obstacles: [],
      particles: [],
      debris: [],
      isBoosting: false,
      boostTime: 0,
      boostCooldown: 0,
      flashTime: 0,
      gameOver: false,
      gameStarted: false,
      difficulty
    };
  }

  private loadHighScore(): number {
    try {
      const saved = localStorage.getItem('carDodgerHighScore');
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  }

  private saveHighScore(score: number): void {
    try {
      localStorage.setItem('carDodgerHighScore', score.toString());
    } catch {
      // ignore
    }
  }

  public setDifficulty(difficulty: Difficulty): void {
    this.state.difficulty = difficulty;
  }

  public start(): void {
    this.state = this.createInitialState(this.state.difficulty as Difficulty);
    this.state.gameStarted = true;
    this.spawnTimer = 0;
    this.distance = 0;
    this.dodgedCount = 0;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  public destroy(): void {
    this.stop();
    this.input.destroy();
  }

  private gameLoop = (): void => {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (!this.state.gameOver && this.state.gameStarted) {
      this.update(dt);
    }

    this.render();

    if (this.state.gameStarted) {
      this.animationId = requestAnimationFrame(this.gameLoop);
    }
  };

  private update(dt: number): void {
    this.updatePlayer(dt);
    this.updateRoad(dt);
    this.updateObstacles(dt);
    this.updateParticles(dt);
    this.updateDebris(dt);
    this.updateBoost(dt);
    this.updateFlash(dt);
    this.spawnObstacles(dt);
    this.checkCollisions();
    this.updateScore(dt);
  }

  private updatePlayer(dt: number): void {
    const speed = this.state.isBoosting ? BOOST_SPEED : BASE_SPEED;
    const player = this.state.player;

    let dx = 0;
    let dy = 0;

    if (this.input.isLeft()) dx -= 1;
    if (this.input.isRight()) dx += 1;
    if (this.input.isUp()) dy -= 1;
    if (this.input.isDown()) dy += 1;

    if (dx !== 0 && dy !== 0) {
      const invLen = 1 / Math.sqrt(2);
      dx *= invLen;
      dy *= invLen;
    }

    player.x += dx * speed * dt;
    player.y += dy * speed * dt;

    const halfW = player.width / 2;
    const halfH = player.height / 2;
    player.x = Math.max(this.roadBounds.left + halfW, Math.min(this.roadBounds.right - halfW, player.x));
    player.y = Math.max(halfH, Math.min(this.canvas.height - halfH, player.y));
  }

  private updateRoad(dt: number): void {
    const speed = this.state.isBoosting ? BOOST_SPEED : BASE_SPEED;
    this.state.roadOffset += speed * dt;
  }

  private updateObstacles(dt: number): void {
    const config = DIFFICULTY_CONFIGS[this.state.difficulty as Difficulty];
    const playerSpeed = this.state.isBoosting ? BOOST_SPEED : BASE_SPEED;
    const relativeSpeed = playerSpeed + config.obstacleSpeed;

    const toRemove: number[] = [];
    this.state.obstacles.forEach((obs, index) => {
      obs.y += relativeSpeed * dt;
      if (obs.y - obs.height / 2 > this.canvas.height) {
        toRemove.push(index);
        this.dodgedCount++;
      }
    });

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.state.obstacles.splice(toRemove[i], 1);
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const p = this.state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.state.particles.splice(i, 1);
      }
    }
  }

  private updateDebris(dt: number): void {
    for (let i = this.state.debris.length - 1; i >= 0; i--) {
      const d = this.state.debris[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 200 * dt;
      d.rotation += d.angularVelocity * dt;
      d.life -= dt;
      if (d.life <= 0) {
        this.state.debris.splice(i, 1);
      }
    }
  }

  private updateBoost(dt: number): void {
    if (this.state.isBoosting) {
      this.state.boostTime -= dt;
      if (this.state.boostTime <= 0) {
        this.state.isBoosting = false;
        this.state.boostTime = 0;
        this.state.boostCooldown = BOOST_COOLDOWN;
      }
    } else if (this.state.boostCooldown > 0) {
      this.state.boostCooldown -= dt;
      if (this.state.boostCooldown < 0) {
        this.state.boostCooldown = 0;
      }
    }
  }

  private updateFlash(dt: number): void {
    if (this.state.flashTime > 0) {
      this.state.flashTime -= dt;
      if (this.state.flashTime < 0) {
        this.state.flashTime = 0;
      }
    }
  }

  private tryBoost(): void {
    if (!this.state.gameStarted || this.state.gameOver) return;
    if (!this.state.isBoosting && this.state.boostCooldown <= 0) {
      this.state.isBoosting = true;
      this.state.boostTime = BOOST_DURATION;
      this.spawnBoostParticlesBurst();
    }
  }

  private spawnBoostParticlesBurst(): void {
    const player = this.state.player;
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
      const isOrange = Math.random() > 0.4;
      this.state.particles.push({
        x: player.x + (Math.random() - 0.5) * player.width * 0.6,
        y: player.y + player.height / 2,
        vx: (Math.random() - 0.5) * 80,
        vy: 60 + Math.random() * 120,
        life: 0.3,
        maxLife: 0.3,
        color: isOrange ? '#f97316' : '#fbbf24',
        size: 4 + Math.random() * 6
      });
    }
  }

  private spawnObstacles(dt: number): void {
    const config = DIFFICULTY_CONFIGS[this.state.difficulty as Difficulty];
    this.spawnTimer += dt;

    if (this.spawnTimer >= config.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnObstacle();
    }
  }

  private spawnObstacle(): void {
    const color = OBSTACLE_COLORS[Math.floor(Math.random() * OBSTACLE_COLORS.length)];
    const x = this.roadBounds.left + OBSTACLE_WIDTH / 2 +
      Math.random() * (this.roadBounds.right - this.roadBounds.left - OBSTACLE_WIDTH);

    this.state.obstacles.push({
      x,
      y: -OBSTACLE_HEIGHT / 2,
      width: OBSTACLE_WIDTH,
      height: OBSTACLE_HEIGHT,
      color
    });
  }

  private checkCollisions(): void {
    const player = this.state.player;

    for (let i = this.state.obstacles.length - 1; i >= 0; i--) {
      const obs = this.state.obstacles[i];
      if (this.rectCollision(player, obs)) {
        this.state.obstacles.splice(i, 1);
        this.state.lives--;
        this.state.flashTime = FLASH_DURATION;
        this.spawnDebris(obs);

        if (this.state.lives <= 0) {
          this.endGame();
        }
        break;
      }
    }
  }

  private rectCollision(a: Car, b: Car): boolean {
    return Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
           Math.abs(a.y - b.y) < (a.height + b.height) / 2;
  }

  private spawnDebris(car: Car): void {
    const directions = [
      { vx: -150, vy: -100 },
      { vx: 150, vy: -100 },
      { vx: -100, vy: -200 },
      { vx: 100, vy: -200 }
    ];

    for (let i = 0; i < 4; i++) {
      this.state.debris.push({
        x: car.x,
        y: car.y,
        vx: directions[i].vx + (Math.random() - 0.5) * 50,
        vy: directions[i].vy + (Math.random() - 0.5) * 50,
        rotation: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 10,
        life: DEBRIS_DURATION,
        maxLife: DEBRIS_DURATION,
        color: car.color,
        size: 12 + Math.random() * 8
      });
    }
  }

  private updateScore(dt: number): void {
    const speed = this.state.isBoosting ? BOOST_SPEED : BASE_SPEED;
    this.distance += speed * dt;
    const distanceScore = Math.floor(this.distance / 100);
    const dodgeScore = this.dodgedCount * 5;
    this.state.score = distanceScore + dodgeScore;

    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
    }
  }

  private endGame(): void {
    this.state.gameOver = true;
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
    }
    this.saveHighScore(this.state.highScore);
    if (this.onGameOverCallback) {
      this.onGameOverCallback();
    }
  }

  private render(): void {
    if (!this.state.gameStarted) {
      this.renderer.drawStartScreen(this.state.highScore);
    } else if (this.state.gameOver) {
      this.renderer.render(this.state);
      const isNewRecord = this.state.score >= this.state.highScore && this.state.score > 0;
      this.renderer.drawGameOverScreen(this.state.score, this.state.highScore, isNewRecord);
    } else {
      this.renderer.render(this.state);
    }
  }

  public getState(): GameState {
    return this.state;
  }

  public onGameOver(callback: () => void): void {
    this.onGameOverCallback = callback;
  }

  public onRestart(callback: () => void): void {
    this.onRestartCallback = callback;
  }

  public renderStartScreen(): void {
    this.renderer.drawStartScreen(this.state.highScore);
  }
}
