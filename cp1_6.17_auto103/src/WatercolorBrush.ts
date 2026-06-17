export interface WatercolorBrushOptions {
  cx: number;
  cy: number;
  color: string;
  themeColors: string[];
}

interface PolygonVertex {
  x: number;
  y: number;
}

export class WatercolorBrush {
  cx: number;
  cy: number;
  vertices: PolygonVertex[];
  targetVertices: PolygonVertex[];
  color: string;
  opacity: number;
  maxOpacity: number;
  age: number;
  duration: number;
  radius: number;
  driftAngle: number;
  driftSpeed: number;
  finished: boolean;
  globalAlpha: number;
  baseVertices: PolygonVertex[];

  constructor(options: WatercolorBrushOptions) {
    this.cx = options.cx;
    this.cy = options.cy;
    this.color = this.pickColor(options.themeColors);
    this.maxOpacity = 0.3 + Math.random() * 0.3;
    this.opacity = 0;
    this.globalAlpha = 1;
    this.age = 0;
    this.duration = 800 + Math.random() * 400;
    this.radius = 30 + Math.random() * 50;
    this.driftAngle = Math.random() * Math.PI * 2;
    this.driftSpeed = 0.3 + Math.random() * 0.2;
    this.finished = false;

    const vertexCount = 8 + Math.floor(Math.random() * 5);
    this.baseVertices = this.generateBaseVertices(vertexCount);
    this.vertices = this.baseVertices.map(() => ({ x: this.cx, y: this.cy }));
    this.targetVertices = this.baseVertices.map((v) => ({
      x: this.cx + v.x,
      y: this.cy + v.y,
    }));
  }

  private pickColor(themeColors: string[]): string {
    return themeColors[Math.floor(Math.random() * themeColors.length)];
  }

  private generateBaseVertices(count: number): PolygonVertex[] {
    const vertices: PolygonVertex[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const r = this.radius * (0.5 + Math.random() * 0.5);
      vertices.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }
    return vertices;
  }

  update(dt: number): void {
    if (this.finished) return;
    this.age += dt;

    const t = Math.min(this.age / this.duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);

    this.vertices = this.baseVertices.map((bv, i) => ({
      x: this.cx + bv.x * eased,
      y: this.cy + bv.y * eased,
    }));

    this.opacity = this.maxOpacity * (0.6 - 0.5 * eased);

    this.cx += Math.cos(this.driftAngle) * this.driftSpeed * (dt / 16);
    this.cy += Math.sin(this.driftAngle) * this.driftSpeed * (dt / 16);

    if (t >= 1) {
      this.finished = true;
      this.opacity = this.maxOpacity * 0.1;
    }
  }

  drift(): void {
    if (!this.finished) return;
    this.cx += Math.cos(this.driftAngle) * this.driftSpeed;
    this.cy += Math.sin(this.driftAngle) * this.driftSpeed;
    this.globalAlpha = Math.max(0, this.globalAlpha - 0.0008);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.vertices.length < 3) return;

    ctx.save();
    ctx.globalAlpha = this.opacity * this.globalAlpha;
    ctx.filter = 'blur(1px)';

    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      const prev = this.vertices[i - 1];
      const curr = this.vertices[i];
      const cpx = (prev.x + curr.x) / 2 + (Math.random() - 0.5) * 2;
      const cpy = (prev.y + curr.y) / 2 + (Math.random() - 0.5) * 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
    }
    const last = this.vertices[this.vertices.length - 1];
    const first = this.vertices[0];
    ctx.quadraticCurveTo(
      last.x,
      last.y,
      (last.x + first.x) / 2,
      (last.y + first.y) / 2
    );
    ctx.closePath();

    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.restore();
  }
}
