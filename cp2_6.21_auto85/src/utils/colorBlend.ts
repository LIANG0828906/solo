import type { RGBA, LAB } from '../types';

/**
 * Lab色彩空间颜色混合工具
 *
 * 基于CIE Lab色彩空间进行颜色混合，相比RGB空间混合：
 * 1. 更符合人眼对颜色的感知
 * 2. 混合结果更自然，不会出现RGB混合的脏色问题
 * 3. 能更好地保持唇纹、皮肤纹理等细节
 *
 * 转换流程： RGB -> XYZ -> Lab -> 混合 -> XYZ -> RGB
 */

/**
 * 将十六进制颜色字符串转换为RGBA对象
 * @param hex 十六进制颜色，如 #BC2649
 * @param alpha 透明度 0-1
 */
export function hexToRgba(hex: string, alpha: number = 1): RGBA {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0, a: alpha };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: alpha,
  };
}

/**
 * 将RGBA转换为十六进制字符串
 */
export function rgbaToHex(rgba: RGBA): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
}

/**
 * sRGB -> XYZ 转换
 * 使用D65白点参考
 */
function rgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
  let rn = r / 255;
  let gn = g / 255;
  let bn = b / 255;

  rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
  gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
  bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;

  rn *= 100;
  gn *= 100;
  bn *= 100;

  const x = rn * 0.4124 + gn * 0.3576 + bn * 0.1805;
  const y = rn * 0.2126 + gn * 0.7152 + bn * 0.0722;
  const z = rn * 0.0193 + gn * 0.1192 + bn * 0.9505;

  return { x, y, z };
}

/**
 * XYZ -> sRGB 转换
 */
function xyzToRgb(x: number, y: number, z: number): { r: number; g: number; b: number } {
  const xn = x / 100;
  const yn = y / 100;
  const zn = z / 100;

  let r = xn * 3.2406 + yn * -1.5372 + zn * -0.4986;
  let g = xn * -0.9689 + yn * 1.8758 + zn * 0.0415;
  let b = xn * 0.0557 + yn * -0.204 + zn * 1.057;

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

  return {
    r: Math.max(0, Math.min(255, r * 255)),
    g: Math.max(0, Math.min(255, g * 255)),
    b: Math.max(0, Math.min(255, b * 255)),
  };
}

/**
 * XYZ -> Lab 转换
 * D65白点参考值
 */
function xyzToLab(x: number, y: number, z: number): LAB {
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;

  let xn = x / refX;
  let yn = y / refY;
  let zn = z / refZ;

  const delta = 6 / 29;

  xn = xn > Math.pow(delta, 3) ? Math.cbrt(xn) : xn / (3 * delta * delta) + 4 / 29;
  yn = yn > Math.pow(delta, 3) ? Math.cbrt(yn) : yn / (3 * delta * delta) + 4 / 29;
  zn = zn > Math.pow(delta, 3) ? Math.cbrt(zn) : zn / (3 * delta * delta) + 4 / 29;

  return {
    L: 116 * yn - 16,
    a: 500 * (xn - yn),
    b: 200 * (yn - zn),
  };
}

/**
 * Lab -> XYZ 转换
 */
function labToXyz(L: number, a: number, b: number): { x: number; y: number; z: number } {
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;

  const delta = 6 / 29;

  let yn = (L + 16) / 116;
  let xn = a / 500 + yn;
  let zn = yn - b / 200;

  const y3 = Math.pow(yn, 3);
  const x3 = Math.pow(xn, 3);
  const z3 = Math.pow(zn, 3);

  yn = y3 > Math.pow(delta, 3) ? y3 : (yn - 4 / 29) * 3 * delta * delta;
  xn = x3 > Math.pow(delta, 3) ? x3 : (xn - 4 / 29) * 3 * delta * delta;
  zn = z3 > Math.pow(delta, 3) ? z3 : (zn - 4 / 29) * 3 * delta * delta;

  return {
    x: xn * refX,
    y: yn * refY,
    z: zn * refZ,
  };
}

/**
 * RGB 转 Lab
 */
export function rgbToLab(r: number, g: number, b: number): LAB {
  const xyz = rgbToXyz(r, g, b);
  return xyzToLab(xyz.x, xyz.y, xyz.z);
}

