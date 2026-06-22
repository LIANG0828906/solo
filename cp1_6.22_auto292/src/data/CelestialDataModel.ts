export type CelestialType = 'nebula' | 'galaxy' | 'starcluster';

export interface ObservationData {
  distance: number;
  apparentMagnitude: number;
  discoverer: string;
  age: string;
}

export interface CelestialObject {
  id: string;
  name: string;
  type: CelestialType;
  position: { x: number; y: number; z: number };
  size: number;
  color: string;
  observationData: ObservationData;
}

const celestialData: CelestialObject[] = [
  {
    id: 'orion-nebula',
    name: '猎户座星云',
    type: 'nebula',
    position: { x: 0, y: 0, z: 0 },
    size: 5,
    color: '#8A2BE2',
    observationData: {
      distance: 1344,
      apparentMagnitude: 4.0,
      discoverer: '尼古拉-克劳德·法布里·德·佩雷斯克',
      age: '~300万年',
    },
  },
  {
    id: 'eagle-nebula',
    name: '鹰状星云',
    type: 'nebula',
    position: { x: -15, y: 5, z: -10 },
    size: 4,
    color: '#9370DB',
    observationData: {
      distance: 7000,
      apparentMagnitude: 6.0,
      discoverer: '菲利普·洛伊斯·德·谢索',
      age: '~550万年',
    },
  },
  {
    id: 'crab-nebula',
    name: '蟹状星云',
    type: 'nebula',
    position: { x: 10, y: -3, z: 8 },
    size: 3,
    color: '#BA55D3',
    observationData: {
      distance: 6523,
      apparentMagnitude: 8.4,
      discoverer: '约翰·贝维斯',
      age: '~968年',
    },
  },
  {
    id: 'andromeda-galaxy',
    name: '仙女座星系',
    type: 'galaxy',
    position: { x: 20, y: 10, z: -20 },
    size: 6,
    color: '#FFD700',
    observationData: {
      distance: 2537000,
      apparentMagnitude: 3.4,
      discoverer: '阿卜杜勒-拉赫曼·苏菲',
      age: '~100亿年',
    },
  },
  {
    id: 'whirlpool-galaxy',
    name: '旋涡星系',
    type: 'galaxy',
    position: { x: -25, y: -5, z: 15 },
    size: 5,
    color: '#DAA520',
    observationData: {
      distance: 23000000,
      apparentMagnitude: 8.4,
      discoverer: '查尔斯·梅西耶',
      age: '~130亿年',
    },
  },
  {
    id: 'sombrero-galaxy',
    name: '草帽星系',
    type: 'galaxy',
    position: { x: 5, y: 15, z: -30 },
    size: 4,
    color: '#B8860B',
    observationData: {
      distance: 29300000,
      apparentMagnitude: 8.0,
      discoverer: '皮埃尔·梅尚',
      age: '~120亿年',
    },
  },
  {
    id: 'pleiades',
    name: '昴星团',
    type: 'starcluster',
    position: { x: 12, y: 8, z: 5 },
    size: 3,
    color: '#A9A9A9',
    observationData: {
      distance: 444,
      apparentMagnitude: 1.6,
      discoverer: '古代已知',
      age: '~1亿年',
    },
  },
  {
    id: 'omega-centauri',
    name: '半人马座ω',
    type: 'starcluster',
    position: { x: -8, y: -10, z: -15 },
    size: 4,
    color: '#C0C0C0',
    observationData: {
      distance: 15800,
      apparentMagnitude: 3.9,
      discoverer: '托勒密',
      age: '~118亿年',
    },
  },
  {
    id: 'm13-cluster',
    name: 'M13球状星团',
    type: 'starcluster',
    position: { x: 30, y: 0, z: 10 },
    size: 3,
    color: '#D3D3D3',
    observationData: {
      distance: 22600,
      apparentMagnitude: 5.8,
      discoverer: '埃德蒙·哈雷',
      age: '~114亿年',
    },
  },
  {
    id: 'hyades',
    name: '毕星团',
    type: 'starcluster',
    position: { x: -20, y: 3, z: 20 },
    size: 2,
    color: '#FFFFFF',
    observationData: {
      distance: 153,
      apparentMagnitude: 0.5,
      discoverer: '古代已知',
      age: '~6.25亿年',
    },
  },
];

export function getCelestialData(): CelestialObject[] {
  return celestialData;
}

export function getCelestialById(id: string): CelestialObject | undefined {
  return celestialData.find((obj) => obj.id === id);
}

export function getCelestialByType(type: CelestialType): CelestialObject[] {
  return celestialData.filter((obj) => obj.type === type);
}

export function getTypeLabel(type: CelestialType): string {
  switch (type) {
    case 'nebula':
      return '星云';
    case 'galaxy':
      return '星系';
    case 'starcluster':
      return '星团';
  }
}

export function getTypeColor(type: CelestialType): string {
  switch (type) {
    case 'nebula':
      return '#8A2BE2';
    case 'galaxy':
      return '#FFD700';
    case 'starcluster':
      return '#00CED1';
  }
}
