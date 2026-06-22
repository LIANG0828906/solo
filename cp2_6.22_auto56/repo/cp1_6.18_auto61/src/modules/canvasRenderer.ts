import type { EmotionType } from '@/types';
import { EMOTION_COLORS } from '@/types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
}

export class CanvasRenderer {
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private lastTime: number = 0;
  private width: number = 0;
  private height: number = 0;
  private emotion: EmotionType = 'calm';
  private intensity: number = 0.5;
  private spectrumData: Float32Array | null = null;
  private isMobile: boolean = false;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(
    ctx: CanvasRenderingContext2D,
    emotion: EmotionType,
    intensity: number,
    isMobile: boolean = false
  ) {
    this.ctx = ctx;
    this.emotion = emotion;
    this.intensity = intensity;
    this.isMobile = isMobile;
    this.width = ctx.canvas.width;
    this.height = ctx.canvas.height;
    this.initParticles();
  }

  setEmotion(emotion: EmotionType, intensity: number): void {
    this.emotion = emotion;
    this.intensity = intensity;
    this.initParticles();
  }

  setSpectrumData(data: Float32Array | null): void {
    this.spectrumData = data;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  start(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.lastTime = performance.now();
    this.animate();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  renderFrame(): void {
    if (!this.ctx) return;
    this.drawBackground();
    this.updateAndDrawParticles(1 / 60);
  }

  private animate(): void {
    if (!this.ctx) return;

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.drawBackground();
    this.updateAndDrawParticles(delta);

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private drawBackground(): void {
    if (!this.ctx) return;
    const color = EMOTION_COLORS[this.emotion];
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0B0E17');
    gradient.addColorStop(0.5, '#1A1A2E');
    gradient.addColorStop(1, this.hexToRgba(color, 0.15));

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private initParticles(): void {
    const particleCount = this.isMobile ? 60 : 120;
    this.particles = [];

    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    const color = EMOTION_COLORS[this.emotion];
    const baseX = Math.random() * this.width;
    const baseY = Math.random() * this.height;
    const speed = 30 + this.intensity * 80;

    switch (this.emotion) {
      case 'happy':
        return {
          x: baseX,
          y: baseY,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          size: 10 + Math.random() * 30 * this.intensity,
          color: this.getHappyColor(),
          alpha: 0.6 + Math.random() * 0.4,
          rotation: 0,
          rotationSpeed: 0,
        };

      case 'sad':
        return {
          x: baseX,
          y: -Math.random() * this.height,
          vx: (Math.random() - 0.5) * 10,
          vy: 30 + Math.random() * 50 * this.intensity,
          size: 2 + Math.random() * 4,
          color,
          alpha: 0.3 + Math.random() * 0.5,
          rotation: 0,
          rotationSpeed: 0,
        };

      case 'angry':
        return {
          x: baseX,
          y: baseY,
          vx: (Math.random() - 0.5) * speed * 2,
          vy: (Math.random() - 0.5) * speed * 2,
          size: 15 + Math.random() * 25 * this.intensity,
          color,
          alpha: 0.7 + Math.random() * 0.3,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 8 * this.intensity,
        };

      case 'calm':
      default:
        return {
          x: baseX,
          y: baseY,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          size: 20 + Math.random() * 40,
          color,
          alpha: 0.2 + Math.random() * 0.3,
          rotation: 0,
          rotationSpeed: 0,
        };
    }
  }

  private getHappyColor(): string {
    const colors = ['#FFD93D', '#FF6B9D', '#6BCB77', '#4D96FF', '#C084FC', '#F97316'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private updateAndDrawParticles(delta: number): void {
    const speedMultiplier = this.spectrumData
      ? 0.5 + this.getAverageSpectrum() * 2
      : 1;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      const intensityScale = this.spectrumData
        ? 0.5 + this.getBandEnergy(i, this.particles.length) * 1.5
        : this.intensity;

      this.updateParticle(p, delta * speedMultiplier * intensityScale);
      this.handleBoundary(p);
      this.drawParticle(p, intensityScale);
    }

    if (this.emotion === 'happy') {
      this.handleCollisions();
    }
  }

  private getAverageSpectrum(): number {
    if (!this.spectrumData) return 0;
    let sum = 0;
    for (let i = 0; i < this.spectrumData.length; i++) {
      sum += this.spectrumData[i];
    }
    return sum / this.spectrumData.length;
  }

  private getBandEnergy(index: number, total: number): number {
    if (!this.spectrumData) return this.intensity;
    const bandIndex = Math.floor((index / total) * this.spectrumData.length);
    return this.spectrumData[Math.min(bandIndex, this.spectrumData.length - 1)];
  }

  private updateParticle(p: Particle, delta: number): void {
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.rotation += p.rotationSpeed * delta;

    if (this.emotion === 'angry') {
      p.alpha = 0.4 + Math.sin(performance.now() / 100 + p.x) * 0.6 * this.intensity;
    }

    if (this.emotion === 'sad') {
      p.alpha = 0.3 + Math.sin(performance.now() / 500 + p.y * 0.01) * 0.3;
    }
  }

  private handleBoundary(p: Particle): void {
    if (this.emotion === 'sad') {
      if (p.y > this.height + 20) {
        p.y = -20;
        p.x = Math.random() * this.width;
      }
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
    } else {
      if (p.x < p.size) {
        p.x = p.size;
        p.vx = Math.abs(p.vx);
      }
      if (p.x > this.width - p.size) {
        p.x = this.width - p.size;
        p.vx = -Math.abs(p.vx);
      }
      if (p.y < p.size) {
        p.y = p.size;
        p.vy = Math.abs(p.vy);
      }
      if (p.y > this.height - p.size) {
        p.y = this.height - p.size;
        p.vy = -Math.abs(p.vy);
      }
    }
  }

  private handleCollisions(): void {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < p1.size + p2.size) {
          const nx = dx / dist;
          const ny = dy / dist;

          const dvx = p1.vx - p2.vx;
          const dvy = p1.vy - p2.vy;
          const dvn = dvx * nx + dvy * ny;

          if (dvn > 0) {
            p1.vx -= dvn * nx * 0.5;
            p1.vy -= dvn * ny * 0.5;
            p2.vx += dvn * nx * 0.5;
            p2.vy += dvn * ny * 0.5;

            const blendColor = this.blendColors(p1.color, p2.color);
            p1.color = blendColor;
            p2.color = blendColor;
          }
        }
      }
    }
  }

  private blendColors(c1: string, c2: string): string {
    const r1 = parseInt(c1.slice(1, 3), 16);
    const g1 = parseInt(c1.slice(3, 5), 16);
    const b1 = parseInt(c1.slice(5, 7), 16);
    const r2 = parseInt(c2.slice(1, 3), 16);
    const g2 = parseInt(c2.slice(3, 5), 16);
    const b2 = parseInt(c2.slice(5, 7), 16);

    const r = Math.floor((r1 + r2) / 2);
    const g = Math.floor((g1 + g2) / 2);
    const b = Math.floor((b1 + b2) / 2);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private drawParticle(p: Particle, intensityScale: number): void {
    if (!this.ctx) return;
    this.ctx.save();
    this.ctx.globalAlpha = p.alpha;

    switch (this.emotion) {
      case 'happy':
        this.drawHappyParticle(p, intensityScale);
        break;
      case 'sad':
        this.drawSadParticle(p);
        break;
      case 'angry':
        this.drawAngryParticle(p, intensityScale);
        break;
      case 'calm':
      default:
        this.drawCalmParticle(p);
        break;
    }

    this.ctx.restore();
  }

  private drawHappyParticle(p: Particle, scale: number): void {
    if (!this.ctx) return;
    const size = p.size * (0.8 + scale * 0.4);
    this.ctx.fillStyle = p.color;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.globalAlpha = p.alpha * 0.3;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, size * 1.3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawSadParticle(p: Particle): void {
    if (!this.ctx) return;
    this.ctx.lineWidth = p.size;
    this.ctx.lineCap = 'round';

    const gradient = this.ctx.createLinearGradient(p.x, p.y - 20, p.x, p.y + 40);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, p.color);
    gradient.addColorStop(1, 'transparent');

    this.ctx.strokeStyle = gradient;
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y - 30);
    this.ctx.lineTo(p.x, p.y + 30);
    this.ctx.stroke();
  }

  private drawAngryParticle(p: Particle, scale: number): void {
    if (!this.ctx) return;
    const size = p.size * (0.7 + scale * 0.6);
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rotation);

    this.ctx.fillStyle = p.color;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size);
    this.ctx.lineTo(size * 0.7, size * 0.7);
    this.ctx.lineTo(-size * 0.7, size * 0.7);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.globalAlpha = p.alpha * 0.4;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size * 1.3);
    this.ctx.lineTo(size * 0.9, size * 0.9);
    this.ctx.lineTo(-size * 0.9, size * 0.9);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawCalmParticle(p: Particle): void {
    if (!this.ctx) return;
    const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, p.color + 'CC');
    gradient.addColorStop(0.5, p.color + '66');
    gradient.addColorStop(1, p.color + '00');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }
}

export function generateThumbnail(
  emotion: EmotionType,
  intensity: number,
  width: number,
  height: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const renderer = new CanvasRenderer(ctx, emotion, intensity, false);
  renderer.resize(width, height);
  renderer.renderFrame();

  const dataUrl = canvas.toDataURL('image/png');
  renderer.stop();

  return dataUrl;
}
