export interface Material {
  name: string;
  nameCn: string;
  refractiveIndex: number;
}

export interface SpectrumColor {
  color: string;
  wavelength: number;
  name: string;
  dispersionFactor: number;
}

export const MATERIALS: Record<string, Material> = {
  glass: { name: 'glass', nameCn: '玻璃', refractiveIndex: 1.52 },
  water: { name: 'water', nameCn: '水', refractiveIndex: 1.33 },
  ice: { name: 'ice', nameCn: '冰', refractiveIndex: 1.31 },
  diamond: { name: 'diamond', nameCn: '钻石', refractiveIndex: 2.42 },
};

export const SPECTRUM_COLORS: SpectrumColor[] = [
  { color: '#FF0000', wavelength: 700, name: '红', dispersionFactor: 0.95 },
  { color: '#FF7F00', wavelength: 620, name: '橙', dispersionFactor: 0.97 },
  { color: '#FFFF00', wavelength: 580, name: '黄', dispersionFactor: 0.99 },
  { color: '#00FF00', wavelength: 530, name: '绿', dispersionFactor: 1.01 },
  { color: '#0000FF', wavelength: 470, name: '蓝', dispersionFactor: 1.03 },
  { color: '#4B0082', wavelength: 440, name: '靛', dispersionFactor: 1.05 },
  { color: '#8B00FF', wavelength: 400, name: '紫', dispersionFactor: 1.07 },
];

export const DEFAULT_CAMERA = {
  position: [6, 4, 8] as [number, number, number],
  fov: 50,
  near: 0.1,
  far: 1000,
};

export const LIGHT_BEAM = {
  diameter: 0.2,
  segmentDiameter: 0.05,
};

export const PRISM_DEFAULTS = {
  prismSize: 2,
  sphereRadius: 1.2,
};
