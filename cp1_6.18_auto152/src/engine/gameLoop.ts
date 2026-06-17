import type {
  ShipState,
  GameState,
  InputState,
  Particle,
  Obstacle,
  MusicNote
} from '../types/gameTypes';
import { AudioEngine } from './audioEngine';
import { TrackGenerator } from './trackGenerator';

export class GameLoop {
  private canvas: HTMLCanvasElement;
  private audioEngine: AudioEngine;
  private trackGenerator: TrackGenerator;

  private ship: ShipState;
  private gameState: GameState;
  private input: InputState;
  private particles: Particle[] = [];

  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private running: boolean = false;

  private readonly jumpHeight = 60;
  private readonly gravity = 800;
  private readonly horizontalSpeed = 150;
  private readonly shipWidth = 20;
  private readonly maxParticles = 50;
  private readonly levelDuration = 30;

  private onScoreUpdate: ((state: GameState) => void) | null = null;
  private onGameOver: ((state: GameState) => void) | null = null;
  private onLevelUp: ((level: number) => void) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    audioEngine: AudioEngine,
    trackGenerator: TrackGenerator
  ) {
    this.canvas = canvas;

    this.audioEngine = audioEngine;
    this.trackGenerator = trackGenerator;

    this.ship = this.createInitialShip();
    this.gameState = this.createInitialState();
    this.input = { left: false, right: false, jump: false };

    this.loadHighScore();
    this.setupInputHandlers();
  }

  private createInitialShip(): ShipState {
    const baseY = this.canvas.height * 0.6;
    return {
      x: this.canvas.width * 0.2,
      y: baseY,
      baseY,
      velocityY: 0,
      isJumping: false,
      jumpStartTime: 0,
      trail: []
    };
  }

  private createInitialState(): GameState {
    return {
      score: 0,
      combo: 0,
      maxCombo: 0,
      highScore: 0,
      bpm: 120,
      baseBpm: 120,
      scrollSpeed: 200,
      level: 1,
      elapsedTime: 0,
      musicProgress: 0,
      isPlaying: false,
      isGameOver: false,
      isPaused: false,
      gamePhase: 'menu'
    };
  }

  private loadHighScore(): void {
    try {
      const saved = localStorage.getItem('sonicRacerHighScore');
      if (saved) {
        this.gameState.highScore = parseInt(saved, 10) || 0;
      }
    } catch (e) {
      console.warn('Failed to load high score:', e);
    }
  }

  private saveHighScore(): void {
    try {
      if (this.gameState.score > this.gameState.highScore) {
        this.gameState.highScore = this.gameState.score;
        localStorage.setItem('sonicRacerHighScore', this.gameState.highScore.toString());
      }
    } catch (e) {
      console.warn('Failed to save high score:', e);
    }
  }

  private setupInputHandlers(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('touchstart', this.handleTouchStart);
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
  }

  public removeInputHandlers(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.gameState.gamePhase !== 'playing') return;

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.input.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.input.right = true;
        break;
      case 'Space':
        this.input.jump = true;
        this.tryJump();
        e.preventDefault();
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.input.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.input.right = false;
        break;
      case 'Space':
        this.input.jump = false;
        break;
    }
  };

  private handleMouseDown = (e: MouseEvent): void => {
    if (this.gameState.gamePhase !== 'playing') return;
    this.input.jump = true;
    this.tryJump();
    e.preventDefault();
  };

  private handleMouseUp = (): void => {
    this.input.jump = false;
  };

  private handleTouchStart = (e: TouchEvent): void => {
    if (this.gameState.gamePhase !== 'playing') return;
    this.input.jump = true;
    this.tryJump();
    e.preventDefault();
  };

  private handleTouchEnd = (): void => {
    this.input.jump = false;
  };

  public startGame(): void {
    this.ship = this.createInitialShip();
    this.gameState = {
      ...this.createInitialState(),
      highScore: this.gameState.highScore,
      isPlaying: true,
      gamePhase: 'playing'
    };
    this.particles = [];
    this.trackGenerator.reset();
    this.audioEngine.play();
    this.running = true;
    this.lastFrameTime = performance.now();
    this.loop();
  }

  public stopGame(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.audioEngine.stop();
  }

  public pauseGame(): void {
    this.gameState.isPaused = true;
    this.audioEngine.pause();
  }

  public resumeGame(): void {
    this.gameState.isPaused = false;
    this.audioEngine.play();
    this.lastFrameTime = performance.now();
  }

  private tryJump(): void {
    if (!this.ship.isJumping && !this.gameState.isGameOver && this.gameState.isPlaying) {
      this.ship.isJumping = true;
      this.ship.jumpStartTime = performance.now();
      this.ship.velocityY = -Math.sqrt(2 * this.gravity * this.jumpHeight);
    }
  }

  private loop = (): void => {
    if (!this.running) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = currentTime;

    if (!this.gameState.isPaused && !this.gameState.isGameOver) {
      this.update(deltaTime);
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number): void {
    this.gameState.elapsedTime += deltaTime;

    const audioDuration = this.audioEngine.getDuration();
    this.gameState.musicProgress = Math.min(1, this.audioEngine.getCurrentTime() / audioDuration);

    const analysis = this.audioEngine.analyze();

    this.checkLevelUp();

    this.gameState.scrollSpeed = 200 * (this.gameState.bpm / 120);

    this.trackGenerator.update(deltaTime, this.gameState.scrollSpeed, analysis, this.gameState.bpm);

    this.updateShip(deltaTime);

    this.checkCollisions();

    this.updateParticles(deltaTime);
  }

  private checkLevelUp(): void {
    const currentLevel = Math.floor(this.gameState.elapsedTime / this.levelDuration) + 1;
    if (currentLevel > this.gameState.level) {
      this.gameState.level = currentLevel;
      this.gameState.bpm = Math.min(200, this.gameState.baseBpm + (currentLevel - 1) * 10);
      this.trackGenerator.increaseDifficulty(currentLevel);
      this.audioEngine.updateBpm(this.gameState.bpm);

      if (this.onLevelUp) {
        this.onLevelUp(currentLevel);
      }
    }
  }

  private updateShip(deltaTime: number): void {
    const minX = this.shipWidth / 2 + 10;
    const maxX = this.canvas.width - this.shipWidth / 2 - 10;

    if (this.input.left) {
      this.ship.x -= this.horizontalSpeed * deltaTime;
    }
    if (this.input.right) {
      this.ship.x += this.horizontalSpeed * deltaTime;
    }

    this.ship.x = Math.max(minX, Math.min(maxX, this.ship.x));

    if (this.ship.isJumping) {
      this.ship.velocityY += this.gravity * deltaTime;
      this.ship.y += this.ship.velocityY * deltaTime;

      const trackY = this.trackGenerator.getTrackYAt(this.ship.x);
      if (this.ship.y >= trackY) {
        this.ship.y = trackY;
        this.ship.velocityY = 0;
        this.ship.isJumping = false;
      }
    } else {
      this.ship.y = this.trackGenerator.getTrackYAt(this.ship.x);
    }

    this.ship.baseY = this.trackGenerator.getBaseY();

    this.updateTrail();
  }

  private updateTrail(): void {
    this.ship.trail.unshift({
      x: this.ship.x - 10,
      y: this.ship.y + 5,
      alpha: 0.6,
      size: 8
    });

    for (let i = 0; i < this.ship.trail.length; i++) {
      this.ship.trail[i].alpha = 0.6 - i * (0.6 / 8);
      this.ship.trail[i].size = 8 - i * (6 / 8);
    }

    while (this.ship.trail.length > 8) {
      this.ship.trail.pop();
    }
  }

  private checkCollisions(): void {
    const obstacles = this.trackGenerator.getObstacles();
    for (const obstacle of obstacles) {
      if (this.checkShipObstacleCollision(obstacle)) {
        this.triggerGameOver();
        return;
      }
    }

    const notes = this.trackGenerator.getNotes();
    for (const note of notes) {
      if (note.active && !note.collected && this.checkShipNoteCollision(note)) {
        this.collectNote(note);
      }
    }
  }

  private checkShipObstacleCollision(obstacle: Obstacle): boolean {
    const dx = this.ship.x - obstacle.x;
    const dy = this.ship.y - obstacle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (this.shipWidth / 2 + obstacle.size * 0.7);
  }

  private checkShipNoteCollision(note: MusicNote): boolean {
    const dx = this.ship.x - note.x;
    const dy = this.ship.y - note.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (this.shipWidth / 2 + note.size);
  }

  private collectNote(note: MusicNote): void {
    this.trackGenerator.collectNote(note);
    this.audioEngine.playCollectSfx();

    this.gameState.combo++;
    if (this.gameState.combo > this.gameState.maxCombo) {
      this.gameState.maxCombo = this.gameState.combo;
    }

    let points = 100;
    if (this.gameState.combo > 0 && this.gameState.combo % 5 === 0) {
      points += 100;
    }
    this.gameState.score += points;

    this.spawnCollectParticles(note.x, note.y);

    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.gameState);
    }
  }

  private spawnCollectParticles(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = (Math.PI * 2 * i) / 8;
      const speed = 50 + Math.random() * 50;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5,
        maxLife: 0.5,
        color: '#00FF88',
        size: 3 + Math.random() * 3
      });
    }
  }

  private updateParticles(deltaTime: number): void {
    for (const particle of this.particles) {
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.life -= deltaTime;
    }

    this.particles = this.particles.filter(p => p.life > 0);
  }

  private triggerGameOver(): void {
    this.gameState.isGameOver = true;
    this.gameState.isPlaying = false;
    this.gameState.gamePhase = 'gameover';
    this.gameState.combo = 0;

    this.saveHighScore();
    this.audioEngine.stop();

    if (this.onGameOver) {
      this.onGameOver(this.gameState);
    }
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public getShip(): ShipState {
    return this.ship;
  }

  public getParticles(): Particle[] {
    return this.particles;
  }

  public setOnScoreUpdate(callback: (state: GameState) => void): void {
    this.onScoreUpdate = callback;
  }

  public setOnGameOver(callback: (state: GameState) => void): void {
    this.onGameOver = callback;
  }

  public setOnLevelUp(callback: (level: number) => void): void {
    this.onLevelUp = callback;
  }

  public resetCombo(): void {
    this.gameState.combo = 0;
  }
}
