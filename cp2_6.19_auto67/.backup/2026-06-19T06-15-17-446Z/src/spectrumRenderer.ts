export interface SpectrumRendererOptions {
  barCount: number;
  width: number;
  height: number;
}

export class SpectrumRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private _options: SpectrumRendererOptions;

  private _analyser: AnalyserNode | null = null;
  private _frequencyData: Uint8Array<ArrayBuffer>;

  private _currentHeights: Float32Array;
  private _peakHold: Float32Array;
  private readonly _decayRate = 0.90;

  private _rafId = 0;
  private _running = false;
  private _lastFrame = 0;

  constructor(canvas: HTMLCanvasElement, options?: Partial<SpectrumRendererOptions>) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取 2D 上下文');
    this.ctx = ctx;
    this._options = {
      barCount: 256,
      width: 0,
      height: 0,
      ...options
    };
    const N = this._options.barCount;
    this._frequencyData = new Uint8Array(new ArrayBuffer(256));
    this._currentHeights = new Float32Array(N);
    this._peakHold = new Float32Array(N);
    this.resize();
  }

  public setAnalyser(analyser: AnalyserNode | null): void {
    this._analyser = analyser;
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

  public startRenderLoop(): void {
    if (this._running) return;
    this._running = true;
    this._lastFrame = performance.now();
    const loop = (now: number) => {
      if (!this._running) return;
      this._lastFrame = now;
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
    const { width: W, height: H, barCount: N } = this._options;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);

    const hasAnalyser = !!this._analyser;
    if (hasAnalyser) {
      this._analyser!.getByteFrequencyData(this._frequencyData);
    }

    const fftBins = this._frequencyData.length;
    const gap = 2;
    const totalGap = gap * (N - 1);
    const barW = Math.max(1, (W - totalGap - 4) / N);
    const usableHeight = H - 16;

    const dt = Math.min(0.05, Math.max(0.001, (now - this._lastFrame) / 1000));
    const riseRate = 16;
    const fallRate = 7;

    for (let i = 0; i < N; i++) {
      let raw = 0;
      if (hasAnalyser) {
        const idx = Math.floor((i / N) * fftBins * 0.85);
        raw = this._frequencyData[idx];
      }
      const targetH = (raw / 255) * usableHeight;

      const cur = this._currentHeights[i];
      const rate = targetH > cur ? riseRate : fallRate;
      this._currentHeights[i] = cur + (targetH - cur) * Math.min(1, rate * dt);

      const prevPeak = this._peakHold[i];
      if (this._currentHeights[i] > prevPeak) {
        this._peakHold[i] = this._currentHeights[i];
      } else {
        this._peakHold[i] = prevPeak * Math.pow(this._decayRate, dt * 60);
      }
    }

    for (let i = 0; i < N; i++) {
      const hNorm = this._currentHeights[i] / usableHeight;
      const peakH = this._peakHold[i];
      const peakNorm = peakH / usableHeight;

      let barH = this._currentHeights[i];
      barH = Math.min(usableHeight + 3, Math.max(0, barH));

      const x = 2 + i * (barW + gap);
      const y = H - 8 - barH;

      const color = this._getBarColor(hNorm);
      const colorTop = this._getBarColor(Math.min(1, hNorm + 0.18));

      ctx.save();
      if (hNorm > 0.55) {
        ctx.shadowColor = colorTop;
        ctx.shadowBlur = 8 * hNorm;
      }

      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, colorTop);
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;

      const r = Math.min(barW / 2, 2.5);
      this._roundRect(ctx, x, y, barW, barH, r);
      ctx.fill();

      if (barH > 4) {
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#ffffff';
        this._roundRect(ctx, x, y, barW, 1.5, r);
        ctx.fill();
      }
      ctx.restore();

      if (peakH > this._currentHeights[i] + 2 && peakH > 4) {
        const peakY = H - 8 - peakH;
        const peakColor = this._getBarColor(Math.min(1, peakNorm + 0.1));
        ctx.save();
        ctx.globalAlpha = Math.max(0.15, 0.7 - (peakH - this._currentHeights[i]) * 0.015);
        ctx.fillStyle = peakColor;
        ctx.shadowColor = peakColor;
        ctx.shadowBlur = 4;
        ctx.fillRect(x, peakY, barW, 2.5);
        ctx.restore();
      }
    }

    this._drawBottomGlow(ctx, W, H);
  }

  private _drawBottomGlow(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    const grad = ctx.createLinearGradient(0, H - 12, 0, H);
    grad.addColorStop(0, 'rgba(74, 158, 255, 0)');
    grad.addColorStop(1, 'rgba(168, 85, 247, 0.12)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, H - 12, W, 12);
  }

  private _roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    const rr = Math.min(r, w / 2, h / 2);
    if (rr <= 0) {
      ctx.rect(x, y, w, h);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  private _getBarColor(t: number): string {
    const p = Math.min(1, Math.max(0, t));
    let r: number, g: number, b: number;
    if (p < 0.5) {
      const k = p / 0.5;
      r = Math.round(34 + (234 - 34) * k);
      g = Math.round(197 + (179 - 197) * k);
      b = Math.round(94 + (8 - 94) * k);
    } else {
      const k = (p - 0.5) / 0.5;
      r = Math.round(234 + (239 - 234) * k);
      g = Math.round(179 + (68 - 179) * k);
      b = Math.round(8 + (68 - 8) * k);
    }
    return `rgb(${r}, ${g}, ${b})`;
  }
}
