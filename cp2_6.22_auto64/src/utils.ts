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
        roughness: 0.9,
        metalness: 0.0,
        clearcoat: 0,
      };
    case 'glossy':
      return {
        ...base,
        roughness: 0.1,
        metalness: 0.3,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      };
    case 'suede':
      return {
        ...base,
        roughness: 1.0,
        metalness: 0.0,
        clearcoat: 0,
        sheen: 1.0,
        sheenRoughness: 0.8,
        sheenColor: new THREE.Color(0x888888),
      };
    case 'mesh':
      return {
        ...base,
        roughness: 0.7,
        metalness: 0.1,
        clearcoat: 0.2,
        transmission: 0.1,
      };
  }
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
