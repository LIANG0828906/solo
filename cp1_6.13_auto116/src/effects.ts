export type EffectType = 'glow' | 'star' | 'stripe';

export interface DrawCommand {
  type: 'radialGradient' | 'line' | 'circle';
  x: number;
  y: number;
  color: string;
  alpha: number;
  size?: number;
  innerColor?: string;
  x2?: number;
  y2?: number;
  lineWidth?: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  size: number;
  alpha: number;
  birthTime: number;
  velocity: number;
  halos: Array<{
    x: number;
    y: number;
    radius: number;
    alpha: number;
  }>;
  starRayLengths: number[];
  stripeSpacing: number;
}

export function renderGlowEffect(
  particle: Particle,
  ctx: CanvasRenderingContext2D,
  timeAlive: number
): void {
  const alpha = particle.alpha * Math.max(0, 1 - timeAlive / 2000);

  const gradient = ctx.createRadialGradient(
    particle.x, particle.y, 0,
    particle.x, particle.y, 50
  );
  gradient.addColorStop(0, adjustAlpha(particle.color, alpha * 0.9));
  gradient.addColorStop(0.3, adjustAlpha(particle.color, alpha * 0.5));
  gradient.addColorStop(0.6, adjustAlpha(particle.color, alpha * 0.2));
  gradient.addColorStop(1, adjustAlpha(particle.color, 0));

  ctx.beginPath();
  ctx.arc(particle.x, particle.y, 50, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = adjustAlpha('#fffef0', alpha * 0.95);
  ctx.fill();

  for (const halo of particle.halos) {
    const haloAlpha = halo.alpha * Math.max(0, 1 - timeAlive / 2000);
    const haloGradient = ctx.createRadialGradient(
      halo.x, halo.y, 0,
      halo.x, halo.y, halo.radius
    );
    haloGradient.addColorStop(0, adjustAlpha(particle.color, haloAlpha * 0.8));
    haloGradient.addColorStop(1, adjustAlpha(particle.color, 0));
    ctx.beginPath();
    ctx.arc(halo.x, halo.y, halo.radius, 0, Math.PI * 2);
    ctx.fillStyle = haloGradient;
    ctx.fill();
  }
}

export function renderStarEffect(
  particle: Particle,
  ctx: CanvasRenderingContext2D,
  timeAlive: number
): void {
  const alpha = particle.alpha * Math.max(0, 1 - timeAlive / 2000);
  const baseColor = adjustAlpha(particle.color, alpha);
  const brightColor = adjustAlpha('#ffffff', alpha * 0.9);

  const rayCount = 6;
  for (let i = 0; i < rayCount; i++) {
    const baseAngle = (i / rayCount) * Math.PI * 2;
    const baseLength = particle.starRayLengths[i] ?? (15 + Math.random() * 15);
    const velocityBonus = particle.velocity * 0.08;
    const finalLength = baseLength + velocityBonus;

    const x2 = particle.x + Math.cos(baseAngle) * finalLength;
    const y2 = particle.y + Math.sin(baseAngle) * finalLength;

    const gradient = ctx.createLinearGradient(particle.x, particle.y, x2, y2);
    gradient.addColorStop(0, brightColor);
    gradient.addColorStop(0.5, adjustAlpha(particle.color, alpha * 0.7));
    gradient.addColorStop(1, adjustAlpha(particle.color, 0));

    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2 + (1 - timeAlive / 2000) * 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size * 0.6, 0, Math.PI * 2);
  const centerGradient = ctx.createRadialGradient(
    particle.x, particle.y, 0,
    particle.x, particle.y, particle.size * 0.6
  );
  centerGradient.addColorStop(0, adjustAlpha('#ffffff', alpha));
  centerGradient.addColorStop(0.5, baseColor);
  centerGradient.addColorStop(1, adjustAlpha(particle.color, alpha * 0.3));
  ctx.fillStyle = centerGradient;
  ctx.fill();

  for (const halo of particle.halos) {
    const haloAlpha = halo.alpha * Math.max(0, 1 - timeAlive / 2000);
    ctx.beginPath();
    ctx.arc(halo.x, halo.y, halo.radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = adjustAlpha(particle.color, haloAlpha);
    ctx.fill();
  }
}

export function renderStripeEffect(
  particle: Particle,
  ctx: CanvasRenderingContext2D,
  timeAlive: number
): void {
  const alpha = particle.alpha * Math.max(0, 1 - timeAlive / 2000);

  const dx = particle.x - particle.prevX;
  const dy = particle.y - particle.prevY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 1) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = adjustAlpha(particle.color, alpha);
    ctx.fill();
    return;
  }

  const tailLength = 20;
  const spacing = particle.stripeSpacing;
  const totalLength = tailLength * spacing;

  const steps = Math.min(tailLength, Math.max(1, Math.ceil(distance / spacing)));

  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const dotAlpha = alpha * (1 - t * 0.85);
    const dotSize = particle.size * (1 - t * 0.6);

    const backDistance = t * Math.min(distance, totalLength);
    const ratio = distance > 0 ? backDistance / distance : 0;

    const dotX = particle.x - dx * ratio;
    const dotY = particle.y - dy * ratio;

    ctx.beginPath();
    ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
    ctx.fillStyle = adjustAlpha(particle.color, dotAlpha);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size * 0.7, 0, Math.PI * 2);
  const headGradient = ctx.createRadialGradient(
    particle.x, particle.y, 0,
    particle.x, particle.y, particle.size * 0.7
  );
  headGradient.addColorStop(0, adjustAlpha('#ffffff', alpha * 0.9));
  headGradient.addColorStop(0.4, adjustAlpha(particle.color, alpha));
  headGradient.addColorStop(1, adjustAlpha(particle.color, alpha * 0.4));
  ctx.fillStyle = headGradient;
  ctx.fill();

  for (const halo of particle.halos) {
    const haloAlpha = halo.alpha * Math.max(0, 1 - timeAlive / 2000) * 0.7;
    ctx.beginPath();
    ctx.arc(halo.x, halo.y, halo.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = adjustAlpha(particle.color, haloAlpha);
    ctx.fill();
  }
}

function adjustAlpha(rgbColor: string, alpha: number): string {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));

  if (rgbColor.startsWith('#')) {
    const hex = rgbColor.slice(1);
    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
  }

  const rgbMatch = rgbColor.match(/\d+/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    return `rgba(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}, ${clampedAlpha})`;
  }

  return `rgba(255, 255, 255, ${clampedAlpha})`;
}

export function hslToHex(hue: number, saturation: number, lightness: number): string {
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - c / 2;

  let r = 0, g = 0, b = 0;
  if (hue < 60) { r = c; g = x; b = 0; }
  else if (hue < 120) { r = x; g = c; b = 0; }
  else if (hue < 180) { r = 0; g = c; b = x; }
  else if (hue < 240) { r = 0; g = x; b = c; }
  else if (hue < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
