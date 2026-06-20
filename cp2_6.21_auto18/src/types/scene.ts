export type ExhibitType =
  | 'pedestal_sculpture'
  | 'hanging_painting'
  | 'glass_relic'
  | 'glowing_sphere'
  | 'particle_column'
  | 'mirror_plane';

export interface Transform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
}

export interface Exhibit {
  id: string;
  type: ExhibitType;
  transform: Transform;
  color: string;
  name: string;
}

export interface PointLightData {
  id: string;
  position: { x: number; y: number; z: number };
  color: string;
  intensity: number;
}

export interface LightingConfig {
  ambientIntensity: number;
  ambientColor: string;
  ambientEnabled: boolean;
  pointLights: PointLightData[];
  pointLightsEnabled: Record<string, boolean>;
}

export type CameraPathType = 'orbit' | 'linear' | 'snake' | 'none';

export type TransformMode = 'translate' | 'rotate';

export interface SceneState {
  exhibits: Exhibit[];
  selectedId: string | null;
  transformMode: TransformMode;
  lighting: LightingConfig;
  cameraPath: CameraPathType;
  isAnimating: boolean;
}

export interface SceneActions {
  addExhibit: (type: ExhibitType) => void;
  removeExhibit: (id: string) => void;
  selectExhibit: (id: string | null) => void;
  updateTransform: (id: string, transform: Partial<Transform>) => void;
  setTransformMode: (mode: TransformMode) => void;
  updatePointLight: (id: string, data: Partial<PointLightData>) => void;
  setAmbientIntensity: (intensity: number) => void;
  setCameraPath: (path: CameraPathType) => void;
  toggleAnimation: () => void;
  toggleLight: (lightId: string | 'ambient') => void;
  setPointLightIntensity: (id: string, intensity: number) => void;
  exportScene: () => string;
  importScene: (json: string) => void;
}

export type SceneStore = SceneState & SceneActions;

export const EXHIBIT_TYPE_NAMES: Record<ExhibitType, string> = {
  pedestal_sculpture: '底座雕塑',
  hanging_painting: '悬挂画作',
  glass_relic: '玻璃柜文物',
  glowing_sphere: '发光球体',
  particle_column: '动态粒子柱',
  mirror_plane: '镜像平面',
};

export const CAMERA_PATH_NAMES: Record<CameraPathType, string> = {
  none: '自由视角',
  orbit: '环绕旋转',
  linear: '直线推进',
  snake: '蛇形巡视',
};
