import * as THREE from 'three';

export function lerpColor(color1: string, color2: string, t: number): THREE.Color {
  const c1 = new THREE.Color(color1);
  const c2 = new THREE.Color(color2);
  return c1.lerp(c2, Math.max(0, Math.min(1, t)));
}

export function velocityToColor(speed: number, maxSpeed: number = 5): THREE.Color {
  const t = Math.min(speed / maxSpeed, 1);
  return lerpColor('#4A90D9', '#50E3C2', t);
}

export function velocityToSize(speed: number, maxSpeed: number = 5, minSize: number = 3, maxSize: number = 6): number {
  const t = Math.min(speed / maxSpeed, 1);
  return minSize + (maxSize - minSize) * t;
}

export function heightToTerrainColor(height: number, minHeight: number, maxHeight: number): THREE.Color {
  const t = (height - minHeight) / (maxHeight - minHeight);
  return lerpColor('#8B9DAF', '#A4B7C4', t);
}

export function createGradientBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color1: string,
  color2: string,
  borderWidth: number = 2
): void {
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(x, y, width, height);
}
