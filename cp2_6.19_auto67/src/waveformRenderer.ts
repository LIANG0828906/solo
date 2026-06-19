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

export class WaveformRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private _options: WaveformRendererOptions;

  private _reduced: Float32Array | null = null;
  private _oldReduced: Float32Array | null = null;
  private _newReduced: Float32Array | null = null;
  private _transitionStart = 0;
  private readonly _transitionDuration = 500;

  private _selectionStartX = -1;
  private _selectionEndX = -1;

  private _indicatorProgress = -1;
  private readonly _trailLength = 18;
  private _trail: number[] = [];

  private _rafId = 0;
  private _running = false;

  private _dataLength = 0;

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
    // placeholder
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
    if (this._dataLength > 0) {
      this._reduceSamples();
    }
    this._renderFrame(performance.now());
  }

  public setWaveformData(data: WaveformData, animate = false): void {
    this._dataLength = data.length;
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
      this._transitionStart = performance.now();
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

  private _reduceSamples(): void {
    // 空实现：尺寸变化不立即重采样，数据更新时会自动调用 _rawToReduced
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
    const loop = (now: number) => {
      if (!this._running) return;
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
      } else {
        inTransition = true;
      }
    }

    if (display && !inTransition) {
      this._drawWaveform(ctx, display, W, H, 1);
    } else if (this._oldReduced && this._newReduced && inTransition) {
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      this._drawInterpolatedWaveform(ctx, this._oldReduced, this._newReduced, ease, W, H);
    } else {
      this._drawPlaceholder(ctx, W, H);
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

  private _drawWaveform(ctx: CanvasRenderingContext2D, data: Float32Array, W: number, H: number, alpha: number): void {
    const center = H / 2;
    const halfH = H / 2 - 8;
    const cols = Math.min(data.length / 2, W);
    ctx.save();
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.fillStyle = this._buildGradient(ctx, H);
    ctx.beginPath();
    const step = 1;
    for (let x = 0; x < cols; x += step) {
      const min = data[x * 2];
      const max = data[x * 2 + 1];
      const y1 = center - max * halfH;
      const y2 = center - min * halfH;
      const h = Math.max(1, y2 - y1);
      ctx.rect(x, y1, Math.max(1, step), h);
    }
    ctx.fill();
    ctx.restore();
  }

  private _drawInterpolatedWaveform(
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
    ctx.fillStyle = this._buildGradient(ctx, H);
    ctx.beginPath();
    for (let x = 0; x < cols; x++) {
      const oMin = oldData[x * 2];
      const oMax = oldData[x * 2 + 1];
      const nMin = newData[x * 2];
      const nMax = newData[x * 2 + 1];
      const min = oMin + (nMin - oMin) * t;
      const max = oMax + (nMax - oMax) * t;
      const y1 = center - max * halfH;
      const y2 = center - min * halfH;
      const h = Math.max(1, y2 - y1);
      ctx.rect(x, y1, 1, h);
    }
    ctx.fill();
  }

  private _drawPlaceholder(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(8, 8, W - 16, H - 16);
    ctx.setLineDash([]);
  }

  private _drawSelection(ctx: CanvasRenderingContext2D, W: number, H: number): void {
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
    void W;
  }

  private _drawIndicator(ctx: CanvasRenderingContext2D, now: number, W: number, H: number): void {
    if (this._indicatorProgress < 0) return;
    const x = this._indicatorProgress * W;

    this._trail.unshift(x);
    if (this._trail.length > this._trailLength) this._trail.length = this._trailLength;

    const color = this._options.indicatorColor;
    for (let i = this._trail.length - 1; i >= 0; i--) {
      const tx = this._trail[i];
      const alpha = (1 - i / this._trail.length) * 0.35;
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
