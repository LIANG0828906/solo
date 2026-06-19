export type MaterialType = 'glass' | 'metal' | 'stone';

export const MATERIAL_COLORS: Record<MaterialType, string> = {
  glass: '#87CEEB',
  metal: '#B0C4DE',
  stone: '#A0522D',
};

export const MATERIAL_NAMES: Record<MaterialType, string> = {
  glass: '玻璃',
  metal: '金属',
  stone: '石材',
};

export interface Building {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  material: MaterialType;
}

export interface BuildingUpdate {
  height?: number;
  material?: MaterialType;
}

const DEFAULT_WIDTH = 1.2;
const DEFAULT_DEPTH = 1.2;
const DEFAULT_HEIGHT = 2.0;

let idCounter = 0;
const generateId = (): string => {
  idCounter += 1;
  return `building-${Date.now()}-${idCounter}`;
};

export const createBuilding = (
  x: number,
  z: number,
  material: MaterialType = 'glass',
  height: number = DEFAULT_HEIGHT,
): Building => ({
  id: generateId(),
  x,
  z,
  width: DEFAULT_WIDTH,
  depth: DEFAULT_DEPTH,
  height,
  material,
});

export const addBuilding = (
  buildings: Building[],
  building: Building,
): Building[] => [...buildings, building];

export const removeBuilding = (
  buildings: Building[],
  id: string,
): Building[] => buildings.filter((b) => b.id !== id);

export const updateBuilding = (
  buildings: Building[],
  id: string,
  update: BuildingUpdate,
): Building[] =>
  buildings.map((b) =>
    b.id === id
      ? {
          ...b,
          ...(update.height !== undefined ? { height: Math.max(0.5, Math.min(5.0, update.height)) } : {}),
          ...(update.material !== undefined ? { material: update.material } : {}),
        }
      : b,
  );

export const snapToGrid = (value: number, gridSize: number = 0.5): number =>
  Math.round(value / gridSize) * gridSize;
