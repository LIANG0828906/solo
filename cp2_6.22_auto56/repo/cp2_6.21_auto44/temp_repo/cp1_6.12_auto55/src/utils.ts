import * as THREE from 'three';

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function lerpColor(
  color1: THREE.Color,
  color2: THREE.Color,
  t: number
): THREE.Color {
  return new THREE.Color().lerpColors(color1, color2, t);
}

export function getHeightColor(
  height: number,
  maxHeight: number
): THREE.Color {
  const lowColor = new THREE.Color(0xf5e6c8);
  const midColor = new THREE.Color(0xa8d8ea);
  const highColor = new THREE.Color(0x2c5f8c);

  const normalizedHeight = Math.min(height / maxHeight, 1);

  if (normalizedHeight <= 0.33) {
    const t = normalizedHeight / 0.33;
    return lerpColor(lowColor, midColor, t);
  } else {
    const t = (normalizedHeight - 0.33) / 0.67;
    return lerpColor(midColor, highColor, t);
  }
}

export function easeLinear(t: number): number {
  return t;
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}
