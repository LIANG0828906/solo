export type GeometryType = 'box' | 'sphere' | 'cylinder' | 'torus' | 'cone';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface MaterialProps {
  color: string;
  roughness: number;
  metalness: number;
}

export interface GeometryItemData {
  id: string;
  type: GeometryType;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  material: MaterialProps;
  name: string;
}

export interface LightingConfig {
  ambientIntensity: number;
  pointLightPosition: Vec3;
  pointLightIntensity: number;
}

export type TransformMode = 'translate' | 'rotate' | 'scale';

export interface SceneState {
  geometries: GeometryItemData[];
  selectedId: string | null;
  lighting: LightingConfig;
  transformMode: TransformMode;
  addGeometry: (type: GeometryType) => void;
  removeGeometry: (id: string) => void;
  updateGeometry: (id: string, updates: Partial<GeometryItemData>) => void;
  selectGeometry: (id: string | null) => void;
  setLighting: (updates: Partial<LightingConfig>) => void;
  setTransformMode: (mode: TransformMode) => void;
  clearScene: () => void;
}
