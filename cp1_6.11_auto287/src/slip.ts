export type BrushStyle = 'fine' | 'medium' | 'thick';

export interface StrokePoint {
  x: number;
  y: number;
  speed: number;
  time: number;
}

export interface Stroke {
  points: StrokePoint[];
  style: BrushStyle;
  opacity: number;
  removing: boolean;
}

const BRUSH_MULTIPLIER: Record<BrushStyle, number> = {
  fine: 0.6,
  medium: 1.0,
  thick: 1.6
};

export class Slip {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  strokes: Stroke[] = [];
  dryingProgress = 1;
  tiltAngle = 0;
  tiltTarget = 0;
  tiltTimer = 0;
  bound = false;
  hoverBrightness = 0;

  private static fiberPattern: HTMLCanvasElement | null = null;

  constructor(index: number, x: number, y: number, width: number, height: number) {
    this.index = index;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  static createFiberPattern(): HTMLCanvasElement {
    if (Slip.fiberPattern) return Slip.fiberPattern;
    const c = document.createElement('canvas');
    c.width = 40;
    c.height = 120;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, 0, 40, 120);
    ctx.strokeStyle = 'rgba(160, 114, 75, 0.25)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 120; i += 2) {
      ctx.beginPath();
      ctx.moveTo(0, i + Math.random() * 0.5);
      ctx.lineTo(40, i + Math.random() * 0.5);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 40; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 120);
      ctx.stroke();
    }
    Slip.fiberPattern = c;
    return c;
  }

  containsPoint(px: number, py: number): boolean {
    return px >= this.x && px <= this.x + this.width &&
      py >= this.y && py <= this.y + this.height;
  }

  getGroovePositions(): { top: { x: number; y: number }; bottom: { x: number; y: number } } {
    return {
      top: { x: this.x + this.width * 0.15, y: this.y + this.height * 0.25 },
      bottom: { x: this.x + this.width * 0.15, y: this.y + this.height * 0.75 }
    };
  }

  addStroke(points: StrokePoint[], style: BrushStyle): void {
    if (points.length < 2) return;
    this.strokes.push({
      points,
      style,
      opacity: 1,
      removing: false
    });
    this.dryingProgress = 0;
  }

  undoStroke(): boolean {
    for (let i = this.strokes.length - 1; i >= 0; i--) {
      if (!this.strokes[i].removing) {
        this.strokes[i].removing = true;
        return true;
      }
    }
    return false;
  }

  triggerTilt(): void {
    this.tiltTarget = -5 * Math.PI / 180;
    this.tiltTimer = 0.3;
  }

  update(dt: number): void {
    if (this.dryingProgress < 1) {
      this.dryingProgress = Math.min(1, this.dryingProgress + dt * 0.5);
    }
    if (this.tiltTimer > 0) {
      this.tiltTimer -= dt;
      if (this.tiltTimer <= 0) {
        this.tiltTarget = 0;
      }
    }
    this.tiltAngle += (this.tiltTarget - this.tiltAngle) * Math.min(1, dt * 12);

    for (let i = this.strokes.length - 1; i >= 0; i--) {
      if (this.strokes[i].removing) {
        this.strokes[i].opacity -= dt * 3.3;
        if (this.strokes[i].opacity <= 0) {
          this.strokes.splice(i, 1);
        }
      }
    }

    const targetHover = 0;
    this.hoverBrightness += (targetHover - this.hoverBrightness) * dt * 10;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate(this.tiltAngle);
    ctx.translate(-cx, -cy);

    const brightness = 1 + this.hoverBrightness * 0.15;
    if (brightness > 1) {
      ctx.filter = `brightness(${brightness})`;
    }

    const pattern = Slip.createFiberPattern();
    ctx.drawImage(pattern, this.x, this.y, this.width, this.height);

    ctx.strokeStyle = 'rgba(139, 90, 43, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);

    const grooves = this.getGroovePositions();
    const grooveRadius = Math.max(2, this.width * 0.075);
    ctx.fillStyle = '#6B3A1F';
    ctx.beginPath();
    ctx.arc(grooves.top.x, grooves.top.y, grooveRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(grooves.bottom.x, grooves.bottom.y, grooveRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(90, 50, 20, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(grooves.top.x, grooves.top.y, grooveRadius + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(grooves.bottom.x, grooves.bottom.y, grooveRadius + 1, 0, Math.PI * 2);
    ctx.stroke();

    if (this.bound) {
      ctx.fillStyle = '#B8860B';
      const knotR = 3;
      ctx.beginPath();
      ctx.arc(grooves.bottom.x, grooves.bottom.y, knotR, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const stroke of this.strokes) {
      this.renderStroke(ctx, stroke);
    }

    ctx.filter = 'none';
    ctx.restore();
  }

  private renderStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
    if (stroke.points.length < 2) return;
    const mult = BRUSH_MULTIPLIER[stroke.style];
    const dryFactor = 0.65 + this.dryingProgress * 0.35;

    ctx.save();
    ctx.globalAlpha = stroke.opacity * dryFactor;
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];
      let w: number;
      if (curr.speed < 50) w = 4;
      else if (curr.speed < 150) w = 2;
      else w = 1;
      w *= mult;

      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();

      if (curr.speed > 200 && Math.random() > 0.65) {
        const sr = Math.random() * 1.5 + 0.5;
        ctx.fillStyle = `rgba(26, 26, 26, ${stroke.opacity * 0.4})`;
        ctx.beginPath();
        ctx.arc(
          curr.x + (Math.random() - 0.5) * 12,
          curr.y + (Math.random() - 0.5) * 12,
          sr, 0, Math.PI * 2
        );
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
