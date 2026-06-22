import { StickyNote as StickyNoteType, Point } from '../types';

export const NOTE_WIDTH = 180;
export const NOTE_HEIGHT = 140;
export const NOTE_CORNER_RADIUS = 4;
export const SIDEBAR_WIDTH = 4;

export function getNoteBounds(note: StickyNoteType): { left: number; right: number; top: number; bottom: number } {
  return {
    left: note.x - NOTE_WIDTH / 2,
    right: note.x + NOTE_WIDTH / 2,
    top: note.y - NOTE_HEIGHT / 2,
    bottom: note.y + NOTE_HEIGHT / 2,
  };
}

export function isPointInNote(point: Point, note: StickyNoteType): boolean {
  const bounds = getNoteBounds(note);
  return point.x >= bounds.left && point.x <= bounds.right &&
         point.y >= bounds.top && point.y <= bounds.bottom;
}

export function isPointInVoteButton(point: Point, note: StickyNoteType): boolean {
  const bounds = getNoteBounds(note);
  const buttonX = bounds.right - 24;
  const buttonY = bounds.bottom - 24;
  const buttonRadius = 16;
  const dx = point.x - buttonX;
  const dy = point.y - buttonY;
  return dx * dx + dy * dy <= buttonRadius * buttonRadius;
}

export function getVoteButtonColor(voteCount: number): { start: string; end: string } {
  if (voteCount === 0) {
    return { start: '#e0e0e0', end: '#d0d0d0' };
  }
  const t = Math.min(voteCount / 10, 1);
  const r = Math.round(224 + (255 - 224) * t);
  const g = Math.round(224 + (215 - 224) * t);
  const b = Math.round(224 + (0 - 224) * t);
  const r2 = Math.round(208 + (255 - 208) * t);
  const g2 = Math.round(208 + (193 - 208) * t);
  const b2 = Math.round(208 + (7 - 208) * t);
  return {
    start: `rgb(${r}, ${g}, ${b})`,
    end: `rgb(${r2}, ${g2}, ${b2})`,
  };
}

export function renderStickyNote(
  ctx: CanvasRenderingContext2D,
  note: StickyNoteType,
  scale: number,
  isSelected: boolean,
  animationProgress: number,
  deleteProgress: number
) {
  const width = NOTE_WIDTH * (animationProgress - deleteProgress);
  const height = NOTE_HEIGHT * (animationProgress - deleteProgress);
  const left = note.x - width / 2;
  const top = note.y - height / 2;
  const alpha = animationProgress - deleteProgress;

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 4;

  const bgGradient = ctx.createLinearGradient(left, top, left, top + height);
  bgGradient.addColorStop(0, note.color);
  bgGradient.addColorStop(1, shadeColor(note.color, -5));

  ctx.fillStyle = bgGradient;
  roundRect(ctx, left, top, width, height, NOTE_CORNER_RADIUS);
  ctx.fill();

  ctx.shadowColor = 'transparent';

  ctx.fillStyle = note.sidebarColor;
  ctx.fillRect(left, top, SIDEBAR_WIDTH, height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.moveTo(left + width - 20, top);
  ctx.lineTo(left + width, top);
  ctx.lineTo(left + width, top + 20);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;
  roundRect(ctx, left, top, width, height, NOTE_CORNER_RADIUS);
  ctx.stroke();

  if (isSelected) {
    ctx.strokeStyle = '#4a90d9';
    ctx.lineWidth = 2;
    roundRect(ctx, left - 2, top - 2, width + 4, height + 4, NOTE_CORNER_RADIUS + 2);
    ctx.stroke();
  }

  const fontSize = Math.max(12, 14 * scale);
  ctx.fillStyle = '#333333';
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.textBaseline = 'top';

  const padding = 12;
  const textLeft = left + SIDEBAR_WIDTH + padding;
  const textTop = top + padding;
  const maxWidth = width - SIDEBAR_WIDTH - padding * 2;
  const maxHeight = height - padding * 2 - 30;

  wrapText(ctx, note.content || '双击编辑...', textLeft, textTop, maxWidth, maxHeight, fontSize + 4);

  const voteCount = note.votes.length;
  const buttonX = left + width - 24;
  const buttonY = top + height - 24;
  const colors = getVoteButtonColor(voteCount);

  const voteGradient = ctx.createRadialGradient(buttonX, buttonY, 0, buttonX, buttonY, 16);
  voteGradient.addColorStop(0, colors.start);
  voteGradient.addColorStop(1, colors.end);

  ctx.beginPath();
  ctx.arc(buttonX, buttonY, 16, 0, Math.PI * 2);
  ctx.fillStyle = voteGradient;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (voteCount >= 10) {
    const shimmer = (Date.now() % 2000) / 2000;
    ctx.save();
    ctx.globalAlpha = 0.3 + 0.3 * Math.sin(shimmer * Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(buttonX, buttonY, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = voteCount > 0 ? '#ffffff' : '#666666';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(voteCount.toString(), buttonX, buttonY);

  ctx.fillStyle = '#999999';
  ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('👍', left + width - 48, buttonY);

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  lineHeight: number
) {
  const words = text.split('');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      if (currentY + lineHeight > y + maxHeight) {
        ctx.fillText(line + '...', x, currentY);
        return;
      }
      ctx.fillText(line, x, currentY);
      line = words[n];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (currentY <= y + maxHeight) {
    ctx.fillText(line, x, currentY);
  }
}

function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255))
      .toString(16)
      .slice(1)
  );
}
