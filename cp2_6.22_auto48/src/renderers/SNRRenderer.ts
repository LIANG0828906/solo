import { SNRSample } from '../types';

export class SNRRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private history: SNRSample[] = [];
  private maxHistory: number = 200;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  addSample(sample: SNRSample): void {
    this.history.push(sample);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, 'rgba(0, 20, 40, 0.9)');
    bgGrad.addColorStop(1, 'rgba(0, 5, 15, 0.95)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    const minSNR = -20;
    const maxSNR = 60;
    const padTop = 18;
    const padBottom = 20;
    const padLeft = 36;
    const padRight = 10;
    const chartW = this.width - padLeft - padRight;
    const chartH = this.height - padTop - padBottom;

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.textAlign = 'right';
    const snrLevels = [-20, 0, 20, 40, 60];
    snrLevels.forEach((level) => {
      const y = padTop + chartH - ((level - minSNR) / (maxSNR - minSNR)) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(this.width - padRight, y);
      ctx.stroke();
      ctx.fillText(`${level}`, padLeft - 4, y + 3);
    });

    ctx.fillStyle = 'rgba(0, 255, 255, 0.35)';
    ctx.fillRect(padLeft, padTop + chartH - ((0 - minSNR) / (maxSNR - minSNR)) * chartH, 1, 1);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop + chartH - ((0 - minSNR) / (maxSNR - minSNR)) * chartH);
    ctx.lineTo(this.width - padRight, padTop + chartH - ((0 - minSNR) / (maxSNR - minSNR)) * chartH);
    ctx.stroke();

    if (this.history.length > 1) {
      ctx.beginPath();
      this.history.forEach((sample, idx) => {
        const x = padLeft + (idx / (this.maxHistory - 1)) * chartW;
        const clampedSNR = Math.max(minSNR, Math.min(maxSNR, sample.value));
        const y = padTop + chartH - ((clampedSNR - minSNR) / (maxSNR - minSNR)) * chartH;
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      const lineGradient = ctx.createLinearGradient(padLeft, 0, this.width - padRight, 0);
      lineGradient.addColorStop(0, 'rgba(255, 100, 100, 0.9)');
      lineGradient.addColorStop(0.5, 'rgba(255, 220, 80, 0.9)');
      lineGradient.addColorStop(1, 'rgba(80, 255, 150, 0.9)');
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#88ffaa';
      ctx.stroke();
      ctx.shadowBlur = 0;

      const last = this.history[this.history.length - 1];
      const lastX = padLeft + ((this.history.length - 1) / (this.maxHistory - 1)) * chartW;
      const lastClamped = Math.max(minSNR, Math.min(maxSNR, last.value));
      const lastY = padTop + chartH - ((lastClamped - minSNR) / (maxSNR - minSNR)) * chartH;

      const lastIdx = this.history.length - 1;
      const firstX = padLeft;
      ctx.lineTo(lastX, padTop + chartH);
      ctx.lineTo(firstX, padTop + chartH);
      ctx.closePath();
      const fillGradient = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
      fillGradient.addColorStop(0, 'rgba(80, 255, 150, 0.25)');
      fillGradient.addColorStop(1, 'rgba(80, 255, 150, 0)');
      ctx.fillStyle = fillGradient;
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00ffff';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = last.value >= 20 ? '#66ff99' : last.value >= 0 ? '#ffcc66' : '#ff6666';
      ctx.textAlign = 'left';
      ctx.fillText(`SNR: ${last.value.toFixed(1)} dB`, padLeft + 4, padTop + 12);
    }

    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('时间 →', this.width / 2, this.height - 5);
  }
}
