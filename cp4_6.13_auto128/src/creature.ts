interface Genes {
  size: number;
  speed: number;
  colorHue: number;
  aggression: number;
  reproductionTendency: number;
}

interface TailPoint {
  x: number;
  y: number;
  age: number;
}

const CANVAS_SIZE = 600;
const TAIL_MAX_LENGTH = 8;
const HUNGER_THRESHOLD = 30;
const SLOW_FACTOR = 0.6;

export class Creature {
  genes: Genes;
  x: number;
  y: number;
  vx: number;
  vy: number;
  energy: number;
  tail: TailPoint[];
  alive: boolean;
  sides: number;
  hungerFlashTimer: number;

  constructor(x: number, y: number, genes?: Partial<Genes>) {
    this.genes = {
      size: genes?.size ?? (Math.random() * 8 + 6),
      speed: genes?.speed ?? (Math.random() * 1.5 + 0.5),
      colorHue: genes?.colorHue ?? (Math.random() * 360),
      aggression: genes?.aggression ?? (Math.random()),
      reproductionTendency: genes?.reproductionTendency ?? (Math.random()),
    };
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * this.genes.speed;
    this.vy = Math.sin(angle) * this.genes.speed;
    this.energy = 80;
    this.tail = [];
    this.alive = true;
    this.sides = Math.floor(this.genes.size / 2) + 3;
    this.hungerFlashTimer = 0;
  }

  get effectiveSpeed(): number {
    return this.energy < HUNGER_THRESHOLD ? this.genes.speed * SLOW_FACTOR : this.genes.speed;
  }

  update(dt: number, speedMultiplier: number): void {
    const spd = this.effectiveSpeed;
    const ratio = spd / (this.genes.speed || 0.01);
    this.x += this.vx * ratio * dt * speedMultiplier;
    this.y += this.vy * ratio * dt * speedMultiplier;

    const r = this.genes.size;
    if (this.x - r < 0) { this.x = r; this.vx = Math.abs(this.vx); }
    if (this.x + r > CANVAS_SIZE) { this.x = CANVAS_SIZE - r; this.vx = -Math.abs(this.vx); }
    if (this.y - r < 0) { this.y = r; this.vy = Math.abs(this.vy); }
    if (this.y + r > CANVAS_SIZE) { this.y = CANVAS_SIZE - r; this.vy = -Math.abs(this.vy); }

    this.tail.unshift({ x: this.x, y: this.y, age: 0 });
    if (this.tail.length > TAIL_MAX_LENGTH) {
      this.tail.pop();
    }
    for (let i = 0; i < this.tail.length; i++) {
      this.tail[i].age += dt * speedMultiplier;
    }

    this.hungerFlashTimer += dt * speedMultiplier;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.drawTail(ctx);
    this.drawBody(ctx);
  }

  private drawTail(ctx: CanvasRenderingContext2D): void {
    for (let i = this.tail.length - 1; i >= 1; i--) {
      const t = this.tail[i];
      const progress = i / this.tail.length;
      const alpha = 0.6 * (1 - progress);
      const radius = this.genes.size * (1 - progress * 0.7);
      const gradient = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, radius);
      gradient.addColorStop(0, `hsla(${this.genes.colorHue}, 100%, 60%, ${alpha})`);
      gradient.addColorStop(1, `hsla(${this.genes.colorHue}, 100%, 60%, 0)`);
      ctx.beginPath();
      ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  private drawBody(ctx: CanvasRenderingContext2D): void {
    const isHungry = this.energy < HUNGER_THRESHOLD;
    const flashRed = isHungry && Math.sin(this.hungerFlashTimer * 8) > 0;
    const hue = flashRed ? 0 : this.genes.colorHue;
    const saturation = flashRed ? 100 : 100;
    const lightness = flashRed ? 50 : 60;

    ctx.save();
    ctx.translate(this.x, this.y);
    const angle = Math.atan2(this.vy, this.vx);
    ctx.rotate(angle);

    ctx.beginPath();
    const s = this.sides;
    const r = this.genes.size;
    for (let i = 0; i < s; i++) {
      const a = (Math.PI * 2 / s) * i - Math.PI / 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    ctx.shadowBlur = 12;
    ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    ctx.fill();
    ctx.strokeStyle = `hsl(${hue}, 80%, 80%)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  checkHunger(): boolean {
    return this.energy < HUNGER_THRESHOLD;
  }

  distanceTo(other: Creature): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  collidesWith(other: Creature): boolean {
    return this.distanceTo(other) < (this.genes.size + other.genes.size);
  }
}
