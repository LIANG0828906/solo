import {
  random,
  randomInt,
  randomCrystalColor,
  CRYSTAL_COLORS,
  CRYSTAL_SCORES,
  CrystalColor,
  Vector2,
  generatePolygonPoints,
  interpolateColor,
  clamp,
  normalize
} from './utils';

export interface Entity {
  x: number;
  y: number;
  active: boolean;
  update(dt: number, speedMultiplier: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

export class Crystal implements Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: CrystalColor;
  score: number;
  active: boolean = true;
  phase: number;
  bounds: { width: number; height: number };

  constructor(bounds: { width: number; height: number }) {
    this.bounds = bounds;
    this.radius = random(5, 15);
    this.x = random(this.radius, bounds.width - this.radius);
    this.y = random(this.radius, bounds.height * 0.75 - this.radius);
    const angle = random(0, Math.PI * 2);
    const speed = random(0.2, 0.5);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = randomCrystalColor();
    this.score = CRYSTAL_SCORES[this.color];
    this.phase = random(0, Math.PI * 2);
  }

  update(dt: number, speedMultiplier: number): void {
    this.x += this.vx * dt * 60 * speedMultiplier;
    this.y += this.vy * dt * 60 * speedMultiplier;
    this.phase += dt * 2;

    if (this.x - this.radius <= 0 || this.x + this.radius >= this.bounds.width) {
      this.vx *= -1;
      this.x = clamp(this.x, this.radius, this.bounds.width - this.radius);
    }
    if (this.y - this.radius <= 0 || this.y + this.radius >= this.bounds.height * 0.75) {
      this.vy *= -1;
      this.y = clamp(this.y, this.radius, this.bounds.height * 0.75 - this.radius);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const color = CRYSTAL_COLORS[this.color];
    const pulse = 1 + Math.sin(this.phase) * 0.1;
    const r = this.radius * pulse;

    ctx.save();
    ctx.filter = `blur(6px)`;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(this.x - r * 0.25, this.y - r * 0.25, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class Ship implements Entity {
  x: number;
  y: number;
  size: number = 40;
  active: boolean = true;
  bounds: { width: number; height: number };

  constructor(bounds: { width: number; height: number }) {
    this.bounds = bounds;
    this.x = bounds.width / 2;
    this.y = bounds.height - 60;
  }

  update(dt: number, _speedMultiplier: number): void {
    this.x = this.bounds.width / 2;
    this.y = this.bounds.height - 60;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = this.size;
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;

    const gradient = ctx.createLinearGradient(0, -s * 0.6, 0, s * 0.5);
    gradient.addColorStop(0, '#00ffff');
    gradient.addColorStop(1, '#0066cc');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(0, -s * 0.6);
    ctx.lineTo(-s * 0.5, s * 0.5);
    ctx.lineTo(0, s * 0.3);
    ctx.lineTo(s * 0.5, s * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 165, 0, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-s * 0.15, s * 0.45);
    ctx.lineTo(0, s * 0.75 + Math.random() * s * 0.1);
    ctx.lineTo(s * 0.15, s * 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  getCollisionRadius(): number {
    return this.size * 0.4;
  }
}

export class Laser implements Entity {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  progress: number = 0;
  speed: number = 0.008;
  active: boolean = true;
  trail: { x: number; y: number }[] = [];
  maxTrailLength: number = 20;

  constructor(startX: number, startY: number, targetX: number, targetY: number) {
    this.startX = startX;
    this.startY = startY;
    this.x = startX;
    this.y = startY;
    this.targetX = targetX;
    this.targetY = targetY;
  }

  update(dt: number, _speedMultiplier: number): void {
    this.progress += this.speed * dt * 60;

    if (this.progress >= 1) {
      this.active = false;
      return;
    }

    this.x = this.startX + (this.targetX - this.startX) * this.progress;
    this.y = this.startY + (this.targetY - this.startY) * this.progress;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.trail.length < 2) return;

    for (let i = 1; i < this.trail.length; i++) {
      const t = i / this.trail.length;
      const alpha = t * 0.8;
      const color = interpolateColor('#00ffff', '#ff00ff', this.progress);

      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 3 * t;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
      ctx.lineTo(this.trail[i].x, this.trail[i].y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  getHeadPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }
}

export class Meteor implements Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean = true;
  bounds: { width: number; height: number };
  polygonPoints: Vector2[];
  rotation: number = 0;
  rotationSpeed: number;
  trailParticles: { x: number; y: number; alpha: number; size: number }[] = [];
  maxTrailParticles: number = 5;

  constructor(bounds: { width: number; height: number }, speedMultiplier: number) {
    this.bounds = bounds;
    this.radius = random(20, 35);

    const edge = randomInt(0, 3);
    switch (edge) {
      case 0:
        this.x = random(0, bounds.width);
        this.y = -this.radius;
        break;
      case 1:
        this.x = bounds.width + this.radius;
        this.y = random(0, bounds.height);
        break;
      case 2:
        this.x = random(0, bounds.width);
        this.y = bounds.height + this.radius;
        break;
      default:
        this.x = -this.radius;
        this.y = random(0, bounds.height);
        break;
    }

    let dirX: number, dirY: number;
    if (edge === 0) {
      dirX = random(-1, 1);
      dirY = random(0.3, 1);
    } else if (edge === 2) {
      dirX = random(-1, 1);
      dirY = random(-1, -0.3);
    } else if (edge === 1) {
      dirX = random(-1, -0.3);
      dirY = random(-1, 1);
    } else {
      dirX = random(0.3, 1);
      dirY = random(-1, 1);
    }

    const dir = normalize({ x: dirX, y: dirY });
    const speed = random(1, 2) * speedMultiplier;
    this.vx = dir.x * speed;
    this.vy = dir.y * speed;

    this.polygonPoints = generatePolygonPoints(randomInt(7, 10), this.radius, 0.35);
    this.rotationSpeed = random(-0.02, 0.02);
  }

  update(dt: number, speedMultiplier: number): void {
    this.x += this.vx * dt * 60 * speedMultiplier;
    this.y += this.vy * dt * 60 * speedMultiplier;
    this.rotation += this.rotationSpeed * dt * 60;

    this.trailParticles.unshift({
      x: this.x,
      y: this.y,
      alpha: 0.5,
      size: this.radius * 0.6
    });
    if (this.trailParticles.length > this.maxTrailParticles) {
      this.trailParticles.pop();
    }
    this.trailParticles.forEach((p, i) => {
      p.alpha = (1 - i / this.maxTrailParticles) * 0.4;
      p.size = this.radius * 0.6 * (1 - i / this.maxTrailParticles);
    });

    const margin = this.radius * 2;
    if (
      this.x < -margin ||
      this.x > this.bounds.width + margin ||
      this.y < -margin ||
      this.y > this.bounds.height + margin
    ) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.trailParticles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#ff6633';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
    gradient.addColorStop(0, '#aa3311');
    gradient.addColorStop(0.5, '#882211');
    gradient.addColorStop(1, '#551100');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#331100';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(this.polygonPoints[0].x, this.polygonPoints[0].y);
    for (let i = 1; i < this.polygonPoints.length; i++) {
      ctx.lineTo(this.polygonPoints[i].x, this.polygonPoints[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(60, 20, 0, 0.6)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + this.rotation * 0.5;
      const r1 = this.radius * 0.2;
      const r2 = this.radius * 0.8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
      ctx.quadraticCurveTo(
        Math.cos(angle + 0.3) * this.radius * 0.5,
        Math.sin(angle + 0.3) * this.radius * 0.5,
        Math.cos(angle + 0.15) * r2,
        Math.sin(angle + 0.15) * r2
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  getCollisionRadius(): number {
    return this.radius * 0.85;
  }
}

export class Particle implements Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  active: boolean = true;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    const angle = random(0, Math.PI * 2);
    const speed = random(1, 4);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = random(1, 3);
    this.color = color;
    this.alpha = 1;
    this.decay = random(0.015, 0.035);
  }

  update(dt: number, _speedMultiplier: number): void {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.alpha -= this.decay * dt * 60;
    if (this.alpha <= 0) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class ScorePopup implements Entity {
  x: number;
  y: number;
  score: number;
  alpha: number = 1;
  active: boolean = true;
  life: number = 0;
  maxLife: number = 1;

  constructor(x: number, y: number, score: number) {
    this.x = x;
    this.y = y;
    this.score = score;
  }

  update(dt: number, _speedMultiplier: number): void {
    this.life += dt;
    this.y -= 40 * dt;
    this.alpha = 1 - this.life / this.maxLife;
    if (this.life >= this.maxLife) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(`+${this.score}`, this.x, this.y);
    ctx.fillText(`+${this.score}`, this.x, this.y);
    ctx.restore();
  }
}
