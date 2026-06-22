import { PresetColor } from '../types';

interface LAB {
  L: number;
  a: number;
  b: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function rgbToLab(r: number, g: number, b: number): LAB {
  let R = r / 255;
  let G = g / 255;
  let B = b / 255;

  R = R > 0.04045 ? Math.pow((R + 0.055) / 1.055, 2.4) : R / 12.92;
  G = G > 0.04045 ? Math.pow((G + 0.055) / 1.055, 2.4) : G / 12.92;
  B = B > 0.04045 ? Math.pow((B + 0.055) / 1.055, 2.4) : B / 12.92;

  let X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  let Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let Z = R * 0.0193 + G * 0.1192 + B * 0.9505;

  X /= 0.95047;
  Y /= 1.00000;
  Z /= 1.08883;

  X = X > 0.008856 ? Math.pow(X, 1 / 3) : 7.787 * X + 16 / 116;
  Y = Y > 0.008856 ? Math.pow(Y, 1 / 3) : 7.787 * Y + 16 / 116;
  Z = Z > 0.008856 ? Math.pow(Z, 1 / 3) : 7.787 * Z + 16 / 116;

  return {
    L: 116 * Y - 16,
    a: 500 * (X - Y),
    b: 200 * (Y - Z),
  };
}

function labToRgb(L: number, a: number, b: number): [number, number, number] {
  let Y = (L + 16) / 116;
  let X = a / 500 + Y;
  let Z = Y - b / 200;

  const Y3 = Math.pow(Y, 3);
  const X3 = Math.pow(X, 3);
  const Z3 = Math.pow(Z, 3);

  Y = Y3 > 0.008856 ? Y3 : (Y - 16 / 116) / 7.787;
  X = X3 > 0.008856 ? X3 : (X - 16 / 116) / 7.787;
  Z = Z3 > 0.008856 ? Z3 : (Z - 16 / 116) / 7.787;

  X *= 0.95047;
  Y *= 1.00000;
  Z *= 1.08883;

  let R = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
  let G = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
  let B = X * 0.0557 + Y * -0.2040 + Z * 1.0570;

  R = R > 0.0031308 ? 1.055 * Math.pow(R, 1 / 2.4) - 0.055 : 12.92 * R;
  G = G > 0.0031308 ? 1.055 * Math.pow(G, 1 / 2.4) - 0.055 : 12.92 * G;
  B = B > 0.0031308 ? 1.055 * Math.pow(B, 1 / 2.4) - 0.055 : 12.92 * B;

  return [R * 255, G * 255, B * 255];
}

export function mixColors(
  baseColor: PresetColor,
  addColors: PresetColor[],
  ratios: number[]
): string {
  const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
  if (totalRatio === 0 || addColors.length === 0) {
    return baseColor.hex;
  }

  const baseRatio = 100 - totalRatio;
  if (baseRatio <= 0) {
    return baseColor.hex;
  }

  const [br, bg, bb] = hexToRgb(baseColor.hex);
  const baseLab = rgbToLab(br, bg, bb);

  let L = baseLab.L * (baseRatio / 100);
  let A = baseLab.a * (baseRatio / 100);
  let B = baseLab.b * (baseRatio / 100);

  addColors.forEach((color, i) => {
    const ratio = ratios[i] || 0;
    const [r, g, b] = hexToRgb(color.hex);
    const lab = rgbToLab(r, g, b);
    L += lab.L * (ratio / 100);
    A += lab.a * (ratio / 100);
    B += lab.b * (ratio / 100);
  });

  const [finalR, finalG, finalB] = labToRgb(L, A, B);
  return rgbToHex(finalR, finalG, finalB);
}

export function generateWatercolorTexture(
  canvas: HTMLCanvasElement,
  color: string,
  noiseDensity: number = 0.05
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const pixelCount = Math.floor(w * h * noiseDensity);

  for (let i = 0; i < pixelCount; i++) {
    const x = Math.floor(Math.random() * w);
    const y = Math.floor(Math.random() * h);
    const idx = (y * w + x) * 4;
    const noise = Math.random() * 60 - 30;
    data[idx] = Math.max(0, Math.min(255, data[idx] + noise));
    data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + noise));
    data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + noise));
  }

  ctx.putImageData(imageData, 0, 0);

  const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  gradient.addColorStop(1, 'rgba(139, 119, 101, 0.12)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

export function generateSmallTexture(
  canvas: HTMLCanvasElement,
  color: string
): void {
  generateWatercolorTexture(canvas, color, 0.03);
}

export function formatRecipeText(
  baseColor: PresetColor,
  addColors: PresetColor[],
  ratios: number[]
): string {
  const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
  const baseRatio = Math.max(0, 100 - totalRatio);
  
  const parts: string[] = [`${baseColor.name}${baseRatio}%`];
  addColors.forEach((c, i) => {
    if (ratios[i] > 0) {
      parts.push(`${c.name}${ratios[i]}%`);
    }
  });
  
  return `配方：${parts.join('+')}`;
}
