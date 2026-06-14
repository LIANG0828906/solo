import * as THREE from 'three';

export enum BuildingStyle {
  MODERN_GLASS = 'modern_glass',
  CLASSICAL_STONE = 'classical_stone',
  FUTURISTIC_METAL = 'futuristic_metal'
}

export enum AnimationState {
  IDLE = 'idle',
  SPAWNING = 'spawning',
  GROWING_FLOOR = 'growing_floor',
  COMPLETING = 'completing',
  COMPLETE = 'complete'
}

export enum LODLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  MERGED = 'merged'
}

export interface IPhysicsBody {
  position: { x: number; z: number };
  velocity: { x: number; z: number };
  collisionRadius: number;
  mass: number;
}

export interface IWindowLightState {
  targetBrightness: number;
  currentBrightness: number;
  toggleInterval: number;
  nextToggleTime: number;
  color?: THREE.Color;
}

export interface IBuilding {
  id: string;
  position: { x: number; z: number };
  targetHeight: number;
  currentHeight: number;
  style: BuildingStyle;
  isGrowing: boolean;
  isComplete: boolean;
  mesh: THREE.Group;
  floors: THREE.Mesh[];
  beaconLight?: THREE.PointLight;
  beaconMesh?: THREE.Mesh;
  windowLights: THREE.Mesh[];
  windowStates?: Map<string, IWindowLightState>;
  animationState?: AnimationState;
  physicsBody?: IPhysicsBody;
  growthProgress: number;
  lastGrowthTime: number;
  targetFloor: number;
  currentFloor: number;
  spawnAnimation: {
    startTime: number;
    duration: number;
    isComplete: boolean;
  };
  pushOffset: { x: number; z: number };
  lodLevel: number;
}

export interface BuildingStyleGeometry {
  columnCount: number;
  panelWidth: number;
  panelHeight: number;
  hasCornice: boolean;
  hasBase: boolean;
  baseHeight: number;
}

export interface BuildingStyleConfig {
  bodyColor: number;
  edgeColor: number;
  windowColor: number;
  roughness: number;
  metalness: number;
  edgeWidth: number;
  geometry: BuildingStyleGeometry;
}

export const GROWTH_INTERVAL = 500;
export const FLOOR_HEIGHT = 1.2;
export const GRID_SIZE = 40;
export const CELL_SIZE = 2;
export const MAX_BUILDINGS_BEFORE_MERGE = 50;
export const NIGHT_MODE_THRESHOLD = 10;
export const MIN_BUILDING_FLOORS = 5;
export const MAX_BUILDING_FLOORS = 25;
export const BUILDING_BASE_WIDTH = 1.5;
export const BUILDING_BASE_DEPTH = 1.5;
export const COLLISION_RADIUS = 4;
export const PUSH_FORCE = 0.3;
export const PHYSICS_DAMPING = 0.95;
export const COLLISION_FORCE_MULTIPLIER = 2.0;
export const SPRING_STIFFNESS = 0.5;
export const BREATHING_SPEED = 0.002;
export const BREATHING_INTENSITY = 0.15;

export const STYLE_CONFIGS: Record<BuildingStyle, BuildingStyleConfig> = {
  [BuildingStyle.MODERN_GLASS]: {
    bodyColor: 0x2a3a5a,
    edgeColor: 0x00ffff,
    windowColor: 0x88ccff,
    roughness: 0.1,
    metalness: 0.9,
    edgeWidth: 0.02,
    geometry: {
      columnCount: 6,
      panelWidth: 0.8,
      panelHeight: 1.0,
      hasCornice: false,
      hasBase: true,
      baseHeight: 0.3
    }
  },
  [BuildingStyle.CLASSICAL_STONE]: {
    bodyColor: 0x8b7355,
    edgeColor: 0xffd700,
    windowColor: 0xffcc33,
    roughness: 0.8,
    metalness: 0.1,
    edgeWidth: 0.03,
    geometry: {
      columnCount: 8,
      panelWidth: 0.6,
      panelHeight: 1.2,
      hasCornice: true,
      hasBase: true,
      baseHeight: 0.5
    }
  },
  [BuildingStyle.FUTURISTIC_METAL]: {
    bodyColor: 0x1a1a2e,
    edgeColor: 0xff00ff,
    windowColor: 0x00ffcc,
    roughness: 0.2,
    metalness: 0.8,
    edgeWidth: 0.025,
    geometry: {
      columnCount: 4,
      panelWidth: 1.0,
      panelHeight: 0.9,
      hasCornice: true,
      hasBase: false,
      baseHeight: 0.2
    }
  }
};

export function generateBuildingId(): string {
  return `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getRandomStyle(): BuildingStyle {
  const styles = Object.values(BuildingStyle);
  return styles[Math.floor(Math.random() * styles.length)];
}

export function getRandomFloors(): number {
  return Math.floor(Math.random() * (MAX_BUILDING_FLOORS - MIN_BUILDING_FLOORS + 1)) + MIN_BUILDING_FLOORS;
}

export function gridToWorld(gridX: number, gridZ: number): { x: number; z: number } {
  const halfGrid = (GRID_SIZE * CELL_SIZE) / 2;
  return {
    x: gridX * CELL_SIZE - halfGrid + CELL_SIZE / 2,
    z: gridZ * CELL_SIZE - halfGrid + CELL_SIZE / 2
  };
}

export function worldToGrid(worldX: number, worldZ: number): { x: number; z: number } | null {
  const halfGrid = (GRID_SIZE * CELL_SIZE) / 2;
  const gridX = Math.floor((worldX + halfGrid) / CELL_SIZE);
  const gridZ = Math.floor((worldZ + halfGrid) / CELL_SIZE);
  
  if (gridX >= 0 && gridX < GRID_SIZE && gridZ >= 0 && gridZ < GRID_SIZE) {
    return { x: gridX, z: gridZ };
  }
  return null;
}
