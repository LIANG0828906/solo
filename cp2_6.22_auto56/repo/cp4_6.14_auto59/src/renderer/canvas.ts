import Matter from 'matter-js';
import { PhysicsEngine } from '../physics/engine';
import { OBSTACLE_PRESETS, BALL_CONFIG, TARGET_CONFIG, ObstacleType } from '../physics/bodies';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface RenderableBody {
  id: number;
  type: ObstacleType | 'ball' | 'target';
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  opacity: number;
  radius?: number;
  isHit?: boolean;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private particles: Particle[] = [];
  private bodyOpacity: Map<number, number> = new Map();
  private bodyTargetOpacity: Map<number, number> = new Map();
  private angleDisplay: Map<number, number> = new Map();
  private angleDisplayTimer: Map<number, number> = new Map();

  constructor() {
    this.canvas = null!;
    this.ctx = null!;
  }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.parentElement!.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  getWidth(): number { return this.width; }
  getHeight(): number { return this.height; }

  render(bodies: RenderableBody[]): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawGrid();
    this.renderBodies(bodies);
    this.renderParticles();
    this.renderAngleTexts();
  }

  drawGrid(): void {
    const ctx = this.ctx;
    const spacing = 50;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 0; x < this.width; x += spacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
    }
    for (let y = 0; y < this.height; y += spacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }
    ctx.stroke();
  }

  private renderBodies(bodies: RenderableBody[]): void {
    for (const body of bodies) {
      if (!this.bodyOpacity.has(body.id)) {
        this.bodyOpacity.set(body.id, 0);
        this.bodyTargetOpacity.set(body.id, 1);
      }

      const current = this.bodyOpacity.get(body.id) || 0;
      const target = this.bodyTargetOpacity.get(body.id) || 1;
      const newOpacity = current + (target - current) * 0.1;
      this.bodyOpacity.set(body.id, newOpacity);

      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = newOpacity;
      ctx.translate(body.x, body.y);
      ctx.rotate(body.angle);

      if (body.type === 'ball') {
        this.drawBall(body);
      } else if (body.type === 'target') {
        this.drawTarget(body);
      } else if (body.type === 'rubberball') {
        this.drawRubberBall(body);
      } else if (body.type === 'spiketrap') {
        this.drawSpikeTrap(body);
      } else if (body.type === 'springboard') {
        this.drawSpringboard(body);
      } else {
        this.drawRect(body);
      }

      ctx.restore();

      if (this.angleDisplay.has(body.id)) {
        this.renderSingleAngleText(body);
      }
    }
  }

  private drawBall(body: RenderableBody): void {
    const ctx = this.ctx;
    const r = body.radius || BALL_CONFIG.radius;
    const gradient = ctx.createRadialGradient(0, -r * 0.3, r * 0.1, 0, 0, r);
    gradient.addColorStop(0, '#fb923c');
    gradient.addColorStop(1, BALL_CONFIG.color);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = BALL_CONFIG.strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawTarget(body: RenderableBody): void {
    const ctx = this.ctx;
    const w = body.width;
    const h = body.height;

    if (body.isHit) {
      ctx.globalAlpha *= 0.3;
    }

    ctx.fillStyle = TARGET_CONFIG.color;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = TARGET_CONFIG.strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, 0);
  }

  private drawRect(body: RenderableBody): void {
    const ctx = this.ctx;
    const preset = OBSTACLE_PRESETS[body.type as ObstacleType];
    const w = body.width;
    const h = body.height;

    ctx.fillStyle = preset.color;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = preset.strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    if (body.type === 'woodbox') {
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2);
      ctx.lineTo(w / 2, h / 2);
      ctx.moveTo(w / 2, -h / 2);
      ctx.lineTo(-w / 2, h / 2);
      ctx.stroke();
    } else if (body.type === 'ironblock') {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, h / 3);
    }
  }

  private drawRubberBall(body: RenderableBody): void {
    const ctx = this.ctx;
    const r = body.width / 2;
    const gradient = ctx.createRadialGradient(0, -r * 0.3, r * 0.1, 0, 0, r);
    gradient.addColorStop(0, '#4ade80');
    gradient.addColorStop(1, '#16a34a');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawSpikeTrap(body: RenderableBody): void {
    const ctx = this.ctx;
    const w = body.width;
    const h = body.height;
    const spikes = 5;
    const spikeWidth = w / spikes;

    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-w / 2, -h / 4, w, h / 2);

    ctx.fillStyle = '#dc2626';
    for (let i = 0; i < spikes; i++) {
      const sx = -w / 2 + i * spikeWidth;
      ctx.beginPath();
      ctx.moveTo(sx, -h / 4);
      ctx.lineTo(sx + spikeWidth / 2, -h / 2);
      ctx.lineTo(sx + spikeWidth, -h / 4);
      ctx.fill();
    }
  }

  private drawSpringboard(body: RenderableBody): void {
    const ctx = this.ctx;
    const w = body.width;
    const h = body.height;

    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(-w / 2, -h / 2, w, h);

    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    const springCount = 6;
    const segW = w / springCount;
    for (let i = 0; i < springCount; i++) {
      const sx = -w / 2 + i * segW;
      ctx.beginPath();
      ctx.moveTo(sx, h / 2);
      ctx.lineTo(sx + segW / 2, -h / 2);
      ctx.lineTo(sx + segW, h / 2);
      ctx.stroke();
    }
  }

  addParticle(particle: Particle): void {
    this.particles.push(particle);
  }

  addSparkParticles(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 30 + Math.random() * 30,
        maxLife: 60,
        color: Math.random() > 0.5 ? '#fbbf24' : '#f97316',
        size: 2 + Math.random() * 3,
      });
    }
  }

  addWoodDebris(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        life: 40 + Math.random() * 30,
        maxLife: 70,
        color: Math.random() > 0.5 ? '#92400e' : '#78350f',
        size: 3 + Math.random() * 4,
      });
    }
  }

  addBallDestroyParticles(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 25 + Math.random() * 25,
        maxLife: 50,
        color: Math.random() > 0.5 ? '#f97316' : '#fb923c',
        size: 2 + Math.random() * 3,
      });
    }
  }

  private renderParticles(): void {
    const ctx = this.ctx;
    const toRemove: number[] = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life--;

      if (p.life <= 0) {
        toRemove.push(i);
        continue;
      }

      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.particles.splice(toRemove[i], 1);
    }
  }

  drawTrajectory(points: { x: number; y: number }[]): void {
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(241, 245, 249, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawPowerBar(power: number): void {
    const fill = document.getElementById('power-bar-fill');
    if (fill) {
      fill.style.width = (power * 100) + '%';
    }
  }

  showAngle(bodyId: number, angle: number): void {
    this.angleDisplay.set(bodyId, angle);
    this.angleDisplayTimer.set(bodyId, Date.now());
  }

  private renderSingleAngleText(body: RenderableBody): void {
    const ctx = this.ctx;
    const now = Date.now();
    const time = this.angleDisplayTimer.get(body.id) || now;
    const elapsed = now - time;
    if (elapsed > 1500) return;

    let alpha = 1;
    if (elapsed > 800) {
      alpha = Math.max(0, 1 - (elapsed - 800) / 700);
    }
    if (alpha <= 0) return;

    const angle = this.angleDisplay.get(body.id) || body.angle;
    const halfH = (body.height || 50) / 2;
    const textY = body.y - halfH - 10;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    const text = Math.round(angle * 180 / Math.PI) + '°';
    ctx.strokeText(text, body.x, textY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, body.x, textY);
    ctx.restore();
  }

  private renderAngleTexts(): void {
  }

  clearBodyTracking(id: number): void {
    this.bodyOpacity.delete(id);
    this.bodyTargetOpacity.delete(id);
    this.angleDisplay.delete(id);
    this.angleDisplayTimer.delete(id);
  }

  clearAllTracking(): void {
    this.bodyOpacity.clear();
    this.bodyTargetOpacity.clear();
    this.angleDisplay.clear();
    this.angleDisplayTimer.clear();
    this.particles = [];
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  setFadeIn(bodyId: number): void {
    this.bodyOpacity.set(bodyId, 0);
    this.bodyTargetOpacity.set(bodyId, 1);
  }
}
