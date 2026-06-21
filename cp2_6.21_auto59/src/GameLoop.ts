import {
  generateSegment,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SEGMENT_HEIGHT,
  type Obstacle,
  type Coin,
  type Powerup,
  type Particle,
} from './TrackGenerator';

const CAR_WIDTH = 40;
const CAR_HEIGHT = 60;
const CAR_Y = CANVAS_HEIGHT - 120;
const CAR_SPEED = 350;
const BASE_SCROLL_SPEED = 200;
const BOOST_MULTIPLIER = 1.5;
const BOOST_DURATION = 3;
const COIN_SCORE = 10;
const DIFFICULTY_INTERVAL = 30;
const MAX_DIFFICULTY_TIME = 180;
const EXPLOSION_PARTICLE_COUNT = 6;
const EXPLOSION_DURATION = 0.3;
const EXPLOSION_SPEED = 250;

export interface GameState {
  carX: number;
  carY: number;
  score: number;
  timeElapsed: number;
  scrollSpeed: number;
  speedBoostRemaining: number;
  obstacles: Obstacle[];
  coins: Coin[];
  powerups: Powerup[];
  particles: Particle[];
  gameOver: boolean;
  difficultyLevel: number;
  explosionDone: boolean;
}

export class GameLoop {
  private carX: number = (CANVAS_WIDTH - CAR_WIDTH) / 2;
  private score: number = 0;
  private timeElapsed: number = 0;
  private speedBoostRemaining: number = 0;
  private obstacles: Obstacle[] = [];
  private coins: Coin[] = [];
  private powerups: Powerup[] = [];
  private particles: Particle[] = [];
  private gameOver: boolean = false;
  private explosionDone: boolean = false;
  private difficultyLevel: number = 0;
  private topEdge: number = 0;
  private keys: Set<string> = new Set();
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.initTrack();
  }

  private initTrack(): void {
    this.topEdge = -SEGMENT_HEIGHT * 2;
    for (let y = this.topEdge; y < CANVAS_HEIGHT + SEGMENT_HEIGHT; y += SEGMENT_HEIGHT) {
      const seg = generateSegment(y, 0);
      this.obstacles.push(...seg.obstacles);
      this.coins.push(...seg.coins);
      this.powerups.push(...seg.powerups);
    }
  }

  reset(): void {
    this.carX = (CANVAS_WIDTH - CAR_WIDTH) / 2;
    this.score = 0;
    this.timeElapsed = 0;
    this.speedBoostRemaining = 0;
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.particles = [];
    this.gameOver = false;
    this.explosionDone = false;
    this.difficultyLevel = 0;
    this.keys.clear();
    this.initTrack();
  }

  handleKeyDown(key: string): void {
    this.keys.add(key);
    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
      // valid game keys
    }
  }

  handleKeyUp(key: string): void {
    this.keys.delete(key);
  }

  private getEffectiveScrollSpeed(): number {
    const baseWithDifficulty = BASE_SCROLL_SPEED * Math.pow(1.10, this.difficultyLevel);
    return this.speedBoostRemaining > 0
      ? baseWithDifficulty * BOOST_MULTIPLIER
      : baseWithDifficulty;
  }

  update(dt: number): GameState {
    if (this.gameOver) {
      this.updateParticles(dt);
      if (this.particles.length === 0 && !this.explosionDone) {
        this.explosionDone = true;
      }
      return this.getState();
    }

    dt = Math.min(dt, 0.05);

    this.timeElapsed += dt;
    this.updateDifficulty();
    this.updateCarPosition(dt);
    this.scrollTrack(dt);
    this.generateNewSegments();
    this.checkCollisions();
    this.updateParticles(dt);
    this.updateBoost(dt);
    this.cleanupOffscreen();

    return this.getState();
  }

  private updateDifficulty(): void {
    const newLevel = Math.min(
      Math.floor(this.timeElapsed / DIFFICULTY_INTERVAL),
      Math.floor(MAX_DIFFICULTY_TIME / DIFFICULTY_INTERVAL)
    );
    this.difficultyLevel = newLevel;
  }

  private updateCarPosition(dt: number): void {
    const speed = CAR_SPEED * dt;
    if (this.keys.has('ArrowLeft')) {
      this.carX = Math.max(0, this.carX - speed);
    }
    if (this.keys.has('ArrowRight')) {
      this.carX = Math.min(CANVAS_WIDTH - CAR_WIDTH, this.carX + speed);
    }
  }

  private scrollTrack(dt: number): void {
    const scrollAmount = this.getEffectiveScrollSpeed() * dt;

    for (const obs of this.obstacles) obs.y += scrollAmount;
    for (const coin of this.coins) coin.y += scrollAmount;
    for (const pwr of this.powerups) pwr.y += scrollAmount;

    this.topEdge += scrollAmount;
  }

  private generateNewSegments(): void {
    while (this.topEdge > -SEGMENT_HEIGHT) {
      this.topEdge -= SEGMENT_HEIGHT;
      const seg = generateSegment(this.topEdge, this.difficultyLevel);
      this.obstacles.push(...seg.obstacles);
      this.coins.push(...seg.coins);
      this.powerups.push(...seg.powerups);
    }
  }

  private checkCollisions(): void {
    const carLeft = this.carX;
    const carRight = this.carX + CAR_WIDTH;
    const carTop = CAR_Y;
    const carBottom = CAR_Y + CAR_HEIGHT;

    for (const obs of this.obstacles) {
      let oLeft: number, oRight: number, oTop: number, oBottom: number;

      if (obs.type === 'barrel') {
        oLeft = obs.x - 15;
        oRight = obs.x + 15;
        oTop = obs.y - 15;
        oBottom = obs.y + 15;
      } else if (obs.type === 'barrier') {
        oLeft = obs.x - 10;
        oRight = obs.x + 10;
        oTop = obs.y - 15;
        oBottom = obs.y + 15;
      } else {
        oLeft = obs.x - 10;
        oRight = obs.x + 10;
        oTop = obs.y - 10;
        oBottom = obs.y + 10;
      }

      if (carLeft < oRight && carRight > oLeft && carTop < oBottom && carBottom > oTop) {
        this.triggerGameOver();
        return;
      }
    }

    for (const coin of this.coins) {
      if (coin.collected) continue;
      const cLeft = coin.x - 12;
      const cRight = coin.x + 12;
      const cTop = coin.y - 12;
      const cBottom = coin.y + 12;

      if (carLeft < cRight && carRight > cLeft && carTop < cBottom && carBottom > cTop) {
        coin.collected = true;
        this.score += COIN_SCORE;
        this.playCoinSound();
      }
    }

    for (const pwr of this.powerups) {
      if (pwr.collected) continue;
      const pLeft = pwr.x - 10;
      const pRight = pwr.x + 10;
      const pTop = pwr.y - 10;
      const pBottom = pwr.y + 10;

      if (carLeft < pRight && carRight > pLeft && carTop < pBottom && carBottom > pTop) {
        pwr.collected = true;
        this.speedBoostRemaining = BOOST_DURATION;
      }
    }
  }

  private triggerGameOver(): void {
    this.gameOver = true;
    this.explosionDone = false;
    this.createExplosion();
  }

  private createExplosion(): void {
    const cx = this.carX + CAR_WIDTH / 2;
    const cy = CAR_Y + CAR_HEIGHT / 2;

    for (let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 / EXPLOSION_PARTICLE_COUNT) * i + Math.random() * 0.5;
      const speed = EXPLOSION_SPEED * (0.6 + Math.random() * 0.8);
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: EXPLOSION_DURATION,
        maxLife: EXPLOSION_DURATION,
      });
    }
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    if (this.gameOver && this.particles.length === 0) {
      this.explosionDone = true;
    }
  }

  private updateBoost(dt: number): void {
    if (this.speedBoostRemaining > 0) {
      this.speedBoostRemaining = Math.max(0, this.speedBoostRemaining - dt);
    }
  }

  private cleanupOffscreen(): void {
    const buffer = 100;
    this.obstacles = this.obstacles.filter(o => o.y < CANVAS_HEIGHT + buffer);
    this.coins = this.coins.filter(c => c.y < CANVAS_HEIGHT + buffer);
    this.powerups = this.powerups.filter(p => p.y < CANVAS_HEIGHT + buffer);
  }

  private playCoinSound(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.1);
    } catch {
      // audio not available
    }
  }

  getState(): GameState {
    return {
      carX: this.carX,
      carY: CAR_Y,
      score: this.score,
      timeElapsed: this.timeElapsed,
      scrollSpeed: this.getEffectiveScrollSpeed(),
      speedBoostRemaining: this.speedBoostRemaining,
      obstacles: this.obstacles,
      coins: this.coins,
      powerups: this.powerups,
      particles: this.particles,
      gameOver: this.gameOver,
      difficultyLevel: this.difficultyLevel,
      explosionDone: this.explosionDone,
    };
  }

  getFinalScore(): number {
    return this.score;
  }
}
