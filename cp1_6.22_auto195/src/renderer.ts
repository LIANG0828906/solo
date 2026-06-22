import { Ball, CollisionEffect, POCKET_POSITIONS } from './gameState';

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  balls: Ball[],
  tableWidth: number,
  tableHeight: number,
  cushionWidth: number,
  isAiming: boolean,
  aimAngle: number,
  power: number,
  predictPoints: { x: number; y: number }[],
  collisionEffects: CollisionEffect[],
  offsetX: number,
  offsetY: number,
  scale: number
): void {
  const w = tableWidth * scale;
  const h = tableHeight * scale;
  const cw = cushionWidth * scale;

  ctx.save();
  ctx.translate(offsetX, offsetY);

  drawTable(ctx, w, h, cw);
  drawPockets(ctx, w, h, cw);

  for (const ball of balls) {
    if (!ball.isPocketed) {
      drawBall(ctx, ball, scale);
    }
  }

  for (const effect of collisionEffects) {
    drawCollisionEffect(ctx, effect, scale);
  }

  if (isAiming) {
    const cueBall = balls.find(b => b.isCueBall && !b.isPocketed);
    if (cueBall) {
      drawPredictPath(ctx, predictPoints, scale);
      drawCueStick(ctx, cueBall, aimAngle, power, scale);
    }
  }

  ctx.restore();
}

function drawTable(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cw: number
): void {
  const woodGrad = ctx.createLinearGradient(0, 0, w, h);
  woodGrad.addColorStop(0, '#5D4037');
  woodGrad.addColorStop(0.5, '#3E2723');
  woodGrad.addColorStop(1, '#2C1810');

  ctx.fillStyle = woodGrad;
  ctx.fillRect(-cw * 0.8, -cw * 0.8, w + cw * 1.6, h + cw * 1.6);

  ctx.fillStyle = '#1B5E20';
  ctx.fillRect(0, 0, w, h);

  const feltGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.6);
  feltGrad.addColorStop(0, '#388E3C');
  feltGrad.addColorStop(1, '#2E7D32');

  ctx.fillStyle = feltGrad;
  ctx.fillRect(cw * 0.5, cw * 0.5, w - cw, h - cw);

  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth = 2;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.moveTo(cw + i * (w - cw * 2) / 20, cw);
    ctx.lineTo(cw + (i + 1) * (w - cw * 2) / 20, h - cw);
    ctx.globalAlpha = 0.03;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = '#1B5E20';
  ctx.lineWidth = 3;
  ctx.strokeRect(cw * 0.5, cw * 0.5, w - cw, h - cw);
}

function drawPockets(
  ctx: CanvasRenderingContext2D,
  _w: number,
  _h: number,
  _cw: number
): void {
  for (const pocket of POCKET_POSITIONS) {
    const px = pocket.x;
    const py = pocket.y;
    const pr = POCKET_POSITIONS.length > 0 ? 22 : 20;

    ctx.beginPath();
    ctx.arc(px, py, pr + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#2C1810';
    ctx.fill();

    const pocketGrad = ctx.createRadialGradient(px - 3, py - 3, 2, px, py, pr);
    pocketGrad.addColorStop(0, '#0a0a0a');
    pocketGrad.addColorStop(1, '#1a1a1a');
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = pocketGrad;
    ctx.fill();
  }
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  ball: Ball,
  scale: number
): void {
  const r = ball.radius * scale;
  const x = ball.x * scale;
  const y = ball.y * scale;

  ctx.save();

  const shadowGrad = ctx.createRadialGradient(x + r * 0.2, y + r * 0.3, r * 0.1, x, y, r * 1.3);
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(x + r * 0.1, y + r * 0.15, r * 1.2, 0, Math.PI * 2);
  ctx.fillStyle = shadowGrad;
  ctx.fill();

  const ballGrad = ctx.createRadialGradient(
    x - r * 0.35,
    y - r * 0.35,
    r * 0.1,
    x,
    y,
    r
  );
  ballGrad.addColorStop(0, lightenColor(ball.color, 40));
  ballGrad.addColorStop(0.5, ball.color);
  ballGrad.addColorStop(1, darkenColor(ball.color, 30));

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = ballGrad;
  ctx.fill();

  if (ball.isStriped) {
    ctx.beginPath();
    ctx.arc(x, y, r, -0.7, 0.7 + Math.PI);
    ctx.lineWidth = r * 0.35;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI - 0.7, Math.PI + 0.7);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = r * 0.35;
    ctx.stroke();
  }

  if (ball.number > 0) {
    const numR = r * 0.42;
    ctx.beginPath();
    ctx.arc(x, y, numR, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = `bold ${r * 0.5}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ball.number.toString(), x, y + 1);
  }

  const highlightGrad = ctx.createRadialGradient(
    x - r * 0.3,
    y - r * 0.3,
    0,
    x - r * 0.25,
    y - r * 0.25,
    r * 0.4
  );
  highlightGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
  highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = highlightGrad;
  ctx.fill();

  ctx.restore();
}

function drawPredictPath(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  scale: number
): void {
  if (points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);

  ctx.beginPath();
  ctx.moveTo(points[0].x * scale, points[0].y * scale);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x * scale, points[i].y * scale);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawCueStick(
  ctx: CanvasRenderingContext2D,
  cueBall: Ball,
  angle: number,
  power: number,
  scale: number
): void {
  const r = cueBall.radius * scale;
  const cx = cueBall.x * scale;
  const cy = cueBall.y * scale;

  const pullBack = 10 + power * 0.8;
  const stickLength = 280;
  const stickWidth = 6;

  const startDist = r + 8 + pullBack;
  const startX = cx + Math.cos(angle) * startDist;
  const startY = cy + Math.sin(angle) * startDist;
  const endX = cx + Math.cos(angle) * (startDist + stickLength);
  const endY = cy + Math.sin(angle) * (startDist + stickLength);

  ctx.save();

  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = stickWidth + 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(startX + 2, startY + 3);
  ctx.lineTo(endX + 2, endY + 3);
  ctx.stroke();

  const grad = ctx.createLinearGradient(startX, startY, endX, endY);
  grad.addColorStop(0, '#F5DEB3');
  grad.addColorStop(0.05, '#DEB887');
  grad.addColorStop(0.3, '#8B4513');
  grad.addColorStop(0.5, '#A0522D');
  grad.addColorStop(0.7, '#8B4513');
  grad.addColorStop(1, '#654321');

  ctx.strokeStyle = grad;
  ctx.lineWidth = stickWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.strokeStyle = '#2C1810';
  ctx.lineWidth = stickWidth * 0.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(cx + Math.cos(angle) * (startDist + 25), cy + Math.sin(angle) * (startDist + 25));
  ctx.stroke();

  ctx.restore();
}

function drawCollisionEffect(
  ctx: CanvasRenderingContext2D,
  effect: CollisionEffect,
  scale: number
): void {
  const r = effect.radius * scale;
  const x = effect.x * scale;
  const y = effect.y * scale;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r * (1 + (1 - effect.alpha) * 1.5), 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${effect.alpha * 0.7})`;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${((R << 16) | (G << 8) | B).toString(16).padStart(6, '0')}`;
}

function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${((R << 16) | (G << 8) | B).toString(16).padStart(6, '0')}`;
}
