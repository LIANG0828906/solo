export type SealType = 'leisure' | 'name' | 'collection';

export interface SealPlacement {
  type: SealType;
  x: number;
  y: number;
  size: number;
}

export interface SealInfo {
  type: SealType;
  name: string;
  shape: 'circle' | 'square' | 'ellipse';
  size: number;
}

export const SEAL_INFOS: Record<SealType, SealInfo> = {
  leisure: {
    type: 'leisure',
    name: '游于艺',
    shape: 'circle',
    size: 80,
  },
  name: {
    type: 'name',
    name: '太白',
    shape: 'square',
    size: 70,
  },
  collection: {
    type: 'collection',
    name: '神品',
    shape: 'ellipse',
    size: 90,
  },
};

const SEAL_COLOR = '#CC3333';
const SEAL_ALPHA = 0.82;

export function drawSeal(
  ctx: CanvasRenderingContext2D,
  type: SealType,
  cx: number,
  cy: number,
  size: number = 80,
  alpha: number = SEAL_ALPHA
): void {
  const info = SEAL_INFOS[type];
  ctx.save();
  ctx.globalAlpha = alpha;

  const r = size / 2;

  switch (info.shape) {
    case 'circle':
      drawCircleSeal(ctx, cx, cy, r, info.name);
      break;
    case 'square':
      drawSquareSeal(ctx, cx, cy, r, info.name);
      break;
    case 'ellipse':
      drawEllipseSeal(ctx, cx, cy, r, info.name);
      break;
  }

  ctx.restore();
}

function drawCircleSeal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  text: string
): void {
  ctx.save();

  ctx.fillStyle = SEAL_COLOR;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  const voidCount = 30 + Math.floor(Math.random() * 20);
  for (let i = 0; i < voidCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * r * 0.95;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    const vr = 0.5 + Math.random() * 2.5;
    ctx.beginPath();
    ctx.arc(x, y, vr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  ctx.strokeStyle = '#F5E6C8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#F5E6C8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#F5E6C8';
  ctx.font = `bold ${Math.floor(r * 0.55)}px "Ma Shan Zheng", "ZCOOL XiaoWei", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (text.length === 3) {
    ctx.fillText(text.charAt(0), cx, cy - r * 0.35);
    ctx.font = `bold ${Math.floor(r * 0.5)}px "Ma Shan Zheng", "ZCOOL XiaoWei", serif`;
    ctx.fillText(text.charAt(1), cx - r * 0.3, cy + r * 0.2);
    ctx.fillText(text.charAt(2), cx + r * 0.3, cy + r * 0.2);
  }

  ctx.restore();
}

function drawSquareSeal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  text: string
): void {
  ctx.save();

  const size = r * 1.8;
  const half = size / 2;

  ctx.fillStyle = SEAL_COLOR;
  roundRect(ctx, cx - half, cy - half, size, size, 4);
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  const voidCount = 25 + Math.floor(Math.random() * 15);
  for (let i = 0; i < voidCount; i++) {
    const x = cx + (Math.random() - 0.5) * size * 0.95;
    const y = cy + (Math.random() - 0.5) * size * 0.95;
    const vr = 0.4 + Math.random() * 2;
    ctx.beginPath();
    ctx.arc(x, y, vr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  ctx.strokeStyle = '#F5E6C8';
  ctx.lineWidth = 2;
  roundRect(ctx, cx - half + 3, cy - half + 3, size - 6, size - 6, 2);
  ctx.stroke();

  ctx.fillStyle = '#F5E6C8';
  ctx.font = `bold ${Math.floor(r * 0.65)}px "Ma Shan Zheng", "ZCOOL XiaoWei", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (text.length === 2) {
    ctx.fillText(text.charAt(0), cx, cy - r * 0.28);
    ctx.fillText(text.charAt(1), cx, cy + r * 0.32);
  }

  ctx.restore();
}

function drawEllipseSeal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  text: string
): void {
  ctx.save();

  const rx = r * 1.15;
  const ry = r * 0.75;

  ctx.fillStyle = SEAL_COLOR;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  const voidCount = 35 + Math.floor(Math.random() * 20);
  for (let i = 0; i < voidCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const a = Math.random() * rx * 0.95;
    const b = Math.random() * ry * 0.95;
    const x = cx + Math.cos(angle) * a;
    const y = cy + Math.sin(angle) * b;
    const vr = 0.4 + Math.random() * 2.2;
    ctx.beginPath();
    ctx.arc(x, y, vr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  ctx.strokeStyle = '#F5E6C8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx - 3, ry - 3, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#F5E6C8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx - 7, ry - 7, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#F5E6C8';
  ctx.font = `bold ${Math.floor(ry * 0.8)}px "Ma Shan Zheng", "ZCOOL XiaoWei", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (text.length === 2) {
    ctx.fillText(text.charAt(0), cx - rx * 0.3, cy);
    ctx.fillText(text.charAt(1), cx + rx * 0.3, cy);
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
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

export function drawSignature(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  author: string = '墨客'
): void {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const ganzhi = getGanZhi(year);
  const monthName = getMonthName(month);

  const text = `岁在${ganzhi}${monthName}  ${author}书`;

  ctx.save();
  ctx.fillStyle = '#1A1A1A';
  ctx.globalAlpha = 0.75;
  ctx.font = `14px "ZCOOL XiaoWei", "Noto Serif SC", serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function getGanZhi(year: number): string {
  const gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const offset = year - 4;
  return gan[offset % 10] + zhi[offset % 12];
}

function getMonthName(month: number): string {
  const names = ['', '孟春', '仲春', '季春', '孟夏', '仲夏', '季夏', '孟秋', '仲秋', '季秋', '孟冬', '仲冬', '季冬'];
  return names[month] || '';
}

export function renderSealPreview(type: SealType, canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSeal(ctx, type, canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.88);
}
