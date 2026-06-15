import { parseExpression } from './parser';
import type { ViewRange, AnalysisResult, MonoInterval, ConcInterval } from './analyzer';
import { analyzeFunction } from './analyzer';
import {
  setupCanvas, drawAll, drawMarkers,
  StyleOptions, pxToX, pxToY, xToPx, yToPx
} from './plotter';

const DEFAULT_RANGE: ViewRange = {
  xMin: -10, xMax: 10,
  yMin: -10, yMax: 10,
  xTickStep: 1, yTickStep: 1
};

const PRESET_COLORS = ['#1a237e', '#e53935', '#43a047', '#fb8c00', '#8e24aa', '#00838f'];

interface State {
  fn: ((x: number) => number) | null;
  range: ViewRange;
  style: StyleOptions;
  analysis: AnalysisResult | null;
  markerAnim: number;
}

class App {
  private state: State;
  private canvasWidth = 0;
  private canvasHeight = 0;

  private mainCanvas: HTMLCanvasElement;
  private markerCanvas: HTMLCanvasElement;
  private mainCtx: CanvasRenderingContext2D;
  private markerCtx: CanvasRenderingContext2D;
  private canvasWrapper: HTMLElement;

  private funcInput: HTMLInputElement;
  private errorMsg: HTMLElement;
  private drawBtn: HTMLButtonElement;
  private analyzeBtn: HTMLButtonElement;
  private exportBtn: HTMLButtonElement;

  private gearBtn: HTMLButtonElement;
  private panelBody: HTMLElement;

  private xMinInput: HTMLInputElement;
  private xMaxInput: HTMLInputElement;
  private xTickInput: HTMLInputElement;
  private yMinInput: HTMLInputElement;
  private yMaxInput: HTMLInputElement;
  private yTickInput: HTMLInputElement;
  private gridToggle: HTMLElement;
  private labelToggle: HTMLElement;
  private colorPresets: HTMLElement;
  private customColor: HTMLInputElement;
  private resetBtn: HTMLButtonElement;

  private analysisResult: HTMLElement;
  private monoBar: HTMLElement;
  private concBar: HTMLElement;

  private isDragging = false;
  private dragStartPx = 0;
  private dragStartPy = 0;
  private dragRange: ViewRange | null = null;
  private pendingRedraw = false;
  private animFrameId: number | null = null;

  private markerAnimRaf: number | null = null;
  private markerAnimStart = 0;

  constructor() {
    this.state = {
      fn: null,
      range: { ...DEFAULT_RANGE },
      style: {
        curveColor: '#1a237e',
        showGrid: true,
        showAxisLabels: true,
        gridDensity: 1
      },
      analysis: null,
      markerAnim: 0
    };

    this.mainCanvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
    this.markerCanvas = document.getElementById('markerCanvas') as HTMLCanvasElement;
    this.canvasWrapper = document.getElementById('canvasWrapper') as HTMLElement;

    const mctx = this.mainCanvas.getContext('2d');
    const mktx = this.markerCanvas.getContext('2d');
    if (!mctx || !mktx) throw new Error('Canvas not supported');
    this.mainCtx = mctx;
    this.markerCtx = mktx;

    this.funcInput = document.getElementById('funcInput') as HTMLInputElement;
    this.errorMsg = document.getElementById('errorMsg') as HTMLElement;
    this.drawBtn = document.getElementById('drawBtn') as HTMLButtonElement;
    this.analyzeBtn = document.getElementById('analyzeBtn') as HTMLButtonElement;
    this.exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;

    this.gearBtn = document.getElementById('gearBtn') as HTMLButtonElement;
    this.panelBody = document.getElementById('panelBody') as HTMLElement;

    this.xMinInput = document.getElementById('xMinInput') as HTMLInputElement;
    this.xMaxInput = document.getElementById('xMaxInput') as HTMLInputElement;
    this.xTickInput = document.getElementById('xTickInput') as HTMLInputElement;
    this.yMinInput = document.getElementById('yMinInput') as HTMLInputElement;
    this.yMaxInput = document.getElementById('yMaxInput') as HTMLInputElement;
    this.yTickInput = document.getElementById('yTickInput') as HTMLInputElement;
    this.gridToggle = document.getElementById('gridToggle') as HTMLElement;
    this.labelToggle = document.getElementById('labelToggle') as HTMLElement;
    this.colorPresets = document.getElementById('colorPresets') as HTMLElement;
    this.customColor = document.getElementById('customColor') as HTMLInputElement;
    this.resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;

    this.analysisResult = document.getElementById('analysisResult') as HTMLElement;
    this.monoBar = document.getElementById('monoBar') as HTMLElement;
    this.concBar = document.getElementById('concBar') as HTMLElement;
  }

