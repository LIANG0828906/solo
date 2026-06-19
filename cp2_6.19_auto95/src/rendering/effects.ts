export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
  shrink: boolean;
}

export interface DiceVisualState {
  x: number;
  y: number;
  rotationX: number;
  rotationY: number;
  scale: number;
  alpha: number;
  bounced: boolean;
  landed: boolean;
  landParticlesSpawned: boolean;
  showValue: boolean;
}

export const COLORS = {
  red: '#C0392B',
  redLight: '#E74C3C',
  blue: '#2980B9',
  blueLight: '#3498DB',
  gold: '#FFD700',
  goldDark: '#DAA520',
  trap: '#E74C3C',
  boost: '#3498DB',
  heal: '#2ECC71',
  woodDark: '#3E2723',
  woodLight: '#5D4037',
  cellLight: '#6D4C41',
  cellDark: '#4E342E',
};

const PARTICLE_POOL: Particle[] = [];
const MAX_PARTICLES = 200;
let particleCount = 0;

function acquireParticle(): Particle {
  if (particleCount < MAX_PARTICLES) {
    particleCount++;
    return {
      x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1,
      color: '#FFF', size: 2, gravity: 0, shrink: true,
    };
  }
  PARTICLE_POOL.sort((a, b) => a.life - b.life);
  return PARTICLE_POOL.shift()!;
}

export function spawnParticles(
  x: number, y: number, count: number,
  options: Partial<Particle> & { colorPalette?: string[] } = {}
): void {
  const palette = options.colorPalette ?? ['#FFD700', '#FFA500', '#FF6347', '#FFFFFF'];
  for (let i = 0; i < count; i++) {
    const p = acquireParticle();
    const angle = Math.random() * Math.PI * 2;
    const speed = (options.vx ?? 1) * (0.5 + Math.random() * 3);
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed + (options.vx ?? 0) * 0.3;
    p.vy = Math.sin(angle) * speed + (options.vy ?? 0) * 0.3;
    p.life = options.maxLife ?? 600 + Math.random() * 400;
    p.maxLife = p.life;
    p.color = palette[Math.floor(Math.random() * palette.length)];
    p.size = options.size ?? 1.5 + Math.random() * 3;
    p.gravity = options.gravity ?? 0.08;
    p.shrink = options.shrink ?? true;
    PARTICLE_POOL.push(p);
  }
}

