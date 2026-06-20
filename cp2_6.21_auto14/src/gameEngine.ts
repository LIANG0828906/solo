import { playHit, playCountdown, playVictory } from './audioManager';

export type ShipType = 'fast' | 'balanced' | 'heavy';
export type ShipShape = 'triangle' | 'hexagon' | 'circle';
export type GamePhase = 'countdown' | 'playing' | 'victory';

export interface ShipConfig {
  type: ShipType;
  color: string;
  speed: number;
  maxHealth: number;
  shape: ShipShape;
}

export interface PlayerConfig {
  shipConfig: ShipConfig;
}

export interface GameConfig {
  player1: PlayerConfig;
  player2: PlayerConfig;
  canvasWidth: number;
  canvasHeight: number;
}

export interface GameState {
  phase: GamePhase;
  player1: {
    health: number;
    score: number;
    maxHealth: number;
  };
  player2: {
    health: number;
    score: number;
    maxHealth: number;
  };
  countdown: number;
  winner: 1 | 2 | null;
  winnerColor: string | null;
}

interface Ship {
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
  color: string;
  shape: ShipShape;
  speed: number;
  size: number;
  invincibleTime: number;
  shootCooldown: number;
  player: 1 | 2;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  player: 1 | 2;
  radius: number;
  trail: { x: number; y: number; alpha: number }[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  type: 'explosion' | 'celebration' | 'star';
  rotation?: number;
  rotationSpeed?: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
}

// 飞船配置：speed 单位为 像素/秒
// - 快速型：360px/s，约1.2秒穿越半屏（450px），机动性强但血量低
// - 均衡型：240px/s，约1.9秒穿越半屏，综合性能平衡
// - 重装型：150px/s，约3秒穿越半屏，移动缓慢但血量高
const SHIP_CONFIGS: Record<ShipType, Omit<ShipConfig, 'color'>> = {
  fast: { type: 'fast', speed: 360, maxHealth: 70, shape: 'triangle' },
  balanced: { type: 'balanced', speed: 240, maxHealth: 100, shape: 'hexagon' },
  heavy: { type: 'heavy', speed: 150, maxHealth: 150, shape: 'circle' },
};

// 子弹速度：420像素/秒
// 穿越整个战场（900px）约需2.1秒，穿越半屏约需1.1秒
// 比最快飞船（360px/s）快约17%，给予玩家一定的躲避空间但保持挑战性
const BULLET_SPEED = 420;
const BULLET_RADIUS = 2;

// 子弹发射频率：每秒3发，每发间隔约0.333秒
const FIRE_RATE = 3;

const INVINCIBLE_DURATION = 0.5;
const MAX_PARTICLES = 200;

// 空间哈希网格大小：20像素
// 将战场划分为网格单元，碰撞检测时只查询相邻网格，大幅减少检测次数
const GRID_SIZE = 20;

const VICTORY_DURATION = 2;

class SpatialHash {
  private cellSize: number;
  private grid: Map<string, { ship?: Ship; bullet?: Bullet }[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear(): void {
    this.grid.clear();
  }

  private getKey(x: number, y: number): string {
    const gx = Math.floor(x / this.cellSize);
    const gy = Math.floor(y / this.cellSize);
    return `${gx},${gy}`;
  }

  insertShip(ship: Ship): void {
    const key = this.getKey(ship.x, ship.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push({ ship });
  }

  insertBullet(bullet: Bullet): void {
    const key = this.getKey(bullet.x, bullet.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push({ bullet });
  }

  queryNearby(x: number, y: number, radius: number): { ship?: Ship; bullet?: Bullet }[] {
    const results: { ship?: Ship; bullet?: Bullet }[] = [];
    const minGX = Math.floor((x - radius) / this.cellSize);
    const maxGX = Math.floor((x + radius) / this.cellSize);
    const minGY = Math.floor((y - radius) / this.cellSize);
    const maxGY = Math.floor((y + radius) / this.cellSize);

    for (let gx = minGX; gx <= maxGX; gx++) {
      for (let gy = minGY; gy <= maxGY; gy++) {
        const key = `${gx},${gy}`;
        const cell = this.grid.get(key);
        if (cell) {
          results.push(...cell);
        }
      }
    }
    return results;
  }
}

class ParticlePool {
  private particles: Particle[] = [];
  private maxParticles: number;

  constructor(maxParticles: number) {
    this.maxParticles = maxParticles;
  }

  add(particle: Particle): void {
    if (this.particles.length < this.maxParticles) {
      this.particles.push(particle);
      return;
    }

    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].life <= 0) {
        this.particles[i] = particle;
        return;
      }
    }

    this.particles.shift();
    this.particles.push(particle);
  }

