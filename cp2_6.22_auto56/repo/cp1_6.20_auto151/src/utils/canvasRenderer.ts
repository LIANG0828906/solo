import type {
  MountStyle,
  MountParams,
  CropArea,
  ScrollParams,
  FrameParams,
  FanParams,
} from '../types';
import { getCroppedImage } from './imageCrop';

export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 640;

function drawFabricTexture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  textureIdx: number
): void {
  const patterns: Array<() => CanvasGradient> = [
    () => {
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, '#f5efe0');
      g.addColorStop(0.5, '#ebe0c8');
      g.addColorStop(1, '#f5efe0');
      return g;
    },
    () => {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#e8dcc0');
      g.addColorStop(0.5, '#d4c49c');
      g.addColorStop(1, '#e8dcc0');
      return g;
    },
    () => {
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, '#f0e4cb');
      g.addColorStop(0.3, '#e5d4a8');
      g.addColorStop(0.7, '#e5d4a8');
      g.addColorStop(1, '#f0e4cb');
      return g;
    },
    () => {
      const g = ctx.createRadialGradient(
        x + w / 2,
        y + h / 2,
        50,
        x + w / 2,
        y + h / 2,
        Math.max(w, h) / 1.5
      );
      g.addColorStop(0, '#f8efd9');
      g.addColorStop(1, '#d9c69a');
      return g;
    },
    () => {
      const g = ctx.createLinearGradient(x, y, x + w, y);
      g.addColorStop(0, '#e6d5b0');
      g.addColorStop(0.25, '#f2e6c8');
      g.addColorStop(0.5, '#e6d5b0');
      g.addColorStop(0.75, '#f2e6c8');
      g.addColorStop(1, '#e6d5b0');
      return g;
    },
    () => {
      const g = ctx.createLinearGradient(x, y, x + w * 0.5, y + h * 0.5);
      g.addColorStop(0, '#ead9b5');
      g.addColorStop(0.4, '#d4bf8a');
      g.addColorStop(0.6, '#d4bf8a');
      g.addColorStop(1, '#ead9b5');
      return g;
    },
  ];

  ctx.save();
  ctx.fillStyle = patterns[textureIdx % patterns.length]();
  ctx.fillRect(x, y, w, h);

  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = '#a08858';
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 12) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i, y + h);
    ctx.stroke();
  }
  for (let j = 0; j < h; j += 18) {
    ctx.beginPath();
    ctx.moveTo(x, y + j);
    ctx.lineTo(x + w, y + j);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAxisHead(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  color: string
): void {
  ctx.save();
  const grad = ctx.createLinearGradient(cx - width / 2, cy, cx + width / 2, cy);
  grad.addColorStop(0, color);
  grad.addColorStop(0.3, lightenColor(color, 30));
  grad.addColorStop(0.7, color);
  grad.addColorStop(1, darkenColor(color, 20));
  ctx.fillStyle = grad;
  roundRect(ctx, cx - width / 2, cy - height / 2, width, height, 6);
  ctx.fill();

  ctx.fillStyle = darkenColor(color, 30);
  const capW = 10;
  roundRect(ctx, cx - width / 2 - capW + 2, cy - height / 2 - 2, capW, height + 4, 4);
  ctx.fill();
  roundRect(ctx, cx + width / 2 - 2, cy - height / 2 - 2, capW, height + 4, 4);
  ctx.fill();
  ctx.restore();
}

function drawScroll(
  ctx: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  params: ScrollParams
): void {
  const { axisColor, fabricTexture } = params;
  const totalW = CANVAS_WIDTH;
  const totalH = CANVAS_HEIGHT;

  const marginX = 30;
  const axisH = 28;
  const fabricW = totalW - marginX * 2;
  const fabricTop = 80;
  const fabricBottom = totalH - 80;
  const fabricH = fabricBottom - fabricTop;

  drawFabricTexture(ctx, marginX, fabricTop, fabricW, fabricH, fabricTexture);

  const imgRatio = image.width / image.height;
  const maxImgW = fabricW - 50;
  const maxImgH = fabricH - 60;
  let imgH = maxImgH;
  let imgW = imgH * imgRatio;
  if (imgW > maxImgW) {
    imgW = maxImgW;
    imgH = imgW / imgRatio;
  }
  const imgX = marginX + (fabricW - imgW) / 2;
  const imgY = fabricTop + 30 + (maxImgH - imgH) / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(74,53,32,0.25)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.drawImage(image, imgX, imgY, imgW, imgH);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(74,53,32,0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(imgX, imgY, imgW, imgH);
  ctx.restore();

  drawAxisHead(ctx, totalW / 2, fabricTop - axisH / 2 + 6, fabricW + 24, axisH, axisColor);
  drawAxisHead(ctx, totalW / 2, fabricBottom + axisH / 2 - 6, fabricW + 24, axisH, axisColor);

  ctx.save();
  ctx.fillStyle = '#4a3520';
  ctx.font = 'bold 14px "SimKai","KaiTi",serif';
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.6;
  ctx.fillText('· 翰墨丹青 ·', totalW / 2, fabricTop + 20);
  ctx.restore();
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  params: FrameParams
): void {
  const { frameColor, frameWidth, matColor } = params;
  const totalW = CANVAS_WIDTH;
  const totalH = CANVAS_HEIGHT;

  const outerX = 20;
  const outerY = 30;
  const outerW = totalW - 40;
  const outerH = totalH - 60;

  ctx.save();
  const frameGrad = ctx.createLinearGradient(outerX, outerY, outerX + outerW, outerY + outerH);
  frameGrad.addColorStop(0, lightenColor(frameColor, 25));
  frameGrad.addColorStop(0.5, frameColor);
  frameGrad.addColorStop(1, darkenColor(frameColor, 25));
  ctx.fillStyle = frameGrad;
  ctx.fillRect(outerX, outerY, outerW, outerH);

  const innerX = outerX + frameWidth;
  const innerY = outerY + frameWidth;
  const innerW = outerW - frameWidth * 2;
  const innerH = outerH - frameWidth * 2;
  ctx.clearRect(innerX, innerY, innerW, innerH);

  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(innerX + 0.5, innerY + 0.5, innerW - 1, innerH - 1);
  ctx.restore();

  const matPad = 22;
  const matX = innerX + matPad;
  const matY = innerY + matPad;
  const matW = innerW - matPad * 2;
  const matH = innerH - matPad * 2;

  ctx.save();
  ctx.fillStyle = matColor;
  ctx.fillRect(matX, matY, matW, matH);
  ctx.shadowColor = 'rgba(74,53,32,0.35)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.strokeStyle = 'rgba(74,53,32,0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(matX, matY, matW, matH);
  ctx.restore();

  const imgRatio = image.width / image.height;
  const imgPad = 18;
  const maxImgW = matW - imgPad * 2;
  const maxImgH = matH - imgPad * 2;
  let imgH = maxImgH;
  let imgW = imgH * imgRatio;
  if (imgW > maxImgW) {
    imgW = maxImgW;
    imgH = imgW / imgRatio;
  }
  const imgX = matX + (matW - imgW) / 2;
  const imgY = matY + (matH - imgH) / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(74,53,32,0.2)';
  ctx.shadowBlur = 6;
  ctx.drawImage(image, imgX, imgY, imgW, imgH);
  ctx.restore();
}

function drawFan(
  ctx: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  params: FanParams
): void {
  const { ribMaterial, fanBgColor } = params;
  const totalW = CANVAS_WIDTH;
  const totalH = CANVAS_HEIGHT;

  const cx = totalW / 2;
  const cy = totalH * 0.9;
  const outerR = Math.min(totalW, totalH) * 0.44;
  const innerR = outerR * 0.42;
  const startAngle = Math.PI * 1.12;
  const endAngle = Math.PI * 1.88;

  ctx.save();
  ctx.shadowColor = 'rgba(74,53,32,0.3)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, startAngle, endAngle);
  ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
  ctx.closePath();
  const fanGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  fanGrad.addColorStop(0, lightenColor(fanBgColor, 10));
  fanGrad.addColorStop(1, fanBgColor);
  ctx.fillStyle = fanGrad;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.clip();
  const ribColors: Record<string, [string, string]> = {
    bamboo: ['#a9d18e', '#548235'],
    wood: ['#c69c6d', '#6f4423'],
    copper: ['#d4af7a', '#8b6914'],
  };
  const [ribLight, ribDark] = ribColors[ribMaterial] || ribColors.bamboo;
  const ribCount = 17;
  for (let i = 0; i <= ribCount; i++) {
    const t = i / ribCount;
    const angle = startAngle + (endAngle - startAngle) * t;
    const sx = cx + Math.cos(angle) * innerR;
    const sy = cy + Math.sin(angle) * innerR;
    const ex = cx + Math.cos(angle) * outerR;
    const ey = cy + Math.sin(angle) * outerR;
    const rg = ctx.createLinearGradient(sx, sy, ex, ey);
    rg.addColorStop(0, ribDark);
    rg.addColorStop(0.5, ribLight);
    rg.addColorStop(1, ribDark);
    ctx.strokeStyle = rg;
    ctx.lineWidth = ribMaterial === 'copper' ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, startAngle, endAngle);
  ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
  ctx.closePath();
  ctx.clip();

  const imgRatio = image.width / image.height;
  const fanW = (outerR - innerR) * 1.6;
  const fanH = fanW / imgRatio;
  const arcMid = (startAngle + endAngle) / 2;
  const midR = (outerR + innerR) / 2;
  const imgCx = cx + Math.cos(arcMid) * midR;
  const imgCy = cy + Math.sin(arcMid) * midR;

  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.drawImage(
    image,
    imgCx - fanW / 2,
    imgCy - fanH / 2,
    fanW,
    fanH
  );
  ctx.restore();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, startAngle, endAngle);
  ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
  ctx.closePath();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = ribColors[ribMaterial][1];
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = ribColors[ribMaterial][1];
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function renderMountedCanvas(
  canvas: HTMLCanvasElement,
  originalImg: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number } | null,
  style: MountStyle,
  params: MountParams,
  whiteBg: boolean = false
): void {
  const ctx = canvas.getContext('2d')!;
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (whiteBg) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  if (!crop) return;

  const cropped = getCroppedImage(originalImg, crop);

  switch (style) {
    case 'scroll':
      drawScroll(ctx, cropped, params.scroll);
      break;
    case 'frame':
      drawFrame(ctx, cropped, params.frame);
      break;
    case 'fan':
      drawFan(ctx, cropped, params.fan);
      break;
  }
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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(full.substring(0, 2), 16),
    g: parseInt(full.substring(2, 4), 16),
    b: parseInt(full.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lightenColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * (percent / 100), g + (255 - g) * (percent / 100), b + (255 - b) * (percent / 100));
}

function darkenColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - percent / 100), g * (1 - percent / 100), b * (1 - percent / 100));
}
