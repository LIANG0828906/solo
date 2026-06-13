/* eslint-disable @typescript-eslint/no-explicit-any */
export type BlendMode = 'normal' | 'overlay' | 'softLight';
export type ThemeType = 'japanese' | 'cyberpunk' | 'darkTech';

interface ThemeColors {
  background: string;
  leftChannel: string;
  rightChannel: string;
  barColors: string[];
  particleColors: string[];
}

interface ThemeConfig {
  particleDensity: number;
  particleSpeed: number;
  particleSize: number;
  colors: ThemeColors;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

interface VisualizerOptions {
  width?: number;
  height?: number;
  particleDensity?: number;
  particleSpeed?: number;
  spectrumSensitivity?: number;
  blendMode?: BlendMode;
  theme?: ThemeType;
}

const themes: Record<ThemeType, ThemeConfig> = {
  japanese: {
    particleDensity: 50,
    particleSpeed: 0.5,
    particleSize: 3,
    colors: {
      background: '#e8f4f8',
      leftChannel: '#a8d8ea',
      rightChannel: '#ffb7c5',
      barColors: ['#ffb7c5', '#c9b1ff', '#a8d8ea', '#7dd3fc'],
      particleColors: ['#ffb7c5', '#c9b1ff', '#a8d8ea', '#7dd3fc', '#fde68a']
    }
  },
  cyberpunk: {
    particleDensity: 100,
    particleSpeed: 3,
    particleSize: 2,
    colors: {
      background: '#0a0a1a',
      leftChannel: '#ff00ff',
      rightChannel: '#00ffff',
      barColors: ['#ff0000', '#ff00ff', '#00ffff', '#00ff00'],
      particleColors: ['#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#00ff00']
    }
  },
  darkTech: {
    particleDensity: 25,
    particleSpeed: 1,
    particleSize: 5,
    colors: {
      background: '#0a0a0a',
      leftChannel: '#00ff00',
      rightChannel: '#ffffff',
      barColors: ['#00ff00', '#00cc00', '#009900', '#ffffff'],
      particleColors: ['#00ff00', '#ffffff', '#008800', '#66ff66']
    }
  }
};

export class Visualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private animationFrameId: number | null = null;
  private particles: Particle[] = [];
  private particleDensity: number;
  private particleSpeed: number;
  private spectrumSensitivity: number;
  private blendMode: BlendMode;
  private currentTheme: ThemeType;
  private targetTheme: ThemeType;
  private themeTransitionProgress = 1;
  private readonly themeTransitionDuration = 500;
  private themeTransitionStart = 0;
  private spectrumData: Float32Array = new Float32Array(64);
  private waveformData: Float32Array = new Float32Array(256);
  private leftWaveform: Float32Array = new Float32Array(256);
  private rightWaveform: Float32Array = new Float32Array(256);

  constructor(canvas: HTMLCanvasElement, options: VisualizerOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;

    this.width = options.width || canvas.width;
    this.height = options.height || canvas.height;
    this.particleDensity = options.particleDensity || 50;
    this.particleSpeed = options.particleSpeed || 1;
    this.spectrumSensitivity = options.spectrumSensitivity || 1;
    this.blendMode = options.blendMode || 'normal';
    this.currentTheme = options.theme || 'japanese';
    this.targetTheme = this.currentTheme;

    this.resize(this.width, this.height);
    this.initParticles();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.initParticles();
  }

  private initParticles(): void {
    this.particles = [];
    const config = themes[this.currentTheme];

    for (let i = 0; i < this.particleDensity; i++) {
      this.particles.push(this.createParticle(config));
    }
  }

