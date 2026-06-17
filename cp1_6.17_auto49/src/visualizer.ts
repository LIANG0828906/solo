import { Particle, BeatSignal, WAVE_COLOR_START, WAVE_COLOR_END, ACCENT_COLOR, NORMAL_COLOR, CANVAS_BG } from './types';

export class Visualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private waveData: number[] = [];
  private waveDataLength: number = 200;
  private currentBeatIndex: number = 0;
  private beatProgress: number = 0;
  private isPlaying: boolean = false;
  private animationId: number | null = null;
  private glowAlpha: number = 0;
  private glowColor: string = NORMAL_COLOR;
  private lastBeatTime: number = 0;
  private beatIntensity: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2d context');
    this.ctx = ctx;
    this.resize();
    this.initWaveData();
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.waveDataLength = Math.floor(rect.width / 3);
    this.initWaveData();
  }

  private initWaveData(): void {
    this.waveData = new Array(this.waveDataLength).fill(0);
  }

  start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.animate();
  }

  stop(): void {
    this.isPlaying = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  onBeat(signal: BeatSignal): void {
    this.currentBeatIndex = signal.beatIndex;
    this.beatIntensity = signal.intensity;
    this.lastBeatTime = performance.now();
    this.glowAlpha = 1;

    if (signal.beatType === 'accent') {
      this.glowColor = ACCENT_COLOR;
    } else if (signal.beatType === 'normal') {
      this.glowColor = NORMAL_COLOR;
    }

    if (signal.beatType !== 'mute') {
      this.spawnParticles(signal.intensity);
      this.addWavePeak(signal.intensity);
    }
  }

  setBeatProgress(progress: number): void {
    this.beatProgress = progress;
  }

  private spawnParticles(intensity: number): void {
    const count = Math.floor(20 + Math.random() * 10 + intensity * 10);
    const centerX = this.canvas.width / (window.devicePixelRatio || 1) / 2;
    const centerY = this.canvas.height / (window.devicePixelRatio || 1) / 2;

    const color = intensity >= 0.9 ? ACCENT_COLOR : NORMAL_COLOR;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3 + intensity * 2;
      const size = 2 + Math.random() * 4;

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.01,
      });
    }
  }

  private addWavePeak(intensity: number): void {
    const peakValue = 0.3 + intensity * 0.7;
    this.waveData[0] = peakValue;
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.alpha -= p.decay;
      p.size *= 0.98;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateWave(): void {
    for (let i = this.waveData.length - 1; i > 0; i--) {
      this.waveData[i] = this.waveData[i - 1] * 0.95;
    }
    if (this.waveData.length > 0) {
      this.waveData[0] *= 0.9;
    }
  }

  private drawBackground(): void {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    this.ctx.fillStyle = CANVAS_BG;
    this.ctx.fillRect(0, 0, width, height);
  }

  private drawGlow(): void {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const centerX = width / 2;
    const centerY = height / 2;

    const timeSinceBeat = (performance.now() - this.lastBeatTime) / 1000;
    const glowDuration = 0.5;
    const progress = Math.min(1, timeSinceBeat / glowDuration);

    const minSize = 20;
    const maxSize = 100;
    const size = minSize + (maxSize - minSize) * this.easeOutCubic(progress);
    const alpha = Math.max(0, 1 - progress);

    if (alpha <= 0) return;

    const gradient = this.ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      size
    );
    gradient.addColorStop(0, this.glowColor + Math.floor(alpha * 200).toString(16).padStart(2, '0'));
    gradient.addColorStop(0.5, this.glowColor + Math.floor(alpha * 100).toString(16).padStart(2, '0'));
    gradient.addColorStop(1, this.glowColor + '00');

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, size * 0.3, 0, Math.PI * 2);
    this.ctx.fillStyle = this.glowColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    this.ctx.fill();
  }

  private drawWave(): void {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const waveHeight = 80;
    const baseY = height - 60;

    const gradient = this.ctx.createLinearGradient(0, baseY - waveHeight, 0, baseY + waveHeight);
    gradient.addColorStop(0, WAVE_COLOR_START);
    gradient.addColorStop(1, WAVE_COLOR_END);

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();

    const step = width / (this.waveData.length - 1);

    for (let i = 0; i < this.waveData.length; i++) {
      const x = i * step;
      const y = baseY - this.waveData[i] * waveHeight;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.stroke();

    for (let i = 0; i < this.waveData.length; i++) {
      const x = i * step;
      const y = baseY + this.waveData[i] * waveHeight * 0.5;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.globalAlpha = 0.5;
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  private drawParticles(): void {
    for (const p of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
      this.ctx.fill();
    }
  }

  private drawBeatIndicator(): void {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    const barWidth = 4;
    const barHeight = 20;
    const spacing = 8;
    const totalBeats = 8;
    const totalWidth = totalBeats * barWidth + (totalBeats - 1) * spacing;
    const startX = (width - totalWidth) / 2;
    const y = height - 30;

    for (let i = 0; i < totalBeats; i++) {
      const x = startX + i * (barWidth + spacing);
      const isActive = i === this.currentBeatIndex % totalBeats;

      this.ctx.fillStyle = isActive ? WAVE_COLOR_END : '#333';
      this.ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private animate = (): void => {
    if (!this.isPlaying) return;

    this.updateParticles();
    this.updateWave();

    this.drawBackground();
    this.drawWave();
    this.drawGlow();
    this.drawParticles();
    this.drawBeatIndicator();

    this.animationId = requestAnimationFrame(this.animate);
  };

  renderStatic(): void {
    this.drawBackground();
    this.drawWave();
    this.drawParticles();
    this.drawBeatIndicator();
  }

  destroy(): void {
    this.stop();
    this.particles = [];
  }
}
