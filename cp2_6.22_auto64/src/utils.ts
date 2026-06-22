import * as THREE from 'three';
import { MaterialType } from './types';

export function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

export function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return new THREE.Color().lerpColors(a, b, t);
}

export function getMaterialPreset(type: MaterialType): THREE.MeshPhysicalMaterialParameters {
  const base: THREE.MeshPhysicalMaterialParameters = {
    color: 0xffffff,
  };

  switch (type) {
    case 'matte':
      return {
        ...base,
        roughness: 0.95,
        metalness: 0.0,
        clearcoat: 0,
      };
    case 'glossy':
      return {
        ...base,
        roughness: 0.05,
        metalness: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        reflectivity: 0.8,
      };
    case 'suede':
      return {
        ...base,
        roughness: 1.0,
        metalness: 0.0,
        clearcoat: 0,
        sheen: 1.0,
        sheenRoughness: 0.9,
        sheenColor: new THREE.Color(0xaaaaaa),
      };
    case 'mesh':
      return {
        ...base,
        roughness: 0.65,
        metalness: 0.05,
        clearcoat: 0.1,
        transmission: 0.05,
      };
  }
}

export function generateSuedeBumpMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    const noise = Math.random();
    const base = 128 + (noise - 0.5) * 120;
    data[idx] = base;
    data[idx + 1] = base;
    data[idx + 2] = base;
    data[idx + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 2 + 0.5;
    const alpha = Math.random() * 0.4 + 0.2;
    const gray = Math.random() * 120 + 90;
    ctx.fillStyle = `rgba(${gray},${gray},${gray},${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = Math.random() * 10 + 3;
    const angle = Math.random() * Math.PI * 2;
    ctx.strokeStyle = `rgba(60,60,60,${Math.random() * 0.3 + 0.15})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

export function generateMeshAlphaMap(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  const holeRadius = 2.8;
  const spacing = 8;
  ctx.fillStyle = '#000000';
  for (let y = 0; y < size; y += spacing) {
    for (let x = 0; x < size; x += spacing) {
      const offset = (y / spacing) % 2 === 0 ? 0 : spacing / 2;
      ctx.beginPath();
      ctx.arc(x + offset, y, holeRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.needsUpdate = true;
  return texture;
}

export function createDecalTexture(image: HTMLImageElement): THREE.Texture {
  const texture = new THREE.Texture(image);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
