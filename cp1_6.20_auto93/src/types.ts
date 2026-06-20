export interface ModelData {
  id: string;
  name: string;
  thumbnail: string;
  src: string;
  description?: string;
}

export interface MaterialConfig {
  color: string;
  opacity: number;
  metalness: number;
  roughness: number;
  emissiveIntensity: number;
  useEnvMap: boolean;
}

export type EnvironmentPreset = 'solid_gray' | 'outdoor_hdr' | 'indoor_warm' | 'starry_night';

export interface EnvironmentConfig {
  preset: EnvironmentPreset;
  backgroundColor: string;
  ambientIntensity: number;
  directionalIntensity: number;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
