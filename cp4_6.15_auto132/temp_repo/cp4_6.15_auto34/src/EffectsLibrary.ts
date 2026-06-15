import type { RippleEffect, SnowBurstEffect, HeatEffect, WeatherType } from './types';

export interface EffectCSSClasses {
  screenShake: string;
  lightningFlash: string;
  lightningActive: string;
}

export const EFFECT_CLASSES: EffectCSSClasses = {
  screenShake: 'screen-shake',
  lightningFlash: 'lightning-flash',
  lightningActive: 'active',
};

export interface ScreenShakeResult {
  className: string;
  durationMs: number;
  triggerKey: () => string;
}

export function getScreenShakeConfig(): ScreenShakeResult {
  return {
    className: EFFECT_CLASSES.screenShake,
    durationMs: 300,
    triggerKey: () => `shake-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
}

export interface LightningFlashResult {
  containerClassName: string;
  activeClassName: string;
  durationMs: number;
  buildFlashState: () => { triggerCount: number; isActive: boolean };
}

export function getLightningFlashConfig(): LightningFlashResult {
  return {
    containerClassName: EFFECT_CLASSES.lightningFlash,
    activeClassName: EFFECT_CLASSES.lightningActive,
    durationMs: 100,
    buildFlashState: () => ({ triggerCount: 0, isActive: false }),
  };
}

export type DrawEffectFn = (ctx: CanvasRenderingContext2D, now: number) => boolean;

export interface RippleFactory {
  create: (x: number, y: number) => RippleEffect;
  draw: DrawEffectFn;
  getDuration: () => number;
  getMaxRadius: () => number;
}

export const rippleEffect: RippleFactory = {
  create: (x, y) => createRipple(x, y),
  draw: (_ctx, _now) => {
    throw new Error('需要绑定具体 effect 数据');
  },
  getDuration: () => 1500,
  getMaxRadius: () => 60,
};

export function createRipple(x: number, y: number): RippleEffect {
  return {
    x,
    y,
    startTime: performance.now(),
    duration: 1500,
    maxRadius: 60,
  };
}

export function createSnowBurst(x: number, y: number): SnowBurstEffect {
  const particleCount = 8;
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2;
    const speed = 40 + Math.random() * 40;
    return {
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
    };
  });

  return {
    x,
    y,
    startTime: performance.now(),
    duration: 800,
    particles,
  };
}

export function createHeat(x: number, y: number): HeatEffect {
  return {
    x,
    y,
    startTime: performance.now(),
    duration: 1000,
  };
}

export function createClickEffect(weather: WeatherType, x: number, y: number) {
  switch (weather) {
    case 'rainy':
    case 'stormy':
      return { kind: 'ripple' as const, data: createRipple(x, y) };
    case 'snowy':
      return { kind: 'snowburst' as const, data: createSnowBurst(x, y) };
    case 'sunny':
      return { kind: 'heat' as const, data: createHeat(x, y) };
  }
}

export function drawRipple(ctx: CanvasRenderingContext2D, effect: RippleEffect, now: number): boolean {
  const elapsed = now - effect.startTime;
  if (elapsed >= effect.duration) return false;

  const t = elapsed / effect.duration;
  const radius = effect.maxRadius * t;
  const alpha = 1 - t;

  ctx.save();
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(150, 210, 255, ${alpha * 0.8})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (radius > 20) {
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, radius * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(150, 210, 255, ${alpha * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();

  return true;
}

export function drawSnowBurst(ctx: CanvasRenderingContext2D, effect: SnowBurstEffect, now: number): boolean {
  const elapsed = now - effect.startTime;
  if (elapsed >= effect.duration) return false;

  const t = elapsed / effect.duration;
  const alpha = 1 - t;
  const easeT = t * (2 - t);

  ctx.save();
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  for (const p of effect.particles) {
    const px = effect.x + p.dx * easeT;
    const py = effect.y + p.dy * easeT + easeT * easeT * 30;
    ctx.beginPath();
    ctx.arc(px, py, p.size * (1 - t * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  return true;
}

export function drawHeat(ctx: CanvasRenderingContext2D, effect: HeatEffect, now: number): boolean {
  const elapsed = now - effect.startTime;
  if (elapsed >= effect.duration) return false;

  const t = elapsed / effect.duration;
  const alpha = 1 - t;
  const riseY = -60 * t * (2 - t);

  ctx.save();
  for (let i = 0; i < 5; i++) {
    const offsetX = Math.sin(t * Math.PI * 3 + i) * 8;
    const y = effect.y + riseY - i * 8;
    const x = effect.x + offsetX;
    const size = 10 + i * 3;
    ctx.beginPath();
    ctx.arc(x, y, size * (1 - t * 0.3), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 200, 120, ${alpha * 0.15 - i * 0.02})`;
    ctx.fill();
  }
  ctx.restore();

  return true;
}

export interface LightningState {
  active: boolean;
  lastTrigger: number;
  nextInterval: number;
}

export function createLightningState(): LightningState {
  return {
    active: false,
    lastTrigger: 0,
    nextInterval: 5000 + Math.random() * 5000,
  };
}

export function updateLightning(state: LightningState, now: number, onFlash: () => void): LightningState {
  if (state.lastTrigger === 0) {
    return { ...state, lastTrigger: now };
  }

  const elapsed = now - state.lastTrigger;
  if (elapsed >= state.nextInterval && !state.active) {
    onFlash();
    return {
      active: true,
      lastTrigger: now,
      nextInterval: 5000 + Math.random() * 5000,
    };
  }

  if (state.active && elapsed >= 100) {
    return { ...state, active: false };
  }

  return state;
}

export function getVisibilityColor(visibility: number): string {
  const clampedV = Math.max(0, Math.min(100, visibility));
  const t = clampedV / 100;
  const r = Math.round(255 * (1 - t));
  const g = Math.round(150 + 105 * t);
  const b = Math.round(80 * (1 - t));
  return `rgb(${r}, ${g}, ${b})`;
}
