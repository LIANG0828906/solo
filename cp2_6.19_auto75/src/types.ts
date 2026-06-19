import * as THREE from 'three';

export type ColorMode = 'warm' | 'cool' | 'rainbow';

export interface ParticleData {
  position: THREE.Vector3;
  originalPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  alpha: number;
  trail: THREE.Vector3[];
  angle: number;
  radius: number;
  height: number;
}

export interface PresetConfig {
  name: string;
  label: string;
  generatePosition: (index: number, total: number) => THREE.Vector3;
}

export interface UICallbacks {
  onParticleCountChange: (count: number) => void;
  onVortexSpeedChange: (speed: number) => void;
  onSpringStrengthChange: (strength: number) => void;
  onColorModeChange: (mode: ColorMode) => void;
  onPresetChange: (preset: string) => void;
}

export interface SliderConfig {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (value: number) => string;
}

export interface TooltipData {
  id: number;
  particleIndex: number;
  element: HTMLElement;
  createdAt: number;
}

export const PRESETS: Record<string, PresetConfig> = {
  nebula: {
    name: 'nebula',
    label: '星云',
    generatePosition: (index: number, total: number) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 5 + Math.random() * 3 + (Math.random() - 0.5);
      return new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
    }
  },
  vortex: {
    name: 'vortex',
    label: '漩涡',
    generatePosition: (index: number, total: number) => {
      const t = index / total;
      const angle = t * Math.PI * 8;
      const radius = t * 8;
      const height = Math.sin(t * Math.PI * 4) * 2;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
    }
  },
  explosion: {
    name: 'explosion',
    label: '爆炸',
    generatePosition: (index: number, total: number) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 8;
      return new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
    }
  },
  galaxy: {
    name: 'galaxy',
    label: '星系',
    generatePosition: (index: number, total: number) => {
      const t = index / total;
      const arm = Math.floor(Math.random() * 4);
      const armOffset = (arm * Math.PI * 2) / 4;
      const angle = t * Math.PI * 6 + armOffset;
      const radius = t * 8 + Math.sin(t * Math.PI * 8) * 0.5;
      const height = (Math.random() - 0.5) * 0.5;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
    }
  }
};
