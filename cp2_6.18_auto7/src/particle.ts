const COLOR_STOPS: [number, string, string][] = [
  [0, '#00FF88', '#00DDFF'],
  [0.5, '#00DDFF', '#FF44AA'],
];

function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

export function speedToColor(speed: number): string {
  const maxLow = 0.5;
  const maxMid = 1.5;
  if (speed <= maxLow) {
    return lerpColor('#00FF88', '#00DDFF', speed / maxLow);
  } else if (speed <= maxMid) {
    return lerpColor('#00DDFF', '#FF44AA', (speed - maxLow) / (maxMid - maxLow));
  }
  return '#FF44AA';
}

export class Particle {
  x: number = 0;
  y: number = 0;
  vx: number = 0;
  vy: number = 0;
  size: number = 2;
  color: string = '#00FF88';
  life: number = 1;
  trail: { x: number; y: number }[] = [];

  init(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number
  ): void {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.life = 1;
    this.trail.length = 0;
    this.updateColor();
  }

  update(dt: number, w: number, h: number, boundaryRestitution: number, trailLen: number): void {
    if (trailLen > 0) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > trailLen) {
        this.trail.shift();
      }
    } else {
      this.trail.length = 0;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x - this.size < 0) {
      this.x = this.size;
      this.vx = Math.abs(this.vx) * boundaryRestitution;
    } else if (this.x + this.size > w) {
      this.x = w - this.size;
      this.vx = -Math.abs(this.vx) * boundaryRestitution;
    }
    if (this.y - this.size < 0) {
      this.y = this.size;
      this.vy = Math.abs(this.vy) * boundaryRestitution;
    } else if (this.y + this.size > h) {
      this.y = h - this.size;
      this.vy = -Math.abs(this.vy) * boundaryRestitution;
    }

    this.updateColor();
  }

  updateColor(): void {
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.color = speedToColor(speed);
  }

  getGlowRadius(): number {
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const t = Math.min(speed / 3, 1);
    return 2 + t * 6;
  }

  hexToRgb(hex: string): { r: number; g: number; b: number } {
    const rgbMatch = hex.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10),
      };
    }
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  }

  collideWith(other: Particle): void {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = this.size + other.size;

    if (dist < minDist && dist > 0.001) {
      const nx = dx / dist;
      const ny = dy / dist;
      const dvx = this.vx - other.vx;
      const dvy = this.vy - other.vy;
      const dvn = dvx * nx + dvy * ny;

      if (dvn > 0) {
        this.vx -= dvn * nx;
        this.vy -= dvn * ny;
        other.vx += dvn * nx;
        other.vy += dvn * ny;
      }

      const overlap = minDist - dist;
      const sep = overlap * 0.5;
      this.x -= nx * sep;
      this.y -= ny * sep;
      other.x += nx * sep;
      other.y += ny * sep;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const glow = this.getGlowRadius();
    const rgb = this.hexToRgb(this.color);

    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glow);
    gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.9)`);
    gradient.addColorStop(0.3, `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`);
    gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glow, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}
