import type { Point, Stroke, CharacterSegment, Candidate } from './types';

export interface RendererState {
  getCurrentStroke: () => Stroke | null;
  getCurrentSegmentStrokes: () => Stroke[];
  getSegments: () => CharacterSegment[];
  getPendingCandidates: () => Candidate[];
  getSelectedCandidate: () => number;
  isErasing: () => boolean;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: RendererState;
  private dpr = 1;
  private rafId: number | null = null;
  private pendingPoints: Array<{ p: Point; addedAt: number }> = [];
  private readonly TRAIL_DELAY_MS = 100;
  private readonly GRID_SIZE = 40;
  private readonly GRID_COLOR = 'rgba(208, 208, 208, 0.15)';
  private readonly STROKE_COLOR = '#333333';
  private readonly STROKE_WIDTH = 3;
  private readonly ERROR_COLOR = '#FF6B6B';
  private readonly ERROR_PERIOD = 500;
  private startTime = performance.now();
  private canvasWrapper: HTMLElement;
  private topCandidateBtns: NodeListOf<HTMLElement>;
  private bottomCandidateBtns: NodeListOf<HTMLElement>;

  constructor(
    canvas: HTMLCanvasElement,
    state: RendererState,
    wrapper: HTMLElement,
  ) {
    this.canvas = canvas;
    this.canvasWrapper = wrapper;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.state = state;
    this.setupCanvas();
    this.topCandidateBtns = document.querySelectorAll('#candidate-bar .candidate-btn');
    this.bottomCandidateBtns = document.querySelectorAll('.bottom-candidates .candidate-btn');
  }

  private setupCanvas(): void {
    this.dpr = window.devicePixelRatio || 1;
    const logicalW = 600;
    const logicalH = 400;
    this.canvas.width = logicalW * this.dpr;
    this.canvas.height = logicalH * this.dpr;
    this.canvas.style.width = '600px';
    this.canvas.style.height = '400px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  public resize(): void {
    this.setupCanvas();
  }

  public start(): void {
    if (this.rafId !== null) return;
    const loop = () => {
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  public stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public addPendingPoint(p: Point): void {
    this.pendingPoints.push({ p, addedAt: performance.now() });
  }

  public triggerEraseAnimation(cb: () => void): void {
    this.canvasWrapper.classList.add('erasing');
    const onEnd = () => {
      this.canvasWrapper.classList.remove('erasing');
      cb();
    };
    this.canvasWrapper.addEventListener('animationend', onEnd, { once: true });
    setTimeout(onEnd, 400);
  }

  private logicalSize(): { w: number; h: number } {
    return { w: 600, h: 400 };
  }

  private drawGrid(): void {
    const { w, h } = this.logicalSize();
    this.ctx.strokeStyle = this.GRID_COLOR;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let x = 0; x <= w; x += this.GRID_SIZE) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += this.GRID_SIZE) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
    }
    this.ctx.stroke();
  }

  private drawStroke(
    stroke: Stroke,
    opts: {
      color?: string;
      width?: number;
      alpha?: number;
      dashed?: boolean;
      phase?: number;
    } = {},
  ): void {
    if (stroke.points.length === 0) return;

    const color = opts.color ?? this.STROKE_COLOR;
    const width = opts.width ?? this.STROKE_WIDTH;
    const alpha = opts.alpha ?? 1;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;

    if (opts.dashed) {
      const phase = opts.phase ?? 0;
      this.ctx.setLineDash([6, 6]);
      this.ctx.lineDashOffset = -phase;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    const pts = stroke.points;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      this.ctx.quadraticCurveTo(p0.x, p0.y, mx, my);
    }
    const last = pts[pts.length - 1];
    this.ctx.lineTo(last.x, last.y);
    this.ctx.stroke();

    if (opts.dashed) {
      this.ctx.setLineDash([]);
    }
    this.ctx.restore();
  }

  private drawTrail(): void {
    const now = performance.now();
    const windowStart = now - this.TRAIL_DELAY_MS;
    const cutoff = windowStart - 80;

    this.pendingPoints = this.pendingPoints.filter(pp => pp.addedAt >= cutoff);

    for (const pp of this.pendingPoints) {
      if (pp.addedAt > now) continue;
      const age = now - pp.addedAt;
      if (age < 0) continue;
      const progress = Math.min(1, age / this.TRAIL_DELAY_MS);
      const alpha = 0.05 + (1 - progress) * 0.15;
      const w = this.STROKE_WIDTH * (0.6 + progress * 0.6);

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = this.STROKE_COLOR;
      this.ctx.beginPath();
      this.ctx.arc(pp.p.x, pp.p.y, w / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  private updateCandidates(): void {
    const cands = this.state.getPendingCandidates();
    const sel = this.state.getSelectedCandidate();

    const apply = (btns: NodeListOf<HTMLElement>) => {
      btns.forEach((btn, idx) => {
        const cand = cands[idx];
        const el = btn as HTMLElement;
        if (cand) {
          el.textContent = cand.char;
          el.title = `${cand.char} 置信度: ${(cand.confidence * 100).toFixed(0)}%`;
          (el as HTMLButtonElement).disabled = false;
        } else {
          el.textContent = '—';
          el.title = '';
          (el as HTMLButtonElement).disabled = true;
        }
        if (sel === idx && cand) {
          el.classList.add('selected');
        } else {
          el.classList.remove('selected');
        }
      });
    };

    apply(this.topCandidateBtns);
    apply(this.bottomCandidateBtns);
  }

  private render(): void {
    const { w, h } = this.logicalSize();
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.fillStyle = '#FAFAFA';
    this.ctx.fillRect(0, 0, w, h);

    this.drawGrid();

    const segments = this.state.getSegments();
    const t = performance.now() - this.startTime;

    for (const seg of segments) {
      const isLowConf = seg.confidence < 0.4 && seg.confidence > 0;
      for (const stroke of seg.strokes) {
        if (isLowConf) {
          const phase = (t % this.ERROR_PERIOD) / this.ERROR_PERIOD * 24;
          const visible = Math.floor(t / (this.ERROR_PERIOD / 2)) % 2 === 0;
          if (visible) {
            this.drawStroke(stroke, {
              color: this.ERROR_COLOR,
              dashed: true,
              phase,
              width: 3.5,
            });
          } else {
            this.drawStroke(stroke, { color: this.ERROR_COLOR, alpha: 0.25 });
          }
        } else {
          this.drawStroke(stroke);
        }
      }
    }

    const currentSegStrokes = this.state.getCurrentSegmentStrokes();
    for (const s of currentSegStrokes) {
      this.drawStroke(s, { color: '#555555' });
    }

    const current = this.state.getCurrentStroke();
    if (current && current.points.length > 0) {
      this.drawStroke(current, { color: this.STROKE_COLOR, alpha: 0.95 });
    }

    this.drawTrail();
    this.updateCandidates();
  }
}
