import { Fleet, FormationType, FORMATION_NAMES, SHIP_COLORS } from './ships';
import { Enemy } from './enemy';
import { StarfieldRenderer } from './renderer';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const ENGAGEMENT_DISTANCE = 100;
const LASER_DURATION = 300;
const LASER_INTERVAL = 2000;
const MAX_LASER_ROUNDS = 3;

interface LaserBeam {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startTime: number;
  shipIndex: number;
}

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;
  private fleet: Fleet;
  private enemy: Enemy | null = null;
  private starfield: StarfieldRenderer;
  private lasers: LaserBeam[] = [];
  private lastTime: number = 0;
  private laserRoundCount: number = 0;
  private nextLaserTime: number = 0;
  private inEngagement: boolean = false;
  private engagementApproaching: boolean = false;
  private engagementTargetX: number = 0;
  private engagementTargetY: number = 0;

  private flagshipXEl: HTMLElement;
  private flagshipYEl: HTMLElement;
  private formationNameEl: HTMLElement;
  private speedPercentEl: HTMLElement;

  constructor() {
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
    this.minimapCtx = this.minimapCanvas.getContext('2d')!;

    this.flagshipXEl = document.getElementById('flagship-x')!;
    this.flagshipYEl = document.getElementById('flagship-y')!;
    this.formationNameEl = document.getElementById('formation-name')!;
    this.speedPercentEl = document.getElementById('speed-percent')!;

    this.fleet = new Fleet();
    this.starfield = new StarfieldRenderer(CANVAS_WIDTH, CANVAS_HEIGHT);

    this.setupEventListeners();
    this.lastTime = performance.now();
    this.loop();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', (e) => this.handleLeftClick(e));
    this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  private handleLeftClick(e: MouseEvent): void {
    if (e.button !== 0) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.cancelEngagement();
    this.fleet.setMoveTarget(x, y);
  }

  private handleRightClick(e: MouseEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.enemy = new Enemy(x, y);
    this.laserRoundCount = 0;
    this.lasers = [];
    this.inEngagement = false;
    this.engagementApproaching = true;
    this.nextLaserTime = 0;

    const flagship = this.fleet.flagship;
    const dx = x - flagship.x;
    const dy = y - flagship.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > ENGAGEMENT_DISTANCE) {
      const ratio = (dist - ENGAGEMENT_DISTANCE) / dist;
      this.engagementTargetX = flagship.x + dx * ratio;
      this.engagementTargetY = flagship.y + dy * ratio;
    } else {
      this.engagementTargetX = flagship.x;
      this.engagementTargetY = flagship.y;
    }

    this.fleet.setRingCenter(x, y);
    this.fleet.setMoveTarget(this.engagementTargetX, this.engagementTargetY);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      e.preventDefault();
      this.cycleFormation();
    }
  }

  private cycleFormation(): void {
    const formations: FormationType[] = ['vee', 'line', 'ring'];
    const currentIndex = formations.indexOf(this.fleet.formation);
    const nextIndex = (currentIndex + 1) % formations.length;
    const nextFormation = formations[nextIndex];

    if (this.enemy && this.enemy.alive && !this.enemy.isDying) {
      this.fleet.setRingCenter(this.enemy.x, this.enemy.y);
    }

    this.fleet.setFormation(nextFormation);
  }

  private cancelEngagement(): void {
    this.engagementApproaching = false;
    this.inEngagement = false;
    this.laserRoundCount = 0;
    this.lasers = [];
  }

  private checkEngagement(): void {
    if (!this.enemy || !this.enemy.alive || this.enemy.isDying) {
      this.inEngagement = false;
      return;
    }

    if (!this.engagementApproaching && !this.inEngagement) return;

    const flagship = this.fleet.flagship;
    const dx = this.enemy.x - flagship.x;
    const dy = this.enemy.y - flagship.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.engagementApproaching) {
      const tdx = this.engagementTargetX - flagship.x;
      const tdy = this.engagementTargetY - flagship.y;
      const targetDist = Math.sqrt(tdx * tdx + tdy * tdy);

      if (targetDist < 5 || dist <= ENGAGEMENT_DISTANCE + 10) {
        this.engagementApproaching = false;
        this.inEngagement = true;
        this.nextLaserTime = performance.now();
      }
    }
  }

  private fireLasers(currentTime: number): void {
    if (!this.inEngagement || !this.enemy || !this.enemy.alive || this.enemy.isDying) return;

    if (this.laserRoundCount >= MAX_LASER_ROUNDS) {
      this.enemy.triggerDeath();
      this.inEngagement = false;
      return;
    }

    if (currentTime >= this.nextLaserTime) {
      for (const ship of this.fleet.ships) {
        this.lasers.push({
          fromX: ship.x,
          fromY: ship.y,
          toX: this.enemy.x,
          toY: this.enemy.y,
          startTime: currentTime,
          shipIndex: ship.index
        });
      }
      this.laserRoundCount++;
      this.nextLaserTime = currentTime + LASER_INTERVAL;
    }
  }

  private updateLasers(currentTime: number): void {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      if (currentTime - this.lasers[i].startTime > LASER_DURATION) {
        this.lasers.splice(i, 1);
      }
    }
  }

  private drawLasers(currentTime: number): void {
    for (const laser of this.lasers) {
      const elapsed = currentTime - laser.startTime;
      const progress = elapsed / LASER_DURATION;
      const alpha = progress < 0.3
        ? progress / 0.3
        : 1 - (progress - 0.3) / 0.7;

      this.ctx.save();

      this.ctx.beginPath();
      this.ctx.moveTo(laser.fromX, laser.fromY);
      this.ctx.lineTo(laser.toX, laser.toY);
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.25})`;
      this.ctx.lineWidth = 8;
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(laser.fromX, laser.fromY);
      this.ctx.lineTo(laser.toX, laser.toY);
      this.ctx.strokeStyle = `rgba(200, 220, 255, ${alpha * 0.5})`;
      this.ctx.lineWidth = 4;
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(laser.fromX, laser.fromY);
      this.ctx.lineTo(laser.toX, laser.toY);
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      this.ctx.restore();
    }
  }

  private drawEngagementTarget(): void {
    if (this.engagementApproaching && this.enemy && this.enemy.alive) {
      this.ctx.save();
      const pulse = Math.sin(performance.now() * 0.008) * 0.3 + 0.7;
      this.ctx.beginPath();
      this.ctx.arc(this.enemy.x, this.enemy.y, ENGAGEMENT_DISTANCE, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 100, 100, ${0.3 * pulse})`;
      this.ctx.setLineDash([8, 6]);
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      this.ctx.restore();
    }
  }

  private updateUI(): void {
    const flagship = this.fleet.flagship;
    this.flagshipXEl.textContent = Math.round(flagship.x).toString();
    this.flagshipYEl.textContent = Math.round(flagship.y).toString();
    this.formationNameEl.textContent = FORMATION_NAMES[this.fleet.formation];
    this.speedPercentEl.textContent = `${this.fleet.getSpeedPercent()}%`;
  }

  private drawMinimap(): void {
    const mctx = this.minimapCtx;
    const mw = this.minimapCanvas.width;
    const mh = this.minimapCanvas.height;

    mctx.clearRect(0, 0, mw, mh);

    mctx.save();
    mctx.fillStyle = '#0a0e27';
    mctx.beginPath();
    mctx.arc(mw / 2, mh / 2, mw / 2, 0, Math.PI * 2);
    mctx.fill();
    mctx.clip();

    const scaleX = mw / CANVAS_WIDTH;
    const scaleY = mh / CANVAS_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (mw - CANVAS_WIDTH * scale) / 2;
    const offsetY = (mh - CANVAS_HEIGHT * scale) / 2;

    mctx.strokeStyle = 'rgba(100, 150, 200, 0.3)';
    mctx.lineWidth = 1;
    mctx.strokeRect(offsetX, offsetY, CANVAS_WIDTH * scale, CANVAS_HEIGHT * scale);

    if (this.enemy && this.enemy.alive) {
      mctx.save();
      mctx.beginPath();
      mctx.arc(
        offsetX + this.enemy.x * scale,
        offsetY + this.enemy.y * scale,
        this.enemy.isDying ? 6 : 4,
        0,
        Math.PI * 2
      );
      mctx.fillStyle = '#FF4444';
      mctx.fill();
      mctx.restore();
    }

    for (const ship of this.fleet.ships) {
      mctx.save();
      mctx.beginPath();
      const size = ship.type === 'flagship' ? 3.5 : 2.5;
      mctx.arc(
        offsetX + ship.x * scale,
        offsetY + ship.y * scale,
        size,
        0,
        Math.PI * 2
      );
      mctx.fillStyle = SHIP_COLORS[ship.type];
      mctx.fill();
      mctx.restore();
    }

    if (this.fleet.formation === 'ring' && this.enemy && this.enemy.alive) {
      mctx.save();
      mctx.beginPath();
      mctx.arc(
        offsetX + this.enemy.x * scale,
        offsetY + this.enemy.y * scale,
        120 * scale,
        0,
        Math.PI * 2
      );
      mctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      mctx.lineWidth = 1;
      mctx.stroke();
      mctx.restore();
    }

    mctx.restore();
  }

  private loop = (): void => {
    const currentTime = performance.now();
    const deltaTime = Math.min(currentTime - this.lastTime, 50);
    this.lastTime = currentTime;

    this.starfield.update(deltaTime);
    this.fleet.update(deltaTime);
    this.checkEngagement();
    this.fireLasers(currentTime);
    this.updateLasers(currentTime);

    if (this.enemy) {
      this.enemy.update(deltaTime);
      if (!this.enemy.alive) {
        this.inEngagement = false;
      }
    }

    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.starfield.draw(this.ctx);
    this.drawEngagementTarget();

    if (this.enemy) {
      this.enemy.draw(this.ctx);
    }

    this.fleet.draw(this.ctx);
    this.drawLasers(currentTime);

    this.drawMinimap();
    this.updateUI();

    requestAnimationFrame(this.loop);
  };
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