  private createParticle(config: ThemeConfig): Particle {
    const colorIndex = Math.floor(Math.random() * config.colors.particleColors.length);
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * config.particleSpeed,
      vy: (Math.random() - 0.5) * config.particleSpeed + config.particleSpeed * 0.5,
      size: Math.random() * config.particleSize + 1,
      color: config.colors.particleColors[colorIndex],
      alpha: Math.random() * 0.5 + 0.3
    };
  }

  setSpectrumData(data: Float32Array): void {
    if (data.length >= 64) {
      this.spectrumData = data.slice(0, 64);
    }
  }

  setWaveformData(left: Float32Array, right: Float32Array): void {
    this.leftWaveform = left;
    this.rightWaveform = right;
  }

  setParticleDensity(density: number): void {
    this.particleDensity = Math.max(0, Math.min(200, density));
    this.adjustParticleCount();
  }

  setParticleSpeed(speed: number): void {
    this.particleSpeed = Math.max(0.1, Math.min(5, speed));
  }

  setSpectrumSensitivity(sensitivity: number): void {
    this.spectrumSensitivity = Math.max(0.1, Math.min(3, sensitivity));
  }

  setBlendMode(mode: BlendMode): void {
    this.blendMode = mode;
  }

  setTheme(theme: ThemeType): void {
    if (theme === this.currentTheme) return;
    this.targetTheme = theme;
    this.themeTransitionStart = performance.now();
    this.themeTransitionProgress = 0;
  }

  private adjustParticleCount(): void {
    const config = themes[this.currentTheme];
    while (this.particles.length < this.particleDensity) {
      this.particles.push(this.createParticle(config));
    }
    while (this.particles.length > this.particleDensity) {
      this.particles.pop();
    }
  }

  private lerpColor(color1: string, color2: string, t: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);

    if (!c1 || !c2) return color1;

    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  }

  private getInterpolatedColors(): ThemeColors {
    if (this.themeTransitionProgress >= 1) {
      return themes[this.currentTheme].colors;
    }

    const currentColors = themes[this.currentTheme].colors;
    const targetColors = themes[this.targetTheme].colors;
    const t = this.themeTransitionProgress;

    return {
      background: this.lerpColor(currentColors.background, targetColors.background, t),
      leftChannel: this.lerpColor(currentColors.leftChannel, targetColors.leftChannel, t),
      rightChannel: this.lerpColor(currentColors.rightChannel, targetColors.rightChannel, t),
      barColors: currentColors.barColors.map((c, i) =>
        this.lerpColor(c, targetColors.barColors[i] || c, t)
      ),
      particleColors: currentColors.particleColors.map((c, i) =>
        this.lerpColor(c, targetColors.particleColors[i] || c, t)
      )
    };
  }

  private getGradientColor(colors: string[], index: number, total: number): string {
    const position = index / (total - 1);
    const segment = position * (colors.length - 1);
    const segmentIndex = Math.floor(segment);
    const segmentT = segment - segmentIndex;

    const color1 = colors[segmentIndex];
    const color2 = colors[Math.min(segmentIndex + 1, colors.length - 1)];

    return this.lerpColor(color1, color2, segmentT);
  }

  private applyBlendMode(): void {
    switch (this.blendMode) {
      case 'overlay':
        this.ctx.globalCompositeOperation = 'overlay';
        break;
      case 'softLight':
        this.ctx.globalCompositeOperation = 'soft-light';
        break;
      default:
        this.ctx.globalCompositeOperation = 'source-over';
    }
  }

  drawWaveform(): void {
    const ctx = this.ctx;
    const colors = this.getInterpolatedColors();
    const centerY = this.height / 2;
    const leftY = centerY - this.height * 0.1;
    const rightY = centerY + this.height * 0.1;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.strokeStyle = '#00d2ff';
    const leftStep = this.width / (this.leftWaveform.length - 1);

    for (let i = 0; i < this.leftWaveform.length; i++) {
      const x = i * leftStep;
      const amplitude = this.leftWaveform[i] * this.spectrumSensitivity;
      const y = leftY + amplitude * this.height * 0.2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#ff6b6b';

    for (let i = 0; i < this.rightWaveform.length; i++) {
      const x = i * leftStep;
      const amplitude = this.rightWaveform[i] * this.spectrumSensitivity;
      const y = rightY - amplitude * this.height * 0.2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  drawFrequencyBars(): void {
    const ctx = this.ctx;
    const colors = this.getInterpolatedColors();
    const barCount = 64;
    const gap = 2;
    const barWidth = (this.width - gap * (barCount + 1)) / barCount;
    const maxBarHeight = this.height * 0.6;
    const startY = this.height * 0.35;

    for (let i = 0; i < barCount; i++) {
      const value = this.spectrumData[i] || 0;
      const barHeight = Math.min(value * this.spectrumSensitivity * maxBarHeight * 3, maxBarHeight);
      const x = gap + i * (barWidth + gap);
      const y = startY + (maxBarHeight - barHeight);
      const radius = barWidth / 2;

      const gradient = ctx.createLinearGradient(x, y + barHeight, x, y);
      const colorCount = colors.barColors.length;
      for (let j = 0; j < colorCount; j++) {
        gradient.addColorStop(j / (colorCount - 1), colors.barColors[j]);
      }

      ctx.fillStyle = this.getGradientColor(colors.barColors, i, barCount);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, y + barHeight);
      ctx.lineTo(x, y + barHeight);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawParticles(): void {
    const ctx = this.ctx;
    const colors = this.getInterpolatedColors();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.x += p.vx * this.particleSpeed;
      p.y += p.vy * this.particleSpeed;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y > this.height) {
        p.y = -p.size;
        p.x = Math.random() * this.width;
      }
      if (p.y < -p.size) p.y = this.height;

      const colorIndex = i % colors.particleColors.length;
      ctx.fillStyle = colors.particleColors[colorIndex];
      ctx.globalAlpha = p.alpha;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  private updateThemeTransition(now: number): void {
    if (this.themeTransitionProgress >= 1) return;

    const elapsed = now - this.themeTransitionStart;
    this.themeTransitionProgress = Math.min(elapsed / this.themeTransitionDuration, 1);

    if (this.themeTransitionProgress >= 1) {
      this.currentTheme = this.targetTheme;
    }
  }

  private render(now: number): void {
    this.updateThemeTransition(now);

    const colors = this.getInterpolatedColors();
    const ctx = this.ctx;

    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, this.width, this.height);

    this.applyBlendMode();

    this.drawParticles();
    this.drawFrequencyBars();
    this.drawWaveform();

    ctx.globalCompositeOperation = 'source-over';
  }

  start(): void {
    if (this.animationFrameId !== null) return;

    const loop = (now: number) => {
      this.render(now);
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  async takeScreenshot(): Promise<void> {
    const exportWidth = 800;
    const exportHeight = 450;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;
    const exportCtx = exportCanvas.getContext('2d');

    if (!exportCtx) {
      throw new Error('Could not create export context');
    }

    exportCtx.drawImage(this.canvas, 0, 0, exportWidth, exportHeight);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    const timestamp = Date.now();
    link.download = `waveform_${timestamp}.png`;
    link.href = dataUrl;
    link.click();
  }

  destroy(): void {
    this.stop();
    this.particles = [];
  }
}
