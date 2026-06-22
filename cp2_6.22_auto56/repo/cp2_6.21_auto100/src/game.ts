import { Ship, Crystal, Laser, Meteor, Particle, ScorePopup, SoundManager } from './entities';
import { InputManager } from './input';
import {
  random,
  randomInt,
  circleCollision,
  lineCircleCollision,
  CRYSTAL_COLORS,
  CrystalColor
} from './utils';

interface GameState {
  score: number;
  speedLevel: number;
  speedMultiplier: number;
  isGameOver: boolean;
  screenShakeX: number;
  screenShakeY: number;
  screenShakeDuration: number;
  meteorTimer: number;
  nextMeteorTime: number;
}

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputManager;

  private ship: Ship;
  private crystals: Crystal[] = [];
  private lasers: Laser[] = [];
  private meteors: Meteor[] = [];
  private particles: Particle[] = [];
  private scorePopups: ScorePopup[] = [];

  private bounds: { width: number; height: number };

  private lastTime: number = 0;
  private animationId: number = 0;
  private fpsAccumulator: number = 0;
  private fpsFrames: number = 0;
  private currentFps: number = 60;

  private state: GameState;
  private stars: Array<{ x: number; y: number; size: number; alpha: number; speed: number; phase: number }> = [];
  private soundManager: SoundManager;

  private gameOverOverlay: HTMLDivElement | null = null;

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D rendering context');
    }
    this.ctx = ctx;

    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));

    this.bounds = { width: this.canvas.width, height: this.canvas.height };

    this.input = new InputManager(this.canvas);
    this.input.onClick(this.handleShoot.bind(this));

    this.state = this.createInitialState();
    this.ship = new Ship(this.bounds);
    this.soundManager = new SoundManager();

    this.generateStars();
    this.spawnInitialCrystals();
    this.scheduleNextMeteor();

    this.startLoop();
  }

  private createInitialState(): GameState {
    return {
      score: 0,
      speedLevel: 1,
      speedMultiplier: 1,
      isGameOver: false,
      screenShakeX: 0,
      screenShakeY: 0,
      screenShakeDuration: 0,
      meteorTimer: 0,
      nextMeteorTime: 0
    };
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.bounds = {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  private generateStars(): void {
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: random(0, this.bounds.width),
        y: random(0, this.bounds.height),
        size: random(1, 2),
        alpha: random(0.3, 1),
        speed: random(0.5, 2),
        phase: random(0, Math.PI * 2)
      });
    }
  }

  private spawnInitialCrystals(): void {
    this.crystals = [];
    for (let i = 0; i < 100; i++) {
      this.crystals.push(new Crystal(this.bounds));
    }
  }

  private scheduleNextMeteor(): void {
    const baseInterval = random(3000, 5000);
    this.state.nextMeteorTime = baseInterval / this.state.speedMultiplier;
    this.state.meteorTimer = 0;
  }

  private handleShoot(x: number, y: number): void {
    if (this.state.isGameOver) return;

    this.soundManager.init();

    const startX = this.ship.x;
    const startY = this.ship.y - this.ship.size * 0.5;
    this.lasers.push(new Laser(startX, startY, x, y));

    this.soundManager.playLaser();
    this.triggerScreenShake();
  }

  private triggerScreenShake(): void {
    this.state.screenShakeDuration = 150;
    this.state.screenShakeX = 0;
    this.state.screenShakeY = 0;
  }

  private updateScreenShake(dt: number): void {
    if (this.state.screenShakeDuration > 0) {
      this.state.screenShakeDuration -= dt * 1000;
      if (this.state.screenShakeDuration > 0) {
        const intensity = Math.min(1, this.state.screenShakeDuration / 75);
        this.state.screenShakeX = (Math.random() * 2 - 1) * 3 * intensity;
        this.state.screenShakeY = (Math.random() * 2 - 1) * 3 * intensity;
      } else {
        this.state.screenShakeX = 0;
        this.state.screenShakeY = 0;
        this.state.screenShakeDuration = 0;
      }
    } else {
      this.state.screenShakeX = 0;
      this.state.screenShakeY = 0;
    }
  }

  private spawnCrystalParticles(x: number, y: number, color: CrystalColor): void {
    const particleColor = CRYSTAL_COLORS[color];
    const count = randomInt(3, 5);
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, particleColor));
    }
  }

  private checkCollisions(): void {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      if (!laser.active) continue;

      const head = laser.getHeadPosition();
      const trail = laser.trail;
      if (trail.length >= 2) {
        const lastPoint = trail[trail.length - 1];
        const prevPoint = trail.length >= 2 ? trail[trail.length - 2] : lastPoint;

        for (let j = this.crystals.length - 1; j >= 0; j--) {
          const crystal = this.crystals[j];
          if (!crystal.active) continue;

          if (lineCircleCollision(
            prevPoint.x, prevPoint.y,
            lastPoint.x, lastPoint.y,
            crystal.x, crystal.y, crystal.radius
          ) || circleCollision(
            head.x, head.y, 5,
            crystal.x, crystal.y, crystal.radius
          )) {
            this.addScore(crystal.score);
            this.scorePopups.push(new ScorePopup(crystal.x, crystal.y, crystal.score));
            this.spawnCrystalParticles(crystal.x, crystal.y, crystal.color);

            const pitchMap: Record<string, number> = {
              red: 0.8,
              blue: 1.0,
              green: 1.2,
              purple: 1.5
            };
            this.soundManager.playCollect(pitchMap[crystal.color] || 1);

            crystal.active = false;
            laser.active = false;
            break;
          }
        }
      }
    }

    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const meteor = this.meteors[i];
      if (!meteor.active) continue;

      for (let j = this.crystals.length - 1; j >= 0; j--) {
        const crystal = this.crystals[j];
        if (!crystal.active) continue;

        if (circleCollision(
          meteor.x, meteor.y, meteor.getCollisionRadius(),
          crystal.x, crystal.y, crystal.radius
        )) {
          crystal.active = false;
        }
      }

      if (circleCollision(
        meteor.x, meteor.y, meteor.getCollisionRadius(),
        this.ship.x, this.ship.y, this.ship.getCollisionRadius()
      )) {
        this.gameOver();
      }
    }
  }

  private addScore(points: number): void {
    const prevScore = this.state.score;
    this.state.score += points;

    const prevLevel = Math.floor(prevScore / 50) + 1;
    const newLevel = Math.floor(this.state.score / 50) + 1;

    if (newLevel > prevLevel) {
      const levelDiff = newLevel - prevLevel;
      this.state.speedLevel = newLevel;
      this.state.speedMultiplier = 1 + (newLevel - 1) * 0.05;
    }
  }

  private cleanupEntities(): void {
    this.crystals = this.crystals.filter(c => c.active);
    while (this.crystals.length < 100) {
      this.crystals.push(new Crystal(this.bounds));
    }

    this.lasers = this.lasers.filter(l => l.active);
    this.meteors = this.meteors.filter(m => m.active);
    this.particles = this.particles.filter(p => p.active);
    this.scorePopups = this.scorePopups.filter(p => p.active);
  }

  private gameOver(): void {
    this.state.isGameOver = true;
    this.soundManager.playGameOver();
    this.showGameOverOverlay();
  }

  private showGameOverOverlay(): void {
    if (this.gameOverOverlay) return;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.75);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 100;
      font-family: Arial, sans-serif;
    `;

    const title = document.createElement('h1');
    title.textContent = '游戏结束';
    title.style.cssText = `
      color: #ff4466;
      font-size: 48px;
      margin-bottom: 20px;
      text-shadow: 0 0 20px #ff4466;
    `;

    const scoreText = document.createElement('div');
    scoreText.textContent = `最终得分: ${this.state.score}`;
    scoreText.style.cssText = `
      color: #00ffff;
      font-size: 32px;
      margin-bottom: 10px;
      text-shadow: 0 0 15px #00ffff;
    `;

    const levelText = document.createElement('div');
    levelText.textContent = `速度等级: ${this.state.speedLevel}`;
    levelText.style.cssText = `
      color: #cc44ff;
      font-size: 24px;
      margin-bottom: 40px;
      text-shadow: 0 0 10px #cc44ff;
    `;

    const button = document.createElement('button');
    button.textContent = '重新开始';
    button.style.cssText = `
      padding: 15px 40px;
      font-size: 24px;
      background: linear-gradient(135deg, #00ffff, #0066cc);
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: bold;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
      transition: all 0.3s ease;
      font-family: Arial, sans-serif;
    `;
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.8)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
    });
    button.addEventListener('click', () => this.restart());

    overlay.appendChild(title);
    overlay.appendChild(scoreText);
    overlay.appendChild(levelText);
    overlay.appendChild(button);

    document.body.appendChild(overlay);
    this.gameOverOverlay = overlay;
  }

  private restart(): void {
    if (this.gameOverOverlay) {
      document.body.removeChild(this.gameOverOverlay);
      this.gameOverOverlay = null;
    }

    this.state = this.createInitialState();
    this.ship = new Ship(this.bounds);
    this.crystals = [];
    this.lasers = [];
    this.meteors = [];
    this.particles = [];
    this.scorePopups = [];

    this.spawnInitialCrystals();
    this.scheduleNextMeteor();
  }

  private update(dt: number): void {
    if (this.state.isGameOver) return;

    this.updateScreenShake(dt);

    this.ship.update(dt, this.state.speedMultiplier);

    this.crystals.forEach(c => c.update(dt, this.state.speedMultiplier));
    this.lasers.forEach(l => l.update(dt, this.state.speedMultiplier));
    this.particles.forEach(p => p.update(dt, this.state.speedMultiplier));
    this.scorePopups.forEach(p => p.update(dt, this.state.speedMultiplier));
    this.meteors.forEach(m => m.update(dt, 1));

    this.state.meteorTimer += dt * 1000;
    if (this.state.meteorTimer >= this.state.nextMeteorTime) {
      this.meteors.push(new Meteor(this.bounds, this.state.speedMultiplier));
      this.scheduleNextMeteor();
    }

    this.checkCollisions();
    this.cleanupEntities();
  }

  private renderBackground(): void {
    const { width, height } = this.bounds;
    const gradient = this.ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.75
    );
    gradient.addColorStop(0, '#1a1a4e');
    gradient.addColorStop(1, '#0a0a2e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);

    const time = performance.now() * 0.001;
    this.ctx.fillStyle = '#ffffff';
    this.stars.forEach(star => {
      const twinkle = 0.5 + 0.5 * Math.sin(time * star.speed + star.phase);
      this.ctx.globalAlpha = star.alpha * twinkle;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }

  private renderUI(): void {
    this.ctx.save();
    this.ctx.font = 'bold 22px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 4;
    this.ctx.strokeText(`得分: ${this.state.score}`, 20, 20);
    this.ctx.fillStyle = '#00ffff';
    this.ctx.fillText(`得分: ${this.state.score}`, 20, 20);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeText(`速度等级: ${this.state.speedLevel}`, 20, 52);
    this.ctx.fillStyle = '#cc44ff';
    this.ctx.fillText(`速度等级: ${this.state.speedLevel}`, 20, 52);

    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillStyle = '#888888';
    this.ctx.fillText(`FPS: ${this.currentFps}`, 20, 84);

    this.ctx.restore();
  }

  private render(): void {
    this.ctx.save();

    if (this.state.screenShakeDuration > 0) {
      this.ctx.translate(this.state.screenShakeX, this.state.screenShakeY);
    }

    this.renderBackground();

    this.crystals.forEach(c => c.render(this.ctx));
    this.particles.forEach(p => p.render(this.ctx));
    this.meteors.forEach(m => m.render(this.ctx));
    this.lasers.forEach(l => l.render(this.ctx));
    this.ship.render(this.ctx);
    this.scorePopups.forEach(p => p.render(this.ctx));

    this.ctx.restore();
    this.ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);

    this.renderUI();
  }

  private startLoop(): void {
    this.lastTime = performance.now();

    const loop = (timestamp: number) => {
      let dt = (timestamp - this.lastTime) / 1000;
      if (dt > 0.1) dt = 0.1;
      this.lastTime = timestamp;

      this.fpsAccumulator += dt;
      this.fpsFrames++;
      if (this.fpsAccumulator >= 0.5) {
        this.currentFps = Math.round(this.fpsFrames / this.fpsAccumulator);
        this.fpsAccumulator = 0;
        this.fpsFrames = 0;
      }

      this.update(dt);
      this.render();

      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  }

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.input.destroy();
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
  }
}

let game: Game | null = null;

window.addEventListener('DOMContentLoaded', () => {
  game = new Game();
});
