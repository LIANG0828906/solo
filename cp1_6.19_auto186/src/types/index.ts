import * as THREE from 'three';

export type MaterialType = 'wood' | 'marble' | 'glass' | 'acoustic';

export type GeometryType = 'wall' | 'cylinder' | 'wedge';

export interface GeometryObject {
  id: string;
  type: GeometryType;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  material: MaterialType;
}

export interface MaterialConfig {
  name: string;
  color: string;
  absorption: {
    low: number;
    mid: number;
    high: number;
  };
}

export interface RayPoint {
  x: number;
  y: number;
  z: number;
}

export interface RayPath {
  id: string;
  points: RayPoint[];
  totalLength: number;
  energyLoss: number;
  reflections: number;
  isValid: boolean;
  receiverIndex?: number;
}

export interface RT60Data {
  low: number;
  mid: number;
  high: number;
}

export interface HeatmapData {
  gridSize: number;
  cellSize: number;
  values: number[][];
}

export interface SceneState {
  geometries: GeometryObject[];
  selectedId: string | null;
  sourcePosition: { x: number; y: number; z: number };
  receiverPositions: { x: number; y: number; z: number }[];
  isSimulating: boolean;
  rayPaths: RayPath[];
  rt60Data: RT60Data;
  heatmapData: HeatmapData;
  activeGeometryType: GeometryType;
  activeMaterial: MaterialType;
  showPanel: boolean;
}

export interface SceneActions {
  addGeometry: (geo: Omit<GeometryObject, 'id'>) => void;
  removeGeometry: (id: string) => void;
  updateGeometry: (id: string, updates: Partial<GeometryObject>) => void;
  selectGeometry: (id: string | null) => void;
  setSourcePosition: (pos: { x: number; y: number; z: number }) => void;
  setReceiverPosition: (index: number, pos: { x: number; y: number; z: number }) => void;
  simulateRays: () => void;
  resetScene: () => void;
  setActiveGeometryType: (type: GeometryType) => void;
  setActiveMaterial: (material: MaterialType) => void;
  setShowPanel: (show: boolean) => void;
}

export type SceneStore = SceneState & SceneActions;
