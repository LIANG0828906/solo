import { ExhibitType } from '../types/scene';

export const EXHIBIT_COLORS: Record<ExhibitType, string[]> = {
  pedestal_sculpture: ['#8b7355', '#a0522d', '#696969', '#708090', '#b8860b'],
  hanging_painting: ['#4a90d9', '#d94a6b', '#4ad98b', '#d9a04a', '#9b59b6'],
  glass_relic: ['#87ceeb', '#98fb98', '#dda0dd', '#f0e68c', '#e6e6fa'],
  glowing_sphere: ['#00ffff', '#ff00ff', '#ffff00', '#00ff88', '#ff6600'],
  particle_column: ['#00ffaa', '#ffaa00', '#00aaff', '#ff66aa', '#aaff00'],
  mirror_plane: ['#c0c0c0', '#e8e8e8', '#a0a0a0', '#d0d0d0', '#b0b0b0'],
};

export function getRandomColor(type: ExhibitType): string {
  const colors = EXHIBIT_COLORS[type];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function generateExhibitName(type: ExhibitType, index: number): string {
  const typeNames: Record<ExhibitType, string> = {
    pedestal_sculpture: '底座雕塑',
    hanging_painting: '悬挂画作',
    glass_relic: '玻璃柜文物',
    glowing_sphere: '发光球体',
    particle_column: '动态粒子柱',
    mirror_plane: '镜像平面',
  };
  return `${typeNames[type]} #${index}`;
}

export function getDefaultTransform() {
  return {
    position: { x: 0, y: 1, z: -2 },
    rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
    scale: 1,
  };
}

export const EXHIBIT_SIZE: Record<ExhibitType, { width: number; height: number; depth: number }> = {
  pedestal_sculpture: { width: 1.2, height: 2, depth: 1.2 },
  hanging_painting: { width: 2, height: 1.5, depth: 0.05 },
  glass_relic: { width: 1, height: 1.5, depth: 1 },
  glowing_sphere: { width: 1, height: 1, depth: 1 },
  particle_column: { width: 0.8, height: 3, depth: 0.8 },
  mirror_plane: { width: 3, height: 2, depth: 0.05 },
};
