import type { WaveformType, ColorTheme, ExplosionParticle, NoteParticle } from './types';

const MAX_PARTICLES = 200;
const EXPLOSION_RADIUS = 120;
const EXPLOSION_DURATION = 800;
const NOTE_LIFETIME = 1200;
const NOTE_FADE_OUT = 800;
const NOTE_SPACING = 15;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return rgbToHex(c1.r + (c2.r - c1.r) * t, c1.g + (c2.g - c1.g) * t, c1.b + (c2.b - c1.b) * t);
}

function getBrightness(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 / 255;
}

function frequencyFromBrightness(brightness: number, baseFreq: number = 220): number {
  return baseFreq + brightness * 600;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioContext: AudioContext | null = null;

  private explosionParticles: ExplosionParticle[] = [];
  private noteParticles: NoteParticle[] = [];
  private particleIdCounter = 0;

  private isDragging = false;
  private lastNoteX = 0;
  private lastNoteY = 0;
  private lastDragTime = 0;
  private dragVelocity = 0;

  private waveform: WaveformType = 'sine';
  private speedMultiplier = 1;
  private theme: ColorTheme;
  private previousTheme: ColorTheme | null = null;
  private themeTransitionStart = 0;
  private readonly THEME_TRANSITION_DURATION = 300;

  private animationFrameId: number = 0;
  private statsCallback: ((stats: { particles: number; fps: number }) => void) | null = null;
  private lastFrameTime = performance.now();
  private frameCount = 0;
  private fps = 0;

  constructor(canvas: HTMLCanvasElement, initialTheme: ColorTheme) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.theme = initialTheme;
    this.resize();
    this.bindEvents();
    this.animate();
  }

  setWaveform(waveform: WaveformType) {
    this.waveform = waveform;
  }

  setSpeed(multiplier: number) {
    this.speedMultiplier = multiplier;
  }

  setTheme(theme: ColorTheme) {
    if (theme.id === this.theme.id) return;
    this.previousTheme = this.theme;
    this.theme = theme;
    this.themeTransitionStart = performance.now();
  }

  setStatsCallback(callback: (stats: { particles: number; fps: number }) => void) {
    this.statsCallback = callback;
  }

  previewWaveform(waveform: WaveformType) {
    this.ensureAudioContext();
    this.playTone(440, waveform, 0.5, 0.2);
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  destroy() {
    cancelAnimationFrame(this.animationFrameId);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mouseleave', this.onMouseUp);
    this.canvas.removeEventListener('touchstart', this.onTouchStart, { passive: false } as AddEventListenerOptions);
    this.canvas.removeEventListener('touchmove', this.onTouchMove, { passive: false } as AddEventListenerOptions);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  private bindEvents() {
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('mouseleave', this.onMouseUp);
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd);
  }

  private getCanvasCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  private onMouseDown = (e: MouseEvent) => {
    const { x, y } = this.getCanvasCoords(e.clientX, e.clientY);
    this.startDrag(x, y);
    this.createExplosion(x, y);
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    const { x, y } = this.getCanvasCoords(e.clientX, e.clientY);
    this.dragTo(x, y);
  };

  private onMouseUp = () => {
    this.endDrag();
  };

  private onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const { x, y } = this.getCanvasCoords(touch.clientX, touch.clientY);
    this.startDrag(x, y);
    this.createExplosion(x, y);
  };

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!this.isDragging || e.touches.length === 0) return;
    const touch = e.touches[0];
    const { x, y } = this.getCanvasCoords(touch.clientX, touch.clientY);
    this.dragTo(x, y);
  };

  private onTouchEnd = () => {
    this.endDrag();
  };

  private startDrag(x: number, y: number) {
    this.isDragging = true;
    this.lastNoteX = x;
    this.lastNoteY = y;
    this.lastDragTime = performance.now();
    this.dragVelocity = 0;
    this.ensureAudioContext();
  }

  private dragTo(x: number, y: number) {
    const now = performance.now();
    const dx = x - this.lastNoteX;
    const dy = y - this.lastNoteY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const dt = now - this.lastDragTime;
    if (dt > 0) {
      this.dragVelocity = distance / dt;
    }

    const adjustedSpacing = Math.max(4, NOTE_SPACING - this.dragVelocity * 8);

    if (distance >= adjustedSpacing) {
      const steps = Math.floor(distance / adjustedSpacing);
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const px = this.lastNoteX + dx * t;
        const py = this.lastNoteY + dy * t;
        this.createNoteParticle(px, py);
      }
      this.lastNoteX = x;
      this.lastNoteY = y;
      this.lastDragTime = now;
    }
  }

  private endDrag() {
    this.isDragging = false;
  }

  private ensureAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  private playTone(frequency: number, waveform: WaveformType, duration: number, volume: number = 0.15) {
    if (!this.audioContext) return;
    const adjustedDuration = duration / this.speedMultiplier;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = waveform;
    oscillator.frequency.value = frequency;

    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + adjustedDuration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + adjustedDuration);
  }

  private getCurrentColor(index: number, now: number): string {
    if (!this.previousTheme) {
      return this.theme.colors[index % this.theme.colors.length];
    }
    const t = Math.min(1, (now - this.themeTransitionStart) / this.THEME_TRANSITION_DURATION);
    if (t >= 1) {
      this.previousTheme = null;
      return this.theme.colors[index % this.theme.colors.length];
    }
    const prevColor = this.previousTheme.colors[index % this.previousTheme.colors.length];
    const nextColor = this.theme.colors[index % this.theme.colors.length];
    return lerpColor(prevColor, nextColor, easeOut(t));
  }

  private createExplosion(x: number, y: number) {
    this.ensureAudioContext();
    const count = Math.floor(30 + Math.random() * 21);
    const startDelay = this.explosionParticles.length > 0 ? 0 : 0;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const radius = EXPLOSION_RADIUS * (0.5 + Math.random() * 0.5);
      const targetX = x + Math.cos(angle) * radius;
      const targetY = y + Math.sin(angle) * radius;
      const colorIndex = Math.floor(Math.random() * this.theme.colors.length);
      const baseColor = this.theme.colors[colorIndex];
      const brightness = getBrightness(baseColor);
      const frequency = frequencyFromBrightness(brightness, 261.63 + Math.random() * 400);

      this.explosionParticles.push({
        id: this.particleIdCounter++,
        startX: x,
        startY: y,
        targetX,
        targetY,
        x,
        y,
        radius: 2 + Math.random() * 4,
        colorIndex,
        opacity: 1,
        startTime: performance.now() + startDelay + Math.random() * 30,
        duration: EXPLOSION_DURATION / this.speedMultiplier,
        frequency,
      });

      if (i % 5 === 0) {
        setTimeout(() => {
          this.playTone(frequency, this.waveform, 0.3, 0.08);
        }, startDelay + i * 3);
      }
    }

    this.playTone(frequencyFromBrightness(0.7, 329.63), this.waveform, 0.4, 0.12);
    this.enforceParticleLimit();
  }

  private createNoteParticle(x: number, y: number) {
    const colorIndex = Math.floor(Math.random() * this.theme.colors.length);
    const baseColor = this.theme.colors[colorIndex];
    const brightness = 0.5 + Math.min(0.5, this.dragVelocity * 3);
    const baseFreq = 300 + Math.random() * 500;
    const frequency = baseFreq + this.dragVelocity * 800;

    this.noteParticles.push({
      id: this.particleIdCounter++,
      x,
      y,
      radius: 6,
      colorIndex,
      brightness,
      opacity: 0.8,
      createdAt: performance.now(),
      lifetime: NOTE_LIFETIME / this.speedMultiplier,
      frequency,
    });

    if (Math.random() < 0.3) {
      this.playTone(frequency, this.waveform, 0.15, 0.05);
    }

    this.enforceParticleLimit();
  }

  private enforceParticleLimit() {
    while (this.explosionParticles.length + this.noteParticles.length > MAX_PARTICLES) {
      if (this.noteParticles.length > 0) {
        this.noteParticles.shift();
      } else if (this.explosionParticles.length > 0) {
        this.explosionParticles.shift();
      } else {
        break;
      }
    }
  }

  private animate = () => {
    const now = performance.now();
    const dt = now - this.lastFrameTime;
    this.frameCount++;
    if (dt >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / dt);
      this.frameCount = 0;
      this.lastFrameTime = now;
      if (this.statsCallback) {
        this.statsCallback({
          particles: this.explosionParticles.length + this.noteParticles.length,
          fps: this.fps,
        });
      }
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.explosionParticles = this.explosionParticles.filter((p) => {
      const elapsed = now - p.startTime;
      if (elapsed < 0) return true;
      const t = Math.min(1, elapsed / p.duration);
      const eased = easeOut(t);
      p.x = p.startX + (p.targetX - p.startX) * eased;
      p.y = p.startY + (p.targetY - p.startY) * eased;
      p.opacity = 1 - t;

      const color = this.getCurrentColor(p.colorIndex, now);
      this.drawExplosionParticle(p, color);

      return t < 1;
    });

    this.noteParticles = this.noteParticles.filter((p) => {
      const age = now - p.createdAt;
      const lifetime = p.lifetime + NOTE_FADE_OUT;
      if (age >= lifetime) return false;

      if (age > p.lifetime) {
        const fadeT = (age - p.lifetime) / NOTE_FADE_OUT;
        p.opacity = 0.8 * (1 - fadeT);
      }

      const color = this.getCurrentColor(p.colorIndex, now);
      this.drawNoteParticle(p, color);

      return true;
    });

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private drawExplosionParticle(p: ExplosionParticle, color: string) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawNoteParticle(p: NoteParticle, baseColor: string) {
    const ctx = this.ctx;
    const { r, g, b } = hexToRgb(baseColor);
    const brightened = rgbToHex(
      r + (255 - r) * p.brightness * 0.5,
      g + (255 - g) * p.brightness * 0.5,
      b + (255 - b) * p.brightness * 0.5,
    );

    ctx.save();
    ctx.globalAlpha = p.opacity;

    ctx.shadowColor = brightened;
    ctx.shadowBlur = 12 + p.brightness * 8;

    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.3, brightened);
    gradient.addColorStop(1, baseColor);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = p.opacity * 0.9;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x + p.radius * 0.15, p.y - p.radius * 0.1, p.radius * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
