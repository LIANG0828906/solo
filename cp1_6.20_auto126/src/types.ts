export type KeyMaterial = 'matte' | 'glossy' | 'satin';

export interface KeyLayout {
  id: string;
  row: number;
  col: number;
  width: number;
  label: string;
}

export interface KeyColor {
  color: string;
  material: KeyMaterial;
}

export interface ColorScheme {
  version: string;
  name: string;
  keys: Record<string, KeyColor>;
}

export interface PresetTheme {
  id: string;
  name: string;
  colors: string[];
  scheme: ColorScheme;
}

export interface MaterialConfig {
  roughness: number;
  metalness: number;
}

export const MATERIAL_MAP: Record<KeyMaterial, MaterialConfig> = {
  matte: { roughness: 0.85, metalness: 0.05 },
  glossy: { roughness: 0.18, metalness: 0.25 },
  satin: { roughness: 0.5, metalness: 0.12 },
};
