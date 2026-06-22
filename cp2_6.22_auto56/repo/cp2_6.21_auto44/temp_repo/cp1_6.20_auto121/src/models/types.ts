export type GeometryType = 'box' | 'cylinder' | 'sphere' | 'cone';

export interface FurnitureGeometry {
  type: 'box' | 'cylinder' | 'sphere' | 'cone';
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
  roughness?: number;
  metalness?: number;
}

export type FurnitureCategory = 'sofa' | 'table' | 'bookshelf' | 'lamp' | 'plant';

export interface FurnitureDefinition {
  id: string;
  name: string;
  category: FurnitureCategory;
  icon: string;
  defaultSize: [number, number, number];
  geometries: FurnitureGeometry[];
  defaultMaterial: {
    color: string;
    roughness: number;
    clearcoat: number;
  };
}

export interface FurnitureInstance {
  instanceId: string;
  definitionId: string;
  position: [number, number, number];
  rotationY: number;
  scale: number;
  themeColorIndex: number;
}

export type DayNightMode = 'day' | 'night';

export interface AppState {
  furnitureInstances: FurnitureInstance[];
  lightIntensity: number;
  wallColor: string;
  mode: DayNightMode;
  isDraggingNew: string | null;
  selectedInstanceId: string | null;
  previewPosition: [number, number, number] | null;

  addFurniture: (defId: string, pos: [number, number, number]) => void;
  removeFurniture: (instanceId: string) => void;
  updateFurniture: (instanceId: string, patch: Partial<FurnitureInstance>) => void;
  setLightIntensity: (v: number) => void;
  setWallColor: (c: string) => void;
  toggleDayNight: () => void;
  setDraggingNew: (id: string | null) => void;
  selectInstance: (id: string | null) => void;
  setPreviewPosition: (pos: [number, number, number] | null) => void;
}
