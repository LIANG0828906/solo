import * as THREE from 'three';
import { TextureType } from './store';

const textureCache: Map<TextureType, THREE.CanvasTexture> = new Map();

function generateWoodTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseColor = '#8B4513';
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const noise = Math.sin(x * 0.02) * Math.cos(y * 0.01) * 20 +
                    Math.sin(x * 0.05 + y * 0.02) * 10 +
                    Math.random() * 5;
      const r = Math.min(255, Math.max(0, 139 + noise));
      const g = Math.min(255, Math.max(0, 69 + noise * 0.5));
      const b = Math.min(255, Math.max(0, 19 + noise * 0.3));
      ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  for (let i = 0; i < 15; i++) {
    const y = Math.random() * 512;
    const amplitude = 5 + Math.random() * 15;
    const frequency = 0.01 + Math.random() * 0.02;
    ctx.strokeStyle = `rgba(60, 30, 10, ${0.3 + Math.random() * 0.4})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    for (let x = 0; x < 512; x++) {
      const offset = Math.sin(x * frequency) * amplitude;
      if (x === 0) {
        ctx.moveTo(x, y + offset);
      } else {
        ctx.lineTo(x, y + offset);
      }
    }
    ctx.stroke();
  }

  return canvas;
}

function generateStoneTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseColor = '#808080';
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  const imageData = ctx.createImageData(512, 512);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const x = (i / 4) % 512;
    const y = Math.floor((i / 4) / 512);
    const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + 0.5) * 255 * 0.3 +
                  Math.random() * 255 * 0.4;
    const val = 100 + noise * 0.5;
    imageData.data[i] = val;
    imageData.data[i + 1] = val + Math.random() * 10;
    imageData.data[i + 2] = val + Math.random() * 15;
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 10 + Math.random() * 40;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const alpha = 0.05 + Math.random() * 0.15;
    gradient.addColorStop(0, `rgba(50, 50, 50, ${alpha})`);
    gradient.addColorStop(1, 'rgba(50, 50, 50, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const length = 20 + Math.random() * 60;
    const angle = Math.random() * Math.PI * 2;
    ctx.strokeStyle = `rgba(60, 60, 60, ${0.1 + Math.random() * 0.2})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }

  return canvas;
}

function generateMetalTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseColor = '#A0A0A0';
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y++) {
    const baseNoise = Math.sin(y * 0.3) * 15 + Math.random() * 10;
    for (let x = 0; x < 512; x++) {
      const fineNoise = Math.sin(x * 0.5 + y * 0.01) * 5;
      const val = 160 + baseNoise + fineNoise;
      ctx.fillStyle = `rgb(${Math.floor(val)},${Math.floor(val + 2)},${Math.floor(val + 5)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  for (let i = 0; i < 100; i++) {
    const y = Math.random() * 512;
    const x = Math.random() * 512;
    const length = 50 + Math.random() * 200;
    const alpha = 0.05 + Math.random() * 0.1;
    const gradient = ctx.createLinearGradient(x, y, x + length, y);
    gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
    gradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, length, 1 + Math.random() * 2);
  }

  return canvas;
}

function generateFabricTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3a5f7a';
  ctx.fillRect(0, 0, 512, 512);

  const threadSize = 4;
  for (let y = 0; y < 512; y += threadSize) {
    for (let x = 0; x < 512; x += threadSize) {
      const isWarp = (Math.floor(x / threadSize) + Math.floor(y / threadSize)) % 2 === 0;
      const noise = Math.random() * 20;
      if (isWarp) {
        ctx.fillStyle = `rgb(${58 + noise}, ${95 + noise}, ${122 + noise})`;
      } else {
        ctx.fillStyle = `rgb(${48 + noise}, ${85 + noise}, ${112 + noise})`;
      }
      ctx.fillRect(x, y, threadSize, threadSize);
    }
  }

  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 512; i += 2) {
    ctx.strokeStyle = '#2a4f6a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  return canvas;
}

function generateCamoTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const colors = ['#3d4a2a', '#5a6b3a', '#4a5a30', '#2a3a1a', '#6b7a4a'];

  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, 512, 512);

  for (let layer = 0; layer < 5; layer++) {
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = 30 + Math.random() * 80;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.7, color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;

      ctx.beginPath();
      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        const r = radius * (0.7 + Math.random() * 0.6);
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (angle === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  return canvas;
}

const textureGenerators: Record<TextureType, () => HTMLCanvasElement> = {
  wood: generateWoodTexture,
  stone: generateStoneTexture,
  metal: generateMetalTexture,
  fabric: generateFabricTexture,
  camo: generateCamoTexture,
};

export function getTexture(type: TextureType): THREE.CanvasTexture {
  if (textureCache.has(type)) {
    return textureCache.get(type)!;
  }

  const canvas = textureGenerators[type]();
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  textureCache.set(type, texture);
  return texture;
}

export function preloadTextures(): void {
  const types: TextureType[] = ['wood', 'stone', 'metal', 'fabric', 'camo'];
  types.forEach((type) => {
    getTexture(type);
  });
}
