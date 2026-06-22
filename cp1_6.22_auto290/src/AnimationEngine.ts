import type { Particle, AnimationState } from './types';

export function triggerPulse(
  animationState: AnimationState,
  color: string,
  duration: number = 1500
): AnimationState {
  return {
    ...animationState,
    pulse: {
      active: true,
      startTime: performance.now(),
      duration,
      color
    }
  };
}

export function triggerParticleBurst(
  particles: Particle[],
  centerX: number,
  centerY: number,
  baseColor: string,
  count: number = 50,
  maxParticles: number = 60
): Particle[] {
  const newParticles: Particle[] = [];
  const availableSlots = maxParticles - particles.length;
  const actualCount = Math.min(count, availableSlots);

  for (let i = 0; i < actualCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    const size = 3 + Math.random() * 5;
    const life = 2000;

    newParticles.push({
      id: Date.now() + i,
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: -Math.abs(Math.sin(angle) * speed * 2 - 2),
      size,
      color: baseColor,
      life,
      maxLife: life
    });
  }

  return [...particles, ...newParticles];
}

export function triggerScreenShake(
  animationState: AnimationState,
  intensity: number = 2,
  duration: number = 500
): AnimationState {
  return {
    ...animationState,
    screenShake: {
      active: true,
      startTime: performance.now(),
      duration,
      intensity
    }
  };
}

export function triggerRingEffect(
  animationState: AnimationState,
  color: string,
  duration: number = 1500
): AnimationState {
  return {
    ...animationState,
    ringEffect: {
      active: true,
      startTime: performance.now(),
      duration,
      color
    }
  };
}

export function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.05,
      life: p.life - deltaTime
    }))
    .filter(p => p.life > 0);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 255, g: 255, b: 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function mixColors(colors: string[]): string {
  if (colors.length === 0) return '#FFFFFF';
  if (colors.length === 1) return colors[0];

  let totalR = 0, totalG = 0, totalB = 0;

  for (const color of colors) {
    const rgb = hexToRgb(color);
    totalR += rgb.r;
    totalG += rgb.g;
    totalB += rgb.b;
  }

  const count = colors.length;
  return rgbToHex(
    Math.round(totalR / count),
    Math.round(totalG / count),
    Math.round(totalB / count)
  );
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return rgbToHex(
    Math.round(c1.r + (c2.r - c1.r) * t),
    Math.round(c1.g + (c2.g - c1.g) * t),
    Math.round(c1.b + (c2.b - c1.b) * t)
  );
}

export function renderAnimations(
  ctx: CanvasRenderingContext2D,
  animationState: AnimationState,
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  if (animationState.pulse && animationState.pulse.active) {
    const elapsed = currentTime - animationState.pulse.startTime;
    const progress = Math.min(elapsed / animationState.pulse.duration, 1);

    if (progress < 1) {
      const maxRadius = Math.min(canvasWidth, canvasHeight) * 0.45;
      const radius = maxRadius * progress;
      const opacity = 1 - progress;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = animationState.pulse.color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = opacity * 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  if (animationState.ringEffect && animationState.ringEffect.active) {
    const elapsed = currentTime - animationState.ringEffect.startTime;
    const progress = Math.min(elapsed / animationState.ringEffect.duration, 1);

    if (progress < 1) {
      const startRadius = Math.min(canvasWidth, canvasHeight) * 0.1;
      const endRadius = Math.min(canvasWidth, canvasHeight) * 0.5;
      const radius = startRadius + (endRadius - startRadius) * progress;
      const opacity = 0.8 * (1 - progress);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = animationState.ringEffect.color;
      ctx.lineWidth = 6;
      ctx.globalAlpha = opacity;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.globalAlpha = opacity * 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  for (const particle of animationState.particles) {
    const lifeProgress = particle.life / particle.maxLife;
    const color = lerpColor(particle.color, '#FFFFFF', 1 - lifeProgress);
    const size = particle.size * lifeProgress;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = lifeProgress;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (animationState.rotatingSymbol && animationState.rotatingSymbol.active) {
    const symbolRadius = Math.min(canvasWidth, canvasHeight) * 0.12;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(animationState.rotatingSymbol.angle);

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * symbolRadius;
      const y = Math.sin(angle) * symbolRadius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.strokeStyle = animationState.rotatingSymbol.color;
    ctx.lineWidth = 3;
    ctx.shadowColor = animationState.rotatingSymbol.color;
    ctx.shadowBlur = 20;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, symbolRadius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = animationState.rotatingSymbol.color;
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

export function getScreenShakeOffset(
  animationState: AnimationState,
  currentTime: number
): { x: number; y: number } {
  if (!animationState.screenShake || !animationState.screenShake.active) {
    return { x: 0, y: 0 };
  }

  const elapsed = currentTime - animationState.screenShake.startTime;
  if (elapsed >= animationState.screenShake.duration) {
    return { x: 0, y: 0 };
  }

  const intensity = animationState.screenShake.intensity;
  const decay = 1 - elapsed / animationState.screenShake.duration;
  const x = (Math.random() - 0.5) * 2 * intensity * decay;
  const y = (Math.random() - 0.5) * 2 * intensity * decay;

  return { x, y };
}
