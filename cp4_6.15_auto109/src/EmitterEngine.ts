import { v4 as uuidv4 } from 'uuid';
import type { EffectParams, ColorStop, CurvePoint } from './types';

export class EmitterEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private params: EffectParams | null = null;
  private particles: MutableParticle[] = [];
  private animationId: number | null = null;
  private lastTime: number = 0;
  private isPlaying: boolean = false;
  private pulseTime: number = 0;
  private emissionAccumulator: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;
  }

  public setParams(params: EffectParams): void {
    this.params = params;
  }

  public start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.animate);
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public reset(): void {
    this.particles = [];
    this.emissionAccumulator = 0;
    this.pulseTime = 0;
  }

  public destroy(): void {
    this.stop();
    this.reset();
    this.params = null;
  }

  private readonly animate = (currentTime: number): void => {
    if (!this.isPlaying || !this.params) return;

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    const averageLifetime = (this.params.lifetimeMin + this.params.lifetimeMax) / 2;
    const emissionRate = this.params.particleCount / averageLifetime;
    this.emissionAccumulator += emissionRate * deltaTime;

    while (this.emissionAccumulator >= 1 && this.particles.length < this.params.particleCount) {
      this.emitParticle();
      this.emissionAccumulator -= 1;
    }

    this.pulseTime += deltaTime;

    this.updateParticles(deltaTime);
    this.particles = this.particles.filter((p) => p.currentAge < p.lifetime);

    this.clearCanvas();
    this.drawTrails();
    this.drawParticles();
    this.drawPulseOrigin();

    this.animationId = requestAnimationFrame(this.animate);
  };

  private updateParticles(deltaTime: number): void {
    for (const particle of this.particles) {
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      if (this.params && this.params.randomOffset > 0) {
        particle.x += randomRange(-this.params.randomOffset, this.params.randomOffset) * deltaTime * 60;
        particle.y += randomRange(-this.params.randomOffset, this.params.randomOffset) * deltaTime * 60;
      }

      particle.currentAge += deltaTime;
      particle.rotation += particle.rotationSpeed * deltaTime;

      const newHistoryPoint: MutableParticleHistoryPoint = {
        x: particle.x,
        y: particle.y,
        age: particle.currentAge,
      };

      particle.history.push(newHistoryPoint);
      if (particle.history.length > 5) {
        particle.history.shift();
      }
    }
  }

  private clearCanvas(): void {
    this.ctx.fillStyle = '#2d2d44';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawTrails(): void {
    for (const particle of this.particles) {
      const lifetime = particle.lifetime;
      for (let i = 0; i < particle.history.length; i++) {
        const point = particle.history[i] as MutableParticleHistoryPoint;
        const ageRatio = point.age / lifetime;
        const trailAlpha = (i / particle.history.length) * (1 - ageRatio) * 0.5;
        const scale = this.params ? sampleScaleCurve(this.params.scaleCurve, ageRatio) : 1;
        const size = particle.size * scale * (i / particle.history.length);

        if (size <= 0) continue;

        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        this.ctx.fillStyle = interpolateColor(particle.colorStops, ageRatio);
        this.ctx.globalAlpha = trailAlpha;
        this.ctx.fill();
      }
    }
    this.ctx.globalAlpha = 1;
  }

  private drawParticles(): void {
    for (const particle of this.particles) {
      const ageRatio = particle.currentAge / particle.lifetime;
      const lifeRemaining = 1 - ageRatio;
      const color = interpolateColor(particle.colorStops, ageRatio);
      const scale = this.params ? sampleScaleCurve(this.params.scaleCurve, ageRatio) : 1;
      const size = particle.size * scale;

      if (size <= 0) continue;

      this.ctx.save();
      this.ctx.translate(particle.x, particle.y);
      this.ctx.rotate((particle.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = lifeRemaining;
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
    this.ctx.globalAlpha = 1;
  }

  private drawPulseOrigin(): void {
    if (!this.params) return;

    const centerX = this.canvas.width / 2 + this.params.originOffsetX;
    const centerY = this.canvas.height / 2 + this.params.originOffsetY;

    const pulsePeriod = 1;
    const pulsePhase = (this.pulseTime % pulsePeriod) / pulsePeriod;
    const pulseValue = pulsePhase < 0.5 ? pulsePhase * 2 : (1 - pulsePhase) * 2;

    const radius = 5 + pulseValue * 15;
    const opacity = 0.8 - pulseValue * 0.6;

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = `rgba(168, 85, 247, ${opacity})`;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(168, 85, 247, 0.9)';
    this.ctx.fill();
  }

  private emitParticle(): void {
    if (!this.params) return;

    const centerX = this.canvas.width / 2 + this.params.originOffsetX;
    const centerY = this.canvas.height / 2 + this.params.originOffsetY;

    const angleStart = (this.params.emissionAngleStart * Math.PI) / 180;
    const angleEnd = (this.params.emissionAngleEnd * Math.PI) / 180;
    const angle = randomRange(angleStart, angleEnd);

    let velocityX = randomRange(this.params.velocityXMin, this.params.velocityXMax);
    let velocityY = randomRange(this.params.velocityYMin, this.params.velocityYMax);

    if (this.params.emissionAngleStart !== this.params.emissionAngleEnd) {
      const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      velocityX = Math.cos(angle) * speed;
      velocityY = Math.sin(angle) * speed;
    }

    const lifetime = randomRange(this.params.lifetimeMin, this.params.lifetimeMax);
    const size = randomRange(3, 8);

    const particle: MutableParticle = {
      id: uuidv4(),
      x: centerX,
      y: centerY,
      vx: velocityX,
      vy: velocityY,
      lifetime,
      currentAge: 0,
      rotation: randomRange(0, 360),
      rotationSpeed: this.params.rotationSpeed,
      size,
      colorStops: this.params.colorGradient,
      history: [],
    };

    this.particles.push(particle);
  }
}

interface MutableParticleHistoryPoint {
  x: number;
  y: number;
  age: number;
}

interface MutableParticle {
  readonly id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifetime: number;
  currentAge: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  readonly colorStops: readonly ColorStop[];
  history: MutableParticleHistoryPoint[];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1] as string, 16),
        g: parseInt(result[2] as string, 16),
        b: parseInt(result[3] as string, 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function interpolateColor(stops: readonly ColorStop[], t: number): string {
  if (stops.length === 0) return '#ffffff';
  if (stops.length === 1) return stops[0]?.color ?? '#ffffff';

  t = Math.max(0, Math.min(1, t));

  let prevStop = stops[0] as ColorStop;
  let nextStop = stops[stops.length - 1] as ColorStop;

  for (let i = 0; i < stops.length - 1; i++) {
    const current = stops[i] as ColorStop;
    const next = stops[i + 1] as ColorStop;
    if (t >= current.position && t <= next.position) {
      prevStop = current;
      nextStop = next;
      break;
    }
  }

  if (prevStop.position === nextStop.position) {
    return prevStop.color;
  }

  const localT = (t - prevStop.position) / (nextStop.position - prevStop.position);
  const c1 = hexToRgb(prevStop.color);
  const c2 = hexToRgb(nextStop.color);

  const r = Math.round(c1.r + (c2.r - c1.r) * localT);
  const g = Math.round(c1.g + (c2.g - c1.g) * localT);
  const b = Math.round(c1.b + (c2.b - c1.b) * localT);

  return rgbToHex(r, g, b);
}

function sampleScaleCurve(curve: readonly CurvePoint[], t: number): number {
  if (curve.length === 0) return 1;
  if (curve.length === 1) return curve[0]?.y ?? 1;

  t = Math.max(0, Math.min(1, t));

  let prevPoint = curve[0] as CurvePoint;
  let nextPoint = curve[curve.length - 1] as CurvePoint;

  for (let i = 0; i < curve.length - 1; i++) {
    const current = curve[i] as CurvePoint;
    const next = curve[i + 1] as CurvePoint;
    if (t >= current.x && t <= next.x) {
      prevPoint = current;
      nextPoint = next;
      break;
    }
  }

  if (prevPoint.x === nextPoint.x) {
    return prevPoint.y;
  }

  const localT = (t - prevPoint.x) / (nextPoint.x - prevPoint.x);
  return prevPoint.y + (nextPoint.y - prevPoint.y) * localT;
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
