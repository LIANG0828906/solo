export type GeometryType = 'icosahedron' | 'torus' | 'octahedron';
export type FrequencyBand = 'bass' | 'mid' | 'treble';
export type MaterialMode = 'solid' | 'wireframe';
export type PresetType = 'gentle' | 'intense' | 'random';
export type AudioSourceType = 'file' | 'microphone' | null;

export interface RotationSpeed {
  x: number;
  y: number;
  z: number;
}

export interface GeometryConfig {
  id: string;
  type: GeometryType;
  enabled: boolean;
  baseSize: number;
  baseColor: string;
  materialMode: MaterialMode;
  rotationSpeed: RotationSpeed;
  orbitRadius: number;
  orbitSpeed: number;
  orbitEccentricity: number;
  orbitOffset: number;
  frequencyBand: FrequencyBand;
  responseSensitivity: number;
  responseSmoothness: number;
  zFloatAmplitude: number;
  scaleMultiplier: number;
  colorShiftIntensity: number;
}

export interface AudioFeatures {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  amplitude: number;
  bass: number;
  mid: number;
  treble: number;
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  beatDetected: boolean;
  bpm: number;
  audioSourceType: AudioSourceType;
}

export interface Preset {
  name: string;
  type: PresetType;
  geometries: Partial<GeometryConfig>[];
}

export interface AnimationState {
  currentPosition: { x: number; y: number; z: number };
  currentRotation: { x: number; y: number; z: number };
  currentScale: number;
  currentColor: string;
  orbitAngle: number;
}

export const GEOMETRY_NAMES: Record<GeometryType, string> = {
  icosahedron: '二十面体',
  torus: '圆环体',
  octahedron: '八面体',
};

export const FREQUENCY_BAND_NAMES: Record<FrequencyBand, string> = {
  bass: '低频',
  mid: '中频',
  treble: '高频',
};

export const MATERIAL_MODE_NAMES: Record<MaterialMode, string> = {
  solid: '实体',
  wireframe: '线框',
};

export const PRESET_NAMES: Record<PresetType, string> = {
  gentle: '柔和',
  intense: '激烈',
  random: '随机',
};