  start(): void {
    this.setupCanvasSize();
    this.bindEvents();
    this.validateAndDraw(true);
    window.addEventListener('resize', () => {
      this.setupCanvasSize();
      this.requestRedraw();
      this.redrawMarkers();
    });
  }

  private setupCanvasSize(): void {
    setupCanvas(this.mainCanvas);
    setupCanvas(this.markerCanvas);
    const rect = this.mainCanvas.getBoundingClientRect();
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;
  }

  private bindEvents(): void {
    this.funcInput.addEventListener('input', () => this.validateLive());
    this.funcInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.validateAndDraw();
      }
    });

    this.drawBtn.addEventListener('click', () => this.validateAndDraw());
    this.analyzeBtn.addEventListener('click', () => this.runAnalysis());
    this.exportBtn.addEventListener('click', () => this.exportPNG());

    this.gearBtn.addEventListener('click', () => {
      this.panelBody.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      const target = e.target as Node;
      if (!this.panelBody.contains(target) && !this.gearBtn.contains(target)) {
        if (window.innerWidth >= 768) {
          this.panelBody.classList.remove('open');
        }
      }
    });

    const rangeInputs: Array<[HTMLInputElement, keyof ViewRange]> = [
      [this.xMinInput, 'xMin'], [this.xMaxInput, 'xMax'], [this.xTickInput, 'xTickStep'],
      [this.yMinInput, 'yMin'], [this.yMaxInput, 'yMax'], [this.yTickInput, 'yTickStep']
    ];
    for (const [el, key] of rangeInputs) {
      el.addEventListener('change', () => {
        const v = parseFloat(el.value);
        if (!isFinite(v)) {
          el.value = String(this.state.range[key]);
          return;
        }
        this.state.range[key] = v;
        this.syncInputsFromState();
        this.requestRedraw();
        if (this.state.analysis) this.redrawMarkers();
      });
    }

    this.gridToggle.addEventListener('click', () => {
      this.state.style.showGrid = !this.state.style.showGrid;
      this.gridToggle.classList.toggle('on', this.state.style.showGrid);
      this.requestRedraw();
    });

    this.labelToggle.addEventListener('click', () => {
      this.state.style.showAxisLabels = !this.state.style.showAxisLabels;
      this.labelToggle.classList.toggle('on', this.state.style.showAxisLabels);
      this.requestRedraw();
    });

    this.colorPresets.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('color-dot')) {
        const color = target.dataset.color!;
        this.setCurveColor(color);
      }
    });

    this.customColor.addEventListener('input', () => {
      this.setCurveColor(this.customColor.value);
    });

    this.resetBtn.addEventListener('click', () => {
      this.state.range = { ...DEFAULT_RANGE };
      this.syncInputsFromState();
      this.requestRedraw();
      if (this.state.analysis) this.redrawMarkers();
    });

    this.mainCanvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());

    this.mainCanvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    this.mainCanvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.mainCanvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.mainCanvas.addEventListener('touchend', () => this.onMouseUp());
  }

  private setCurveColor(color: string): void {
    this.state.style.curveColor = color;
    const dots = this.colorPresets.querySelectorAll('.color-dot');
    dots.forEach((d) => {
      const el = d as HTMLElement;
      el.classList.toggle('active', el.dataset.color === color);
    });
    if (PRESET_COLORS.includes(color)) {
      this.customColor.value = color;
    }
    this.requestRedraw();
  }

  private syncInputsFromState(): void {
    const r = this.state.range;
    this.xMinInput.value = String(r.xMin);
    this.xMaxInput.value = String(r.xMax);
    this.xTickInput.value = String(r.xTickStep);
    this.yMinInput.value = String(r.yMin);
    this.yMaxInput.value = String(r.yMax);
    this.yTickInput.value = String(r.yTickStep);
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.startDrag(e.offsetX, e.offsetY);
  }

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    const rect = this.mainCanvas.getBoundingClientRect();
    this.startDrag(t.clientX - rect.left, t.clientY - rect.top);
  }

  private startDrag(px: number, py: number): void {
    this.isDragging = true;
    this.dragStartPx = px;
    this.dragStartPy = py;
    this.dragRange = { ...this.state.range };
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    const rect = this.mainCanvas.getBoundingClientRect();
    this.continueDrag(e.clientX - rect.left, e.clientY - rect.top);
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    const rect = this.mainCanvas.getBoundingClientRect();
    this.continueDrag(t.clientX - rect.left, t.clientY - rect.top);
  }

  private continueDrag(px: number, py: number): void {
    if (!this.dragRange) return;
    const dxPx = px - this.dragStartPx;
    const dyPx = py - this.dragStartPy;
    const r0 = this.dragRange;
    const w = this.canvasWidth, h = this.canvasHeight;
    const scaleX = (r0.xMax - r0.xMin) / (w - 80);
    const scaleY = (r0.yMax - r0.yMin) / (h - 75);
    this.state.range.xMin = r0.xMin - dxPx * scaleX;
    this.state.range.xMax = r0.xMax - dxPx * scaleX;
    this.state.range.yMin = r0.yMin + dyPx * scaleY;
    this.state.range.yMax = r0.yMax + dyPx * scaleY;
    this.syncInputsFromState();
    this.requestRedraw();
    if (this.state.analysis) this.redrawMarkers();
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.dragRange = null;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const rect = this.mainCanvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 1.12 : 0.892;
    this.zoomAt(px, py, factor);
  }

  private zoomAt(px: number, py: number, factor: number): void {
    const r = this.state.range;
    const x = pxToX(px, this.canvasWidth, r);
    const y = pxToY(py, this.canvasHeight, r);
    r.xMin = x - (x - r.xMin) * factor;
    r.xMax = x + (r.xMax - x) * factor;
    r.yMin = y - (y - r.yMin) * factor;
    r.yMax = y + (r.yMax - y) * factor;
    this.syncInputsFromState();
    this.requestRedraw();
    if (this.state.analysis) this.redrawMarkers();
  }

  private validateLive(): void {
    const text = this.funcInput.value;
    if (!text.trim()) {
      this.showError('');
      return;
    }
    const res = parseExpression(text);
    if (res.success) {
      this.showError('');
    } else {
      this.showError(res.error || '表达式无效');
    }
  }

  private showError(msg: string): void {
    if (msg) {
      this.funcInput.classList.add('error');
      this.errorMsg.textContent = '⚠ ' + msg;
      this.errorMsg.classList.add('visible');
    } else {
      this.funcInput.classList.remove('error');
      this.errorMsg.textContent = '';
      this.errorMsg.classList.remove('visible');
    }
  }

  private validateAndDraw(initial = false): void {
    const text = this.funcInput.value;
    const res = parseExpression(text);
    if (!res.success) {
      this.showError(res.error || '表达式无效');
      this.state.fn = null;
      this.clearAnalysis();
      this.requestRedraw();
      return;
    }
    this.showError('');
    this.state.fn = res.fn!;
    if (!initial) {
      this.clearAnalysis();
    }
    this.requestRedraw();
  }

  private runAnalysis(): void {
    if (!this.state.fn) {
      this.validateAndDraw();
      if (!this.state.fn) return;
    }

    const result = analyzeFunction(this.state.fn, {
      xMin: this.state.range.xMin,
      xMax: this.state.range.xMax
    });

    this.state.analysis = result;
    this.startMarkerAnimation();
    this.renderIntervalBars(result);

    this.analysisResult.classList.add('visible');
    this.markerCanvas.classList.add('visible');
  }

  private clearAnalysis(): void {
    this.state.analysis = null;
    this.state.markerAnim = 0;
    if (this.markerAnimRaf !== null) {
      cancelAnimationFrame(this.markerAnimRaf);
      this.markerAnimRaf = null;
    }
    this.analysisResult.classList.remove('visible');
    this.markerCanvas.classList.remove('visible');
    this.markerCtx.clearRect(0, 0, this.markerCanvas.width, this.markerCanvas.height);
  }

  private startMarkerAnimation(): void {
    if (this.markerAnimRaf !== null) cancelAnimationFrame(this.markerAnimRaf);
    this.state.markerAnim = 0;
    this.markerAnimStart = performance.now();
    const DURATION = 400;

    const animate = (now: number) => {
      const elapsed = now - this.markerAnimStart;
      const t = Math.min(1, elapsed / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      this.state.markerAnim = eased;
      this.redrawMarkers();
      if (t < 1) {
        this.markerAnimRaf = requestAnimationFrame(animate);
      } else {
        this.markerAnimRaf = null;
      }
    };
    this.markerAnimRaf = requestAnimationFrame(animate);
  }

  private renderIntervalBars(result: AnalysisResult): void {
    const { xMin, xMax } = this.state.range;
    const span = xMax - xMin;

    this.renderBar(this.monoBar, result.monotonicity.map((iv) => ({
      start: iv.start,
      end: iv.end,
      width: Math.max(0, Math.min(xMax, iv.end) - Math.max(xMin, iv.start)) / span,
      color: iv.property === 'increasing' ? '#43a047' : '#e53935',
      label: iv.property === 'increasing' ? '↗ 递增' : '↘ 递减',
      fullLabel: `[${formatIntervalLabel(iv.start, xMin)}, ${formatIntervalLabel(iv.end, xMax)}]`
    })));

    this.renderBar(this.concBar, result.concavity.map((iv) => ({
      start: iv.start,
      end: iv.end,
      width: Math.max(0, Math.min(xMax, iv.end) - Math.max(xMin, iv.start)) / span,
      color: iv.property === 'convex' ? '#1e88e5' : '#fb8c00',
      label: iv.property === 'convex' ? '⌣ 凸' : '⌢ 凹',
      fullLabel: `[${formatIntervalLabel(iv.start, xMin)}, ${formatIntervalLabel(iv.end, xMax)}]`
    })));
  }

  private renderBar(container: HTMLElement, segments: Array<{
    width: number; color: string; label: string; fullLabel: string; start: number; end: number;
  }>): void {
    container.innerHTML = '';

    if (segments.length === 0) {
      container.innerHTML = '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:#999;font-size:11px;">暂无数据</div>';
      return;
    }

    const total = segments.reduce((s, x) => s + x.width, 0);
    const normalized = total > 0 ? segments.map(s => ({ ...s, width: s.width / total })) : segments;

    normalized.forEach((seg, i) => {
      const el = document.createElement('div');
      el.className = 'interval-segment';
      el.style.flexGrow = String(seg.width * 10000);
      el.style.flexBasis = '0';
      el.style.background = seg.color;
      el.title = `${seg.fullLabel} ${seg.label}`;

      if (seg.width > 0.06) {
        const lbl = document.createElement('span');
        lbl.className = 'segment-label';
        lbl.textContent = seg.label;
        el.appendChild(lbl);
      }

      el.style.animationDelay = `${i * 100}ms`;
      container.appendChild(el);

      requestAnimationFrame(() => {
        setTimeout(() => {
          el.classList.add('show');
        }, i * 100);
      });
    });
  }

  private requestRedraw(): void {
    if (this.pendingRedraw) return;
    this.pendingRedraw = true;
    this.animFrameId = requestAnimationFrame(() => {
      this.pendingRedraw = false;
      this.animFrameId = null;
      this.redraw();
    });
  }

  private redraw(): void {
    drawAll(
      this.mainCtx,
      this.state.fn,
      this.canvasWidth,
      this.canvasHeight,
      this.state.range,
      this.state.style
    );
  }

  private redrawMarkers(): void {
    if (!this.state.analysis) return;
    drawMarkers(
      this.markerCtx,
      this.state.analysis.extrema,
      this.state.analysis.inflections,
      this.canvasWidth,
      this.canvasHeight,
      this.state.range,
      { animationProgress: this.state.markerAnim }
    );
  }

  private exportPNG(): void {
    const EXPORT_W = 2048;
    const PAD_TOP = 60, PAD_BOTTOM = 260, GAP = 30;
    const EXPORT_H_GRAPH = Math.round(EXPORT_W * 0.6);
    const EXPORT_H = EXPORT_H_GRAPH + PAD_TOP + PAD_BOTTOM;

    const off = document.createElement('canvas');
    off.width = EXPORT_W;
    off.height = EXPORT_H;
    const octx = off.getContext('2d')!;

    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, EXPORT_W, EXPORT_H);

    const scaleX = EXPORT_W / this.canvasWidth;
    const scaleY = EXPORT_H_GRAPH / this.canvasHeight;
    const useScale = Math.min(scaleX, scaleY);
    const offsetX = (EXPORT_W - this.canvasWidth * useScale) / 2;

    octx.save();
    octx.translate(offsetX, PAD_TOP);
    octx.scale(useScale, useScale);

    const origRange = this.state.range;
    drawAll(
      octx,
      this.state.fn,
      this.canvasWidth,
      this.canvasHeight,
      origRange,
      this.state.style
    );

    if (this.state.analysis) {
      drawMarkers(
        octx,
        this.state.analysis.extrema,
        this.state.analysis.inflections,
        this.canvasWidth,
        this.canvasHeight,
        origRange,
        { animationProgress: 1 }
      );
    }
    octx.restore();

    const headerY = 32;
    octx.save();
    octx.fillStyle = '#1a237e';
    octx.font = '600 36px "Cormorant Garamond", serif';
    octx.textBaseline = 'top';
    octx.textAlign = 'left';
    octx.fillText(`f(x) = ${this.funcInput.value || 'undefined'}`, offsetX, headerY);

    octx.font = '400 18px "Noto Sans SC", sans-serif';
    octx.fillStyle = '#666';
    const rangeText = `X: [${origRange.xMin.toFixed(2)}, ${origRange.xMax.toFixed(2)}]   Y: [${origRange.yMin.toFixed(2)}, ${origRange.yMax.toFixed(2)}]`;
    octx.textAlign = 'right';
    octx.fillText(rangeText, EXPORT_W - offsetX, headerY + 10);
    octx.restore();

    const barsTop = PAD_TOP + EXPORT_H_GRAPH + GAP;
    if (this.state.analysis) {
      this.drawExportIntervalBars(octx, offsetX, barsTop, EXPORT_W - offsetX * 2, this.state.analysis);
    }

    octx.save();
    octx.font = '13px "Noto Sans SC", sans-serif';
    octx.fillStyle = '#999';
    octx.textAlign = 'right';
    octx.textBaseline = 'bottom';
    octx.fillText('Generated by Function Visualizer', EXPORT_W - 24, EXPORT_H - 16);
    octx.restore();

    off.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `function_plot_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  private drawExportIntervalBars(
    ctx: CanvasRenderingContext2D,
    x0: number, y0: number, width: number,
    result: AnalysisResult
  ): void {
    const barH = 44;
    const gap = 24;
    const labelH = 28;

    this.drawExportBar(ctx, x0, y0, width, barH, labelH,
      '单调性区间', result.monotonicity,
      (iv: MonoInterval) => iv.property === 'increasing' ? '#43a047' : '#e53935',
      (iv: MonoInterval) => iv.property === 'increasing' ? '↗ 递增' : '↘ 递减',
      [
        { color: '#43a047', label: '单调递增' },
        { color: '#e53935', label: '单调递减' }
      ]
    );

    this.drawExportBar(ctx, x0, y0 + barH + labelH + gap, width, barH, labelH,
      '凹凸性区间', result.concavity,
      (iv: ConcInterval) => iv.property === 'convex' ? '#1e88e5' : '#fb8c00',
      (iv: ConcInterval) => iv.property === 'convex' ? '⌣ 凸' : '⌢ 凹',
      [
        { color: '#1e88e5', label: '凸函数' },
        { color: '#fb8c00', label: '凹函数' }
      ]
    );
  }

  private drawExportBar<T extends { start: number; end: number }>(
    ctx: CanvasRenderingContext2D,
    x0: number, y0: number, width: number, barH: number, labelH: number,
    title: string, intervals: T[],
    colorFn: (iv: T) => string,
    textFn: (iv: T) => string,
    legends: Array<{ color: string; label: string }>
  ): void {
    const { xMin, xMax } = this.state.range;
    const span = xMax - xMin;

    ctx.save();
    ctx.font = '600 16px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#333';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(title, x0, y0);

    let lx = x0 + 180;
    ctx.font = '400 13px "Noto Sans SC", sans-serif';
    for (const lg of legends) {
      ctx.fillStyle = lg.color;
      ctx.fillRect(lx, y0 + 4, 14, 14);
      ctx.fillStyle = '#555';
      ctx.fillText(lg.label, lx + 20, y0 + 2);
      lx += 120;
    }
    ctx.restore();

    const by = y0 + labelH;
    ctx.save();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 0.5, by + 0.5, width - 1, barH - 1);
    ctx.restore();

    if (intervals.length === 0) {
      ctx.save();
      ctx.fillStyle = '#999';
      ctx.font = '14px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('暂无数据', x0 + width / 2, by + barH / 2);
      ctx.restore();
      return;
    }

    for (const iv of intervals) {
      const s = Math.max(xMin, iv.start);
      const e = Math.min(xMax, iv.end);
      if (e <= s) continue;
      const segW = ((e - s) / span) * width;
      const sx = x0 + ((s - xMin) / span) * width;

      ctx.save();
      ctx.fillStyle = colorFn(iv);
      ctx.fillRect(sx, by, segW, barH);

      if (segW > 80) {
        ctx.fillStyle = '#fff';
        ctx.font = '500 13px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetY = 1;
        ctx.fillText(textFn(iv), sx + segW / 2, by + barH / 2);
      }
      ctx.restore();
    }
  }
}

function formatIntervalLabel(v: number, fallback: number): string {
  if (!isFinite(v)) v = fallback;
  const abs = Math.abs(v);
  if (abs > 1000 || (abs < 0.001 && abs > 0)) {
    return v.toExponential(2);
  }
  return Number(v.toFixed(3)).toString();
}

const app = new App();
app.start();

export { };
