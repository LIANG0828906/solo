import { CONFIG, Player, Obstacle, DataFragment, GameState } from './types';
import { createPlayer, updatePlayer, hitPlayer, PlayerInput } from './game/player';
import { createObstacle, updateObstacle, isObstacleOffScreen, createDataFragment, updateDataFragment, isFragmentOffScreen } from './game/obstacle';
import { checkPlayerObstacleCollision, checkPlayerFragmentCollision } from './game/collision';
import { BackgroundRenderer } from './render/background';
import { PlayerRenderer } from './render/playerRenderer';
import { ObstacleRenderer } from './render/obstacleRenderer';
import { UIRenderer } from './render/uiRenderer';
import { ParticleSystem } from './particles';
import { audioSystem } from './audio';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number = 0;
  private lastTime: number = 0;
  private fps: number = 60;
  private frameCount: number = 0;
  private fpsTimer: number = 0;

  private player!: Player;
  private obstacles: Obstacle[] = [];
  private fragments: DataFragment[] = [];
  private gameState!: GameState;
  private input: PlayerInput = { left: false, right: false, jump: false };

  private backgroundRenderer!: BackgroundRenderer;
  private playerRenderer!: PlayerRenderer;
  private obstacleRenderer!: ObstacleRenderer;
  private uiRenderer!: UIRenderer;
  private particleSystem!: ParticleSystem;

  private lastSpawnTime: number = 0;
  private currentSpawnInterval: number = CONFIG.INITIAL_SPAWN_INTERVAL;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private scaleX: number = 1;
  private scaleY: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.init();
  }

  private init(): void {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.backgroundRenderer = new BackgroundRenderer(this.ctx);
    this.playerRenderer = new PlayerRenderer(this.ctx);
    this.obstacleRenderer = new ObstacleRenderer(this.ctx);
    this.uiRenderer = new UIRenderer(this.ctx);
    this.particleSystem = new ParticleSystem();

    this.resetGame();
    this.bindEvents();

    audioSystem.init();
  }

  private resizeCanvas(): void {
    const container = document.getElementById('game-container')!;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const gameRatio = CONFIG.CANVAS_WIDTH / CONFIG.CANVAS_HEIGHT;
    const containerRatio = containerWidth / containerHeight;

    let canvasWidth: number, canvasHeight: number;

    if (containerRatio > gameRatio) {
      canvasHeight = containerHeight;
      canvasWidth = canvasHeight * gameRatio;
    } else {
      canvasWidth = containerWidth;
      canvasHeight = canvasWidth / gameRatio;
    }

    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;
    this.canvas.style.width = `${canvasWidth}px`;
    this.canvas.style.height = `${canvasHeight}px`;

    this.scaleX = this.canvas.width / canvasWidth;
    this.scaleY = this.canvas.height / canvasHeight;
    
    const rect = this.canvas.getBoundingClientRect();
    this.offsetX = rect.left;
    this.offsetY = rect.top;
  }

  private resetGame(): void {
    this.player = createPlayer();
    this.obstacles = [];
    this.fragments = [];
    this.particleSystem.clear();

    const storedHighScore = localStorage.getItem('cyberDashHighScore');
    const highScore = storedHighScore ? parseFloat(storedHighScore) : 0;

    this.gameState = {
      score: 0,
      highScore,
      displayScore: 0,
      isPaused: false,
      isGameOver: false,
      gameSpeed: CONFIG.INITIAL_GAME_SPEED,
      spawnInterval: CONFIG.INITIAL_SPAWN_INTERVAL,
      alertLevel: 0,
      obstacleCount: 0,
      lastLifeBonus: 0
    };

    this.currentSpawnInterval = CONFIG.INITIAL_SPAWN_INTERVAL;
    this.lastSpawnTime = 0;

    audioSystem.setBPM(120);
    audioSystem.startMusic();
  }

  private bindEvents(): void {
    window.addEventListener('keydown', (e) => {
      audioSystem.resume();
      
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.input.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.input.right = true;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (!this.player.isJumping && !this.gameState.isPaused && !this.gameState.isGameOver) {
          audioSystem.playJumpSound();
        }
        this.input.jump = true;
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (!this.gameState.isGameOver) {
          this.gameState.isPaused = !this.gameState.isPaused;
          if (this.gameState.isPaused) {
            audioSystem.stopMusic();
          } else {
            audioSystem.startMusic();
          }
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.input.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.input.right = false;
      }
      if (e.code === 'Space') {
        this.input.jump = false;
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.offsetX = rect.left;
      this.offsetY = rect.top;
      
      this.uiRenderer.updateHoverStates(
        e.clientX, e.clientY,
        this.scaleX, this.scaleY,
        this.offsetX, this.offsetY
      );
    });

    this.canvas.addEventListener('click', (e) => {
      audioSystem.resume();
      
      if (this.uiRenderer.isPauseButtonClicked(
        e.clientX, e.clientY,
        this.scaleX, this.scaleY,
        this.offsetX, this.offsetY
      )) {
        if (!this.gameState.isGameOver) {
          this.gameState.isPaused = !this.gameState.isPaused;
          if (this.gameState.isPaused) {
            audioSystem.stopMusic();
          } else {
            audioSystem.startMusic();
          }
        }
        return;
      }

      if (this.gameState.isPaused && !this.gameState.isGameOver) {
        if (this.uiRenderer.isResumeButtonClicked(
          e.clientX, e.clientY,
          this.scaleX, this.scaleY,
          this.offsetX, this.offsetY
        )) {
          this.gameState.isPaused = false;
          audioSystem.startMusic();
          return;
        }
        if (this.uiRenderer.isRestartButtonClicked(
          e.clientX, e.clientY,
          this.scaleX, this.scaleY,
          this.offsetX, this.offsetY
        )) {
          this.resetGame();
          return;
        }
      }

      if (this.gameState.isGameOver) {
        if (this.uiRenderer.isRestartButtonClicked(
          e.clientX, e.clientY,
          this.scaleX, this.scaleY,
          this.offsetX, this.offsetY
        )) {
          this.resetGame();
          return;
        }
      }
    });
  }

  private spawnObstacle(currentTime: number): void {
    if (currentTime - this.lastSpawnTime < this.currentSpawnInterval) return;

    this.lastSpawnTime = currentTime;
    
    const obstacle = createObstacle(this.gameState.gameSpeed);
    this.obstacles.push(obstacle);
    this.gameState.obstacleCount++;

    if (this.gameState.obstacleCount % 10 === 0) {
      const fragment = createDataFragment(
        obstacle.x + obstacle.width / 2,
        obstacle.y
      );
      this.fragments.push(fragment);
    }

    const minInterval = CONFIG.MIN_SPAWN_INTERVAL;
    const maxInterval = CONFIG.INITIAL_SPAWN_INTERVAL;
    const reduction = Math.floor(this.gameState.score / CONFIG.DIFFICULTY_INTERVAL) * 200;
    this.currentSpawnInterval = Math.max(minInterval, maxInterval - reduction);
  }

  private updateDifficulty(): void {
    const difficultyLevel = Math.floor(this.gameState.score / CONFIG.DIFFICULTY_INTERVAL);
    this.gameState.gameSpeed = Math.min(
      CONFIG.MAX_GAME_SPEED,
      CONFIG.INITIAL_GAME_SPEED + difficultyLevel * 0.5
    );

    this.gameState.alertLevel = Math.min(1, difficultyLevel / 5);

    const newBPM = 120 + difficultyLevel * 12;
    audioSystem.setBPM(newBPM);

    const currentLifeBonus = Math.floor(this.gameState.score / CONFIG.LIFE_BONUS_SCORE);
    if (currentLifeBonus > this.gameState.lastLifeBonus) {
      this.gameState.lastLifeBonus = currentLifeBonus;
      if (this.player.lives < CONFIG.MAX_LIVES) {
        this.player.lives++;
      }
    }
  }

  private update(deltaTime: number, currentTime: number): void {
    if (this.gameState.isPaused || this.gameState.isGameOver) return;

    updatePlayer(this.player, this.input, deltaTime);

    if (this.player.isJumping) {
      this.particleSystem.addTrailParticle(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height
      );
      this.particleSystem.addTrailParticle(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height
      );
    }

    this.spawnObstacle(currentTime);

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      updateObstacle(obs, deltaTime);
      obs.speed = this.gameState.gameSpeed;

      if (isObstacleOffScreen(obs)) {
        this.obstacles.splice(i, 1);
        continue;
      }

      if (!this.player.isInvincible && checkPlayerObstacleCollision(this.player, obs)) {
        hitPlayer(this.player);
        audioSystem.playHitSound();
        
        if (this.player.lives <= 0) {
          this.gameOver();
        }
      }
    }

    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const frag = this.fragments[i];
      updateDataFragment(frag, deltaTime, this.gameState.gameSpeed);

      if (isFragmentOffScreen(frag) || frag.collected) {
        this.fragments.splice(i, 1);
        continue;
      }

      if (checkPlayerFragmentCollision(this.player, frag)) {
        frag.collected = true;
        this.gameState.score += CONFIG.SCORE_PER_FRAGMENT;
        audioSystem.playCollectSound();
        this.particleSystem.addHaloParticles(frag.x, frag.y);
      }
    }

    this.particleSystem.update(deltaTime);
    this.backgroundRenderer.update(deltaTime, this.gameState.gameSpeed);
    this.updateDifficulty();

    if (this.gameState.displayScore < this.gameState.score) {
      const increment = Math.max(1, this.gameState.score * 0.05);
      this.gameState.displayScore = Math.min(
        this.gameState.score,
        this.gameState.displayScore + increment
      );
    }
  }

  private gameOver(): void {
    this.gameState.isGameOver = true;
    audioSystem.stopMusic();

    if (this.gameState.score > this.gameState.highScore) {
      this.gameState.highScore = this.gameState.score;
      localStorage.setItem('cyberDashHighScore', this.gameState.score.toString());
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = CONFIG;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.backgroundRenderer.draw(this.gameState.alertLevel);
    this.backgroundRenderer.drawSideColumns();

    this.obstacles.forEach(obs => this.obstacleRenderer.drawObstacle(obs));
    this.fragments.forEach(frag => this.obstacleRenderer.drawDataFragment(frag));

    this.playerRenderer.drawParticles(this.particleSystem.getParticles());
    this.playerRenderer.draw(this.player);

    this.uiRenderer.draw({
      gameState: this.gameState,
      player: this.player,
      fps: this.fps,
      mouseX: this.mouseX,
      mouseY: this.mouseY
    });
  }

  private gameLoop = (currentTime: number): void => {
    const deltaTime = this.lastTime ? currentTime - this.lastTime : 16.67;
    this.lastTime = currentTime;

    this.frameCount++;
    this.fpsTimer += deltaTime;
    if (this.fpsTimer >= 1000) {
      this.fps = this.frameCount * 1000 / this.fpsTimer;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.update(Math.min(deltaTime, 32), currentTime);
    this.render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  start(): void {
    this.lastTime = 0;
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  destroy(): void {
    cancelAnimationFrame(this.animationId);
    audioSystem.destroy();
  }
}

const game = new Game();
game.start();

window.addEventListener('beforeunload', () => {
  game.destroy();
});
