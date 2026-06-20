import * as THREE from 'three';

export interface BuildingConfig {
  length: number;
  width: number;
  floors: number;
  floorHeight: number;
}

export interface SunPosition {
  azimuth: number;
  altitude: number;
  vector3: THREE.Vector3;
  direction: THREE.Vector3;
}

export interface DisplayOptions {
  showShadowTrail: boolean;
  showIsochron: boolean;
  showHeatmap: boolean;
}

export interface TimeSlot {
  startHour: number;
  endHour: number;
  inShadow: boolean;
}

export interface ShadowPointData {
  x: number;
  z: number;
  shadowCoverageRatio: number;
  timeSlots: TimeSlot[];
}

export interface ShadowData {
  shadowPolygon: THREE.Vector3[];
  shadowTrail: THREE.Vector3[];
  isochrons: { level: number; points: THREE.Vector3[] }[];
  heatmapGrid: ShadowPointData[][];
  gridSize: number;
  gridBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export interface GroundClickInfo {
  point: { x: number; z: number };
  dateStr: string;
  timeSlots: TimeSlot[];
  shadowCoverageRatio: number;
}

export const DEFAULT_BUILDING: BuildingConfig = {
  length: 20,
  width: 15,
  floors: 6,
  floorHeight: 3.5,
};

export const DEFAULT_LATITUDE = 40.0;
export const DEFAULT_LONGITUDE = 116.4;
export const GRID_SIZE = 40;
export const GRID_RESOLUTION = 50;
