import type { Rune } from './noteRune';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  startSize: number;
  life: number;
  maxLife: number;
  colorR: number;
  colorG: number;
  colorB: number;
  trail: { x: number; y: number }[];
  wander: number;
  wanderSpeed: number;
}

interface Shockwave {
  x: number;
  y: number;
  startRadius: number;
  endRadius: number;
  life: number;
  maxLife: number;
}

const MAX_PARTICLES = 600;
const TRAIL_MAX = 3;
const PARTICLE_LIFE = 1.2;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function mapRange(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
}

export class EffectManager {
  private particles: Particle[] = [];
  private shockwaves: Shockwave[] = [];
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.ensureAudio();
  }

  private ensureAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      try {
        const AC = (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
        this.audioCtx = new AC();
      } catch {
        this.audioCtx = null;
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  pitchToExplosionRadius(pitch: number): number {
    return mapRange(clamp(pitch, 60, 71), 60, 71, 80, 150);
  }

  triggerExplosion(rune: Rune, x: number, y: number): void {
    const rgb = hexToRgb(rune.color);
    const radius = this.pitchToExplosionRadius(rune.pitch);
    const count = 50 + Math.floor(Math.random() * 31);
    const capacity = MAX_PARTICLES - this.particles.length;
    const actualCount = Math.min(count, Math.max(0, capacity));

    if (capacity <= 0) {
      const removeCount = Math.max(0, count - capacity + 10);
      this.particles.splice(0, removeCount);
    }

    const tmpl = rune.particleTemplate;
    const kf0 = tmpl[0] ?? { t: 0, spread: 0, speed: 1, alpha: 1 };
    const kf1 = tmpl[1] ?? { t: 0.5, spread: 0.75, speed: 0.5, alpha: 0.75 };
    void (tmpl[2] ?? { t: 1, spread: 1, speed: 0, alpha: 0 });

    for (let i = 0; i < actualCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speedFactor = lerp(kf0.speed, kf1.speed, Math.random()) * (0.7 + Math.random() * 0.6);
      const speed = (radius / PARTICLE_LIFE) * speedFactor;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4,
        startSize: 4,
        life: 0,
        maxLife: PARTICLE_LIFE,
        colorR: rgb.r,
        colorG: rgb.g,
        colorB: rgb.b,
        trail: [],
        wander: Math.random() * Math.PI * 2,
        wanderSpeed: 2 + Math.random() * 3
      });
    }

    this.addShockwave(x, y);
  }

  private addShockwave(x: number, y: number) {
    this.shockwaves.push({
      x,
      y,
      startRadius: 30,
      endRadius: 120,
      life: 0,
      maxLife: 0.3
    });
  }

  playNote(pitch: number, duration: number = 0.3): void {
    this.ensureAudio();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const freq = 440 * Math.pow(2, (pitch - 69) / 12);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const gain = ctx.createGain();
    const fadeIn = 0.03;
    const fadeOut = 0.03;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + fadeIn);
    gain.gain.setValueAtTime(0.18, ctx.currentTime + duration - fadeOut);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  update(dt: number): void {
    const dtSec = dt / 1000;

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      this.shockwaves[i].life += dtSec;
      if (this.shockwaves[i].life >= this.shockwaves[i].maxLife) {
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dtSec;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > TRAIL_MAX) {
        p.trail.length = TRAIL_MAX;
      }

      p.wander += dtSec * p.wanderSpeed;
      const wx = Math.cos(p.wander) * 15;
      const wy = Math.sin(p.wander * 1.3) * 15;

      const t = p.life / p.maxLife;
      const decay = Math.pow(1 - t, 0.8);
      p.x += p.vx * dtSec * decay + wx * dtSec;
      p.y += p.vy * dtSec * decay + wy * dtSec;

      p.size = p.startSize * (1 - t);
    }

    if (this.particles.length > MAX_PARTICLES) {
      this.particles.splice(0, this.particles.length - MAX_PARTICLES);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      const t = p.life / p.maxLife;
      const r = Math.round(lerp(p.colorR, 255, t * 0.8));
      const g = Math.round(lerp(p.colorG, 255, t * 0.8));
      const b = Math.round(lerp(p.colorB, 255, t * 0.8));
      const alpha = 1 - t;

      if (p.trail.length > 1) {
        ctx.lineCap = 'round';
        for (let j = 0; j < p.trail.length - 1; j++) {
          const tr = p.trail[j];
          const tr2 = p.trail[j + 1];
          const ta = alpha * (1 - j / p.trail.length) * 0.5;
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${ta})`;
          ctx.lineWidth = Math.max(1, p.size * (1 - j / p.trail.length) * 0.7);
          ctx.beginPath();
          ctx.moveTo(tr.x, tr.y);
          ctx.lineTo(tr2.x, tr2.y);
          ctx.stroke();
        }
      }

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.2);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
      grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.6, p.size * 0.35), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    for (const sw of this.shockwaves) {
      const t = sw.life / sw.maxLife;
      const radius = lerp(sw.startRadius, sw.endRadius, t);
      const alpha = (1 - t) * 0.8;
      const width = 3 * (1 - t) + 1;

      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      const halo = ctx.createRadialGradient(sw.x, sw.y, radius * 0.9, sw.x, sw.y, radius * 1.15);
      halo.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.2})`);
      halo.addColorStop(1, `rgba(255, 255, 255, 0)`);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, radius * 1.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
