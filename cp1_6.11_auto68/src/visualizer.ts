import { AudioEngine, AudioRegion } from './audioEngine';

export class Visualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioEngine: AudioEngine;
  private animationId: number | null = null;
  private isRunning: boolean = false;

  private dpr: number = 1;
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;

  private waveformTop: number = 0;
  private waveformHeight: number = 0;
  private spectrumTop: number = 0;
  private spectrumHeight: number = 0;

  private spectrumGradient: CanvasGradient | null = null;

  private onTimeUpdate?: (time: number) => void;

  constructor(canvas: HTMLCanvasElement, audioEngine: AudioEngine) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取 Canvas 2D 上下文');
    this.ctx = ctx;
    this.audioEngine = audioEngine;

    this.dpr = window.devicePixelRatio || 1;
    this.resize();
  }

  setOnTimeUpdate(callback: (time: number) => void): void {
    this.onTimeUpdate = callback;
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;

    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.waveformHeight = this.canvasHeight * 0.6;
    this.waveformTop = 0;
    this.spectrumTop = this.waveformHeight + 2;
    this.spectrumHeight = this.canvasHeight - this.spectrumTop;

    this.createSpectrumGradient();
  }

  private createSpectrumGradient(): void {
    if (this.spectrumHeight <= 0) return;
    this.spectrumGradient = this.ctx.createLinearGradient(
      0,
      this.spectrumTop + this.spectrumHeight,
      0,
      this.spectrumTop
    );
    this.spectrumGradient.addColorStop(0, '#1E90FF');
    this.spectrumGradient.addColorStop(0.5, '#9932CC');
    this.spectrumGradient.addColorStop(1, '#FF4500');
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return;

    this.draw();

    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.audioEngine.getCurrentTime());
    }

    this.animationId = requestAnimationFrame(this.animate);
  };

  draw(): void {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.ctx.fillStyle = '#2C2C2C';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.drawWaveform();
    this.drawRegion();
    this.drawPlayhead();
    this.drawSpectrum();
    this.drawTimeMarkers();
  }

  private drawWaveform(): void {
    const peaks = this.audioEngine.getFullWaveformPeaks();
    if (!peaks || peaks.length === 0) return;

    const { ctx, waveformTop, waveformHeight, canvasWidth } = this;
    const centerY = waveformTop + waveformHeight / 2;
    const amplitude = waveformHeight / 2 - 4;

    ctx.save();
    ctx.beginPath();

    const numPeaks = peaks.length / 2;
    const step = canvasWidth / numPeaks;

    ctx.moveTo(0, centerY);

    for (let i = 0; i < numPeaks; i++) {
      const x = i * step;
      const max = peaks[i * 2 + 1];
      const y = centerY - max * amplitude;
      ctx.lineTo(x, y);
    }

    for (let i = numPeaks - 1; i >= 0; i--) {
      const x = i * step;
      const min = peaks[i * 2];
      const y = centerY - min * amplitude;
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 206, 209, 0.25)';
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < numPeaks; i++) {
      const x = i * step;
      const max = peaks[i * 2 + 1];
      const y = centerY - max * amplitude;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#00CED1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < numPeaks; i++) {
      const x = i * step;
      const min = peaks[i * 2];
      const y = centerY - min * amplitude;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#00CED1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvasWidth, centerY);
    ctx.strokeStyle = 'rgba(0, 206, 209, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();
  }

  private drawRegion(): void {
    const region = this.audioEngine.getRegion();
    if (!region) return;

    const { ctx, waveformTop, waveformHeight, canvasWidth } = this;
    const duration = this.audioEngine.getDuration();
    if (duration <= 0) return;

    const startX = (region.start / duration) * canvasWidth;
    const endX = (region.end / duration) * canvasWidth;
    const width = endX - startX;

    ctx.save();
    ctx.fillStyle = 'rgba(30, 144, 255, 0.3)';
    ctx.fillRect(startX, waveformTop, width, waveformHeight);

    ctx.strokeStyle = 'rgba(30, 144, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, waveformTop);
    ctx.lineTo(startX, waveformTop + waveformHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(endX, waveformTop);
    ctx.lineTo(endX, waveformTop + waveformHeight);
    ctx.stroke();

    ctx.fillStyle = '#1E90FF';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textBaseline = 'top';

    const startTimeStr = this.formatTime(region.start);
    const startTextWidth = ctx.measureText(startTimeStr).width;
    const startTextX = Math.max(startX, 2);
    ctx.fillText(startTimeStr, startTextX, waveformTop + 4);

    const endTimeStr = this.formatTime(region.end);
    const endTextWidth = ctx.measureText(endTimeStr).width;
    const endTextX = Math.min(endX - endTextWidth, canvasWidth - endTextWidth - 2);
    ctx.fillText(endTimeStr, endTextX, waveformTop + 4);

    ctx.restore();
  }

  private drawPlayhead(): void {
    const { ctx, waveformTop, waveformHeight, canvasWidth } = this;
    const currentTime = this.audioEngine.getCurrentTime();
    const duration = this.audioEngine.getDuration();
    if (duration <= 0) return;

    const x = (currentTime / duration) * canvasWidth;

    ctx.save();
    ctx.strokeStyle = '#FF4500';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255, 69, 0, 0.5)';
    ctx.shadowBlur = 4;

    ctx.beginPath();
    ctx.moveTo(x, waveformTop);
    ctx.lineTo(x, waveformTop + waveformHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, waveformTop + waveformHeight, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FF4500';
    ctx.fill();

    ctx.restore();
  }

  private drawSpectrum(): void {
    const spectrum = this.audioEngine.getSpectrum();
    if (!spectrum) return;

    const { ctx, spectrumTop, spectrumHeight, canvasWidth } = this;
    if (spectrumHeight <= 0) return;

    const numBars = 64;
    const gap = 1;
    const totalGap = (numBars - 1) * gap;
    const barWidth = (canvasWidth - totalGap) / numBars;

    ctx.save();

    for (let i = 0; i < numBars; i++) {
      const value = spectrum[i] / 255;
      const barHeight = value * spectrumHeight;
      const x = i * (barWidth + gap);
      const y = spectrumTop + spectrumHeight - barHeight;

      const hue = (1 - i / numBars) * 240;
      const saturation = 100;
      const lightness = 50 + value * 20;
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

      const radius = Math.min(barWidth / 2, 3);
      this.roundRect(ctx, x, y, barWidth, barHeight, radius);
      ctx.fill();
    }

    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    if (height < radius * 2) radius = height / 2;
    if (width < radius * 2) radius = width / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private drawTimeMarkers(): void {
    const { ctx, canvasWidth, waveformTop, waveformHeight } = this;
    const duration = this.audioEngine.getDuration();
    if (duration <= 0) return;

    const numMarkers = 5;
    ctx.save();
    ctx.fillStyle = 'rgba(224, 224, 224, 0.6)';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'center';

    for (let i = 0; i <= numMarkers; i++) {
      const time = (duration / numMarkers) * i;
      const x = (time / duration) * canvasWidth;
      const timeStr = this.formatTimeShort(time);
      ctx.fillText(timeStr, x, waveformTop + waveformHeight - 4);
    }

    ctx.restore();
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  private formatTimeShort(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getCanvasWidth(): number {
    return this.canvasWidth;
  }

  getWaveformTop(): number {
    return this.waveformTop;
  }

  getWaveformHeight(): number {
    return this.waveformHeight;
  }

  timeToX(time: number): number {
    const duration = this.audioEngine.getDuration();
    if (duration <= 0) return 0;
    return (time / duration) * this.canvasWidth;
  }

  xToTime(x: number): number {
    const duration = this.audioEngine.getDuration();
    if (duration <= 0) return 0;
    return (x / this.canvasWidth) * duration;
  }

  isInWaveformArea(y: number): boolean {
    return y >= this.waveformTop && y <= this.waveformTop + this.waveformHeight;
  }
}
