import {
  Mesh,
  SphereGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Color,
  CanvasTexture,
  AdditiveBlending,
  BackSide,
  InstancedMesh,
} from 'three';
import { SPECTRAL_COLORS, SCALE_FACTOR, SpectralType } from '../types/star';

const textureCache = new Map<string, CanvasTexture>();
const materialCache = new Map<string, MeshStandardMaterial>();

function createSurfaceTexture(spectralType: Exclude<SpectralType, 'ALL'>): CanvasTexture {
  const cached = textureCache.get(spectralType);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const baseColor = new Color(SPECTRAL_COLORS[spectralType]);

  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;

      let noise = 0;
      noise += Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.3;
      noise += Math.sin(x * 0.1 + 1) * Math.cos(y * 0.08 + 2) * 0.2;
      noise += Math.sin(x * 0.2 + 3) * Math.cos(y * 0.15 + 1) * 0.15;
      noise += Math.sin(x * 0.4 + 5) * Math.cos(y * 0.3 + 4) * 0.1;
      noise += Math.random() * 0.1 - 0.05;

      noise = (noise + 0.75) / 1.5;
      noise = Math.max(0.3, Math.min(1.2, noise));

      const r = Math.floor(baseColor.r * 255 * noise);
      const g = Math.floor(baseColor.g * 255 * noise);
      const b = Math.floor(baseColor.b * 255 * noise);

      data[idx] = Math.min(255, r);
      data[idx + 1] = Math.min(255, g);
      data[idx + 2] = Math.min(255, b);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = 1000;
  texture.needsUpdate = true;

  textureCache.set(spectralType, texture);
  return texture;
}

export function createStarMesh(
  spectralType: Exclude<SpectralType, 'ALL'>,
  radius: number,
  isSelected: boolean = false
): Mesh {
  const color = SPECTRAL_COLORS[spectralType];
  const scaledRadius = radius * SCALE_FACTOR;
  const texture = createSurfaceTexture(spectralType);

  const emissiveIntensity = isSelected ? 0.8 : 0.3;

  const material = new MeshStandardMaterial({
    map: texture,
    emissive: new Color(color),
    emissiveIntensity,
    emissiveMap: texture,
    roughness: 0.8,
    metalness: 0.1,
  });

  const geometry = new SphereGeometry(scaledRadius, 32, 32);
  const mesh = new Mesh(geometry, material);

  if (isSelected) {
    const glowGeometry = new SphereGeometry(scaledRadius * 1.5, 32, 32);
    const glowMaterial = new MeshBasicMaterial({
      color: new Color(color),
      transparent: true,
      opacity: 0.3,
      blending: AdditiveBlending,
      side: BackSide,
    });
    const glowMesh = new Mesh(glowGeometry, glowMaterial);
    glowMesh.name = 'glow';
    mesh.add(glowMesh);
  }

  return mesh;
}

export function createInstancedStarsMaterial(
  spectralType: Exclude<SpectralType, 'ALL'>
): MeshStandardMaterial {
  const cacheKey = `instanced-${spectralType}`;
  const cached = materialCache.get(cacheKey);
  if (cached) return cached.clone();

  const color = SPECTRAL_COLORS[spectralType];
  const texture = createSurfaceTexture(spectralType);

  const material = new MeshStandardMaterial({
    map: texture,
    emissive: new Color(color),
    emissiveIntensity: 0.3,
    emissiveMap: texture,
    roughness: 0.8,
    metalness: 0.1,
  });

  materialCache.set(cacheKey, material);
  return material.clone();
}

export function disposeMesh(mesh: Mesh | InstancedMesh): void {
  if (!mesh) return;

  mesh.traverse((child) => {
    if (child instanceof Mesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  });

  if (mesh.geometry) {
    mesh.geometry.dispose();
  }
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((mat) => mat.dispose());
    } else {
      mesh.material.dispose();
    }
  }
}

export function clearCache(): void {
  textureCache.forEach((texture) => texture.dispose());
  textureCache.clear();
  materialCache.forEach((material) => material.dispose());
  materialCache.clear();
}

export { createSurfaceTexture };