/**
 * Lab 转 RGB
 */
export function labToRgb(L: number, a: number, b: number): { r: number; g: number; b: number } {
  const xyz = labToXyz(L, a, b);
  return xyzToRgb(xyz.x, xyz.y, xyz.z);
}

/**
 * 基于Lab色彩空间的alpha合成算法
 *
 * 算法原理：
 * 1. 将底色和产品色都转换到Lab色彩空间
 * 2. 在Lab空间中进行alpha混合：保持底色的明度结构（L通道细节），
 *    混合a/b通道的颜色信息
 * 3. 转换回RGB空间
 *
 * 这种方式相比直接RGB alpha混合：
 * - 能更好地保持唇纹、皮肤纹理等明度细节
 * - 颜色混合更自然，不会出现发灰现象
 *
 * @param baseColor 基础肤色（像素原始颜色）
 * @param productColor 产品颜色
 * @param alpha 透明度 0-1
 */
export function labAlphaBlend(baseColor: RGBA, productColor: RGBA, alpha: number): RGBA {
  const baseLab = rgbToLab(baseColor.r, baseColor.g, baseColor.b);
  const productLab = rgbToLab(productColor.r, productColor.g, productColor.b);

  const effectiveAlpha = alpha * productColor.a;

  // L通道：保留更多底色的明度细节，使唇纹可见
  // 使用非线性混合：底色L贡献度随alpha增加但不完全覆盖
  const baseLContribution = 1 - effectiveAlpha * 0.7;
  const blendedL = baseLab.L * baseLContribution + productLab.L * effectiveAlpha;

  // a/b通道：按alpha比例混合颜色信息
  const blendedA = baseLab.a * (1 - effectiveAlpha) + productLab.a * effectiveAlpha;
  const blendedB = baseLab.b * (1 - effectiveAlpha) + productLab.b * effectiveAlpha;

  const rgb = labToRgb(blendedL, blendedA, blendedB);

  return {
    r: Math.round(rgb.r),
    g: Math.round(rgb.g),
    b: Math.round(rgb.b),
    a: 1,
  };
}

/**
 * 口红颜色混合
 * 基于Lab色彩空间的半透明叠加
 * 特别优化：保持唇部纹理细节可见
 *
 * @param baseSkinColor 基础唇色
 * @param lipstickHex 口红色号（十六进制）
 * @param opacity 透明度 0.3-1.0
 */
export function blendLipColor(baseSkinColor: RGBA, lipstickHex: string, opacity: number): RGBA {
  const lipstickColor = hexToRgba(lipstickHex, opacity);
  return labAlphaBlend(baseSkinColor, lipstickColor, opacity);
}

/**
 * 眼影颜色混合
 * 基于Lab色彩空间的渐变叠加
 * 支持珠光效果参数
 *
 * @param baseSkinColor 基础肤色
 * @param eyeshadowHex 眼影色号（十六进制）
 * @param opacity 透明度
 * @param shimmerIntensity 珠光强度 0-1
 */
export function blendEyeshadowColor(
  baseSkinColor: RGBA,
  eyeshadowHex: string,
  opacity: number,
  shimmerIntensity: number = 0,
): RGBA {
  const eyeshadowColor = hexToRgba(eyeshadowHex, opacity);
  let result = labAlphaBlend(baseSkinColor, eyeshadowColor, opacity);

  if (shimmerIntensity > 0) {
    const shimmerBoost = shimmerIntensity * 30;
    result = {
      ...result,
      r: Math.min(255, result.r + shimmerBoost),
      g: Math.min(255, result.g + shimmerBoost * 0.8),
      b: Math.min(255, result.b + shimmerBoost * 0.6),
    };
  }

  return result;
}

/**
 * 腮红颜色混合
 * 基于Lab色彩空间的径向渐变叠加
 * 腮红透明度固定为0.3，通过范围大小控制自然度
 *
 * @param baseSkinColor 基础肤色
 * @param blushHex 腮红色号（十六进制）
 */
export function blendBlushColor(baseSkinColor: RGBA, blushHex: string): RGBA {
  const blushColor = hexToRgba(blushHex, 0.3);
  return labAlphaBlend(baseSkinColor, blushColor, 0.3);
}
