export interface WaveformRendererOptions {
  width: number;
  height: number;
  gradientStart: string;
  gradientEnd: string;
  selectionColor: string;
  selectionBorderColor: string;
  indicatorColor: string;
}

export type WaveformData = Float32Array;

export interface TransitionConfig {
  delayMs: number;
}

export class WaveformRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private _options: WaveformRendererOptions;

  private _reduced: Float32Array | null = null;
  private _oldReduced: Float32Array | null = null;
  private _newReduced: Float32Array | null = null;
  private _transitionStart = 0;
  private _transitionDelay = 0;
  private readonly _transitionDuration = 500;

  private _selectionStartX = -1;
  private _selectionEndX = -1;

  private _indicatorProgress = -1;
  private _trail: number[] = [];

  private _rafId = 0;
  private _running = false;
  private _lastFrameTime = 0;
  private _currentFps = 60;

  constructor(canvas: HTMLCanvasElement, options?: Partial<WaveformRendererOptions>) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取 2D 上下文');
    this.ctx = ctx;
    this._options = {
      width: 0,
      height: 0,
      gradientStart: '#4a9eff',
      gradientEnd: '#a855f7',
      selectionColor: 'rgba(255, 215, 0, 0.3)',
      selectionBorderColor: 'rgba(255, 215, 0, 0.9)',
      indicatorColor: '#7dd3fc',
      ...options
    };
    this.resize();
  }

  public setDuration(_duration: number): void {
    void _duration;
  }

  public resize(customWidth?: number, customHeight?: number): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const w = customWidth ?? rect.width;
    const h = customHeight ?? rect.height;
    if (w <= 0 || h <= 0) return;
    this._options.width = w;
    this._options.height = h;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._renderFrame(performance.now());
  }

  public setWaveformData(data: WaveformData, animate = false, config?: TransitionConfig): void {
    if (!animate) {
      this._oldReduced = null;
      this._newReduced = null;
      this._rawToReduced(data);
      this._reduced = this._tempReduceBuffer ?? null;
      this._tempReduceBuffer = null;
      this._renderFrame(performance.now());
    } else {
      this._oldReduced = this._reduced;
      this._rawToReduced(data);
      this._newReduced = this._tempReduceBuffer ?? null;
      this._tempReduceBuffer = null;
      this._transitionDelay = config?.delayMs ?? 0;
      this._transitionStart = performance.now() + this._transitionDelay;
      this.startRenderLoop();
    }
  }

  private _tempReduceBuffer: Float32Array | null = null;

  private _rawToReduced(raw: Float32Array): void {
    const width = Math.max(2, Math.floor(this._options.width));
    const step = Math.max(1, Math.floor(raw.length / width));
    const out = new Float32Array(width * 2);
    for (let x = 0; x < width; x++) {
      const start = x * step;
      const end = Math.min(raw.length, start + step);
      let min = 1;
      let max = -1;
      for (let i = start; i < end; i++) {
        const v = raw[i];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (max < min) {
        const t = max;
        max = min;
        min = t;
      }
      out[x * 2] = min;
      out[x * 2 + 1] = max;
    }
    this._tempReduceBuffer = out;
  }

  public setSelectionByRatio(startRatio: number, endRatio: number): void {
    const w = this._options.width;
    if (startRatio > endRatio) [startRatio, endRatio] = [endRatio, startRatio];
    this._selectionStartX = startRatio * w;
    this._selectionEndX = endRatio * w;
    this._renderFrame(performance.now());
  }

  public clearSelection(): void {
    this._selectionStartX = -1;
    this._selectionEndX = -1;
    this._renderFrame(performance.now());
  }

  public getSelectionRatio(clientX: number): number {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.min(1, Math.max(0, x / this._options.width));
  }

  public setIndicator(progress: number): void {
    this._indicatorProgress = Math.min(1, Math.max(0, progress));
    if (!this._running) this._renderFrame(performance.now());
  }

  public clearIndicator(): void {
    this._indicatorProgress = -1;
    this._trail.length = 0;
    if (!this._running) this._renderFrame(performance.now());
  }

  public startRenderLoop(): void {
    if (this._running) return;
    this._running = true;
    this._lastFrameTime = performance.now();
    const loop = (now: number) => {
      if (!this._running) return;
      const dt = now - this._lastFrameTime;
      if (dt > 0) {
        this._currentFps = this._currentFps * 0.9 + (1000 / dt) * 0.1;
      }
      this._lastFrameTime = now;
      this._renderFrame(now);
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  public stopRenderLoop(): void {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = 0;
  }

  private _renderFrame(now: number): void {
    const { width: W, height: H } = this._options;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);

    this._drawGrid(ctx, W, H);

    let display = this._reduced;
    let inTransition = false;
    let t = 0;
    if (this._oldReduced && this._newReduced) {
      t = (now - this._transitionStart) / this._transitionDuration;
      if (t >= 1) {
        this._reduced = this._newReduced;
        this._oldReduced = null;
        this._newReduced = null;
        display = this._reduced;
      } else if (t < 0) {
        display = this._oldReduced;
        inTransition = false;
      } else {
        inTransition = true;
      }
    }

    if (display && !inTransition) {
      this._drawWaveformSmooth(ctx, display, W, H);
    } else if (this._oldReduced && this._newReduced && inTransition) {
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      this._drawInterpolatedWaveformSmooth(ctx, this._oldReduced, this._newReduced, ease, W, H);
    } else {
      this._drawPlaceholder(ctx, W, H);
    }

    if (this._oldReduced === null && this._newReduced === null && this._running) {
      this.stopRenderLoop();
    }

    this._drawSelection(ctx, W, H);
    this._drawIndicator(ctx, now, W, H);
  }

  private _drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();
    const steps = 6;
    for (let i = 1; i < steps; i++) {
      const x = (W / steps) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
  }

  private _buildGradient(ctx: CanvasRenderingContext2D, H: number): CanvasGradient {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, this._options.gradientEnd);
    grad.addColorStop(0.5, this._options.gradientStart);
    grad.addColorStop(1, this._options.gradientEnd);
    return grad;
  }

  private _catmullRomPoint(p0: number, p1: number, p2: number, p3: number, t: number): number {
    const t2 = t * t;
    const t3 = t2 * t;
    return 0.5 * (
      (2 * p1) +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3
    );
  }

  private _drawWaveformSmooth(ctx: CanvasRenderingContext2D, data: Float32Array, W: number, H: number): void {
    const center = H / 2;
    const halfH = H / 2 - 8;
    const cols = Math.min(data.length / 2, W);
    if (cols < 2) return;

    ctx.save();
    ctx.fillStyle = this._buildGradient(ctx, H);

    const subsample = Math.max(1, Math.floor(cols / 512));
    const points: Array<{ x: number; yTop: number; yBot: number }> = [];
    for (let x = 0; x < cols; x += subsample) {
      const maxVal = data[x * 2 + 1];
      const minVal = data[x * 2];
      points.push({
        x,
        yTop: center - maxVal * halfH,
        yBot: center - minVal * halfH
      });
    }
    const lastPt = { x: cols - 1, yTop: center - data[(cols - 1) * 2 + 1] * halfH, yBot: center - data[(cols - 1) * 2] * halfH };
    if (points.length === 0 || points[points.length - 1].x !== lastPt.x) {
      points.push(lastPt);
    }

    if (points.length < 2) {
      ctx.restore();
      return;
    }

    const maxGap = 3;

    ctx.beginPath();
    for (let pi = 0; pi < points.length - 1; pi++) {
      const p0 = points[Math.max(0, pi - 1)];
      const p1 = points[pi];
      const p2 = points[Math.min(points.length - 1, pi + 1)];
      const p3 = points[Math.min(points.length - 1, pi + 2)];
      const segGap = Math.abs(p2.x - p1.x);
      const stepCount = Math.max(2, Math.min(16, Math.ceil(segGap / maxGap)));

      for (let s = 0; s < stepCount; s++) {
        const st = s / stepCount;
        const yTop = this._catmullRomPoint(p0.yTop, p1.yTop, p2.yTop, p3.yTop, st);
        const yBot = this._catmullRomPoint(p0.yBot, p1.yBot, p2.yBot, p3.yBot, st);
        const x = this._catmullRomPoint(p0.x, p1.x, p2.x, p3.x, st);
        const h = Math.max(1, yBot - yTop);
        ctx.rect(x, yTop, segGap / stepCount * 0.9, h);
      }
    }
    ctx.fill();
    ctx.restore();
  }

  private _drawInterpolatedWaveformSmooth(
    ctx: CanvasRenderingContext2D,
    oldData: Float32Array,
    newData: Float32Array,
    t: number,
    W: number,
    H: number
  ): void {
    const center = H / 2;
    const halfH = H / 2 - 8;
    const cols = Math.min(Math.min(oldData.length, newData.length) / 2, W);
    if (cols < 2) return;

    ctx.save();
    ctx.fillStyle = this._buildGradient(ctx, H);

    const subsample = Math.max(1, Math.floor(cols / 512));
    const points: Array<{ x: number; yTop: number; yBot: number }> = [];

    for (let x = 0; x < cols; x += subsample) {
      const oMax = oldData[x * 2 + 1];
      const oMin = oldData[x * 2];
      const nMax = newData[x * 2 + 1];
      const nMin = newData[x * 2];
      const maxVal = oMax + (nMax - oMax) * t;
      const minVal = oMin + (nMin - oMin) * t;
      points.push({
        x,
        yTop: center - maxVal * halfH,
        yBot: center - minVal * halfH
      });
    }
    const lastIdx = cols - 1;
    const loMax = oldData[lastIdx * 2 + 1];
    const loMin = oldData[lastIdx * 2];
    const lnMax = newData[lastIdx * 2 + 1];
    const lnMin = newData[lastIdx * 2];
    const lm = loMax + (lnMax - loMax) * t;
    const lmin = loMin + (lnMin - loMin) * t;
    const lastPt = { x: lastIdx, yTop: center - lm * halfH, yBot: center - lmin * halfH };
    if (points.length === 0 || points[points.length - 1].x !== lastPt.x) {
      points.push(lastPt);
    }

    if (points.length < 2) {
      ctx.restore();
      return;
    }

    const maxGap = 3;
    ctx.beginPath();
    for (let pi = 0; pi < points.length - 1; pi++) {
      const p0 = points[Math.max(0, pi - 1)];
      const p1 = points[pi];
      const p2 = points[Math.min(points.length - 1, pi + 1)];
      const p3 = points[Math.min(points.length - 1, pi + 2)];
      const segGap = Math.abs(p2.x - p1.x);
      const stepCount = Math.max(2, Math.min(16, Math.ceil(segGap / maxGap)));

      for (let s = 0; s < stepCount; s++) {
        const st = s / stepCount;
        const yTop = this._catmullRomPoint(p0.yTop, p1.yTop, p2.yTop, p3.yTop, st);
        const yBot = this._catmullRomPoint(p0.yBot, p1.yBot, p2.yBot, p3.yBot, st);
        const x = this._catmullRomPoint(p0.x, p1.x, p2.x, p3.x, st);
        const h = Math.max(1, yBot - yTop);
        ctx.rect(x, yTop, segGap / stepCount * 0.9, h);
      }
    }
    ctx.fill();
    ctx.restore();
  }

  private _drawPlaceholder(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(8, 8, W - 16, H - 16);
    ctx.setLineDash([]);
  }

  private _drawSelection(ctx: CanvasRenderingContext2D, _W: number, H: number): void {
    let x1 = this._selectionStartX;
    let x2 = this._selectionEndX;
    if (x1 < 0 || x2 < 0 || Math.abs(x1 - x2) < 1) return;
    if (x1 > x2) [x1, x2] = [x2, x1];
    ctx.fillStyle = this._options.selectionColor;
    ctx.fillRect(x1, 0, x2 - x1, H);
    ctx.strokeStyle = this._options.selectionBorderColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1 + 0.5, 0);
    ctx.lineTo(x1 + 0.5, H);
    ctx.moveTo(x2 + 0.5, 0);
    ctx.lineTo(x2 + 0.5, H);
    ctx.stroke();
    void _W;
  }

  private _drawIndicator(ctx: CanvasRenderingContext2D, now: number, W: number, H: number): void {
    if (this._indicatorProgress < 0) return;
    const x = this._indicatorProgress * W;

    this._trail.unshift(x);

    const fps = Math.max(1, this._currentFps);
    const trailCount = 18;
    const trailStep = Math.max(1, Math.round(60 / fps));
    const maxTrailLen = trailCount * trailStep;

    if (this._trail.length > maxTrailLen) {
      this._trail.length = maxTrailLen;
    }

    const color = this._options.indicatorColor;

    for (let i = 0; i < trailCount; i++) {
      const idx = i * trailStep;
      if (idx >= this._trail.length) break;
      const tx = this._trail[idx];
      const progress = i / trailCount;
      const alpha = (1 - progress) * 0.35;
      const blur = (i + 1) * 1.6;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx, 4);
      ctx.lineTo(tx, H - 4);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 4);
    ctx.lineTo(x, H - 4);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, H / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
    void now;
  }
}
