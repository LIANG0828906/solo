import type { Card, Enemy } from '@/types/game';

const CARD_W = 120;
const CARD_H = 170;

export function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1a0f2e');
  grad.addColorStop(1, '#2d1b4e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function drawPlatform(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, 150, 0, Math.PI * 2);
  ctx.fillStyle = '#2a2a3a';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 150, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(74, 48, 117, 0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();

  for (let r = 40; r < 150; r += 35) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(74, 48, 117, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  cx: number,
  cy: number,
  effects: string[] = []
) {
  const glowColor = effects.includes('poison') ? '#9B59B6' : '#FF4D4D';

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 77, 77, 0.6)';
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 77, 77, 0.3)';
  ctx.fill();

  const barW = 60;
  const barH = 6;
  const barX = cx - barW / 2;
  const barY = cy - 36;

  ctx.fillStyle = '#1a0f2e';
  ctx.fillRect(barX, barY, barW, barH);

  const hpRatio = Math.max(0, enemy.hp / enemy.maxHP);
  const hpGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
  hpGrad.addColorStop(0, '#4CAF50');
  hpGrad.addColorStop(1, '#FF5252');
  ctx.fillStyle = hpGrad;
  ctx.fillRect(barX, barY, barW * hpRatio, barH);

  ctx.fillStyle = '#ffffff';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${enemy.hp}/${enemy.maxHP}`, cx, barY - 4);

  if (enemy.shield > 0) {
    ctx.fillStyle = '#4D79FF';
    ctx.fillText(`🛡${enemy.shield}`, cx, barY - 20);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '12px sans-serif';
  ctx.fillText(enemy.name, cx, cy + 32);
}

export function drawCard(
  ctx: CanvasRenderingContext2D,
  card: Card,
  x: number,
  y: number,
  isHovered: boolean = false
) {
  const scale = isHovered ? 1.05 : 1;
  const drawX = x - (CARD_W * (scale - 1)) / 2;
  const drawY = y - (CARD_H * (scale - 1)) / 2;

  const typeColors: Record<string, string> = {
    attack: '#FF4D4D',
    defense: '#4D79FF',
    skill: '#9B59B6',
  };
  const borderColor = typeColors[card.type] || '#4a3075';

  ctx.save();
  if (isHovered) {
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = 12;
  }

  roundRect(ctx, drawX, drawY, CARD_W, CARD_H, 8);
  ctx.fillStyle = '#2d1b4e';
  ctx.fill();

  roundRect(ctx, drawX, drawY, CARD_W, CARD_H, 8);
  ctx.strokeStyle = isHovered ? borderColor : '#4a3075';
  ctx.lineWidth = isHovered ? 2.5 : 1.5;
  ctx.stroke();

  ctx.fillStyle = borderColor;
  ctx.fillRect(drawX + 8, drawY + 8, CARD_W - 16, 3);

  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(card.name, drawX + CARD_W / 2, drawY + 35);

  ctx.font = '24px sans-serif';
  ctx.fillText(String(card.value), drawX + CARD_W / 2, drawY + 80);

  ctx.font = '11px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  const lines = wrapText(ctx, card.description, CARD_W - 20);
  lines.forEach((line, i) => {
    ctx.fillText(line, drawX + CARD_W / 2, drawY + 110 + i * 14);
  });

  ctx.restore();
}

export function drawTrajectoryLine(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return;

  const grad = ctx.createLinearGradient(fromX, fromY, toX, toY);
  grad.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
  grad.addColorStop(1, 'rgba(255, 215, 0, 0.1)');

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  current: number,
  max: number,
  width: number
) {
  const height = 8;

  ctx.fillStyle = '#1a0f2e';
  ctx.fillRect(x, y, width, height);

  const ratio = Math.max(0, current / max);
  const grad = ctx.createLinearGradient(x, y, x + width, y);
  grad.addColorStop(0, '#4CAF50');
  grad.addColorStop(1, '#FF5252');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, width * ratio, height);

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
}

export function drawPlayerInfo(
  ctx: CanvasRenderingContext2D,
  hp: number,
  maxHp: number,
  shield: number,
  round: number
) {
  const x = 20;
  const y = 20;

  ctx.fillStyle = 'rgba(26, 15, 46, 0.8)';
  roundRect(ctx, x, y, 200, 80, 8);
  ctx.fill();

  drawHealthBar(ctx, x + 10, y + 10, hp, maxHp, 180);

  ctx.fillStyle = '#ffffff';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`HP: ${hp}/${maxHp}`, x + 10, y + 42);

  if (shield > 0) {
    ctx.fillStyle = '#4D79FF';
    ctx.fillText(`🛡 ${shield}`, x + 100, y + 42);
  }

  ctx.fillStyle = '#FFD700';
  ctx.font = '13px sans-serif';
  ctx.fillText(`回合 ${round}`, x + 10, y + 65);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const chars = [...text];
  const lines: string[] = [];
  let current = '';

  for (const ch of chars) {
    const test = current + ch;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = ch;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}
