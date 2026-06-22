import * as THREE from 'three';

export type MaterialType = 'matte' | 'glossy' | 'suede' | 'mesh';

export interface ShoeConfig {
  upperColor: string;
  soleColor: string;
  laceColor: string;
  logoColor: string;
  upperMaterial: MaterialType;
  soleMaterial: MaterialType;
  laceMaterial: MaterialType;
  logoMaterial: MaterialType;
  decalImage: string | null;
  shoeModel: number;
}

export interface ShoeModel {
  id: number;
  name: string;
  description: string;
  buildGeometry: () => THREE.Group;
  defaultConfig: Partial<ShoeConfig>;
}

export type PartName = 'upper' | 'sole' | 'lace' | 'logo';

export const DEFAULT_CONFIG: ShoeConfig = {
  upperColor: '#e8e8e8',
  soleColor: '#2d2d2d',
  laceColor: '#ffffff',
  logoColor: '#00d4ff',
  upperMaterial: 'matte',
  soleMaterial: 'matte',
  laceMaterial: 'matte',
  logoMaterial: 'glossy',
  decalImage: null,
  shoeModel: 0,
};

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  matte: '哑光',
  glossy: '亮光',
  suede: '绒面',
  mesh: '网眼',
};

export const PART_LABELS: Record<PartName, string> = {
  upper: '鞋面',
  sole: '鞋底',
  lace: '鞋带',
  logo: 'Logo',
};
