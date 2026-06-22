import { Particle, SpiceAura, SpiceType, SPICE_PRESETS } from './types';

const POT_CX = 300;
const POT_CY = 240;

export function addSpice(
  type: SpiceType,
  particles: Particle[],
  auras: SpiceAura[]
): void {
  const preset = SPICE_PRESETS[type];
  const count = type === 'scallion' ? 20 : type === 'pepper' ? 16 : 10;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: POT_CX + (Math.random() - 0.5) * 80,
      y: POT_CY - 120 - Math.random() * 30,
      vx: (Math.random() - 0.5) * 40,
      vy: 80 + Math.random() * 40,
      life: 1.4 + Math.random() * 0.4,
      maxLife: 1.8,
      size: getSpiceSize(type),
      color: preset.color,
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 6,
      shape: preset.shape
    });
  }

  auras.push({
    type,
    x: POT_CX,
    y: POT_CY - 20,
    radius: 5,
    maxRadius: 140,
    life: 2.5,
    maxLife: 2.5,
    color: preset.auraColor
  });
}

function getSpiceSize(type: SpiceType): number {
  switch (type) {
    case 'starAnise': return 5;
    case 'cinnamon': return 6;
    case 'pepper': return 2;
    case 'ginger': return 3.5;
    case 'scallion': return 2.5;
  }
}

export function drawSpiceParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  ctx.save();
  particles.forEach((p) => {
    if (p.life < 0) return;
    const alpha = Math.min(1, p.life / p.maxLife * 1.5);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation || 0);
    ctx.globalAlpha = alpha;

    switch (p.shape) {
      case 'star':
        drawStar(ctx, p.size, p.color);
        break;
      case 'curl':
        drawCurl(ctx, p.size, p.color);
        break;
      case 'strip':
        drawStrip(ctx, p.size, p.color);
        break;
      default:
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
    }
    ctx.restore();
  });
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  const spikes = 8;
  const outerR = size;
  const innerR = size * 0.45;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 0.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(90,40,10,0.6)';
  ctx.fill();
}

function drawCurl(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const angle = t * Math.PI * 3;
    const r = t * size;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawStrip(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-size * 1.4, -size * 0.35, size * 2.8, size * 0.7, size * 0.25);
  ctx.fill();
}

export function drawAuras(ctx: CanvasRenderingContext2D, auras: SpiceAura[]): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  auras.forEach((aura) => {
    const t = 1 - aura.life / aura.maxLife;
    const r = aura.maxRadius * Math.min(1, t * 1.4);
    const alpha = (aura.life / aura.maxLife) * 0.5;
    const grad = ctx.createRadialGradient(aura.x, aura.y, r * 0.2, aura.x, aura.y, r);
    grad.addColorStop(0, aura.color.replace(/[\d.]+\)$/, `${alpha})`));
    grad.addColorStop(0.6, aura.color.replace(/[\d.]+\)$/, `${alpha * 0.5})`));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(aura.x, aura.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  });
  ctx.restore();
}

export function updateAuras(auras: SpiceAura[], dt: number): void {
  for (let i = auras.length - 1; i >= 0; i--) {
    auras[i].life -= dt;
    if (auras[i].life <= 0) auras.splice(i, 1);
  }
}

export function drawSettledSpices(
  ctx: CanvasRenderingContext2D,
  settled: Array<{ x: number; y: number; type: SpiceType; rotation: number }>
): void {
  ctx.save();
  settled.forEach((s) => {
    const preset = SPICE_PRESETS[s.type];
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);
    const size = getSpiceSize(s.type) * 0.85;
    switch (preset.shape) {
      case 'star':
        drawStar(ctx, size, preset.color);
        break;
      case 'curl':
        drawCurl(ctx, size, preset.color);
        break;
      case 'strip':
        drawStrip(ctx, size, preset.color);
        break;
      default:
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = preset.color;
        ctx.fill();
    }
    ctx.restore();
  });
  ctx.restore();
}

export function settleSpiceParticles(
  particles: Particle[],
  settled: Array<{ x: number; y: number; type: SpiceType; rotation: number }>,
  typeMap: Map<Particle, SpiceType>
): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (p.y >= POT_CY - 15 && p.vy > 0 && p.life > 0.2) {
      const t = typeMap.get(p);
      if (t && settled.length < 80) {
        settled.push({
          x: Math.max(POT_CX - 110, Math.min(POT_CX + 110, p.x)),
          y: POT_CY - 10 + (Math.random() - 0.5) * 20,
          type: t,
          rotation: p.rotation || 0
        });
      }
      particles.splice(i, 1);
    }
  }
}
