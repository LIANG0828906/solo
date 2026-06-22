import * as THREE from 'three';

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
};

export const lerpColor = (
  color1: string,
  color2: string,
  t: number
): string => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const clampedT = Math.max(0, Math.min(1, t));
  return rgbToHex(
    c1.r + (c2.r - c1.r) * clampedT,
    c1.g + (c2.g - c1.g) * clampedT,
    c1.b + (c2.b - c1.b) * clampedT
  );
};

export const getValueColor = (
  value: number,
  min: number,
  max: number,
  colorStart: string,
  colorEnd: string
): string => {
  const t = max === min ? 0.5 : (value - min) / (max - min);
  return lerpColor(colorStart, colorEnd, t);
};

export const hexToThreeColor = (hex: string): THREE.Color => {
  const rgb = hexToRgb(hex);
  return new THREE.Color(rgb.r, rgb.g, rgb.b);
};

export const threeColorToHex = (color: THREE.Color): string => {
  return rgbToHex(color.r, color.g, color.b);
};

export const lerpThreeColor = (
  c1: THREE.Color,
  c2: THREE.Color,
  t: number
): THREE.Color => {
  const clampedT = Math.max(0, Math.min(1, t));
  return new THREE.Color(
    c1.r + (c2.r - c1.r) * clampedT,
    c1.g + (c2.g - c1.g) * clampedT,
    c1.b + (c2.b - c1.b) * clampedT
  );
};
