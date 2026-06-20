import * as THREE from 'three';

export function generateAbstractPaintingTexture(
  width: number = 512,
  height: number = 512,
  baseColor: string = '#4a90d9'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const base = new THREE.Color(baseColor);
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  const color1 = new THREE.Color().setHSL(hsl.h, hsl.s * 0.8, hsl.l * 1.2);
  const color2 = new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l * 0.6);
  gradient.addColorStop(0, baseColor);
  gradient.addColorStop(0.5, color1.getStyle());
  gradient.addColorStop(1, color2.getStyle());
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 8; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 30 + Math.random() * 100;
    const hue = (hsl.h + Math.random() * 0.2 - 0.1 + 1) % 1;
    const color = new THREE.Color().setHSL(
      hue,
      0.6 + Math.random() * 0.3,
      0.5 + Math.random() * 0.2
    );

    const radGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    radGrad.addColorStop(0, color.getStyle() + '80');
    radGrad.addColorStop(1, color.getStyle() + '00');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 15; i++) {
    const startX = Math.random() * width;
    const startY = Math.random() * height;
    const endX = startX + (Math.random() - 0.5) * 200;
    const endY = startY + (Math.random() - 0.5) * 200;
    const hue = (hsl.h + Math.random() * 0.3 - 0.15 + 1) % 1;
    const color = new THREE.Color().setHSL(hue, 0.7, 0.6);

    ctx.strokeStyle = color.getStyle() + '60';
    ctx.lineWidth = 2 + Math.random() * 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(
      startX + (Math.random() - 0.5) * 100,
      startY + (Math.random() - 0.5) * 100,
      endX + (Math.random() - 0.5) * 100,
      endY + (Math.random() - 0.5) * 100,
      endX,
      endY
    );
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function generateGlowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
