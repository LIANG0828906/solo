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
  baseSize: number;
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
    particleDensity: 150,
    particleSpeed: 0.5,
    particleSize: 3,
    colors: {
      background: '#2a3a4a',
      leftChannel: '#a8d8ea',
      rightChannel: '#ffb7c5',
      barColors: ['#ff6b6b', '#c9b1ff', '#7dd3fc', '#00d2ff'],
      particleColors: ['#ffb7c5', '#c9b1ff', '#a8d8ea', '#7dd3fc', '#fde68a']
    }
  },
  cyberpunk: {
    particleDensity: 400,
    particleSpeed: 3,
    particleSize: 2,
    colors: {
      background: '#0a0a1a',
      leftChannel: '#00d2ff',
      rightChannel: '#ff6b6b',
      barColors: ['#ff0000', '#ff00ff', '#9d00ff', '#00d2ff'],
      particleColors: ['#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#00ff00']
    }
  },
  darkTech: {
    particleDensity: 80,
    particleSpeed: 1,
    particleSize: 5,
    colors: {
      background: '#0a0a0a',
      leftChannel: '#00ff00',
      rightChannel: '#ffffff',
      barColors: ['#ff0000', '#9900ff', '#00ff88', '#ffffff'],
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
  private particleSize: number;
  private targetParticleDensity: number;
  private targetParticleSpeed: number;
  private targetParticleSize: number;
  private spectrumSensitivity: number;
  private blendMode: BlendMode;
  private currentTheme: ThemeType;
  private targetTheme: ThemeType;
  private themeTransitionProgress = 1;
  private readonly themeTransitionDuration = 500;
  private themeTransitionStart = 0;
  private spectrumData: Float32Array = new Float32Array(64);
  private leftWaveform: Float32Array = new Float32Array(256);
  private rightWaveform: Float32Array = new Float32Array(256);
  private hasAudioData = false;
  private idleTime = 0;

  constructor(canvas: HTMLCanvasElement, options: VisualizerOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;

    this.width = options.width || canvas.width;
    this.height = options.height || canvas.height;
    this.particleDensity = options.particleDensity || 200;
    this.particleSpeed = options.particleSpeed || 1;
    this.particleSize = 3;
    this.targetParticleDensity = this.particleDensity;
    this.targetParticleSpeed = this.particleSpeed;
    this.targetParticleSize = this.particleSize;
    this.spectrumSensitivity = options.spectrumSensitivity || 1;
    this.blendMode = options.blendMode || 'normal';
    this.currentTheme = options.theme || 'darkTech';
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
      vy: (Math.random() - 0.5) * config.particleSpeed + config.particleSpeed * 0.3,
      baseSize: Math.random() * config.particleSize + 1,
      color: config.colors.particleColors[colorIndex],
      alpha: Math.random() * 0.5 + 0.3
    };
  }

  setSpectrumData(data: Float32Array): void {
    this.hasAudioData = true;
    if (data.length >= 64) {
      this.spectrumData = data.slice(0, 64);
    } else {
      const expanded = new Float32Array(64);
      for (let i = 0; i < 64; i++) {
        expanded[i] = data[Math.floor(i * data.length / 64)] || 0;
      }
      this.spectrumData = expanded;
    }
  }

  setWaveformData(left: Float32Array, right: Float32Array): void {
    this.hasAudioData = true;
    this.leftWaveform = left;
    this.rightWaveform = right;
  }

  setParticleDensity(density: number): void {
    this.targetParticleDensity = Math.max(50, Math.min(500, density));
    this.particleDensity = this.targetParticleDensity;
    this.adjustParticleCount();
  }

  setParticleSpeed(speed: number): void {
    this.targetParticleSpeed = Math.max(0.1, Math.min(5, speed));
    this.particleSpeed = this.targetParticleSpeed;
  }

  setSpectrumSensitivity(sensitivity: number): void {
    this.spectrumSensitivity = Math.max(0.5, Math.min(3, sensitivity));
  }

  setBlendMode(mode: BlendMode): void {
    this.blendMode = mode;
  }

  setTheme(theme: ThemeType): void {
    if (theme === this.currentTheme) return;
    this.targetTheme = theme;
    this.themeTransitionStart = performance.now();
    this.themeTransitionProgress = 0;
    this.targetParticleDensity = themes[theme].particleDensity;
    this.targetParticleSpeed = themes[theme].particleSpeed;
    this.targetParticleSize = themes[theme].particleSize;
  }

  private adjustParticleCount(): void {
    while (this.particles.length < this.particleDensity) {
      this.particles.push(this.createParticle(themes[this.currentTheme]));
    }
    while (this.particles.length > this.particleDensity) {
      this.particles.pop();
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
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

  private getIdleSpectrum(index: number, total: number, time: number): number {
    const base = Math.sin(time * 2 + index * 0.3) * 0.3 + 0.4;
    const wave = Math.sin(time * 3 + index * 0.15) * 0.2;
    const envelope = Math.exp(-Math.pow((index / total - 0.3) * 3, 2));
    return Math.max(0, Math.min(1, (base + wave) * envelope));
  }

  private getIdleWaveform(index: number, total: number, time: number, channel: number): number {
    const freq = channel === 0 ? 3 : 4;
    const phase = channel === 0 ? 0 : Math.PI / 2;
    return Math.sin(time * freq + (index / total) * Math.PI * 4 + phase) * 0.6;
  }

  drawWaveform(): void {
    const ctx = this.ctx;
    const centerY = this.height / 2;
    const leftY = centerY - this.height * 0.08;
    const rightY = centerY + this.height * 0.08;
    const colors = this.getInterpolatedColors();

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const sampleCount = Math.max(this.leftWaveform.length, this.rightWaveform.length, 256);
    const stepX = this.width / (sampleCount - 1);

    ctx.beginPath();
    ctx.strokeStyle = this.hasAudioData ? colors.leftChannel : '#00d2ff';
    for (let i = 0; i < sampleCount; i++) {
      let amplitude: number;
      if (this.hasAudioData && this.leftWaveform.length > 0) {
        const idx = Math.floor(i * this.leftWaveform.length / sampleCount);
        amplitude = this.leftWaveform[idx] || 0;
      } else {
        amplitude = this.getIdleWaveform(i, sampleCount, this.idleTime, 0);
      }
      amplitude *= this.spectrumSensitivity;
      const x = i * stepX;
      const y = leftY + amplitude * this.height * 0.25;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = this.hasAudioData ? colors.rightChannel : '#ff6b6b';
    for (let i = 0; i < sampleCount; i++) {
      let amplitude: number;
      if (this.hasAudioData && this.rightWaveform.length > 0) {
        const idx = Math.floor(i * this.rightWaveform.length / sampleCount);
        amplitude = this.rightWaveform[idx] || 0;
      } else {
        amplitude = this.getIdleWaveform(i, sampleCount, this.idleTime, 1);
      }
      amplitude *= this.spectrumSensitivity;
      const x = i * stepX;
      const y = rightY - amplitude * this.height * 0.25;
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
    const maxBarHeight = this.height * 0.55;
    const startY = this.height * 0.38;

    for (let i = 0; i < barCount; i++) {
      let value: number;
      if (this.hasAudioData) {
        value = this.spectrumData[i] || 0;
      } else {
        value = this.getIdleSpectrum(i, barCount, this.idleTime);
      }
      const barHeight = Math.min(value * this.spectrumSensitivity * maxBarHeight * 2.5, maxBarHeight);
      const x = gap + i * (barWidth + gap);
      const y = startY + (maxBarHeight - barHeight);
      const radius = Math.min(barWidth / 2, 6);

      ctx.fillStyle = this.getGradientColor(colors.barColors, i, barCount);
      ctx.beginPath();
      if (barHeight > radius * 2) {
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barHeight);
        ctx.lineTo(x, y + barHeight);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
      } else {
        const r = barHeight / 2;
        ctx.arc(x + barWidth / 2, y + r, r, 0, Math.PI * 2);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  drawParticles(): void {
    const ctx = this.ctx;
    const colors = this.getInterpolatedColors();
    const t = this.themeTransitionProgress;
    const currentSpeed = this.lerp(this.particleSpeed, this.targetParticleSpeed, t);
    const currentSize = this.lerp(this.particleSize, this.targetParticleSize, t);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.x += p.vx * currentSpeed;
      p.y += p.vy * currentSpeed;

      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
      if (p.y > this.height + 10) {
        p.y = -10;
        p.x = Math.random() * this.width;
      }
      if (p.y < -10) p.y = this.height + 10;

      const colorIndex = i % colors.particleColors.length;
      ctx.fillStyle = colors.particleColors[colorIndex];
      ctx.globalAlpha = p.alpha;

      const size = p.baseSize * currentSize / 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, size), 0, Math.PI * 2);
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
      this.particleSpeed = this.targetParticleSpeed;
      this.particleSize = this.targetParticleSize;
    }
  }

  private render(now: number): void {
    this.idleTime = now * 0.001;
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
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  destroy(): void {
    this.stop();
    this.particles = [];
  }
}
