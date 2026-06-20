import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type TileType = 'grass' | 'stone' | 'wall' | 'water';

export interface Tile {
  id: string;
  type: TileType;
  x: number;
  y: number;
  placedAt?: number;
}

export interface Material {
  id: string;
  type: TileType;
  name: string;
  category: string;
  color: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface CollisionPolygon {
  id: string;
  vertices: Point[];
  isClosed: boolean;
}

export interface LightSource {
  x: number;
  y: number;
  intensity: number;
  range: number;
}

export interface Character {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  isJumping: boolean;
  isWalking: boolean;
  walkFrame: number;
  facingRight: boolean;
}

export type AppMode = 'editor' | 'preview';
export type EditMode = 'tile' | 'collision';

export interface TileAnimation {
  id: string;
  startTime: number;
  scale: number;
}

export interface MapState {
  tiles: Tile[];
  materials: Material[];
  collisionPolygons: CollisionPolygon[];
  lightSource: LightSource;
  appMode: AppMode;
  editMode: EditMode;
  zoom: number;
  panX: number;
  panY: number;
  gridSize: number;
  selectedMaterial: Material | null;
  selectedPolygonId: string | null;
  selectedVertexIndex: number | null;
  character: Character;
  tileAnimations: TileAnimation[];
  isPanning: boolean;
  isDraggingLight: boolean;
  isDrawingPolygon: boolean;
  currentDrawingPolygon: Point[];
  showMaterialPanel: boolean;
  showCollisionPanel: boolean;
  hoveredTile: Tile | null;

  addTile: (type: TileType, x: number, y: number) => void;
  removeTile: (id: string) => void;
  setSelectedMaterial: (material: Material | null) => void;
  setAppMode: (mode: AppMode) => void;
  setEditMode: (mode: EditMode) => void;
  addCollisionPolygon: (polygon: CollisionPolygon) => void;
  updateCollisionPolygon: (id: string, vertices: Point[]) => void;
  removeCollisionPolygon: (id: string) => void;
  setLightSource: (light: Partial<LightSource>) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setCharacter: (char: Partial<Character>) => void;
  resetMap: () => void;
  addTileAnimation: (id: string) => void;
  removeTileAnimation: (id: string) => void;
  setIsPanning: (panning: boolean) => void;
  setIsDraggingLight: (dragging: boolean) => void;
  setIsDrawingPolygon: (drawing: boolean) => void;
  setCurrentDrawingPolygon: (points: Point[]) => void;
  addPolygonVertex: (point: Point) => void;
  finishDrawingPolygon: () => void;
  cancelDrawingPolygon: () => void;
  setSelectedPolygon: (id: string | null, vertexIndex?: number | null) => void;
  setShowMaterialPanel: (show: boolean) => void;
  setShowCollisionPanel: (show: boolean) => void;
  setHoveredTile: (tile: Tile | null) => void;
  resetCharacter: () => void;
}

const defaultMaterials: Material[] = [
  { id: 'mat-grass', type: 'grass', name: '草地', category: '地面', color: '#4ade80' },
  { id: 'mat-stone', type: 'stone', name: '石路', category: '地面', color: '#9ca3af' },
  { id: 'mat-wall', type: 'wall', name: '墙壁', category: '障碍', color: '#78716c' },
  { id: 'mat-water', type: 'water', name: '水域', category: '装饰', color: '#3b82f6' },
];

const defaultLightSource: LightSource = {
  x: 400,
  y: 200,
  intensity: 1.0,
  range: 300,
};

const defaultCharacter: Character = {
  x: 100,
  y: 300,
  velocityX: 0,
  velocityY: 0,
  isJumping: false,
  isWalking: false,
  walkFrame: 0,
  facingRight: true,
};

const defaultTiles: Tile[] = [
  { id: uuidv4(), type: 'grass', x: 0, y: 8 },
  { id: uuidv4(), type: 'grass', x: 1, y: 8 },
  { id: uuidv4(), type: 'grass', x: 2, y: 8 },
  { id: uuidv4(), type: 'grass', x: 3, y: 8 },
  { id: uuidv4(), type: 'grass', x: 4, y: 8 },
  { id: uuidv4(), type: 'grass', x: 5, y: 8 },
  { id: uuidv4(), type: 'grass', x: 6, y: 8 },
  { id: uuidv4(), type: 'grass', x: 7, y: 8 },
  { id: uuidv4(), type: 'grass', x: 8, y: 8 },
  { id: uuidv4(), type: 'grass', x: 9, y: 8 },
  { id: uuidv4(), type: 'grass', x: 10, y: 8 },
  { id: uuidv4(), type: 'stone', x: 3, y: 6 },
  { id: uuidv4(), type: 'stone', x: 4, y: 6 },
  { id: uuidv4(), type: 'stone', x: 5, y: 6 },
  { id: uuidv4(), type: 'wall', x: 12, y: 7 },
  { id: uuidv4(), type: 'wall', x: 12, y: 8 },
  { id: uuidv4(), type: 'water', x: 14, y: 8 },
  { id: uuidv4(), type: 'water', x: 15, y: 8 },
  { id: uuidv4(), type: 'water', x: 16, y: 8 },
  { id: uuidv4(), type: 'grass', x: 18, y: 8 },
  { id: uuidv4(), type: 'grass', x: 19, y: 8 },
  { id: uuidv4(), type: 'grass', x: 20, y: 8 },
  { id: uuidv4(), type: 'stone', x: 19, y: 5 },
  { id: uuidv4(), type: 'stone', x: 20, y: 5 },
  { id: uuidv4(), type: 'stone', x: 21, y: 5 },
];

const defaultCollisionPolygons: CollisionPolygon[] = [
  {
    id: 'col-1',
    vertices: [
      { x: 0, y: 320 },
      { x: 440, y: 320 },
      { x: 440, y: 360 },
      { x: 0, y: 360 },
    ],
    isClosed: true,
  },
  {
    id: 'col-2',
    vertices: [
      { x: 120, y: 240 },
      { x: 240, y: 240 },
      { x: 240, y: 280 },
      { x: 120, y: 280 },
    ],
    isClosed: true,
  },
];

export const useMapStore = create<MapState>((set, get) => ({
  tiles: defaultTiles,
  materials: defaultMaterials,
  collisionPolygons: defaultCollisionPolygons,
  lightSource: defaultLightSource,
  appMode: 'editor',
  editMode: 'tile',
  zoom: 1.0,
  panX: 0,
  panY: 0,
  gridSize: 40,
  selectedMaterial: null,
  selectedPolygonId: null,
  selectedVertexIndex: null,
  character: defaultCharacter,
  tileAnimations: [],
  isPanning: false,
  isDraggingLight: false,
  isDrawingPolygon: false,
  currentDrawingPolygon: [],
  showMaterialPanel: true,
  showCollisionPanel: false,
  hoveredTile: null,

  addTile: (type, x, y) => {
    const { tiles } = get();
    const existingTile = tiles.find(t => t.x === x && t.y === y);
    if (existingTile) {
      set({
        tiles: tiles.map(t =>
          t.id === existingTile.id ? { ...t, type } : t
        ),
      });
      get().addTileAnimation(existingTile.id);
    } else {
      const newTile: Tile = {
        id: uuidv4(),
        type,
        x,
        y,
      };
      set({ tiles: [...tiles, newTile] });
      get().addTileAnimation(newTile.id);
    }
  },

  removeTile: (id) => {
    set({ tiles: get().tiles.filter(t => t.id !== id) });
  },

  setSelectedMaterial: (material) => {
    set({ selectedMaterial: material });
  },

  setAppMode: (mode) => {
    if (mode === 'preview') {
      get().resetCharacter();
    }
    set({ appMode: mode });
  },

  setEditMode: (mode) => {
    set({ editMode: mode });
  },

  addCollisionPolygon: (polygon) => {
    set({
      collisionPolygons: [...get().collisionPolygons, polygon],
    });
  },

  updateCollisionPolygon: (id, vertices) => {
    set({
      collisionPolygons: get().collisionPolygons.map(p =>
        p.id === id ? { ...p, vertices } : p
      ),
    });
  },

  removeCollisionPolygon: (id) => {
    set({
      collisionPolygons: get().collisionPolygons.filter(p => p.id !== id),
      selectedPolygonId: get().selectedPolygonId === id ? null : get().selectedPolygonId,
    });
  },

  setLightSource: (light) => {
    set({
      lightSource: { ...get().lightSource, ...light },
    });
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.25, Math.min(4, zoom)) });
  },