export function updateParticles(dt: number): void {
  for (let i = PARTICLE_POOL.length - 1; i >= 0; i--) {
    const p = PARTICLE_POOL[i];
    p.vy += p.gravity * dt * 0.06;
    p.x += p.vx * dt * 0.06;
    p.y += p.vy * dt * 0.06;
    p.life -= dt;
    if (p.life <= 0) {
      PARTICLE_POOL.splice(i, 1);
      particleCount--;
    }
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D): void {
  for (const p of PARTICLE_POOL) {
    const t = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = t;
    const size = p.shrink ? p.size * t : p.size;
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
    grad.addColorStop(0, p.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function clearParticles(): void {
  PARTICLE_POOL.length = 0;
  particleCount = 0;
}

export function createDiceVisual(centerX: number, topY: number): DiceVisualState {
  return {
    x: centerX,
    y: topY,
    rotationX: 0,
    rotationY: 0,
    scale: 0.9,
    alpha: 1,
    bounced: false,
    landed: false,
    landParticlesSpawned: false,
    showValue: false,
  };
}

export function updateDiceVisual(
  state: DiceVisualState,
  elapsed: number,
  duration: number,
  centerY: number,
  diceSize: number
): void {
  const t = Math.min(1, elapsed / duration);
  const fallStartY = state.y;

  if (t < 0.7) {
    const fallT = t / 0.7;
    const parabola = fallT * fallT;
    state.y = fallStartY + (centerY - fallStartY) * parabola;
    state.rotationX += 0.55;
    state.rotationY += 0.72;
    state.scale = 0.85 + fallT * 0.15;
  } else if (t < 0.8) {
    if (!state.bounced) {
      state.bounced = true;
      state.y = centerY;
      spawnDiceLandParticles(state.x, state.y + diceSize * 0.4);
    }
    const bounceT = (t - 0.7) / 0.1;
    const bounceHeight = diceSize * 0.25 * Math.sin(bounceT * Math.PI);
    state.y = centerY - bounceHeight;
    state.rotationX += 0.15;
    state.rotationY += 0.18;
    state.scale = 1.0 + Math.sin(bounceT * Math.PI) * 0.06;
  } else {
    if (!state.landed) {
      state.landed = true;
      state.showValue = true;
      state.rotationX = 0;
      state.rotationY = 0;
    }
    const settleT = (t - 0.8) / 0.2;
    state.scale = 1.0 + (1 - settleT) * 0.02;
    state.rotationX *= 0.85;
    state.rotationY *= 0.85;
  }
}

function spawnDiceLandParticles(x: number, y: number): void {
  spawnParticles(x, y, 18, {
    colorPalette: ['#D4A574', '#C4956A', '#B8860B', '#FFD700', '#FFFFFF'],
    size: 2.5,
    maxLife: 500,
    gravity: 0.15,
    vx: 2, vy: -1.5,
  });
}

export function drawDice(
  ctx: CanvasRenderingContext2D,
  state: DiceVisualState,
  value: number,
  size: number,
  playerColor: 'red' | 'blue',
  holdElapsed: number
): void {
  ctx.save();
  ctx.translate(state.x, state.y);
  ctx.scale(state.scale, state.scale);
  ctx.globalAlpha = state.alpha;

  const color = playerColor === 'red' ? COLORS.red : COLORS.blue;
  const colorLight = playerColor === 'red' ? COLORS.redLight : COLORS.blueLight;

  const projectedSize = size * Math.abs(Math.cos(state.rotationY * 0.5));
  const projectedHeight = size * Math.abs(Math.cos(state.rotationX * 0.5));
  const actualW = Math.max(30, projectedSize);
  const actualH = Math.max(30, projectedHeight);

  if (holdElapsed > 0) {
    drawDiceHalo(ctx, actualW, actualH, playerColor, holdElapsed);
  }

  const shadowOffset = 6 + state.scale * 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = shadowOffset;
  const grad = ctx.createLinearGradient(-actualW / 2, -actualH / 2, actualW / 2, actualH / 2);
  grad.addColorStop(0, '#FFFFF0');
  grad.addColorStop(0.5, '#FFFFFF');
  grad.addColorStop(1, '#E8E0D0');
  ctx.fillStyle = grad;
  roundRect(ctx, -actualW / 2, -actualH / 2, actualW, actualH, actualW * 0.12);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, actualW * 0.04);
  roundRect(ctx, -actualW / 2, -actualH / 2, actualW, actualH, actualW * 0.12);
  ctx.stroke();

  if (state.showValue) {
    drawDiceDots(ctx, value, actualW, actualH, colorLight);
  } else {
    drawRandomDots(ctx, actualW, actualH, state.rotationX, state.rotationY, colorLight);
  }

  ctx.restore();
}

function drawDiceHalo(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  playerColor: 'red' | 'blue',
  holdElapsed: number
): void {
  const baseColor = playerColor === 'red' ? '192, 57, 43' : '41, 128, 185';
  const haloPulse = 0.7 + Math.sin(holdElapsed * 0.004) * 0.3;
  const rotationAngle = holdElapsed * 0.0015;

  ctx.save();
  ctx.rotate(rotationAngle);

  for (let ring = 0; ring < 2; ring++) {
    const ringOffset = ring * 6;
    const ringSize = Math.max(w, h) * 0.58 + ringOffset + haloPulse * 4;
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const wobble = 1 + Math.sin(a * 6 + holdElapsed * 0.003 + ring) * 0.04;
      const rx = Math.cos(a) * ringSize * wobble;
      const ry = Math.sin(a) * ringSize * wobble;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(${baseColor}, ${0.35 * haloPulse - ring * 0.12})`;
    ctx.lineWidth = 3 - ring;
    ctx.stroke();
  }

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + rotationAngle;
    const dist = Math.max(w, h) * 0.66 + haloPulse * 5;
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;
    const pulseSize = 3 + Math.sin(holdElapsed * 0.005 + i) * 1.5;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, pulseSize * 2);
    grad.addColorStop(0, `rgba(${baseColor}, 0.9)`);
    grad.addColorStop(1, `rgba(${baseColor}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, pulseSize * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawDiceDots(
  ctx: CanvasRenderingContext2D,
  value: number,
  w: number, h: number,
  color: string
): void {
  const positions: Record<number, [number, number][]> = {
    1: [[0.5, 0.5]],
    2: [[0.28, 0.28], [0.72, 0.72]],
    3: [[0.28, 0.28], [0.5, 0.5], [0.72, 0.72]],
    4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
    5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
    6: [[0.28, 0.22], [0.72, 0.22], [0.28, 0.5], [0.72, 0.5], [0.28, 0.78], [0.72, 0.78]],
  };
  const dotSize = Math.min(w, h) * 0.11;
  const dots = positions[value] || positions[1];
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = dotSize * 0.8;
  dots.forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(-w / 2 + w * px, -h / 2 + h * py, dotSize, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
}

function drawRandomDots(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  rotX: number, rotY: number,
  color: string
): void {
  const seed = Math.floor((Math.abs(rotX) + Math.abs(rotY)) * 10) % 6 + 1;
  drawDiceDots(ctx, seed, w, h, color);
}

export function drawDiceNumberPop(
  ctx: CanvasRenderingContext2D,
  centerX: number, centerY: number,
  value: number,
  elapsed: number,
  playerColor: 'red' | 'blue'
): void {
  if (elapsed <= 0 || elapsed > 1400) return;
  const duration = 1400;
  const t = elapsed / duration;
  const color = playerColor === 'red' ? COLORS.red : COLORS.blue;
  const colorLight = playerColor === 'red' ? COLORS.redLight : COLORS.blueLight;

  let scale: number;
  if (t < 0.25) {
    const st = t / 0.25;
    scale = 0.3 + st * 2.7;
  } else if (t < 0.45) {
    const st = (t - 0.25) / 0.2;
    scale = 3.0 - st * 0.8;
  } else {
    scale = 2.2;
  }
  const alpha = t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha * 0.95;

  const haloR = 70 + t * 60;
  for (let i = 0; i < 3; i++) {
    const g = ctx.createRadialGradient(0, 0, haloR * 0.2, 0, 0, haloR + i * 12);
    g.addColorStop(0, `rgba(${playerColor === 'red' ? '231,76,60' : '52,152,219'}, ${0.3 - i * 0.08})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, haloR + i * 12, 0, Math.PI * 2);
    ctx.fill();
  }

  const textGrad = ctx.createLinearGradient(0, -50, 0, 50);
  textGrad.addColorStop(0, '#FFFFFF');
  textGrad.addColorStop(0.5, colorLight);
  textGrad.addColorStop(1, color);
  ctx.fillStyle = textGrad;
  ctx.font = 'bold 72px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 6;
  ctx.strokeText(String(value), 0, 0);
  ctx.fillText(String(value), 0, 0);

  ctx.shadowColor = color;
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 72px Georgia, "Times New Roman", serif';
  ctx.fillText(String(value), 0, 0);

  ctx.restore();

  if (t < 0.4 && Math.random() < 0.5) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 50;
    spawnParticles(
      centerX + Math.cos(angle) * dist,
      centerY + Math.sin(angle) * dist,
      1,
      {
        colorPalette: [color, colorLight, '#FFFFFF', '#FFD700'],
        size: 2 + Math.random() * 2,
        maxLife: 500,
        gravity: 0.05,
      }
    );
  }
}

export function drawAttackProjectile(
  ctx: CanvasRenderingContext2D,
  fromX: number, fromY: number,
  toX: number, toY: number,
  progress: number,
  playerColor: 'red' | 'blue',
  cellSize: number
): void {
  const color = playerColor === 'red' ? COLORS.red : COLORS.blue;
  const colorLight = playerColor === 'red' ? COLORS.redLight : COLORS.blueLight;

  const ease = progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  const cx = fromX + (toX - fromX) * ease;
  const cy = fromY + (toY - fromY) * ease - Math.sin(ease * Math.PI) * cellSize * 0.6;

  if (progress > 0.05) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const trailProgress = Math.max(0, ease - (i + 1) * 0.07);
      if (trailProgress <= 0) continue;
      const tx = fromX + (toX - fromX) * trailProgress;
      const ty = fromY + (toY - fromY) * trailProgress - Math.sin(trailProgress * Math.PI) * cellSize * 0.6;
      ctx.globalAlpha = (0.7 - i * 0.2) * (1 - progress);
      ctx.lineWidth = 8 - i * 2;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    }
    ctx.restore();
  }

  const orbSize = cellSize * 0.22;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbSize);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.3, colorLight);
  grad.addColorStop(0.7, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = orbSize * 1.5;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, orbSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (progress >= 0.95 && progress < 0.98) {
    spawnParticles(toX, toY, 24, {
      colorPalette: [color, colorLight, '#FFFFFF', '#FFD700', '#FFA500'],
      size: 3,
      maxLife: 600,
      gravity: 0.05,
      vx: 3, vy: -2,
    });
  }
}

export function drawLowHpAura(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  baseRadius: number,
  time: number
): void {
  const pulse = Math.sin(time * 0.00628) * 0.5 + 0.5;
  const expandRadius = baseRadius + 5 + pulse * 7;

  for (let i = 0; i < 3; i++) {
    const r = expandRadius + i * 3 + pulse * 3;
    const alpha = (0.35 - i * 0.1) * (0.7 + pulse * 0.3);
    const grad = ctx.createRadialGradient(cx, cy, baseRadius * 0.6, cx, cy, r);
    grad.addColorStop(0, `rgba(255, 60, 60, 0)`);
    grad.addColorStop(0.6, `rgba(231, 76, 60, ${alpha * 0.6})`);
    grad.addColorStop(1, `rgba(192, 57, 43, 0)`);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = `rgba(255, 80, 80, ${0.4 + pulse * 0.4})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.lineDashOffset = -time * 0.03;
  ctx.beginPath();
  ctx.arc(cx, cy, expandRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

let audioCtx: AudioContext | null = null;
export function playDiceClick(intensity = 1): void {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctxA = audioCtx;
    const osc = ctxA.createOscillator();
    const gain = ctxA.createGain();
    osc.type = 'square';
    const baseFreq = 1200 + Math.random() * 800;
    osc.frequency.setValueAtTime(baseFreq, ctxA.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctxA.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08 * intensity, ctxA.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctxA.currentTime + 0.07);
    osc.connect(gain);
    gain.connect(ctxA.destination);
    osc.start();
    osc.stop(ctxA.currentTime + 0.08);
  } catch (_e) { /* ignore */ }
}

export function playAttackHit(): void {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctxA = audioCtx;
    const osc = ctxA.createOscillator();
    const gain = ctxA.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctxA.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctxA.currentTime + 0.2);
    gain.gain.setValueAtTime(0.12, ctxA.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctxA.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctxA.destination);
    osc.start();
    osc.stop(ctxA.currentTime + 0.26);
  } catch (_e) { /* ignore */ }
}

export function playEventSound(type: 'trap' | 'boost' | 'heal'): void {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctxA = audioCtx;
    const osc = ctxA.createOscillator();
    const gain = ctxA.createGain();
    if (type === 'trap') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, ctxA.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctxA.currentTime + 0.2);
    } else if (type === 'boost') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctxA.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctxA.currentTime + 0.15);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, ctxA.currentTime);
      osc.frequency.setValueAtTime(784, ctxA.currentTime + 0.08);
    }
    gain.gain.setValueAtTime(0.1, ctxA.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctxA.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctxA.destination);
    osc.start();
    osc.stop(ctxA.currentTime + 0.22);
  } catch (_e) { /* ignore */ }
}
