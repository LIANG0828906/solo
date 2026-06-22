export interface Vec2 {
  x: number;
  y: number;
}

export type AsteroidSize = 'large' | 'medium' | 'small';
export type OreColor = 'cyan' | 'purple' | 'gold' | 'green' | 'pink';

export interface OreValue {
  color: string;
  glow: string;
  value: number;
}

export const ORE_VALUES: Record<OreColor, OreValue> = {
  cyan: { color: '#00ccff', glow: '#00eeff', value: 5 },
  purple: { color: '#cc66ff', glow: '#dd88ff', value: 8 },
  gold: { color: '#ffdd33', glow: '#ffee66', value: 15 },
  green: { color: '#66ff66', glow: '#88ff88', value: 10 },
  pink: { color: '#ff66aa', glow: '#ff88cc', value: 12 }
};

export const ASTEROID_CONFIG: Record<AsteroidSize, { size: number; hp: number; color: string; accent: string }> = {
  large: { size: 64, hp: 3, color: '#cc3333', accent: '#ff5555' },
  medium: { size: 48, hp: 2, color: '#ff7733', accent: '#ff9955' },
  small: { size: 32, hp: 1, color: '#ffcc33', accent: '#ffee66' }
};

const CANVAS_W = 800;
const CANVAS_H = 600;

export class Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;

  constructor() {
    this.x = Math.random() * CANVAS_W;
    this.y = Math.random() * CANVAS_H;
    this.size = Math.random() * 2 + 0.5;
    this.brightness = Math.random();
    this.twinkleSpeed = Math.random() * 0.05 + 0.01;
    this.twinklePhase = Math.random() * Math.PI * 2;
  }

  update(): void {
    this.twinklePhase += this.twinkleSpeed;
  }

  getAlpha(): number {
    return 0.3 + Math.sin(this.twinklePhase) * 0.35 + this.brightness * 0.35;
  }
}

export class Ship {
  x: number;
  y: number;
  width: number = 32;
  height: number = 32;
  speed: number = 5;
  angle: number = -Math.PI / 2;
  shield: number = 1;
  shieldMax: number = 1;
  weaponLevel: number = 1;
  invincibleTime: number = 0;
  engineFlamePhase: number = 0;
  vx: number = 0;
  vy: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(keys: Set<string>): void {
    let dx = 0;
    let dy = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
      this.angle = Math.atan2(dy, dx);
    }

    this.vx = this.vx * 0.85 + dx * this.speed * 0.15;
    this.vy = this.vy * 0.85 + dy * this.speed * 0.15;

    this.x += this.vx;
    this.y += this.vy;

    const halfW = this.width / 2;
    const halfH = this.height / 2;
    this.x = Math.max(halfW, Math.min(CANVAS_W - halfW, this.x));
    this.y = Math.max(halfH, Math.min(CANVAS_H - halfH, this.y));

