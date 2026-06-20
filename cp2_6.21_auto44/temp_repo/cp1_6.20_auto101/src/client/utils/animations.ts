
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface DamageNumber {
  x: number;
  y: number;
  value: number;
  isCrit: boolean;
  isHeal: boolean;
  life: number;
  maxLife: number;
  startY: number;
}

export interface ShakeEffect {
  unitId: string;
  intensity: number;
  life: number;
  maxLife: number;
  offsetX: number;
  offsetY: number;
}

export function createParticles(
  x: number,
  y: number,
  count: number,
  color: string,
  speed: number = 3
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const velocity = speed * (0.5 + Math.random() * 0.5);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: 1,
      maxLife: 1,
      color,
      size: 3 + Math.random() * 4,
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.1,
      life: p.life - deltaTime * 0.002,
      size: p.size * 0.98,
    }))
    .filter(p => p.life > 0);
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

export function createDamageNumber(
  x: number,
  y: number,
  value: number,
  isCrit: boolean = false,
  isHeal: boolean = false
): DamageNumber {
  return {
    x,
    y,
    value,
    isCrit,
    isHeal,
    life: 1,
    maxLife: 1,
    startY: y,
  };
}

export function updateDamageNumbers(numbers: DamageNumber[], deltaTime: number): DamageNumber[] {
  return numbers
    .map(n => ({
      ...n,
      y: n.startY - (1 - n.life) * 60,
      life: n.life - deltaTime * 0.0015,
    }))
    .filter(n => n.life > 0);
}

export function drawDamageNumbers(ctx: CanvasRenderingContext2D, numbers: DamageNumber[]): void {
  numbers.forEach(n => {
    ctx.save();
    ctx.globalAlpha = n.life;
    
    const fontSize = n.isCrit ? 32 : 22;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (n.isHeal) {
      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = '#166534';
    } else if (n.isCrit) {
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#7f1d1d';
    } else {
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#78350f';
    }
    
    ctx.lineWidth = n.isCrit ? 4 : 3;
    ctx.strokeText(String(n.value), n.x, n.y);
    ctx.fillText(String(n.value), n.x, n.y);
    
    if (n.isCrit) {
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('暴击!', n.x, n.y - fontSize);
    }
    
    ctx.restore();
  });
}

export function createShakeEffect(unitId: string, intensity: number = 8): ShakeEffect {
  return {
    unitId,
    intensity,
    life: 1,
    maxLife: 1,
    offsetX: 0,
    offsetY: 0,
  };
}

export function updateShakeEffects(shakes: ShakeEffect[], deltaTime: number): ShakeEffect[] {
  return shakes
    .map(s => {
      const progress = 1 - s.life;
      const currentIntensity = s.intensity * s.life;
      return {
        ...s,
        offsetX: (Math.random() - 0.5) * currentIntensity * 2,
        offsetY: (Math.random() - 0.5) * currentIntensity * 2,
        life: s.life - deltaTime * 0.008,
      };
    })
    .filter(s => s.life > 0);
}

export function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export function easeInQuad(t: number): number {
  return t * t;
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function hexToPixel(q: number, r: number, size: number): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * (3 / 2) * r;
  return { x, y };
}

export function pixelToHex(x: number, y: number, size: number): { q: number; r: number } {
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / size;
  const r = ((2 / 3) * y) / size;
  return hexRound(q, r);
}

export function hexRound(q: number, r: number): { q: number; r: number } {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);
  
  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);
  
  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }
  
  return { q: rq, r: rr };
}

export function drawHexagon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fill: string,
  stroke?: string,
  lineWidth: number = 2
): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const hx = x + size * Math.cos(angle);
    const hy = y + size * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(hx, hy);
    } else {
      ctx.lineTo(hx, hy);
    }
  }
  ctx.closePath();
  
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export function getHexCorner(x: number, y: number, size: number, i: number): { x: number; y: number } {
  const angle = (Math.PI / 3) * i - Math.PI / 6;
  return {
    x: x + size * Math.cos(angle),
    y: y + size * Math.sin(angle),
  };
}