  setPan: (x, y) => {
    set({ panX: x, panY: y });
  },

  setCharacter: (char) => {
    set({
      character: { ...get().character, ...char },
    });
  },

  resetMap: () => {
    set({
      tiles: [],
      collisionPolygons: [],
      lightSource: defaultLightSource,
      character: defaultCharacter,
    });
  },

  addTileAnimation: (id) => {
    const anim: TileAnimation = {
      id,
      startTime: performance.now(),
      scale: 0.8,
    };
    set({
      tileAnimations: [...get().tileAnimations.filter(a => a.id !== id), anim],
    });
    setTimeout(() => {
      get().removeTileAnimation(id);
    }, 500);
  },

  removeTileAnimation: (id) => {
    set({
      tileAnimations: get().tileAnimations.filter(a => a.id !== id),
    });
  },

  setIsPanning: (panning) => {
    set({ isPanning: panning });
  },

  setIsDraggingLight: (dragging) => {
    set({ isDraggingLight: dragging });
  },

  setIsDrawingPolygon: (drawing) => {
    set({ isDrawingPolygon: drawing });
  },

  setCurrentDrawingPolygon: (points) => {
    set({ currentDrawingPolygon: points });
  },

  addPolygonVertex: (point) => {
    set({
      currentDrawingPolygon: [...get().currentDrawingPolygon, point],
    });
  },

  finishDrawingPolygon: () => {
    const { currentDrawingPolygon } = get();
    if (currentDrawingPolygon.length >= 3) {
      const newPolygon: CollisionPolygon = {
        id: uuidv4(),
        vertices: currentDrawingPolygon,
        isClosed: true,
      };
      get().addCollisionPolygon(newPolygon);
    }
    set({
      isDrawingPolygon: false,
      currentDrawingPolygon: [],
    });
  },

  cancelDrawingPolygon: () => {
    set({
      isDrawingPolygon: false,
      currentDrawingPolygon: [],
    });
  },

  setSelectedPolygon: (id, vertexIndex = null) => {
    set({
      selectedPolygonId: id,
      selectedVertexIndex: vertexIndex,
    });
  },

  setShowMaterialPanel: (show) => {
    set({ showMaterialPanel: show });
  },

  setShowCollisionPanel: (show) => {
    set({ showCollisionPanel: show });
  },

  setHoveredTile: (tile) => {
    set({ hoveredTile: tile });
  },

  resetCharacter: () => {
    const leftMostTile = get().tiles.reduce((min, t) => (t.x < min.x ? t : min), get().tiles[0]);
    set({
      character: {
        ...defaultCharacter,
        x: leftMostTile ? leftMostTile.x * get().gridSize : 100,
        y: 200,
      },
    });
  },
}));
