import * as THREE from 'three';

export const lerpColor = (
  from: THREE.Color,
  to: THREE.Color,
  t: number
): THREE.Color => {
  const result = new THREE.Color();
  result.r = from.r + (to.r - from.r) * t;
  result.g = from.g + (to.g - from.g) * t;
  result.b = from.b + (to.b - from.b) * t;
  return result;
};

export const getFluxColor = (flux: number, t: number): THREE.Color => {
  const cyan = new THREE.Color('#00E5FF');
  const magenta = new THREE.Color('#FF00E5');
  const normalizedFlux = Math.max(0, Math.min(1, flux / 100));
  const mixT = (t * 0.7 + normalizedFlux * 0.3);
  return lerpColor(cyan, magenta, mixT);
};

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

export const rgbToString = (r: number, g: number, b: number, a: number = 1): string => {
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
};

export const colorToCssRgba = (color: THREE.Color, alpha: number = 1): string => {
  return rgbToString(color.r, color.g, color.b, alpha);
};
