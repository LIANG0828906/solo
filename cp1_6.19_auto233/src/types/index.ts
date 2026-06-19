export interface Building {
  id: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  rotation: number;
  blockId: string;
}

export interface FacadeData {
  buildingId: string;
  facadeIndex: number;
  sunlightHours: number;
  hourlyIntensity: number[];
  color: string;
}

export interface ShadowPolygon {
  buildingId: string;
  points: { x: number; z: number }[];
}

export interface BlockStats {
  blockId: string;
  blockName: string;
  avgSunlightHours: number;
  shadowCoverage: number;
  totalArea: number;
}

export interface SunPosition {
  altitude: number;
  azimuth: number;
}

export interface AppState {
  buildings: Building[];
  selectedBuildingId: string | null;
  selectedFacadeId: string | null;
  date: Date;
  time: number;
  latitude: number;
  longitude: number;
  sunPosition: SunPosition;
  facadeData: FacadeData[];
  shadowPolygons: ShadowPolygon[];
  blockStats: BlockStats[];
  isPlacingMode: boolean;
  activePreset: string | null;
}

export interface AppActions {
  addBuilding: (building: Omit<Building, 'id'>) => void;
  removeBuilding: (id: string) => void;
  updateBuildingHeight: (id: string, height: number) => void;
  selectBuilding: (id: string | null) => void;
  selectFacade: (buildingId: string | null, facadeIndex: number | null) => void;
  setDate: (date: Date) => void;
  setTime: (time: number) => void;
  setLatitude: (lat: number) => void;
  setLongitude: (lng: number) => void;
  setPlacingMode: (active: boolean) => void;
  setActivePreset: (presetId: string | null) => void;
  loadPreset: (presetId: string) => void;
  recalculateShadows: () => void;
}

export type Store = AppState & AppActions;

export const FACADE_NAMES = ['东立面', '南立面', '西立面', '北立面'];

export const PRESET_BLOCKS = [
  {
    id: 'block-a',
    name: 'A区 - 高密度街区',
    buildings: [
      { position: { x: -12, y: 0, z: -8 }, size: { width: 4, height: 6, depth: 4 }, rotation: 0, blockId: 'block-a' },
      { position: { x: -6, y: 0, z: -8 }, size: { width: 4, height: 8, depth: 4 }, rotation: 0, blockId: 'block-a' },
      { position: { x: 0, y: 0, z: -8 }, size: { width: 4, height: 5, depth: 4 }, rotation: 0, blockId: 'block-a' },
      { position: { x: -12, y: 0, z: -2 }, size: { width: 4, height: 7, depth: 4 }, rotation: 0, blockId: 'block-a' },
      { position: { x: -6, y: 0, z: -2 }, size: { width: 4, height: 4, depth: 4 }, rotation: 0, blockId: 'block-a' },
      { position: { x: 0, y: 0, z: -2 }, size: { width: 4, height: 9, depth: 4 }, rotation: 0, blockId: 'block-a' },
    ],
  },
  {
    id: 'block-b',
    name: 'B区 - 中密度街区',
    buildings: [
      { position: { x: 6, y: 0, z: -8 }, size: { width: 5, height: 4, depth: 5 }, rotation: 0, blockId: 'block-b' },
      { position: { x: 14, y: 0, z: -8 }, size: { width: 5, height: 5, depth: 5 }, rotation: 0, blockId: 'block-b' },
      { position: { x: 6, y: 0, z: 0 }, size: { width: 5, height: 6, depth: 5 }, rotation: 0, blockId: 'block-b' },
      { position: { x: 14, y: 0, z: 0 }, size: { width: 5, height: 3, depth: 5 }, rotation: 0, blockId: 'block-b' },
    ],
  },
  {
    id: 'block-c',
    name: 'C区 - 公园绿地',
    buildings: [
      { position: { x: -8, y: 0, z: 8 }, size: { width: 6, height: 3, depth: 6 }, rotation: 0, blockId: 'block-c' },
      { position: { x: 4, y: 0, z: 8 }, size: { width: 4, height: 2, depth: 4 }, rotation: 0, blockId: 'block-c' },
      { position: { x: 12, y: 0, z: 8 }, size: { width: 5, height: 4, depth: 5 }, rotation: 0, blockId: 'block-c' },
    ],
  },
];

export const BLOCK_INFO: Record<string, { name: string; area: number }> = {
  'block-a': { name: 'A区', area: 144 },
  'block-b': { name: 'B区', area: 100 },
  'block-c': { name: 'C区', area: 120 },
};
