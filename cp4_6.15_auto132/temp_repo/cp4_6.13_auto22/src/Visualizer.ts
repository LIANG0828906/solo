export type VisualizerMode = 'spectrum' | 'waveform';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class Visualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mode: VisualizerMode = 'spectrum';
  private spectrumData: Float32Array = new Float32Array(32);
  private waveformData: Float32Array = new Float32Array(512);
  private animationId: number = 0;
  private time: number = 0;
  private particles: Particle[] = [];
  private isPlaying: boolean = false;
  private dpr: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  private resize = (): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  setMode(mode: VisualizerMode): void {
    this.mode = mode;
    this.particles = [];
  }

  setPlaying(playing: boolean): void {
    this.isPlaying = playing;
  }

  updateData(spectrum: Float32Array, waveform: Float32Array): void {
    this.spectrumData = spectrum;
    this.waveformData = waveform;
  }

  start(): void {
    if (this.animationId) return;
    this.animate();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.resize);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    if (this.isPlaying) {
      this.time += 0.016;
    }
    this.render();
  };

  private getWidth(): number {
    return this.canvas.width / this.dpr;
  }

  private getHeight(): number {
    return this.canvas.height / this.dpr;
  }

  private render(): void {
    const w = this.getWidth();
    const h = this.getHeight();

    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, w, h);

    this.drawBackgroundGlow(w, h);

    if (this.mode === 'spectrum') {
      this.drawSpectrum(w, h);
    } else {
      this.drawWaveform(w, h);
    }
  }

  private drawBackgroundGlow(w: number, h: number): void {
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 2);
    const gradient = this.ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
    gradient.addColorStop(0, `rgba(0, 212, 255, ${0.05 + pulse * 0.03})`);
    gradient.addColorStop(0.5, `rgba(255, 0, 110, ${0.03 + pulse * 0.02})`);
    gradient.addColorStop(1, 'rgba(10, 10, 26, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, w, h);
  }

  private getSpectrumColor(index: number, total: number): string {
    const ratio = index / (total - 1);
    if (ratio < 0.33) {
      const t = ratio / 0.33;
      const r = Math.round(255);
      const g = Math.round(50 + t * 100);
      const b = Math.round(30);
      return `rgb(${r}, ${g}, ${b})`;
    } else if (ratio < 0.66) {
      const t = (ratio - 0.33) / 0.33;
      const r = Math.round(255 - t * 150);
      const g = Math.round(180 - t * 30);
      const b = Math.round(30 + t * 50);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const t = (ratio - 0.66) / 0.34;
      const r = Math.round(100 + t * 50);
      const g = Math.round(50 + t * 30);
      const b = Math.round(200 + t * 55);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }

  private drawSpectrum(w: number, h: number): void {
    const barCount = this.spectrumData.length;
    const padding = 0.1;
    const breathe = 1 + 0.03 * Math.sin(this.time * 3);
    const totalBarWidth = w * (1 - padding * 2);
    const gap = totalBarWidth * 0.02;
    const barWidth = (totalBarWidth - gap * (barCount - 1)) / barCount;
    const startX = w * padding;
    const maxBarHeight = h * 0.7 * breathe;
    const baseY = h * 0.85;

    for (let i = 0; i < barCount; i++) {
      const value = Math.pow(this.spectrumData[i], 1.2);
      const barHeight = value * maxBarHeight;
      const x = startX + i * (barWidth + gap);
      const y = baseY - barHeight;
      const color = this.getSpectrumColor(i, barCount);

      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 15;

      const barGradient = this.ctx.createLinearGradient(x, baseY, x, y);
      barGradient.addColorStop(0, color);
      barGradient.addColorStop(1, this.lightenColor(color, 30));

      this.ctx.fillStyle = barGradient;
      this.roundRect(this.ctx, x, y, barWidth, barHeight, barWidth / 3);
      this.ctx.fill();

      if (value > 0.1) {
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(x + barWidth / 2, y - 4, Math.max(3, barWidth * 0.35), 0, Math.PI * 2);
        this.ctx.fill();
      }

      if (this.isPlaying && value > 0.5 && Math.random() < 0.3) {
        this.spawnParticle(x + barWidth / 2, y, color);
      }
    }

    this.ctx.shadowBlur = 0;
    this.updateParticles(w, h);
  }

  private drawWaveform(w: number, h: number): void {
    const centerY = h / 2;
    const amp = h * 0.35;
    const data = this.waveformData;
    const len = data.length;

    this.ctx.save();

    this.ctx.beginPath();
    const gradient = this.ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#00d4ff');
    gradient.addColorStop(0.5, '#8a2be2');
    gradient.addColorStop(1, '#ff006e');

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = '#00d4ff';
    this.ctx.shadowBlur = 20;

    for (let side = -1; side <= 1; side += 2) {
      this.ctx.beginPath();
      for (let i = 0; i < len; i++) {
        const t = i / (len - 1);
        const x = t * w;
        const waveVal = data[i];
        const ripple = Math.sin(t * 20 + this.time * 4) * 0.08 * (0.5 + 0.5 * Math.sin(this.time * 2));
        const waterWave = Math.sin(t * 8 + this.time * 2.5) * 0.05;
        const y = centerY + side * (waveVal * amp + ripple * amp + waterWave * amp * 0.3);

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          const prevT = (i - 1) / (len - 1);
          const prevX = prevT * w;
          const prevVal = data[i - 1];
          const prevRipple = Math.sin(prevT * 20 + this.time * 4) * 0.08 * (0.5 + 0.5 * Math.sin(this.time * 2));
          const prevWater = Math.sin(prevT * 8 + this.time * 2.5) * 0.05;
          const prevY = centerY + side * (prevVal * amp + prevRipple * amp + prevWater * amp * 0.3);

          const cpx = (prevX + x) / 2;
          this.ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
        }
      }
      this.ctx.stroke();
    }

    this.ctx.shadowBlur = 0;
    this.ctx.restore();

    if (this.isPlaying) {
      const maxIdx = this.findMaxIndex(data);
      const maxX = (maxIdx / (len - 1)) * w;
      const maxY = centerY + data[maxIdx] * amp;
      if (Math.random() < 0.4) {
        this.spawnParticle(maxX, maxY, Math.random() > 0.5 ? '#00d4ff' : '#ff006e');
      }
      const symY = centerY - data[maxIdx] * amp;
      if (Math.random() < 0.4) {
        this.spawnParticle(maxX, symY, Math.random() > 0.5 ? '#8a2be2' : '#ff006e');
      }
    }

    this.updateParticles(w, h);
  }

  private findMaxIndex(arr: Float32Array): number {
    let maxIdx = 0;
    let maxVal = -Infinity;
    for (let i = 0; i < arr.length; i++) {
      const abs = Math.abs(arr[i]);
      if (abs > maxVal) {
        maxVal = abs;
        maxIdx = i;
      }
    }
    return maxIdx;
  }

  private spawnParticle(x: number, y: number, color: string): void {
    if (this.particles.length > 150) return;
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 1,
      life: 1,
      maxLife: 0.8 + Math.random() * 0.6,
      color,
      size: 1 + Math.random() * 2.5
    });
  }

  private updateParticles(w: number, h: number): void {
    this.ctx.save();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life -= 0.016 / p.maxLife;

      if (p.life <= 0 || p.y > h + 10 || p.x < -10 || p.x > w + 10) {
        this.particles.splice(i, 1);
        continue;
      }

      const alpha = Math.max(0, p.life);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private lightenColor(rgb: string, percent: number): string {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return rgb;
    const r = Math.min(255, Math.round(parseInt(match[1]) * (1 + percent / 100)));
    const g = Math.min(255, Math.round(parseInt(match[2]) * (1 + percent / 100)));
    const b = Math.min(255, Math.round(parseInt(match[3]) * (1 + percent / 100)));
    return `rgb(${r}, ${g}, ${b})`;
  }
}
