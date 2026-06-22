import { WaveformSample } from '../types';

export class WaveformRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private buffer: WaveformSample[] = [];
  private maxBufferSize: number = 600;
  private phase: number = 0;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  addSample(sample: WaveformSample): void {
    this.buffer.push(sample);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
  }

  render(
    baseFreqKhz: number,
    dopplerShiftHz: number,
    signalStrength: number,
    noiseThreshold: number,
    currentTime: number
  ): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, 'rgba(0, 20, 40, 0.9)');
    bgGrad.addColorStop(1, 'rgba(0, 5, 15, 0.95)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 0; y < this.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    for (let x = 0; x < this.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, this.height / 2);
    ctx.lineTo(this.width, this.height / 2);
    ctx.stroke();

    const displayFreq = baseFreqKhz * 1000 + dopplerShiftHz;
    const cyclesPerScreen = displayFreq / 150;
    const noiseAmp = noiseThreshold * 8;
    const signalAmp = Math.max(5, signalStrength * 45);
    const midY = this.height / 2;

    this.phase += (displayFreq / 60) * 0.002;

    ctx.beginPath();
    for (let x = 0; x < this.width; x++) {
      const t = x / this.width;
      const yWave = Math.sin(t * Math.PI * 2 * cyclesPerScreen + this.phase);
      const yNoise = (Math.random() - 0.5) * noiseAmp;
      const y = midY - (yWave * signalAmp + yNoise);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    const waveGradient = ctx.createLinearGradient(0, 0, this.width, 0);
    if (dopplerShiftHz > 0) {
      waveGradient.addColorStop(0, 'rgba(255, 100, 120, 0.9)');
      waveGradient.addColorStop(1, 'rgba(255, 60, 80, 1)');
    } else if (dopplerShiftHz < 0) {
      waveGradient.addColorStop(0, 'rgba(100, 150, 255, 0.9)');
      waveGradient.addColorStop(1, 'rgba(60, 120, 255, 1)');
    } else {
      waveGradient.addColorStop(0, 'rgba(0, 255, 220, 0.9)');
      waveGradient.addColorStop(1, 'rgba(0, 255, 180, 1)');
    }
    ctx.strokeStyle = waveGradient;
    ctx.lineWidth = 1.8;
    ctx.shadowBlur = 6;
    ctx.shadowColor = dopplerShiftHz > 0 ? '#ff4466' : dopplerShiftHz < 0 ? '#4488ff' : '#00ffcc';
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.lineTo(this.width, midY);
    ctx.lineTo(0, midY);
    ctx.closePath();
    const fillGradient = ctx.createLinearGradient(0, 0, 0, this.height);
    if (dopplerShiftHz > 0) {
      fillGradient.addColorStop(0, 'rgba(255, 80, 100, 0.25)');
      fillGradient.addColorStop(1, 'rgba(255, 80, 100, 0)');
    } else if (dopplerShiftHz < 0) {
      fillGradient.addColorStop(0, 'rgba(80, 140, 255, 0.25)');
      fillGradient.addColorStop(1, 'rgba(80, 140, 255, 0)');
    } else {
      fillGradient.addColorStop(0, 'rgba(0, 255, 200, 0.2)');
      fillGradient.addColorStop(1, 'rgba(0, 255, 200, 0)');
    }
    ctx.fillStyle = fillGradient;
    ctx.fill();

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = dopplerShiftHz > 0 ? '#ff6677' : dopplerShiftHz < 0 ? '#6699ff' : '#00ffcc';
    ctx.textAlign = 'left';
    const freqLabel = `${(displayFreq / 1000).toFixed(2)} kHz`;
    const shiftLabel = dopplerShiftHz >= 0 ? `+${dopplerShiftHz.toFixed(1)} Hz` : `${dopplerShiftHz.toFixed(1)} Hz`;
    ctx.fillText(`f = ${freqLabel}   Δf = ${shiftLabel}`, 8, 14);

    if (Math.abs(dopplerShiftHz) > 1) {
      const indicator = dopplerShiftHz > 0 ? '↑ 靠近 (波形变密)' : '↓ 远离 (波形变疏)';
      ctx.fillStyle = dopplerShiftHz > 0 ? '#ff8866' : '#66ccff';
      ctx.textAlign = 'right';
      ctx.fillText(indicator, this.width - 8, 14);
    }
  }
}
