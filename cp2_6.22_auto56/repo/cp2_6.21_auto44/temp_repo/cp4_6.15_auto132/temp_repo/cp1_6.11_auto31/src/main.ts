import { Player } from './player';
import { Asteroid } from './asteroid';
import { Crystal, Particle } from './crystal';

type GameState = 'start' | 'playing' | 'gameover';

interface Star {
  x: number;
  y: number;
  size: number;
  baseBrightness: number;
  phase: number;
  speed: number;
}

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;

  private gameState: GameState = 'start';
  private player: Player | null = null;
  private asteroids: Asteroid[] = [];
  private crystals: Crystal[] = [];
  private particles: Particle[] = [];
  private stars: Star[] = [];

  private score: number = 0;
  private displayScore: number = 0;
  private highScore: number = 0;
  private gameTime: number = 0;
  private dodgedCount: number = 0;

  private lastCrystalSpawn: number = 0;
  private crystalSpawnInterval: number = 2500;
  private lastAsteroidSpawn: number = 0;
  private asteroidSpawnInterval: number = 1500;

  private maxAsteroids: number = 12;
  private minAsteroids: number = 3;

  private lastTime: number = 0;
  private animationId: number = 0;

  private audioContext: AudioContext | null = null;

  private scoreValueEl: HTMLElement;
  private timeValueEl: HTMLElement;
  private asteroidValueEl: HTMLElement;
  private startScreen: HTMLElement;
  private gameOverScreen: HTMLElement;
  private finalScoreEl: HTMLElement;
  private highScoreEl: HTMLElement;
  private dodgedCountEl: HTMLElement;
  private screenFlash: HTMLElement;
  private scoreDisplay: HTMLElement;
  private timeDisplay: HTMLElement;
  private asteroidCount: HTMLElement;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;

    this.scoreValueEl = document.getElementById('score-value')!;
    this.timeValueEl = document.getElementById('time-value')!;
    this.asteroidValueEl = document.getElementById('asteroid-value')!;
    this.startScreen = document.getElementById('start-screen')!;
    this.gameOverScreen = document.getElementById('game-over-screen')!;
    this.finalScoreEl = document.getElementById('final-score')!;
    this.highScoreEl = document.getElementById('high-score')!;
    this.dodgedCountEl = document.getElementById('dodged-count')!;
    this.screenFlash = document.getElementById('screen-flash')!;
    this.scoreDisplay = document.getElementById('score-display')!;
    this.timeDisplay = document.getElementById('time-display')!;
    this.asteroidCount = document.getElementById('asteroid-count')!;

    const savedHighScore = localStorage.getItem('spaceDodgeHighScore');
    if (savedHighScore) {
      this.highScore = parseInt(savedHighScore, 10);
    }

    this.initCanvas();
    this.initStars();
    this.bindEvents();
    this.gameLoop(0);
  }

  private initCanvas(): void {
    const container = document.getElementById('game-container')!;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  private initStars(): void {
    this.stars = [];
    for (let i = 0; i < 220; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 1 + Math.random() * 2,
        baseBrightness: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5
      });
    }
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });

    document.getElementById('start-button')!.addEventListener('click', () => this.startGame());
    document.getElementById('restart-button')!.addEventListener('click', () => this.startGame());

    window.addEventListener('resize', () => this.handleResize());
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.gameState !== 'playing' || !this.player) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    this.player.setTarget(x, y);
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (this.gameState !== 'playing' || !this.player) return;
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    this.player.setTarget(x, y);
  }

  private handleResize(): void {
    const container = document.getElementById('game-container')!;
    const oldWidth = this.width;
    const oldHeight = this.height;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const ratioX = this.width / oldWidth;
    const ratioY = this.height / oldHeight;

    for (const star of this.stars) {
      star.x *= ratioX;
      star.y *= ratioY;
    }

    if (this.player) {
      this.player.resize(this.width, this.height);
    }
    for (const asteroid of this.asteroids) {
      asteroid.resize(this.width, this.height);
    }
    for (const crystal of this.crystals) {
      crystal.resize(this.width, this.height);
    }
  }

  private startGame(): void {
    this.gameState = 'playing';
    this.score = 0;
    this.displayScore = 0;
    this.gameTime = 0;
    this.dodgedCount = 0;
    this.asteroids = [];
    this.crystals = [];
    this.particles = [];
    this.lastCrystalSpawn = 0;
    this.lastAsteroidSpawn = 0;
    this.lastTime = performance.now();

    this.player = new Player(this.width, this.height);

    this.startScreen.classList.remove('visible');
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.remove('visible');
    this.gameOverScreen.classList.add('hidden');

    this.scoreDisplay.classList.add('visible');
    this.timeDisplay.classList.add('visible');
    this.asteroidCount.classList.add('visible');

    this.updateUI();
  }

  private gameOver(): void {
    this.gameState = 'gameover';

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('spaceDodgeHighScore', this.highScore.toString());
    }

    this.finalScoreEl.textContent = Math.floor(this.score).toString();
    this.highScoreEl.textContent = Math.floor(this.highScore).toString();
    this.dodgedCountEl.textContent = this.dodgedCount.toString();

    this.scoreDisplay.classList.remove('visible');
    this.timeDisplay.classList.remove('visible');
    this.asteroidCount.classList.remove('visible');

    this.gameOverScreen.classList.remove('hidden');
    setTimeout(() => {
      this.gameOverScreen.classList.add('visible');
    }, 50);
  }

  private spawnAsteroid(): void {
    const targetCount = this.getCurrentMaxAsteroids();
    if (this.asteroids.length < targetCount) {
      this.asteroids.push(new Asteroid(this.width, this.height));
    }
  }

  private getCurrentMaxAsteroids(): number {
    const progress = Math.min(this.gameTime / 60, 1);
    return Math.floor(this.minAsteroids + (this.maxAsteroids - this.minAsteroids) * progress);
  }

  private spawnCrystal(): void {
    this.crystals.push(new Crystal(this.width, this.height));
    this.crystalSpawnInterval = 2000 + Math.random() * 1000;
  }

  private createParticles(x: number, y: number, color: string): void {
    for (let i = 0; i < 30; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  private playCollectSound(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }

  private flashScreen(): void {
    this.screenFlash.classList.add('active');
    setTimeout(() => {
      this.screenFlash.classList.remove('active');
    }, 200);
  }

  private updateUI(): void {
    this.scoreValueEl.textContent = Math.floor(this.displayScore).toString();
    this.timeValueEl.textContent = Math.floor(this.gameTime).toString();
    this.asteroidValueEl.textContent = this.asteroids.length.toString();
  }

  private checkCollisions(): void {
    if (!this.player) return;

    for (const asteroid of this.asteroids) {
      if (!asteroid.active) continue;
      if (this.player.collidesWith(asteroid.x, asteroid.y, asteroid.getCollisionRadius())) {
        this.gameOver();
        return;
      }
    }

    for (let i = this.crystals.length - 1; i >= 0; i--) {
      const crystal = this.crystals[i];
      if (!crystal.active) continue;
      
      if (this.player.collidesWith(crystal.x, crystal.y, crystal.getCollisionRadius())) {
        const points = crystal.getScore();
        this.score += points;
        this.createParticles(crystal.x, crystal.y, crystal.getColorHex());
        this.playCollectSound();
        this.flashScreen();
        crystal.active = false;
        this.crystals.splice(i, 1);
      }
    }
  }

  private update(deltaTime: number): void {
    if (this.gameState !== 'playing') {
      this.updateStars(deltaTime);
      return;
    }

    this.gameTime += deltaTime / 1000;

    if (this.displayScore < this.score) {
      const diff = this.score - this.displayScore;
      this.displayScore += diff * deltaTime / 300;
      if (this.displayScore > this.score) {
        this.displayScore = this.score;
      }
    }

    this.updateStars(deltaTime);

    if (this.player) {
      this.player.update();
    }

    this.lastAsteroidSpawn += deltaTime;
    const spawnInterval = Math.max(400, 1500 - this.gameTime * 15);
    if (this.lastAsteroidSpawn > spawnInterval) {
      this.spawnAsteroid();
      this.lastAsteroidSpawn = 0;
    }

    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const asteroid = this.asteroids[i];
      asteroid.update();
      if (!asteroid.active) {
        if (asteroid.dodged) {
          this.dodgedCount++;
        }
        this.asteroids.splice(i, 1);
      }
    }

    this.lastCrystalSpawn += deltaTime;
    if (this.lastCrystalSpawn > this.crystalSpawnInterval) {
      this.spawnCrystal();
      this.lastCrystalSpawn = 0;
    }

    for (const crystal of this.crystals) {
      crystal.update();
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const alive = this.particles[i].update(deltaTime / 1000);
      if (!alive) {
        this.particles.splice(i, 1);
      }
    }

    this.checkCollisions();
    this.updateUI();
  }

  private updateStars(deltaTime: number): void {
    for (const star of this.stars) {
      star.phase += deltaTime / 1000 * star.speed;
      star.x -= star.speed * 0.3;
      if (star.x < 0) {
        star.x = this.width;
        star.y = Math.random() * this.height;
      }
    }
  }

  private draw(): void {
    this.ctx.fillStyle = '#0a0a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawStars();

    if (this.gameState === 'start') {
      return;
    }

    for (const crystal of this.crystals) {
      crystal.draw(this.ctx);
    }

    for (const asteroid of this.asteroids) {
      asteroid.draw(this.ctx);
    }

    for (const particle of this.particles) {
      particle.draw(this.ctx);
    }

    if (this.player) {
      this.player.draw(this.ctx);
    }
  }

  private drawStars(): void {
    for (const star of this.stars) {
      const brightness = star.baseBrightness * (0.5 + 0.5 * Math.sin(star.phase));
      this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private gameLoop = (timestamp: number): void => {
    const deltaTime = Math.min(timestamp - this.lastTime, 50);
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.draw();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
