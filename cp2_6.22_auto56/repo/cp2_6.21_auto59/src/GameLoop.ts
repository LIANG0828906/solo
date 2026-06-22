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
const BASE_SCROLL_SPEED = 200;
const BOOST_MULTIPLIER = 1.5;
const BOOST_DURATION = 3;
const COIN_SCORE = 10;
const DIFFICULTY_INTERVAL = 30;
const MAX_DIFFICULTY_TIME = 180;
const EXPLOSION_PARTICLE_COUNT = 6;
const EXPLOSION_DURATION = 0.3;
const EXPLOSION_SPEED = 250;
const SOUND_MIN_INTERVAL = 0.1;
const BASE_CAR_SPEED = 350;

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
  private baseCarSpeed: number = BASE_CAR_SPEED;
  private currentCarSpeed: number = BASE_CAR_SPEED;
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
  private lastSoundTime: number = -Infinity;

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
    this.baseCarSpeed = BASE_CAR_SPEED;
    this.currentCarSpeed = BASE_CAR_SPEED;
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.particles = [];
    this.gameOver = false;
    this.explosionDone = false;
    this.difficultyLevel = 0;
    this.keys.clear();
    this.lastSoundTime = -Infinity;
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
    const speed = this.currentCarSpeed * dt;
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
      let hit = false;

      if (obs.type === 'barrel') {
        hit = this.checkCircleRect(obs.x, obs.y, 15, carLeft, carTop, carRight, carBottom);
      } else if (obs.type === 'barrier') {
        const oLeft = obs.x - 10;
        const oRight = obs.x + 10;
        const oTop = obs.y - 15;
        const oBottom = obs.y + 15;
        hit = carLeft < oRight && carRight > oLeft && carTop < oBottom && carBottom > oTop;
      } else {
        const tx = obs.x;
        const ty = obs.y;
        const tri: [number, number][] = [
          [tx, ty - 10],
          [tx + 10, ty + 10],
          [tx - 10, ty + 10],
        ];
        hit = this.checkTriangleRect(tri, carLeft, carTop, carRight, carBottom);
      }

      if (hit) {
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

  private checkCircleRect(
    cx: number, cy: number, r: number,
    rx: number, ry: number, rw: number, rh: number
  ): boolean {
    const nearestX = Math.max(rx, Math.min(cx, rw));
    const nearestY = Math.max(ry, Math.min(cy, rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < r * r;
  }

  private pointInTriangle(
    px: number, py: number,
    [x1, y1]: [number, number],
    [x2, y2]: [number, number],
    [x3, y3]: [number, number]
  ): boolean {
    const d1 = this.sign(px, py, x1, y1, x2, y2);
    const d2 = this.sign(px, py, x2, y2, x3, y3);
    const d3 = this.sign(px, py, x3, y3, x1, y1);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);
  }

  private sign(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
  }

  private segIntersect(
    a1: [number, number], a2: [number, number],
    b1: [number, number], b2: [number, number]
  ): boolean {
    const [ax1, ay1] = a1;
    const [ax2, ay2] = a2;
    const [bx1, by1] = b1;
    const [bx2, by2] = b2;
    const d1x = ax2 - ax1;
    const d1y = ay2 - ay1;
    const d2x = bx2 - bx1;
    const d2y = by2 - by1;
    const denom = d1x * d2y - d1y * d2x;
    if (Math.abs(denom) < 1e-10) return false;
    const s = ((ax1 - bx1) * (-d2y) - (ay1 - by1) * (-d2x)) / denom;
    const t = ((ax1 - bx1) * d1y - (ay1 - by1) * d1x) / -denom;
    return s >= 0 && s <= 1 && t >= 0 && t <= 1;
  }

  private checkTriangleRect(
    tri: [number, number][],
    rx: number, ry: number, rw: number, rh: number
  ): boolean {
    const carPts: [number, number][] = [
      [rx, ry], [rw, ry], [rw, rh], [rx, rh],
    ];
    for (const p of carPts) {
      if (this.pointInTriangle(p[0], p[1], tri[0], tri[1], tri[2])) return true;
    }
    for (const p of tri) {
      if (p[0] >= rx && p[0] <= rw && p[1] >= ry && p[1] <= rh) return true;
    }
    const triEdges: [number, number][] = [
      [tri[0][0], tri[0][1]], [tri[1][0], tri[1][1]], [tri[2][0], tri[2][1]],
    ];
    const rectEdges: [number, number][] = [
      [rx, ry], [rw, ry], [rw, rh], [rx, rh],
    ];
    for (let i = 0; i < 3; i++) {
      const a1 = triEdges[i];
      const a2 = triEdges[(i + 1) % 3];
      for (let j = 0; j < 4; j++) {
        const b1 = rectEdges[j];
        const b2 = rectEdges[(j + 1) % 4];
        if (this.segIntersect(a1, a2, b1, b2)) return true;
      }
    }
    return false;
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
      if (this.speedBoostRemaining > 0) {
        this.currentCarSpeed = this.baseCarSpeed * BOOST_MULTIPLIER;
      } else {
        this.currentCarSpeed = this.baseCarSpeed;
      }
    } else {
      this.currentCarSpeed = this.baseCarSpeed;
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
      if (this.timeElapsed - this.lastSoundTime < SOUND_MIN_INTERVAL) {
        return;
      }
      this.lastSoundTime = this.timeElapsed;
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
