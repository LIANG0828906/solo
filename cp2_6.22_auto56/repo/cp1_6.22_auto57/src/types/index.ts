export interface Intersection {
  id: string;
  x: number;
  z: number;
  signalState: 'red' | 'green';
  signalTimer: number;
}

export interface RoadSegment {
  id: string;
  from: string;
  to: string;
  type: 'main' | 'branch';
  lanes: number;
  speedLimit: number;
  allowUTurn: boolean;
}

export interface SignalCycle {
  red: number;
  green: number;
}

export interface SignalCycleExtended {
  redDuration: number;
  greenDuration: number;
  yellowDuration: number;
}

export interface RoadNetwork {
  intersections: Intersection[];
  segments: RoadSegment[];
  signalCycle: SignalCycle;
}

export interface RoadNetworkData {
  intersections: Intersection[];
  segments: RoadSegment[];
  signalCycle: SignalCycleExtended;
}

export interface Vehicle {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: { y: number };
  speed: number;
  targetSpeed: number;
  path: string[];
  currentPathIndex: number;
  detourPath?: string[];
  strategy: 'shortest' | 'avoid-congestion';
  isBraking: boolean;
  color: string;
}

export type VehicleData = Vehicle;

export interface Obstacle {
  id: string;
  position: { x: number; z: number };
  affectedSegmentId?: string;
}

export type ObstacleData = Obstacle;

export interface HeatmapCell {
  segmentId?: string;
  x?: number;
  z?: number;
  congestionLevel: 0 | 1 | 2;
  avgSpeed: number;
  vehicleCount?: number;
}

export interface Analytics {
  totalVehicles: number;
  avgSpeed: number;
  congestionIndex: number;
}

export type AnalyticsData = Analytics;

export interface RoadGeometryData {
  mainRoadMeshes: Array<{
    geometry: THREE.BufferGeometry;
    material: THREE.MeshBasicMaterial;
  }>;
  branchRoadLines: Array<{
    geometry: THREE.BufferGeometry;
    material: THREE.LineBasicMaterial;
  }>;
  intersectionPoints: Array<{
    position: THREE.Vector3;
  }>;
}
