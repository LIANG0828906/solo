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
  id: string;
  position: { x: number; z: number };
  velocity: { x: number; z: number };
  halfWidth: number;
  halfDepth: number;
  rotation: number;
  mass: number;
  isStatic: boolean;
  restitution: number;
}

export interface IWindowLightState {
  targetBrightness: number;
  currentBrightness: number;
  toggleInterval: number;
  nextToggleTime: number;
  color: THREE.Color;
  baseColor: THREE.Color;
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
  decorativeMeshes: THREE.Object3D[];
  beaconLight?: THREE.PointLight;
  beaconMesh?: THREE.Mesh;
  windowLights: THREE.Mesh[];
  windowStates: Map<number, IWindowLightState>;
  animationState: AnimationState;
  physicsBody: IPhysicsBody;
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
  lodLevel: LODLevel;
  growthTimeline?: any;
  width: number;
  depth: number;
}

export interface BuildingStyleGeometry {
  columnCount: number;
  columnRadius: number;
  columnHeightRatio: number;
  panelWidth: number;
  panelHeight: number;
  panelDepth: number;
  hasCornice: boolean;
  corniceHeight: number;
  corniceOverhang: number;
  hasBase: boolean;
  baseHeight: number;
  baseStepCount: number;
  hasAngularPanels: boolean;
  panelAngle: number;
  hasRoofStructure: boolean;
  roofAntennaCount: number;
}

export interface BuildingStyleConfig {
  bodyColor: number;
  edgeColor: number;
  windowColor: number;
  accentColor: number;
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
export const COLLISION_PADDING = 0.15;
export const PHYSICS_DAMPING = 0.92;
export const COLLISION_FORCE_MULTIPLIER = 3.0;
export const SPRING_STIFFNESS = 0.8;
export const MAX_PHYSICS_VELOCITY = 1.5;
export const BREATHING_SPEED = 0.002;
export const BREATHING_INTENSITY = 0.15;
export const MIN_WINDOW_TOGGLE_INTERVAL = 1.0;
export const MAX_WINDOW_TOGGLE_INTERVAL = 5.0;
export const WINDOW_BRIGHTNESS_CHANGE_SPEED = 2.0;

export const STYLE_CONFIGS: Record<BuildingStyle, BuildingStyleConfig> = {
  [BuildingStyle.MODERN_GLASS]: {
    bodyColor: 0x2a3a5a,
    edgeColor: 0x00ffff,
    windowColor: 0x88ccff,
    accentColor: 0x00ffcc,
    roughness: 0.1,
    metalness: 0.9,
    edgeWidth: 0.02,
    geometry: {
      columnCount: 0,
      columnRadius: 0,
      columnHeightRatio: 0,
      panelWidth: 0.8,
      panelHeight: 1.0,
      panelDepth: 0.02,
      hasCornice: false,
      corniceHeight: 0,
      corniceOverhang: 0,
      hasBase: true,
      baseHeight: 0.3,
      baseStepCount: 1,
      hasAngularPanels: false,
      panelAngle: 0,
      hasRoofStructure: true,
      roofAntennaCount: 2
    }
  },
  [BuildingStyle.CLASSICAL_STONE]: {
    bodyColor: 0x8b7355,
    edgeColor: 0xffd700,
    windowColor: 0xffcc33,
    accentColor: 0xdaa520,
    roughness: 0.8,
    metalness: 0.1,
    edgeWidth: 0.03,
    geometry: {
      columnCount: 6,
      columnRadius: 0.08,
      columnHeightRatio: 0.85,
      panelWidth: 0.6,
      panelHeight: 1.2,
      panelDepth: 0.04,
      hasCornice: true,
      corniceHeight: 0.25,
      corniceOverhang: 0.2,
      hasBase: true,
      baseHeight: 0.5,
      baseStepCount: 3,
      hasAngularPanels: false,
      panelAngle: 0,
      hasRoofStructure: false,
      roofAntennaCount: 0
    }
  },
  [BuildingStyle.FUTURISTIC_METAL]: {
    bodyColor: 0x1a1a2e,
    edgeColor: 0xff00ff,
    windowColor: 0x00ffcc,
    accentColor: 0xff00aa,
    roughness: 0.2,
    metalness: 0.85,
    edgeWidth: 0.025,
    geometry: {
      columnCount: 0,
      columnRadius: 0,
      columnHeightRatio: 0,
      panelWidth: 1.0,
      panelHeight: 0.9,
      panelDepth: 0.06,
      hasCornice: true,
      corniceHeight: 0.15,
      corniceOverhang: 0.15,
      hasBase: false,
      baseHeight: 0.2,
      baseStepCount: 1,
      hasAngularPanels: true,
      panelAngle: 0.35,
      hasRoofStructure: true,
      roofAntennaCount: 4
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

export function getRandomWindowToggleTime(): number {
  return MIN_WINDOW_TOGGLE_INTERVAL + Math.random() * (MAX_WINDOW_TOGGLE_INTERVAL - MIN_WINDOW_TOGGLE_INTERVAL);
}
