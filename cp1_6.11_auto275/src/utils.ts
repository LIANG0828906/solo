// ============================================================
// utils.ts - 工具函数模块
// 职责：提供颜色混合算法、布纹噪点生成、拖拽辅助等纯函数
// 被依赖：design.ts, simulate.ts, main.ts
// ============================================================

/**
 * 将十六进制颜色字符串转换为RGB对象
 * @param hex 十六进制颜色值，如 #D4322E
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const sanitized = hex.replace('#', '');
  const value = sanitized.length === 3
    ? sanitized.split('').map(c => c + c).join('')
    : sanitized;
  return {
    r: parseInt(value.substring(0, 2), 16),
    g: parseInt(value.substring(2, 4), 16),
    b: parseInt(value.substring(4, 6), 16)
  };
}

/**
 * 将RGB对象转换为十六进制颜色字符串
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 正片叠底 (Multiply) 颜色混合算法
 * 公式：结果 = 底色 × 叠印色 / 255
 * 用于模拟颜料半透明叠加效果
 * @param base 底色RGB
 * @param overlay 叠印色RGB
 * @param opacity 叠印色不透明度 0-1
 */
export function multiplyBlend(
  base: { r: number; g: number; b: number },
  overlay: { r: number; g: number; b: number },
  opacity: number = 1.0
): { r: number; g: number; b: number } {
  const clampedOpacity = Math.max(0, Math.min(1, opacity));
  const multiply = (b: number, o: number) => (b * o) / 255;
  const resultR = multiply(base.r, overlay.r);
  const resultG = multiply(base.g, overlay.g);
  const resultB = multiply(base.b, overlay.b);
  return {
    r: base.r + (resultR - base.r) * clampedOpacity,
    g: base.g + (resultG - base.g) * clampedOpacity,
    b: base.b + (resultB - base.b) * clampedOpacity
  };
}

/**
 * 生成布纹噪点的ImageData
 * 使用确定性伪随机算法生成0.5px粒度的布纹噪点
 * @param width 画布宽度
 * @param height 画布高度
 * @param baseColor 基础颜色RGB
 * @param noiseColor 噪点颜色RGB
 * @param intensity 噪点强度 0-1
 */
export function generateClothNoiseImageData(
  width: number,
  height: number,
  baseColor: { r: number; g: number; b: number },
  noiseColor: { r: number; g: number; b: number },
  intensity: number = 0.08
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = `rgb(${baseColor.r},${baseColor.g},${baseColor.b})`;
  ctx.fillRect(0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const step = 2;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const n = pseudoRandom(x * 13 + y * 71);
      if (n > 0.5 - intensity / 2 && n < 0.5 + intensity / 2) continue;
      const alpha = n > 0.5 ? intensity * 0.6 : -intensity * 0.6;
      const weave = ((x + y) & 2) === 0 ? 1 : -1;
      for (let dy = 0; dy < step && y + dy < height; dy++) {
        for (let dx = 0; dx < step && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          data[idx]     = clampByte(data[idx]     + (noiseColor.r - baseColor.r) * alpha + weave * 1.2);
          data[idx + 1] = clampByte(data[idx + 1] + (noiseColor.g - baseColor.g) * alpha + weave * 1.2);
          data[idx + 2] = clampByte(data[idx + 2] + (noiseColor.b - baseColor.b) * alpha + weave * 1.2);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return ctx.getImageData(0, 0, width, height);
}

/**
 * 生成带纹理的棉布底图并缓存到离屏Canvas
 * @param width 画布宽度
 * @param height 画布高度
 */
export function createClothTextureCanvas(
  width: number,
  height: number
): HTMLCanvasElement {
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d')!;

  const baseCloth = hexToRgb('#F5EDE0');
  const noiseCloth = hexToRgb('#E6D5B8');
  const imageData = generateClothNoiseImageData(width, height, baseCloth, noiseCloth, 0.07);
  ctx.putImageData(imageData, 0, 0);

  ctx.strokeStyle = 'rgba(230, 213, 184, 0.35)';
  ctx.lineWidth = 0.5;
  for (let y = 0; y < height; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let x = 0; x < width; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  return offscreen;
}

/**
 * 确定性伪随机函数（基于种子，用于重现布纹）
 * 返回值范围 0-1
 */
export function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * 数值钳制到0-255字节范围
 */
export function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/**
 * 线性插值
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 缓动函数：easeInOutCubic
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * 将版在布料上的位置居中计算
 * @param clothW 布料宽度
 * @param clothH 布料高度
 * @param blockW 版宽度
 * @param blockH 版高度
 */
export function calculateBlockPosition(
  clothW: number,
  clothH: number,
  blockW: number,
  blockH: number
): { x: number; y: number; scale: number } {
  const maxW = clothW * 0.65;
  const maxH = clothH * 0.8;
  const scale = Math.min(maxW / blockW, maxH / blockH);
  const drawW = blockW * scale;
  const drawH = blockH * scale;
  return {
    x: (clothW - drawW) / 2,
    y: (clothH - drawH) / 2,
    scale
  };
}

/**
 * 创建空的Block图层ImageData（400x600）
 */
export function createEmptyBlockImageData(width: number, height: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#F5EDE0';
  ctx.fillRect(0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

/**
 * 生成雕版缩略图（80x120灰底黑线）
 * @param blockImageData 版的ImageData (400x600)
 * @param thumbW 缩略图宽度
 * @param thumbH 缩略图高度
 */
export function generateBlockThumbnail(
  blockImageData: ImageData,
  thumbW: number = 80,
  thumbH: number = 120
): HTMLCanvasElement {
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = blockImageData.width;
  srcCanvas.height = blockImageData.height;
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.putImageData(blockImageData, 0, 0);

  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbW;
  thumbCanvas.height = thumbH;
  const thumbCtx = thumbCanvas.getContext('2d')!;

  thumbCtx.fillStyle = '#E8DCC4';
  thumbCtx.fillRect(0, 0, thumbW, thumbH);
  thumbCtx.imageSmoothingEnabled = false;
  thumbCtx.drawImage(srcCanvas, 0, 0, thumbW, thumbH);

  const data = thumbCtx.getImageData(0, 0, thumbW, thumbH);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (lum < 200) {
      d[i] = 20; d[i + 1] = 20; d[i + 2] = 20;
    } else {
      d[i] = 232; d[i + 1] = 220; d[i + 2] = 196;
    }
  }
  thumbCtx.putImageData(data, 0, 0);
  return thumbCanvas;
}

/**
 * 检测ImageData是否为空白（全是布底色）
 */
export function isBlockEmpty(imageData: ImageData): boolean {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < 235 || d[i + 1] < 228 || d[i + 2] < 215) {
      return false;
    }
  }
  return true;
}

/**
 * 中文数字转换（壹贰叁肆）
 */
export const CN_NUMERALS: string[] = ['壹', '贰', '叁', '肆'];

/**
 * 颜料颜色定义
 */
export interface PigmentColor {
  hex: string;
  name: string;
}

export const PIGMENT_COLORS: PigmentColor[] = [
  { hex: '#D4322E', name: '朱砂红' },
  { hex: '#2E8B57', name: '石绿' },
  { hex: '#4169E1', name: '靛蓝' },
  { hex: '#DAA520', name: '藤黄' }
];
