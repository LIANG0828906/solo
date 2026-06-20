import { IAuraSlot } from './types';

interface Particle {
  baseAngle: number;
  baseRadius: number;
  phase: number;
}

interface AuraParticles {
  particles: Particle[];
  prevParticleCount: number;
}

const CANVAS_SIZE = 500;
const CENTER_X = CANVAS_SIZE / 2;
const CENTER_Y = CANVAS_SIZE / 2;
const MAX_RADIUS_UNITS = 5;
const PIXELS_PER_UNIT = (CANVAS_SIZE / 2 - 30) / MAX_RADIUS_UNITS;

export class AuraRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private auraStates: Map<number, AuraParticles> = new Map();
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private slots: IAuraSlot[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.canvas.width = CANVAS_SIZE;
    this.canvas.height = CANVAS_SIZE;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    let h = hex.replace('#', '');
    if (h.length === 3) {
      h = h.split('').map((c) => c + c).join('');
    }
    const num = parseInt(h, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h /= 360;
    s /= 100;
    l /= 100;

    if (s === 0) {
      const val = Math.round(l * 255);
      return { r: val, g: val, b: val };
    }

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
      r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    };
  }

  private shiftHue(hex: string, shiftDegrees: number): string {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.h = (hsl.h + shiftDegrees) % 360;
    if (hsl.h < 0) hsl.h += 360;
    const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(newRgb.r)}${toHex(newRgb.g)}${toHex(newRgb.b)}`;
  }

  private initParticles(count: number): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        baseAngle: (i / count) * Math.PI * 2,
        baseRadius: 0.15 + Math.random() * 0.85,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return particles;
  }

  private getOrCreateParticles(slot: IAuraSlot): Particle[] {
    let state = this.auraStates.get(slot.id);
    const count = slot.params.particleCount;

    if (!state || state.prevParticleCount !== count) {
      state = {
        particles: this.initParticles(count),
        prevParticleCount: count,
      };
      this.auraStates.set(slot.id, state);
    }
    return state.particles;
  }

  public setSlots(slots: IAuraSlot[]): void {
    this.slots = slots;
    const validIds = new Set(slots.map((s) => s.id));
    for (const id of Array.from(this.auraStates.keys())) {
      if (!validIds.has(id)) {
        this.auraStates.delete(id);
      }
    }
  }

  public start(): void {
    if (this.animationFrameId !== null) return;
    this.startTime = performance.now();
    this.animate(this.startTime);
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private animate = (timestamp: number): void => {
    const elapsed = (timestamp - this.startTime) / 1000;
    this.render(elapsed);
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  public render(elapsed: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.save();
    const gradient = ctx.createRadialGradient(
      CENTER_X, CENTER_Y, 0,
      CENTER_X, CENTER_Y, CANVAS_SIZE / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.restore();

    for (const slot of this.slots) {
      if (!slot.enabled) continue;
      this.renderAura(slot, elapsed);
    }

    ctx.save();
    const centerGlow = ctx.createRadialGradient(
      CENTER_X, CENTER_Y, 0,
      CENTER_X, CENTER_Y, 25
    );
    centerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    centerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = centerGlow;
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderAura(slot: IAuraSlot, elapsed: number): void {
    const ctx = this.ctx;
    const { params, hueShift } = slot;
    const particles = this.getOrCreateParticles(slot);

    const baseColor = hueShift
      ? this.shiftHue(params.color, (elapsed / 2) * 360)
      : params.color;
    const rgb = this.hexToRgb(baseColor);

    const rotation = elapsed * params.rotationSpeed;
    const pulsePhase = elapsed * params.pulseFrequency * Math.PI * 2;
    const basePxRadius = params.radius * PIXELS_PER_UNIT;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const pulse = 1 + 0.3 * Math.sin(pulsePhase + p.phase);
      const currentRadiusPx = basePxRadius * p.baseRadius * pulse;
      const alpha = (1 - p.baseRadius) * 0.8 + 0.2;
      const pulseAlpha = alpha * (0.85 + 0.15 * Math.sin(pulsePhase + p.phase));
      const size = 3 * (0.85 + 0.3 * Math.sin(pulsePhase + p.phase));

      const angle = p.baseAngle + rotation;
      const x = CENTER_X + Math.cos(angle) * currentRadiusPx;
      const y = CENTER_Y + Math.sin(angle) * currentRadiusPx;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.arc(x, y, size + 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pulseAlpha * 0.25})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pulseAlpha})`;
      ctx.fill();
      ctx.restore();
    }
  }

  public destroy(): void {
    this.stop();
  }
}
