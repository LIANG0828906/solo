import {
  PendulumState,
  Mechanism,
  Particle,
  Vector2D,
  RectMechanism,
  CircleMechanism,
  PortalMechanism,
} from './types';

export const CANVAS_W = 800;
export const CANVAS_H = 600;
export const DRAG_THRESHOLD = 50;

const PARTICLE_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
export const PARTICLE_LIFE_MS = 1500;

export function drawBackground(ctx: CanvasRenderingContext2D): void {
  const grd = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grd.addColorStop(0, '#0B0B2B');
  grd.addColorStop(1, '#1B1B3B');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#4ECDC4';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x <= CANVAS_W; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_H);
    ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_H; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRope(ctx: CanvasRenderingContext2D, pendulum: PendulumState): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pendulum.pivot.x, pendulum.pivot.y);
  ctx.lineTo(pendulum.bobPosition.x, pendulum.bobPosition.y);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(pendulum.pivot.x, pendulum.pivot.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawBob(ctx: CanvasRenderingContext2D, pendulum: PendulumState): void {
  ctx.save();
  const { bobPosition, bobRadius } = pendulum;
  const grd = ctx.createRadialGradient(
    bobPosition.x - bobRadius * 0.4,
    bobPosition.y - bobRadius * 0.4,
    bobRadius * 0.2,
    bobPosition.x,
    bobPosition.y,
    bobRadius
  );
  grd.addColorStop(0, '#FFF4B3');
  grd.addColorStop(0.5, '#FFD700');
  grd.addColorStop(1, '#B8860B');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(bobPosition.x, bobPosition.y, bobRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(bobPosition.x, bobPosition.y, bobRadius * 0.8, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,215,0,0.4)';
  ctx.stroke();
  ctx.restore();
}

export function drawDragLine(
  ctx: CanvasRenderingContext2D,
  pendulum: PendulumState,
  dragCurrent: Vector2D
): void {
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pendulum.bobPosition.x, pendulum.bobPosition.y);
  ctx.lineTo(dragCurrent.x, dragCurrent.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,215,0,0.6)';
  ctx.beginPath();
  ctx.arc(dragCurrent.x, dragCurrent.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawTrigger(ctx: CanvasRenderingContext2D, m: RectMechanism): void {
  ctx.save();
  ctx.translate(m.position.x, m.position.y);
  ctx.rotate(m.rotation);
  ctx.fillStyle = m.triggered ? 'rgba(78,205,196,0.65)' : 'rgba(78,205,196,0.2)';
  ctx.strokeStyle = m.triggered ? '#7FE8DD' : 'rgba(78,205,196,0.8)';
  ctx.lineWidth = 2;
  const w = m.width, h = m.height;
  roundRect(ctx, -w / 2, -h / 2, w, h, 4);
  ctx.fill();
  ctx.stroke();
  if (m.triggered) {
    ctx.shadowColor = '#4ECDC4';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#BFF5EE';
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGoal(ctx: CanvasRenderingContext2D, m: RectMechanism): void {
  ctx.save();
  ctx.translate(m.position.x, m.position.y);
  ctx.rotate(m.rotation);
  const w = m.width, h = m.height;
  const grd = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  grd.addColorStop(0, 'rgba(255,215,0,0.15)');
  grd.addColorStop(0.5, 'rgba(255,215,0,0.4)');
  grd.addColorStop(1, 'rgba(255,215,0,0.15)');
  ctx.fillStyle = grd;
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2.5;
  roundRect(ctx, -w / 2, -h / 2, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 16;
  ctx.strokeStyle = '#FFF1A8';
  ctx.stroke();
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('终点', 0, 0);
  ctx.restore();
}

export function drawMovingPlank(ctx: CanvasRenderingContext2D, m: RectMechanism): void {
  ctx.save();
  ctx.translate(m.position.x, m.position.y);
  ctx.rotate(m.rotation);
  const w = m.width, h = m.height;
  const grd = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  grd.addColorStop(0, 'rgba(69,183,209,0.75)');
  grd.addColorStop(1, 'rgba(78,205,196,0.55)');
  ctx.fillStyle = grd;
  ctx.strokeStyle = '#B7ECE6';
  ctx.lineWidth = 1.5;
  roundRect(ctx, -w / 2, -h / 2, w, h, 4);
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor = '#45B7D1';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.restore();
}

export function drawPortal(ctx: CanvasRenderingContext2D, m: PortalMechanism, timeSec: number): void {
  ctx.save();
  ctx.translate(m.position.x, m.position.y);
  const rot = (timeSec * Math.PI * 2) / 5;
  const rx = m.radius;
  const ry = m.radius * 0.7;
  ctx.rotate(rot * 0.4);
  const grd = ctx.createRadialGradient(0, 0, rx * 0.2, 0, 0, rx);
  grd.addColorStop(0, 'rgba(142,68,173,0.8)');
  grd.addColorStop(0.6, 'rgba(155,89,182,0.5)');
  grd.addColorStop(1, 'rgba(155,89,182,0.05)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(rot * 0.6);
  ctx.strokeStyle = '#D7BDE2';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.85, ry * 0.85, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowColor = '#9B59B6';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = '#E8DAEF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.55, ry * 0.55, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawGem(ctx: CanvasRenderingContext2D, m: CircleMechanism, timeSec: number, color: string = '#FF6B6B'): void {
  ctx.save();
  ctx.translate(m.position.x, m.position.y);
  const pulse = 0.9 + 0.1 * Math.sin((timeSec * Math.PI * 2) / 2);
  ctx.scale(pulse, pulse);
  const r = m.radius;
  const pts: Array<[number, number]> = [];
  const sides = 8;
  for (let i = 0; i < sides; i++) {
    const ang = (i / sides) * Math.PI * 2 - Math.PI / 2;
    pts.push([Math.cos(ang) * r, Math.sin(ang) * r]);
  }
  const grd = ctx.createRadialGradient(0, -r * 0.3, r * 0.2, 0, 0, r);
  grd.addColorStop(0, '#FFFFFF');
  grd.addColorStop(0.25, color);
  grd.addColorStop(1, shadeColor(color, -30));
  ctx.fillStyle = grd;
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.stroke();
  ctx.restore();
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  ctx.save();
  for (const p of particles) {
    if (p.life <= 0) continue;
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.position.x, p.position.y, p.radius * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawMechanism(ctx: CanvasRenderingContext2D, m: Mechanism, timeSec: number): void {
  if (!m.active) return;
  switch (m.type) {
    case 'trigger':
      drawTrigger(ctx, m as RectMechanism);
      break;
    case 'goal':
      if (m.shape === 'rectangle') drawGoal(ctx, m as RectMechanism);
      break;
    case 'moving_plank':
      drawMovingPlank(ctx, m as RectMechanism);
      break;
    case 'portal':
      drawPortal(ctx, m as PortalMechanism, timeSec);
      break;
    case 'gem': {
      const cm = m as CircleMechanism;
      const c = (m as any).gemColor as string | undefined;
      drawGem(ctx, cm, timeSec, c || '#FF6B6B');
      break;
    }
  }
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  options: {
    pendulum: PendulumState;
    mechanisms: Mechanism[];
    particles: Particle[];
    dragStart: Vector2D | null;
    dragCurrent: Vector2D | null;
    timeSec: number;
  }
): void {
  const { pendulum, mechanisms, particles, dragCurrent, timeSec } = options;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBackground(ctx);
  for (const m of mechanisms) drawMechanism(ctx, m, timeSec);
  drawRope(ctx, pendulum);
  drawBob(ctx, pendulum);
  if (dragCurrent) drawDragLine(ctx, pendulum, dragCurrent);
  drawParticles(ctx, particles);
}

export function createParticles(origin: Vector2D, count: number): Particle[] {
  const arr: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    arr.push({
      id: `p_${Math.random().toString(36).slice(2)}_${i}`,
      position: { ...origin },
      velocity: { x: Math.cos(ang) * speed, y: Math.sin(ang) * speed },
      radius: 2 + Math.random() * 4,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      life: PARTICLE_LIFE_MS,
      maxLife: PARTICLE_LIFE_MS,
    });
  }
  return arr;
}

export function stepParticles(particles: Particle[], dtMs: number): Particle[] {
  return particles
    .map((p) => {
      const l = p.life - dtMs;
      return {
        ...p,
        life: l,
        position: {
          x: p.position.x + p.velocity.x * (dtMs / 16.67),
          y: p.position.y + p.velocity.y * (dtMs / 16.67),
        },
      };
    })
    .filter((p) => p.life > 0);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function shadeColor(hex: string, percent: number): string {
  const f = parseInt(hex.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  const R = f >> 16;
  const G = (f >> 8) & 0x00ff;
  const B = f & 0x0000ff;
  const r = Math.round((t - R) * p) + R;
  const g = Math.round((t - G) * p) + G;
  const b = Math.round((t - B) * p) + B;
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

export function isNearBob(bob: Vector2D, point: Vector2D): boolean {
  const dx = bob.x - point.x;
  const dy = bob.y - point.y;
  return dx * dx + dy * dy <= DRAG_THRESHOLD * DRAG_THRESHOLD;
}
