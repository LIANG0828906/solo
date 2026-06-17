export interface MaterialConfig {
  id: string;
  name: string;
  color: string;
  roughness: number;
  metalness: number;
  transparent?: boolean;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
}

export const MATERIALS: MaterialConfig[] = [
  {
    id: 'stone',
    name: '石头',
    color: '#808080',
    roughness: 0.8,
    metalness: 0.1,
  },
  {
    id: 'grass',
    name: '草地',
    color: '#4CAF50',
    roughness: 0.9,
    metalness: 0.0,
  },
  {
    id: 'wood',
    name: '木头',
    color: '#8D6E63',
    roughness: 0.7,
    metalness: 0.0,
  },
  {
    id: 'metal',
    name: '金属',
    color: '#9E9E9E',
    roughness: 0.3,
    metalness: 0.9,
  },
  {
    id: 'crystal',
    name: '水晶',
    color: '#00E5FF',
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.5,
    emissive: '#00E5FF',
    emissiveIntensity: 0.2,
  },
  {
    id: 'lava',
    name: '熔岩',
    color: '#FF5722',
    roughness: 0.6,
    metalness: 0.1,
    emissive: '#FF5722',
    emissiveIntensity: 0.3,
  },
];

export function getMaterialById(id: string): MaterialConfig {
  return MATERIALS.find((m) => m.id === id) || MATERIALS[0];
}

export function getDefaultMaterial(): MaterialConfig {
  return MATERIALS[0];
}
