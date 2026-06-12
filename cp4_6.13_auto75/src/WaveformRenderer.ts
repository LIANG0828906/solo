import { WaveformData } from './AudioProcessor';

export interface WaveformStyle {
  startColor: string;
  endColor: string;
  lineWidth: number;
  mirror: boolean;
  barWidth: number;
  barGap: number;
  cornerRadius: number;
  style: 'bars' | 'line' | 'mirror';
  verticalScale: number;
}

export class WaveformRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private data: WaveformData | null = null;
  private style: WaveformStyle;
  private scale: number = 1;
  private rafId: number | null = null;
  private pendingRender: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;

    this.style = {
      startColor: '#00d4ff',
      endColor: '#9d4edd',
      lineWidth: 2,
      mirror: true,
      barWidth: 3,
      barGap: 2,
      cornerRadius: 2,
      style: 'mirror',
      verticalScale: 1
    };
  }

  setData(data: WaveformData | null) {
    this.data = data;
    this.requestRender();
  }

  setStyle(style: Partial<WaveformStyle>) {
    this.style = { ...this.style, ...style };
    this.requestRender();
  }

  getStyle(): WaveformStyle {
    return { ...this.style };
  }

  setScale(scale: number) {
    this.scale = scale;
    this.requestRender();
  }

  resize(width: number, height: number) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.requestRender();
  }

  requestRender() {
    if (this.pendingRender) return;
    this.pendingRender = true;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      this.pendingRender = false;
      this.render();
    });
  }

  render() {
    const { ctx, canvas } = this;
    const cssWidth = canvas.width / (window.devicePixelRatio || 1);
    const cssHeight = canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, cssWidth, cssHeight);

    if (!this.data) {
      this.renderPlaceholder(cssWidth, cssHeight);
      return;
    }

    const paddingX = 20;
    const paddingY = 20;
    const renderWidth = cssWidth - paddingX * 2;
    const renderHeight = cssHeight - paddingY * 2;
    const centerY = cssHeight / 2;

    const { peaks } = this.data;
    const { style } = this;

    const gradient = ctx.createLinearGradient(0, 0, cssWidth, 0);
    gradient.addColorStop(0, style.startColor);
    gradient.addColorStop(1, style.endColor);

    ctx.fillStyle = gradient;
    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (style.style === 'line') {
      this.renderLine(peaks, paddingX, renderWidth, centerY, renderHeight, style);
    } else if (style.style === 'bars') {
      this.renderBars(peaks, paddingX, renderWidth, centerY, renderHeight, style);
    } else {
      this.renderMirrorBars(peaks, paddingX, renderWidth, centerY, renderHeight, style);
    }
  }

  private renderPlaceholder(width: number, height: number) {
    const { ctx, style } = this;
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, style.startColor);
    gradient.addColorStop(1, style.endColor);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    ctx.lineCap = 'round';

    const centerY = height / 2;
    const bars = 40;
    const barWidth = (width - 80) / bars;
    const maxHeight = height * 0.3;

    for (let i = 0; i < bars; i++) {
      const x = 40 + i * barWidth + barWidth * 0.25;
      const h = (Math.sin(i * 0.5) * 0.5 + 0.5) * maxHeight * 0.6 + 10;
      const w = barWidth * 0.5;
      this.roundRect(ctx, x, centerY - h / 2, w, h, 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = gradient;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.6;
    ctx.fillText('上传音频或录音以显示波形', width / 2, centerY + maxHeight + 50);
    ctx.globalAlpha = 1;
  }

  private renderLine(
    peaks: number[],
    offsetX: number,
    width: number,
    centerY: number,
    height: number,
    style: WaveformStyle
  ) {
    const { ctx } = this;
    ctx.lineWidth = style.lineWidth;
    ctx.globalAlpha = 0.9;

    ctx.beginPath();
    for (let i = 0; i < peaks.length; i++) {
      const x = offsetX + (i / (peaks.length - 1)) * width;
      const amp = peaks[i] * (height / 2) * style.verticalScale;
      const y = centerY - amp;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = offsetX + ((i - 1) / (peaks.length - 1)) * width;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, centerY - peaks[i - 1] * (height / 2) * style.verticalScale, cpX, (centerY - peaks[i - 1] * (height / 2) * style.verticalScale + y) / 2);
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private renderBars(
    peaks: number[],
    offsetX: number,
    width: number,
    centerY: number,
    height: number,
    style: WaveformStyle
  ) {
    const { ctx } = this;
    const totalBars = peaks.length;
    const totalGapWidth = (totalBars - 1) * style.barGap;
    const barWidth = Math.max(1, (width - totalGapWidth) / totalBars);
    const maxHeight = (height / 2) * style.verticalScale;

    for (let i = 0; i < totalBars; i++) {
      const x = offsetX + i * (barWidth + style.barGap);
      const amp = peaks[i] * maxHeight;
      const barHeight = Math.max(2, amp);
      const y = centerY - barHeight;
      const bw = Math.max(1, barWidth - 0.5);
      this.roundRect(ctx, x, y, bw, barHeight, Math.min(style.cornerRadius, bw / 2));
      ctx.fill();
    }
  }

  private renderMirrorBars(
    peaks: number[],
    offsetX: number,
    width: number,
    centerY: number,
    height: number,
    style: WaveformStyle
  ) {
    const { ctx } = this;
    const totalBars = peaks.length;
    const totalGapWidth = (totalBars - 1) * style.barGap;
    const barWidth = Math.max(1, (width - totalGapWidth) / totalBars);
    const maxHeight = (height / 2) * style.verticalScale;

    for (let i = 0; i < totalBars; i++) {
      const x = offsetX + i * (barWidth + style.barGap);
      const amp = peaks[i] * maxHeight;
      const barHeight = Math.max(2, amp);
      const bw = Math.max(1, barWidth - 0.5);
      const radius = Math.min(style.cornerRadius, bw / 2);

      this.roundRect(ctx, x, centerY - barHeight, bw, barHeight, radius);
      ctx.fill();

      ctx.globalAlpha = 0.6;
      this.roundRect(ctx, x, centerY, bw, barHeight * 0.7, radius);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  drawToContext(
    targetCtx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const sourceCanvas = this.canvas;
    targetCtx.drawImage(sourceCanvas, x, y, width, height);
  }

  getData(): WaveformData | null {
    return this.data;
  }

  destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }
}
