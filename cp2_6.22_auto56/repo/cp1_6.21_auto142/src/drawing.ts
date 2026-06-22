export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export type SpellType = 'fire' | 'ice' | 'lightning';

export const SPELL_COLORS: Record<SpellType, string> = {
  fire: '#FF4500',
  ice: '#00BFFF',
  lightning: '#FFD700'
};

const MAX_HISTORY = 20;

export class DrawingManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private strokes: Stroke[] = [];
  private history: Stroke[][] = [[]];
  private historyIndex: number = 0;
  private currentStroke: Stroke | null = null;
  private isDrawing: boolean = false;
  private spellType: SpellType = 'fire';
  private needsRender: boolean = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  getSpellType(): SpellType {
    return this.spellType;
  }

  setSpellType(type: SpellType): void {
    this.spellType = type;
  }

  startDrawing(x: number, y: number): void {
    this.isDrawing = true;
    this.currentStroke = {
      points: [{ x, y }],
      color: SPELL_COLORS[this.spellType],
      width: 4
    };
    this.needsRender = true;
  }

  draw(x: number, y: number): void {
    if (!this.isDrawing || !this.currentStroke) return;
    this.currentStroke.points.push({ x, y });
    this.needsRender = true;
  }

  stopDrawing(): void {
    if (!this.isDrawing || !this.currentStroke) return;
    this.isDrawing = false;
    if (this.currentStroke.points.length > 1) {
      this.strokes.push(this.currentStroke);
      this.pushHistory();
    }
    this.currentStroke = null;
  }

  private pushHistory(): void {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(this.strokes.map(s => ({ ...s, points: [...s.points] })));
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
    this.needsRender = true;
  }

  undo(): boolean {
    if (this.historyIndex <= 0) return false;
    this.historyIndex--;
    this.strokes = this.history[this.historyIndex].map(s => ({ ...s, points: [...s.points] }));
    this.needsRender = true;
    return true;
  }

  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) return false;
    this.historyIndex++;
    this.strokes = this.history[this.historyIndex].map(s => ({ ...s, points: [...s.points] }));
    this.needsRender = true;
    return true;
  }

  clear(): void {
    this.strokes = [];
    this.currentStroke = null;
    this.history = [[]];
    this.historyIndex = 0;
    this.needsRender = true;
  }

  getAllPoints(): Point[] {
    const pts: Point[] = [];
    for (const s of this.strokes) {
      for (const p of s.points) {
        pts.push(p);
      }
    }
    return pts;
  }

  getStrokes(): Stroke[] {
    return this.strokes;
  }

  loadStrokes(strokes: Stroke[]): void {
    this.strokes = strokes.map(s => ({ ...s, points: [...s.points] }));
    this.pushHistory();
  }

  isDirty(): boolean {
    return this.needsRender;
  }

  markClean(): void {
    this.needsRender = false;
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#F5E6CA';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawParchmentTexture(ctx);

    for (const stroke of this.strokes) {
      this.renderStroke(ctx, stroke);
    }
    if (this.currentStroke) {
      this.renderStroke(ctx, this.currentStroke);
    }

    this.needsRender = false;
  }

  private drawParchmentTexture(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const size = Math.random() * 3 + 1;
      ctx.fillStyle = Math.random() > 0.5 ? '#8B7355' : '#A0926B';
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();
  }

  private renderStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
    if (stroke.points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];
      const mx = (prev.x + curr.x) / 2;
      const my = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
    }
    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();

    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = stroke.width - 1;
    ctx.stroke();

    ctx.restore();
  }

  renderToThumbnail(thumbCanvas: HTMLCanvasElement): void {
    const tctx = thumbCanvas.getContext('2d')!;
    const scaleX = thumbCanvas.width / this.canvas.width;
    const scaleY = thumbCanvas.height / this.canvas.height;
    tctx.fillStyle = '#F5E6CA';
    tctx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);
    tctx.save();
    tctx.scale(scaleX, scaleY);
    for (const stroke of this.strokes) {
      this.renderStroke(tctx, stroke);
    }
    tctx.restore();
  }
}
