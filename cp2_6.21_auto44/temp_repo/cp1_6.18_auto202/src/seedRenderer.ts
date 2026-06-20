import { easeOutCubic, easeOutElastic, easeOutBounce, lerp } from './seedEngine';
import type { GrowthStage, Particle, Seed } from './types/seed';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
}

export function drawSeedBud(
  rc: RenderContext,
  seed: Seed,
  cx: number,
  cy: number,
  radius: number,
  scale: number = 1
): void {
  const { ctx } = rc;
  const r = radius * scale;

  ctx.save();
  ctx.translate(cx, cy);

  const gradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
  gradient.addColorStop(0, seed.seedColorEnd);
  gradient.addColorStop(1, seed.seedColor);

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(-r * 0.25, -r * 0.25, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fill();

  ctx.strokeStyle = 'rgba(93, 64, 55, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

export function drawStem(
  rc: RenderContext,
  baseX: number,
  baseY: number,
  topY: number,
  progress: number
): void {
  const { ctx } = rc;
  const eased = easeOutCubic(progress);
  const currentTopY = lerp(baseY, topY, eased);

  ctx.save();
  ctx.strokeStyle = '#6B8E6B';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  const cp1x = baseX + 8;
  const cp1y = lerp(baseY, currentTopY, 0.3);
  const cp2x = baseX - 8;
  const cp2y = lerp(baseY, currentTopY, 0.7);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, baseX, currentTopY);
  ctx.stroke();

  ctx.strokeStyle = '#8FBC8F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(baseX - 1, baseY);
  ctx.bezierCurveTo(cp1x - 1, cp1y, cp2x - 1, cp2y, baseX - 1, currentTopY);
  ctx.stroke();

  ctx.restore();
}

export function drawLeaf(
  rc: RenderContext,
  x: number,
  y: number,
  size: number,
  angle: number,
  progress: number,
  flip: boolean = false
): void {
  if (progress <= 0) return;
  const { ctx } = rc;
  const eased = easeOutCubic(progress);
  const actualSize = size * eased;
  const actualAngle = angle * eased;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(flip ? -actualAngle : actualAngle);
  ctx.scale(flip ? -1 : 1, 1);

  const gradient = ctx.createLinearGradient(0, 0, actualSize, -actualSize * 0.6);
  gradient.addColorStop(0, '#8FBC8F');
  gradient.addColorStop(1, '#7FB069');

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(actualSize * 0.5, -actualSize * 0.8, actualSize, -actualSize * 0.6);
  ctx.quadraticCurveTo(actualSize * 0.5, -actualSize * 0.2, 0, 0);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = '#556B2F';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(actualSize * 0.5, -actualSize * 0.4, actualSize * 0.9, -actualSize * 0.55);
  ctx.stroke();

  ctx.restore();
}

export function drawFlower(
  rc: RenderContext,
  seed: Seed,
  cx: number,
  cy: number,
  progress: number,
  extraRotation: number = 0
): void {
  if (progress <= 0) return;
  const { ctx } = rc;
  const eased = easeOutElastic(progress);
  const petalCount = 8;
  const maxPetalLength = 50;
  const petalLength = maxPetalLength * eased;
  const petalWidth = 18 * eased;

  const slowRotation = progress >= 1 ? extraRotation : extraRotation * progress;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(slowRotation);

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const individualProgress = Math.max(0, Math.min(1, (progress * petalCount - i) / (petalCount * 0.5)));
    const individualEased = easeOutCubic(individualProgress);
    const currentLength = petalLength * individualEased;
    const currentWidth = petalWidth * individualEased;

    if (currentLength <= 0) continue;

    ctx.save();
    ctx.rotate(angle);

    const gradient = ctx.createRadialGradient(
      currentLength * 0.5, 0, 0,
      currentLength * 0.5, 0, currentLength * 0.6
    );
    gradient.addColorStop(0, seed.petalColorEnd);
    gradient.addColorStop(0.7, seed.petalColor);
    gradient.addColorStop(1, adjustAlpha(seed.petalColor, 0.6));

    ctx.beginPath();
    ctx.ellipse(
      currentLength * 0.6,
      0,
      currentLength * 0.55,
      currentWidth * 0.5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'rgba(93, 64, 55, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();
  }

  const centerRadius = 12 * Math.max(0.3, eased);
  const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerRadius);
  centerGradient.addColorStop(0, '#FFD700');
  centerGradient.addColorStop(0.6, '#F4A460');
  centerGradient.addColorStop(1, '#CD853F');

  ctx.beginPath();
  ctx.arc(0, 0, centerRadius, 0, Math.PI * 2);
  ctx.fillStyle = centerGradient;
  ctx.fill();

  const dotCount = 12;
  for (let i = 0; i < dotCount; i++) {
    const dotAngle = (i / dotCount) * Math.PI * 2;
    const dotDist = centerRadius * 0.6;
    ctx.beginPath();
    ctx.arc(
      Math.cos(dotAngle) * dotDist,
      Math.sin(dotAngle) * dotDist,
      1.5,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = '#8B4513';
    ctx.fill();
  }

  ctx.restore();
}

export function drawParticle(rc: RenderContext, particle: Particle): void {
  const { ctx } = rc;
  const alpha = Math.max(0, Math.min(1, particle.life));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(particle.x, particle.y);
  ctx.rotate(particle.rotation);

  if (particle.type === 'dirt') {
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(0, 0, particle.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (particle.type === 'pollen') {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
    gradient.addColorStop(0, particle.color);
    gradient.addColorStop(1, adjustAlpha(particle.color, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (particle.type === 'petal') {
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, particle.size, particle.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(93, 64, 55, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  ctx.restore();
}

export function drawParticles(rc: RenderContext, particles: Particle[]): void {
  for (const p of particles) {
    drawParticle(rc, p);
  }
}

export function drawGround(rc: RenderContext, width: number, baseY: number): void {
  const { ctx } = rc;

  const gradient = ctx.createLinearGradient(0, baseY - 10, 0, baseY + 20);
  gradient.addColorStop(0, 'rgba(143, 188, 143, 0.6)');
  gradient.addColorStop(0.3, 'rgba(139, 105, 20, 0.4)');
  gradient.addColorStop(1, 'rgba(107, 68, 35, 0.2)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, baseY);

  for (let x = 0; x <= width; x += 5) {
    const wave = Math.sin(x * 0.03) * 3 + Math.sin(x * 0.07) * 2;
    ctx.lineTo(x, baseY + wave);
  }

  ctx.lineTo(width, baseY + 25);
  ctx.lineTo(0, baseY + 25);
  ctx.closePath();
  ctx.fill();
}

export interface GrowthRenderParams {
  seed: Seed;
  stage: GrowthStage;
  stageProgress: number;
  canvasWidth: number;
  canvasHeight: number;
  particles: Particle[];
  time: number;
}

export function renderGrowthAnimation(rc: RenderContext, params: GrowthRenderParams): void {
  const { ctx, width, height } = rc;
  const { seed, stage, stageProgress, particles, time } = params;

  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const baseY = height - 60;
  const stemTopY = baseY - 110;
  const flowerCenterY = stemTopY;

  drawGround(rc, width, baseY);

  let budY = baseY - 20;
  let budScale = 1;
  let stemProgress = 0;
  let leaf1Progress = 0;
  let leaf2Progress = 0;
  let flowerProgress = 0;
  let extraRotation = 0;

  switch (stage) {
    case 'sprouting': {
      const eased = easeOutBounce(stageProgress);
      budY = lerp(baseY + 40, baseY - 20, eased);
      budScale = lerp(0.5, 1, Math.min(1, stageProgress * 2));
      break;
    }
    case 'branching': {
      budY = stemTopY;
      budScale = 1;
      stemProgress = 1;
      leaf1Progress = Math.max(0, Math.min(1, (stageProgress - 0.2) / 0.5));
      leaf2Progress = Math.max(0, Math.min(1, (stageProgress - 0.5) / 0.5));
      break;
    }
    case 'blooming': {
      budY = stemTopY;
      budScale = 1 - stageProgress * 0.3;
      stemProgress = 1;
      leaf1Progress = 1;
      leaf2Progress = 1;
      flowerProgress = stageProgress;
      extraRotation = stageProgress * 0.3;
      break;
    }
    case 'complete': {
      budY = stemTopY;
      budScale = 0;
      stemProgress = 1;
      leaf1Progress = 1;
      leaf2Progress = 1;
      flowerProgress = 1;
      extraRotation = time * 0.0005;
      break;
    }
  }

  if (stemProgress > 0) {
    drawStem(rc, centerX, baseY, stemTopY, stemProgress);

    const leaf1Y = lerp(baseY, stemTopY, 0.45);
    drawLeaf(rc, centerX, leaf1Y, 35, Math.PI / 4, leaf1Progress, false);

    const leaf2Y = lerp(baseY, stemTopY, 0.7);
    drawLeaf(rc, centerX, leaf2Y, 30, Math.PI / 5, leaf2Progress, true);
  }

  if (flowerProgress > 0) {
    drawFlower(rc, seed, centerX, flowerCenterY, flowerProgress, extraRotation);
  }

  if (budScale > 0 && stage !== 'complete' && !(stage === 'blooming' && stageProgress > 0.6)) {
    const budOpacity = stage === 'blooming' ? Math.max(0, 1 - stageProgress * 1.5) : 1;
    ctx.globalAlpha = budOpacity;
    drawSeedBud(rc, seed, centerX, budY, 20, budScale);
    ctx.globalAlpha = 1;
  }

  drawParticles(rc, particles);
}

function adjustAlpha(hexColor: string, alpha: number): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
