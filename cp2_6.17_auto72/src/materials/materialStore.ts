export type MaterialType = 'stone' | 'grass' | 'wood' | 'metal' | 'crystal' | 'lava';

export interface MaterialConfig {
  name: string;
  type: MaterialType;
  color: string;
  opacity: number;
  emissive: string;
  emissiveIntensity: number;
  roughness: number;
}

export const MATERIALS: MaterialConfig[] = [
  {
    name: '石头',
    type: 'stone',
    color: '#808080',
    opacity: 1,
    emissive: '#000000',
    emissiveIntensity: 0,
    roughness: 0.9,
  },
  {
    name: '草地',
    type: 'grass',
    color: '#4CAF50',
    opacity: 1,
    emissive: '#000000',
    emissiveIntensity: 0,
    roughness: 0.8,
  },
  {
    name: '木头',
    type: 'wood',
    color: '#8D6E63',
    opacity: 1,
    emissive: '#000000',
    emissiveIntensity: 0,
    roughness: 0.85,
  },
  {
    name: '金属',
    type: 'metal',
    color: '#9E9E9E',
    opacity: 1,
    emissive: '#000000',
    emissiveIntensity: 0,
    roughness: 0.3,
  },
  {
    name: '发光水晶',
    type: 'crystal',
    color: '#00E5FF',
    opacity: 0.5,
    emissive: '#00E5FF',
    emissiveIntensity: 0.8,
    roughness: 0.1,
  },
  {
    name: '熔岩',
    type: 'lava',
    color: '#FF5722',
    opacity: 1,
    emissive: '#FF5722',
    emissiveIntensity: 0.3,
    roughness: 0.7,
  },
];

export function getMaterialConfig(type: MaterialType): MaterialConfig {
  return MATERIALS.find((m) => m.type === type) ?? MATERIALS[0];
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 1, g: 1, b: 1 };
}
