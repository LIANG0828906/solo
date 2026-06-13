export type PresetType = 'crystal' | 'lava' | 'ocean';

export interface AudioBands {
  bands: Float32Array;
}

export interface SculptParams {
  maxDisplacement: number;
  rotationSpeed: number;
  trailLength: number;
  preset: PresetType;
}

export const DEFAULT_PARAMS: SculptParams = {
  maxDisplacement: 2.0,
  rotationSpeed: 0.5,
  trailLength: 30,
  preset: 'crystal',
};

export interface PresetConfig {
  baseHue: number;
  hueRange: number;
  saturation: number;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;
  bloomIntensity: number;
  bloomRadius: number;
  bloomThreshold: number;
  dofFocus: number;
  dofAperture: number;
  lightColor: number;
  ambientIntensity: number;
}

export const PRESET_CONFIGS: Record<PresetType, PresetConfig> = {
  crystal: {
    baseHue: 0.55,
    hueRange: 0.35,
    saturation: 1.0,
    metalness: 0.9,
    roughness: 0.1,
    opacity: 1.0,
    transparent: false,
    bloomIntensity: 0.8,
    bloomRadius: 0.3,
    bloomThreshold: 0.6,
    dofFocus: 4.0,
    dofAperture: 0.005,
    lightColor: 0x00ffff,
    ambientIntensity: 0.3,
  },
  lava: {
    baseHue: 0.05,
    hueRange: 0.12,
    saturation: 0.95,
    metalness: 0.3,
    roughness: 0.8,
    opacity: 1.0,
    transparent: false,
    bloomIntensity: 1.5,
    bloomRadius: 0.8,
    bloomThreshold: 0.4,
    dofFocus: 3.8,
    dofAperture: 0.02,
    lightColor: 0xff6600,
    ambientIntensity: 0.5,
  },
  ocean: {
    baseHue: 0.58,
    hueRange: 0.1,
    saturation: 0.7,
    metalness: 0.5,
    roughness: 0.3,
    opacity: 0.8,
    transparent: true,
    bloomIntensity: 0.5,
    bloomRadius: 0.6,
    bloomThreshold: 0.7,
    dofFocus: 4.5,
    dofAperture: 0.01,
    lightColor: 0x4488ff,
    ambientIntensity: 0.4,
  },
};