    if (this.invincibleTime > 0) this.invincibleTime--;
    this.engineFlamePhase += 0.3;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI / 2);

    if (this.invincibleTime > 0 && Math.floor(this.invincibleTime / 4) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    if (this.shield > 0) {
      const shieldRadius = 24;
      const shieldGrad = ctx.createRadialGradient(0, 0, shieldRadius - 4, 0, 0, shieldRadius + 6);
      const shieldColor = this.shield / this.shieldMax;
      const r = Math.floor(100 + (1 - shieldColor) * 155);
      const g = Math.floor(255 - (1 - shieldColor) * 155);
      const b = Math.floor(150 - (1 - shieldColor) * 100);
      shieldGrad.addColorStop(0, `rgba(${r},${g},${b},0)`);
      shieldGrad.addColorStop(0.6, `rgba(${r},${g},${b},${0.15 * shieldColor})`);
      shieldGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = shieldGrad;
      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius + 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(${r},${g},${b},${0.4 * shieldColor})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    const flameLen = 8 + Math.sin(this.engineFlamePhase) * 3 + Math.max(Math.abs(this.vx), Math.abs(this.vy)) * 2;
    const flameGrad = ctx.createLinearGradient(0, 12, 0, 12 + flameLen);
    flameGrad.addColorStop(0, '#ffee66');
    flameGrad.addColorStop(0.4, '#ff8833');
    flameGrad.addColorStop(1, 'rgba(255,68,0,0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-5, 12);
    ctx.lineTo(0, 12 + flameLen);
    ctx.lineTo(5, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2a2a5a';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(12, 12);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#4a4a8a';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(8, 8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#6a6aaa';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(4, 4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#00ccff';
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur = 8;
    ctx.fillRect(-3, -6, 6, 6);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#1a1a3a';
    ctx.fillRect(-14, 4, 6, 8);
    ctx.fillRect(8, 4, 6, 8);

    ctx.fillStyle = '#ff5555';
    ctx.fillRect(-13, 5, 4, 3);
    ctx.fillRect(9, 5, 4, 3);

    ctx.restore();
  }

  takeDamage(): boolean {
    if (this.invincibleTime > 0) return false;
    this.shield--;
    this.invincibleTime = 90;
    return this.shield <= 0;
  }
}

export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number = 10;
  radius: number = 3;
  alive: boolean = true;
  trail: Vec2[] = [];
  damage: number;

  constructor(x: number, y: number, targetX: number, targetY: number, damage: number = 1) {
    this.x = x;
    this.y = y;
    const dx = targetX - x;
    const dy = targetY - y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = (dx / len) * this.speed;
    this.vy = (dy / len) * this.speed;
    this.damage = damage;
    for (let i = 0; i < 6; i++) {
      this.trail.push({ x, y });
    }
  }

  update(): void {
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.pop();
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < -20 || this.x > CANVAS_W + 20 || this.y < -20 || this.y > CANVAS_H + 20) {
      this.alive = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const alpha = (1 - i / this.trail.length) * 0.6;
      const r = this.radius * (1 - i / this.trail.length * 0.7);
      ctx.fillStyle = `rgba(0, 204, 255, ${alpha})`;
      ctx.shadowColor = '#00ccff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#00ccff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: AsteroidSize;
  radius: number;
  hp: number;
  rotation: number;
  rotationSpeed: number;
  alive: boolean = true;
  shape: number[];
  vertices: number;
  oreDrops: OreColor[];

  constructor(size: AsteroidSize, x?: number, y?: number) {
    this.size = size;
    const cfg = ASTEROID_CONFIG[size];
    this.radius = cfg.size / 2;
    this.hp = cfg.hp;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.04;
    this.vertices = 8 + Math.floor(Math.random() * 4);

    this.shape = [];
    for (let i = 0; i < this.vertices; i++) {
      this.shape.push(0.75 + Math.random() * 0.5);
    }

    if (x !== undefined && y !== undefined) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const spd = 0.8 + Math.random() * 1.2;
      this.vx = Math.cos(angle) * spd;
      this.vy = Math.sin(angle) * spd;
    } else {
      this._spawnAtEdge();
    }

    this.oreDrops = [];
    const dropCount = size === 'large' ? 3 + Math.floor(Math.random() * 2) : size === 'medium' ? 2 : 1;
    const colors: OreColor[] = ['cyan', 'purple', 'gold', 'green', 'pink'];
    const weights = [35, 25, 10, 20, 10];
    for (let i = 0; i < dropCount; i++) {
      this.oreDrops.push(this._weightedPick(colors, weights));
    }
  }

  private _weightedPick<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[0];
  }

  private _spawnAtEdge(): void {
    const edge = Math.floor(Math.random() * 4);
    const margin = 60;
    switch (edge) {
      case 0:
        this.x = Math.random() * CANVAS_W;
        this.y = -margin;
        break;
      case 1:
        this.x = CANVAS_W + margin;
        this.y = Math.random() * CANVAS_H;
        break;
      case 2:
        this.x = Math.random() * CANVAS_W;
        this.y = CANVAS_H + margin;
        break;
      default:
        this.x = -margin;
        this.y = Math.random() * CANVAS_H;
        break;
    }

    const targetX = 100 + Math.random() * (CANVAS_W - 200);
    const targetY = 100 + Math.random() * (CANVAS_H - 200);
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const spd = 0.6 + Math.random() * 1.0;
    this.vx = (dx / len) * spd;
    this.vy = (dy / len) * spd;
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;

    const margin = this.radius + 40;
    if (this.x < -margin * 2 || this.x > CANVAS_W + margin * 2 ||
        this.y < -margin * 2 || this.y > CANVAS_H + margin * 2) {
      this.alive = false;
    }
  }

  hit(damage: number = 1): boolean {
    this.hp -= damage;
    return this.hp <= 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const cfg = ASTEROID_CONFIG[this.size];
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.shadowColor = cfg.accent;
    ctx.shadowBlur = 8;

    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    for (let i = 0; i < this.vertices; i++) {
      const angle = (i / this.vertices) * Math.PI * 2;
      const r = this.radius * this.shape[i];
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = cfg.accent;
    for (let i = 0; i < this.vertices; i++) {
      const angle = (i / this.vertices) * Math.PI * 2;
      const r = this.radius * this.shape[i] * 0.55;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      ctx.fillRect(px - 2, py - 2, 4, 4);
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < this.vertices; i++) {
      const angle = (i / this.vertices) * Math.PI * 2;
      const r = this.radius * this.shape[i];
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  split(): Asteroid[] {
    const result: Asteroid[] = [];
    if (this.size === 'large') {
      result.push(new Asteroid('medium', this.x - 10, this.y));
      result.push(new Asteroid('medium', this.x + 10, this.y));
    } else if (this.size === 'medium') {
      result.push(new Asteroid('small', this.x - 8, this.y));
      result.push(new Asteroid('small', this.x + 8, this.y));
    }
    return result;
  }
}

export class Ore {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: OreColor;
  radius: number = 6;
  alive: boolean = true;
  onGround: boolean = false;
  bounceCount: number = 0;
  rotation: number;
  rotationSpeed: number;
  collected: boolean = false;
  collectProgress: number = 0;
  gravity: number = 0.15;
  groundY: number = CANVAS_H - 20;

  constructor(x: number, y: number, color: OreColor) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const spd = 1 + Math.random() * 3;
    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd - 2;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.15;
  }

  update(): void {
    if (this.collected) {
      this.collectProgress += 0.08;
      if (this.collectProgress >= 1) {
        this.alive = false;
      }
      return;
    }

    if (!this.onGround) {
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotationSpeed;

      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.bounceCount++;
        if (this.bounceCount < 3) {
          this.vy *= -0.45;
          this.vx *= 0.7;
        } else {
          this.onGround = true;
          this.vx = 0;
          this.vy = 0;
        }
      }

      if (this.x < this.radius) {
        this.x = this.radius;
        this.vx *= -0.6;
      }
      if (this.x > CANVAS_W - this.radius) {
        this.x = CANVAS_W - this.radius;
        this.vx *= -0.6;
      }
    }
  }

  startCollect(): void {
    this.collected = true;
  }

  getValue(): number {
    return ORE_VALUES[this.color].value;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const val = ORE_VALUES[this.color];
    ctx.save();

    if (this.collected) {
      const p = this.collectProgress;
      ctx.translate(this.x, this.y - p * 40);
      ctx.rotate(this.rotation + p * Math.PI * 4);
      const scale = 1 - p * 0.7;
      ctx.scale(scale, scale);
      ctx.globalAlpha = 1 - p;
    } else {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
    }

    ctx.shadowColor = val.glow;
    ctx.shadowBlur = 12;
    ctx.fillStyle = val.color;

    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius * 0.8, -this.radius * 0.3);
    ctx.lineTo(this.radius * 0.6, this.radius);
    ctx.lineTo(-this.radius * 0.6, this.radius);
    ctx.lineTo(-this.radius * 0.8, -this.radius * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = val.glow;
    ctx.beginPath();
    ctx.moveTo(0, -this.radius * 0.8);
    ctx.lineTo(this.radius * 0.4, -this.radius * 0.2);
    ctx.lineTo(this.radius * 0.2, this.radius * 0.5);
    ctx.lineTo(-this.radius * 0.3, this.radius * 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  isNearShip(ship: Ship): boolean {
    const dx = this.x - ship.x;
    const dy = this.y - ship.y;
    return Math.sqrt(dx * dx + dy * dy) < 45;
  }
}

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alive: boolean = true;
  gravity: number = 0;
  shrink: boolean = true;

  constructor(x: number, y: number, vx: number, vy: number, color: string, size: number, life: number, gravity: number = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.gravity = gravity;
  }

  update(): void {
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const alpha = this.life / this.maxLife;
    const s = this.shrink ? this.size * alpha : this.size;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.fillRect(this.x - s / 2, this.y - s / 2, s, s);
    ctx.restore();
  }
}
