export type ObjectId = string | null;

export type LightType = 'main' | 'fill' | 'spot';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface LightConfig {
  id: string;
  type: LightType;
  name: string;
  position: Position3D;
  colorTemp: number;
  intensity: number;
  angle?: number;
  penumbra?: number;
  enabled: boolean;
}

export interface MaterialConfig {
  id: string;
  name: string;
  color: string;
  roughness: number;
  metalness: number;
  bumpScale: number;
}

export interface DesignScheme {
  id: string;
  name: string;
  thumbnail: string;
  lights: LightConfig[];
  materials: Record<string, MaterialConfig>;
  createdAt: number;
}

export interface AppState {
  selectedObjectId: ObjectId;
  activeSchemeId: string | null;
  schemes: DesignScheme[];
  lights: LightConfig[];
  materials: Record<string, MaterialConfig>;
  isMaterialPanelOpen: boolean;
}

export interface AppActions {
  setSelectedObjectId: (id: ObjectId) => void;
  setActiveSchemeId: (id: string | null) => void;
  setSchemes: (schemes: DesignScheme[]) => void;
  setLights: (lights: LightConfig[]) => void;
  updateLight: (id: string, config: Partial<LightConfig>) => void;
  setMaterials: (materials: Record<string, MaterialConfig>) => void;
  updateMaterial: (key: string, config: Partial<MaterialConfig>) => void;
  setIsMaterialPanelOpen: (open: boolean) => void;
  transitionToScheme: (schemeId: string) => Promise<void>;
}

export type AppStore = AppState & AppActions;
