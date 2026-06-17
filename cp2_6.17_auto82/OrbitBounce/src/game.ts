import { Star } from './star';
import { Asteroid, AsteroidPool } from './asteroid';
import { BlackHole } from './blackhole';
import { UI } from './ui';

interface Pulse {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  duration: number;
  elapsed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
}

interface BackgroundStar {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ui: UI;
  private star!: Star;
  private asteroidPool!: AsteroidPool;
  private blackHoles: BlackHole[] = [];
  private pulses: Pulse[] = [];
  private particles: Particle[] = [];
  private bgStars: BackgroundStar[] = [];

  private score: number = 0;
  private lives: number = 3;
  private gameTime: number = 0;
  private blackholeTimer: number = 0;
  private blackholeInterval: number = 8;

  private running: boolean = false;
  private lastTimestamp: number = 0;
  private animFrameId: number = 0;

  private minOrbit: number = 80;
  private maxOrbit: number = 350;
  private initialAsteroidCount: number = 12;

  constructor() {
    const container = document.getElementById('game-container')!;
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.ui = new UI(container);

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('click', (e) => this.onClick(e));

    this.initBgStars();
    this.startGame();
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const minDim = Math.min(window.innerWidth, window.innerHeight);

    this.minOrbit = minDim * 0.1;
    this.maxOrbit = minDim * 0.4;

    if (this.star) {
      this.star.x = cx;
      this.star.y = cy;
    }
  }

  private initBgStars(): void {
    this.bgStars = [];
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < 200; i++) {
      this.bgStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 0.5 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  private startGame(): void {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    this.star = new Star(cx, cy);
    this.asteroidPool = new AsteroidPool();
    this.asteroidPool.init(cx, cy, this.minOrbit, this.maxOrbit);

    const count = this.initialAsteroidCount + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      this.asteroidPool.spawn(cx, cy, this.minOrbit, this.maxOrbit);
    }

    this.blackHoles = [];
    this.pulses = [];
    this.particles = [];
    this.score = 0;
    this.lives = 3;
    this.gameTime = 0;
    this.blackholeTimer = 0;
    this.running = true;

    this.ui.updateScore(0);
    this.ui.updateLives(3);
    this.ui.updateTime(0);
    this.ui.hideGameOver();

    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  private onClick(e: MouseEvent): void {
    if (!this.running) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.pulses.push({
      x,
      y,
      radius: 0,
      maxRadius: 200,
      duration: 0.8,
      elapsed: 0
    });

    this.asteroidPool.forEachActive(asteroid => {
      asteroid.applyPulse(x, y);
    });
  }

  private loop = (timestamp: number): void => {
    if (!this.running) return;

    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;

    this.update(dt);
    this.draw();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    this.gameTime += dt;
    this.ui.updateTime(this.gameTime);

    this.star.update(dt);

    const pulseList = this.pulses.length > 0 ? this.pulses : undefined;
    this.asteroidPool.forEachActive(asteroid => {
      asteroid.update(dt, this.star.x, this.star.y, pulseList);

      if (this.star.isColliding(asteroid.x, asteroid.y, asteroid.radius)) {
        this.score += 10;
        this.ui.updateScore(this.score);
        this.ui.flashScore();
        this.spawnExplosion(this.star.x, this.star.y);
        this.asteroidPool.deactivate(asteroid);
        return;
      }

      for (const bh of this.blackHoles) {
        if (bh.alive && bh.isConsuming(asteroid.x, asteroid.y)) {
          this.asteroidPool.deactivate(asteroid);
          this.lives--;
          this.ui.updateLives(this.lives);
          break;
        }
      }
    });

    this.blackholeTimer += dt;
    if (this.blackholeTimer >= this.blackholeInterval) {
      this.blackholeTimer = 0;
      this.spawnBlackHole();
    }

    for (const bh of this.blackHoles) {
      bh.update(dt);
    }

    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.elapsed += dt;
      p.radius = (p.elapsed / p.duration) * p.maxRadius;
      if (p.elapsed >= p.duration) {
        this.pulses.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (this.lives <= 0 || this.asteroidPool.activeCount <= 0) {
      this.endGame();
    }
  }

  private spawnBlackHole(): void {
    const margin = 60;
    const w = window.innerWidth;
    const h = window.innerHeight;
    let x: number, y: number;
    let attempts = 0;
    do {
      x = margin + Math.random() * (w - margin * 2);
      y = margin + Math.random() * (h - margin * 2);
      attempts++;
    } while (
      Math.sqrt((x - this.star.x) ** 2 + (y - this.star.y) ** 2) < 120 &&
      attempts < 20
    );

    const bh = new BlackHole(x, y);
    this.blackHoles.push(bh);

    if (this.blackHoles.length > 5) {
      this.blackHoles.shift();
    }
  }

  private spawnExplosion(x: number, y: number): void {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 4,
        life: 0.5,
        maxLife: 0.5
      });
    }
  }

  private endGame(): void {
    this.running = false;
    cancelAnimationFrame(this.animFrameId);
    this.ui.showGameOver(this.score, () => this.startGame());
  }

  private draw(): void {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0A0B1E');
    bgGrad.addColorStop(1, '#1A1B3A');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    for (const s of this.bgStars) {
      const twinkle = Math.sin(this.gameTime * s.twinkleSpeed + s.twinklePhase) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255,255,255,${s.alpha * twinkle})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const bh of this.blackHoles) {
      bh.draw(ctx);
    }

    this.star.draw(ctx);

    this.asteroidPool.forEachActive(asteroid => {
      asteroid.draw(ctx);
    });

    for (const pulse of this.pulses) {
      const progress = pulse.elapsed / pulse.duration;
      const alpha = 0.6 * (1 - progress);
      ctx.strokeStyle = `rgba(123,104,238,${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
      ctx.stroke();

      const fillGrad = ctx.createRadialGradient(pulse.x, pulse.y, pulse.radius * 0.8, pulse.x, pulse.y, pulse.radius);
      fillGrad.addColorStop(0, `rgba(123,104,238,0)`);
      fillGrad.addColorStop(1, `rgba(123,104,238,${alpha * 0.3})`);
      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = `rgba(255,215,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

new Game();