  getAll(): Particle[] {
    return this.particles;
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
        p.rotation += p.rotationSpeed * dt;
      }
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  clear(): void {
    this.particles = [];
  }

  getCount(): number {
    return this.particles.length;
  }
}

class GameEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: GameConfig | null = null;
  private gameState: GameState | null = null;
  private stateChangeCallback: ((state: GameState) => void) | null = null;

  private ship1: Ship | null = null;
  private ship2: Ship | null = null;
  private bullets: Bullet[] = [];
  private particlePool: ParticlePool;
  private spatialHash: SpatialHash;
  private stars: Star[] = [];

  private keys: Set<string> = new Set();
  private animationId: number | null = null;
  private lastTime: number = 0;
  private countdownTimer: number = 3;
  private victoryTimer: number = 0;
  private dividerColorPhase: number = 0;

  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private halfWidth: number = 0;

  constructor() {
    this.particlePool = new ParticlePool(MAX_PARTICLES);
    this.spatialHash = new SpatialHash(GRID_SIZE);
  }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.generateStars();
    this.setupInput();
  }

  private generateStars(): void {
    this.stars = [];
    const starCount = 150;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        size: 1 + Math.random(),
        alpha: 0.1 + Math.random() * 0.15,
      });
    }
  }

  private setupInput(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  startGame(config: GameConfig): void {
    this.config = config;
    this.canvasWidth = config.canvasWidth;
    this.canvasHeight = config.canvasHeight;
    this.halfWidth = this.canvasWidth / 2;

    if (this.canvas) {
      this.canvas.width = this.canvasWidth;
      this.canvas.height = this.canvasHeight;
    }

    if (this.stars.length === 0) {
      this.generateStars();
    }

    this.ship1 = this.createShip(1, config.player1.shipConfig);
    this.ship2 = this.createShip(2, config.player2.shipConfig);
    this.bullets = [];
    this.particlePool.clear();
    this.countdownTimer = 3;
    this.victoryTimer = 0;
    this.dividerColorPhase = 0;

    this.gameState = {
      phase: 'countdown',
      player1: {
        health: this.ship1.maxHealth,
        score: 0,
        maxHealth: this.ship1.maxHealth,
      },
      player2: {
        health: this.ship2.maxHealth,
        score: 0,
        maxHealth: this.ship2.maxHealth,
      },
      countdown: 3,
      winner: null,
      winnerColor: null,
    };

    this.notifyStateChange();
    this.lastTime = performance.now();
    this.loop();
  }

  stopGame(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  getGameState(): GameState | null {
    return this.gameState;
  }

  onStateChange(callback: (state: GameState) => void): void {
    this.stateChangeCallback = callback;
  }

  private notifyStateChange(): void {
    if (this.gameState && this.stateChangeCallback) {
      this.stateChangeCallback({ ...this.gameState });
    }
  }

  private createShip(player: 1 | 2, config: ShipConfig): Ship {
    const y = this.canvasHeight / 2;
    const x = player === 1
      ? this.canvasWidth * 0.2
      : this.canvasWidth * 0.8;

    return {
      x,
      y,
      vx: 0,
      vy: 0,
      health: config.maxHealth,
      maxHealth: config.maxHealth,
      color: config.color,
      shape: config.shape,
      speed: config.speed,
      size: 20,
      invincibleTime: 0,
      shootCooldown: 0,
      player,
    };
  }

  private loop = (): void => {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 1 / 30);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    if (!this.gameState || !this.ship1 || !this.ship2) return;

    this.dividerColorPhase += dt * 2;

    if (this.gameState.phase === 'countdown') {
      const prevCountdown = Math.ceil(this.countdownTimer);
      this.countdownTimer -= dt;
      const newCountdown = Math.ceil(this.countdownTimer);

      if (prevCountdown !== newCountdown && newCountdown > 0) {
        playCountdown();
      }

      this.gameState.countdown = Math.max(0, this.countdownTimer);

      if (this.countdownTimer <= 0) {
        this.gameState.phase = 'playing';
        this.notifyStateChange();
      }
      return;
    }

    if (this.gameState.phase === 'victory') {
      this.victoryTimer += dt;
      this.particlePool.update(dt);
      this.updateVictoryParticles();

      if (this.victoryTimer >= VICTORY_DURATION) {
        this.stopGame();
      }
      return;
    }

    this.updateShips(dt);
    this.updateBullets(dt);
    this.checkCollisions();
    this.particlePool.update(dt);

    if (this.ship1.health <= 0 || this.ship2.health <= 0) {
      this.endGame();
    }
  }

  private updateShips(dt: number): void {
    if (!this.ship1 || !this.ship2) return;

    this.updateShipMovement(this.ship1, 1, dt);
    this.updateShipMovement(this.ship2, 2, dt);

    this.updateShooting(this.ship1, dt);
    this.updateShooting(this.ship2, dt);

    if (this.ship1.invincibleTime > 0) {
      this.ship1.invincibleTime -= dt;
    }
    if (this.ship2.invincibleTime > 0) {
      this.ship2.invincibleTime -= dt;
    }
  }

  private updateShipMovement(ship: Ship, player: 1 | 2, dt: number): void {
    let dx = 0;
    let dy = 0;

    if (player === 1) {
      if (this.keys.has('KeyW')) dy -= 1;
      if (this.keys.has('KeyS')) dy += 1;
      if (this.keys.has('KeyA')) dx -= 1;
      if (this.keys.has('KeyD')) dx += 1;
    } else {
      if (this.keys.has('ArrowUp')) dy -= 1;
      if (this.keys.has('ArrowDown')) dy += 1;
      if (this.keys.has('ArrowLeft')) dx -= 1;
      if (this.keys.has('ArrowRight')) dx += 1;
    }

    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    const newX = ship.x + dx * ship.speed * dt;
    const newY = ship.y + dy * ship.speed * dt;

    const minX = player === 1 ? ship.size : this.halfWidth + ship.size;
    const maxX = player === 1 ? this.halfWidth - ship.size : this.canvasWidth - ship.size;

    ship.x = Math.max(minX, Math.min(maxX, newX));
    ship.y = Math.max(ship.size, Math.min(this.canvasHeight - ship.size, newY));
  }

  private updateShooting(ship: Ship, dt: number): void {
    ship.shootCooldown -= dt;

    if (ship.shootCooldown <= 0) {
      this.fireBullet(ship);
      ship.shootCooldown = 1 / FIRE_RATE;
    }
  }

  private fireBullet(ship: Ship): void {
    const direction = ship.player === 1 ? 1 : -1;
    const bullet: Bullet = {
      x: ship.x + direction * ship.size,
      y: ship.y,
      vx: BULLET_SPEED * direction,
      vy: 0,
      color: ship.player === 1 ? '#00f0ff' : '#ff007a',
      player: ship.player,
      radius: BULLET_RADIUS,
      trail: [],
    };
    this.bullets.push(bullet);
  }

  private updateBullets(dt: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      bullet.trail.unshift({ x: bullet.x, y: bullet.y, alpha: 0.6 });
      if (bullet.trail.length > 5) {
        bullet.trail.pop();
      }
      bullet.trail.forEach((t, idx) => {
        t.alpha = 0.6 * (1 - idx / 5);
      });

      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;

      if (bullet.x < -10 || bullet.x > this.canvasWidth + 10 ||
          bullet.y < -10 || bullet.y > this.canvasHeight + 10) {
        this.bullets.splice(i, 1);
      }
    }
  }

  private checkCollisions(): void {
    if (!this.ship1 || !this.ship2 || !this.gameState) return;

    this.spatialHash.clear();
    this.spatialHash.insertShip(this.ship1);
    this.spatialHash.insertShip(this.ship2);

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      const nearbyItems = this.spatialHash.queryNearby(bullet.x, bullet.y, bullet.radius + 5);

      for (const item of nearbyItems) {
        if (!item.ship) continue;

        const ship = item.ship;
        if (ship.player === bullet.player) continue;
        if (ship.invincibleTime > 0) continue;

        const dx = bullet.x - ship.x;
        const dy = bullet.y - ship.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ship.size + bullet.radius) {
          this.bullets.splice(i, 1);
          this.hitShip(ship, bullet);
          break;
        }
      }
    }
  }

  private hitShip(ship: Ship, bullet: Bullet): void {
    ship.health -= 10;
    ship.invincibleTime = INVINCIBLE_DURATION;

    if (ship.player === 1 && this.gameState) {
      this.gameState.player1.health = Math.max(0, ship.health);
      this.gameState.player2.score += 10;
    } else if (ship.player === 2 && this.gameState) {
      this.gameState.player2.health = Math.max(0, ship.health);
      this.gameState.player1.score += 10;
    }

    this.notifyStateChange();
    playHit();

    this.createExplosion(bullet.x, bullet.y, bullet.color);
  }

  private createExplosion(x: number, y: number, color: string): void {
    const fragmentCount = 6;
    for (let i = 0; i < fragmentCount; i++) {
      const angle = (Math.PI * 2 * i) / fragmentCount + Math.random() * 0.3;
      const speed = 100 + Math.random() * 50;
      this.particlePool.add({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 0.5,
        maxLife: 0.5,
        size: 3 + Math.random() * 2,
        type: 'explosion',
      });
    }
  }

  private endGame(): void {
    if (!this.gameState || !this.ship1 || !this.ship2) return;

    const winner: 1 | 2 = this.ship1.health <= 0 ? 2 : 1;
    const winnerShip = winner === 1 ? this.ship1 : this.ship2;
    this.gameState.phase = 'victory';
    this.gameState.winner = winner;
    this.gameState.winnerColor = winnerShip.color;
    this.victoryTimer = 0;

    this.notifyStateChange();
    playVictory();

    this.createVictoryEffect(winner);
  }

  private lerpColor(color1: string, color2: string, t: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    if (!c1 || !c2) return color1;

    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  private createVictoryEffect(winner: 1 | 2): void {
    const ship = winner === 1 ? this.ship1 : this.ship2;
    if (!ship) return;

    const winnerColor = ship.color;
    const goldColor = '#ffd700';

    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      const colorT = Math.random();
      const particleColor = Math.random() > 0.5 ? winnerColor : goldColor;
      this.particlePool.add({
        x: ship.x,
        y: ship.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: particleColor,
        life: 1.5,
        maxLife: 1.5,
        size: 4 + Math.random() * 4,
        type: 'celebration',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 5,
      });
    }
  }

  private updateVictoryParticles(): void {
    if (!this.ship1 || !this.ship2 || !this.gameState?.winner) return;

    const winner = this.gameState.winner;
    const ship = winner === 1 ? this.ship1 : this.ship2;
    const winnerColor = ship?.color || '#ffd700';
    const goldColor = '#ffd700';

    if (Math.random() < 0.3) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 100;
      const particleColor = Math.random() > 0.5 ? winnerColor : goldColor;
      this.particlePool.add({
        x: ship.x,
        y: ship.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: particleColor,
        life: 1.5,
        maxLife: 1.5,
        size: 4 + Math.random() * 4,
        type: 'celebration',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 5,
      });
    }
  }

  private render(): void {
    if (!this.ctx || !this.canvas || !this.gameState) return;

    const ctx = this.ctx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    ctx.clearRect(0, 0, w, h);

    this.renderBackground();
    this.renderStars();
    this.renderGrid();
    this.renderDivider();
    this.renderBullets();
    this.renderShips();
    this.renderParticles();
    this.renderVictoryOverlay();
  }

  private renderBackground(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2);
    gradient.addColorStop(0, '#1a0a2e');
    gradient.addColorStop(1, '#060612');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#0a0a2e';
    ctx.fillRect(0, 0, w, h);
  }

  private renderStars(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    this.stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.fill();
    });
  }

  private renderGrid(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const gridSize = 40;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = 0; y <= h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  private renderDivider(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const t = (Math.sin(this.dividerColorPhase) + 1) / 2;
    const r1 = 255, g1 = 0, b1 = 122;
    const r2 = 0, g2 = 240, b2 = 255;
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(this.halfWidth, 0);
    ctx.lineTo(this.halfWidth, this.canvasHeight);
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  private renderBullets(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    this.bullets.forEach(bullet => {
      bullet.trail.forEach((t) => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, bullet.radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${t.alpha * 0.5})`;
        ctx.fill();
      });

      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fillStyle = bullet.color;
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  private renderShips(): void {
    if (!this.ctx || !this.ship1 || !this.ship2) return;

    this.renderShip(this.ship1);
    this.renderShip(this.ship2);
  }

  private renderShip(ship: Ship): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const isFlickering = ship.invincibleTime > 0 && Math.floor(ship.invincibleTime * 10) % 2 === 0;
    if (isFlickering) {
      ctx.globalAlpha = 0.3;
    }

    ctx.save();
    ctx.translate(ship.x, ship.y);

    if (ship.player === 2) {
      ctx.scale(-1, 1);
    }

    ctx.fillStyle = ship.color;
    ctx.strokeStyle = ship.color;
    ctx.shadowColor = ship.color;
    ctx.shadowBlur = 15;
    ctx.lineWidth = 2;

    const size = ship.size;

    switch (ship.shape) {
      case 'triangle':
        this.drawTriangle(ctx, size);
        break;
      case 'hexagon':
        this.drawHexagon(ctx, size);
        break;
      case 'circle':
        this.drawCircleShip(ctx, size);
        break;
    }

    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private drawTriangle(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, -size * 0.7);
    ctx.lineTo(-size * 0.4, 0);
    ctx.lineTo(-size * 0.7, size * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(size * 0.2, 0, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawHexagon(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawCircleShip(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(-size * 0.2, 0, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size * 0.3, 0, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderParticles(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    this.particlePool.getAll().forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;

      if (particle.type === 'celebration') {
        this.drawStar(ctx, particle.x, particle.y, 5, particle.size, particle.size * 0.5, particle.rotation || 0);
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1;
    });
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number,
    rotation: number
  ): void {
    let rot = (Math.PI / 2) * 3 + rotation;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  private renderVictoryOverlay(): void {
    if (!this.ctx || !this.gameState || this.gameState.phase !== 'victory') return;

    const ctx = this.ctx;
    const winnerColor = this.gameState.winnerColor || (this.gameState.winner === 1 ? '#00f0ff' : '#ff007a');
    const progress = Math.min(1, this.victoryTimer / VICTORY_DURATION);
    const goldColor = '#ffd700';

    const bgGradient = ctx.createRadialGradient(
      this.canvasWidth / 2, this.canvasHeight / 2, 0,
      this.canvasWidth / 2, this.canvasHeight / 2, Math.max(this.canvasWidth, this.canvasHeight) / 2
    );
    const outerColor = this.lerpColor('#060612', winnerColor, progress * 0.3);
    const innerColor = this.lerpColor('#1a0a2e', winnerColor, progress * 0.5);
    bgGradient.addColorStop(0, innerColor);
    bgGradient.addColorStop(1, outerColor);

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    const glowGradient = ctx.createRadialGradient(
      this.canvasWidth / 2, this.canvasHeight / 2, 0,
      this.canvasWidth / 2, this.canvasHeight / 2, this.canvasWidth / 2.5
    );
    glowGradient.addColorStop(0, `${winnerColor}${Math.floor(progress * 0.3 * 255).toString(16).padStart(2, '0')}`);
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    if (this.gameState.winner && (this.ship1 || this.ship2)) {
      const ship = this.gameState.winner === 1 ? this.ship1 : this.ship2;
      if (ship) {
        const scale = 1 + this.victoryTimer * 0.5;
        const rotation = this.victoryTimer * 2;

        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.scale(scale, scale);
        ctx.rotate(rotation);
        ctx.globalAlpha = 0.8;

        ctx.beginPath();
        ctx.arc(0, 0, ship.size * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = goldColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = goldColor;
        ctx.shadowBlur = 20;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, ship.size * 2, 0, Math.PI * 2);
        ctx.strokeStyle = winnerColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = winnerColor;
        ctx.globalAlpha = 0.5 * progress;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }
  }

  destroy(): void {
    this.stopGame();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}

const gameEngine = new GameEngine();

export function startGame(config: GameConfig): void {
  gameEngine.startGame(config);
}

export function stopGame(): void {
  gameEngine.stopGame();
}

export function getGameState(): GameState | null {
  return gameEngine.getGameState();
}

export function onStateChange(callback: (state: GameState) => void): void {
  gameEngine.onStateChange(callback);
}

export function initEngine(canvas: HTMLCanvasElement): void {
  gameEngine.init(canvas);
}

export function destroyEngine(): void {
  gameEngine.destroy();
}

export { SHIP_CONFIGS };
