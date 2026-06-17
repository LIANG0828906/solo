export interface TrajectoryPoint {
  x: number;
  y: number;
  z: number;
}

export interface TrajectoryFeatures {
  length: number;
  curvatures: number[];
  avgCurvature: number;
  directions: number[];
  directionDistribution: number[];
}

export interface TrajectoryData {
  id: string;
  points: TrajectoryPoint[];
  features: TrajectoryFeatures;
  createdAt: number;
  fadingOut: boolean;
  fadeStartTime: number;
}

export interface ParticleState {
  trajectoryId: string;
  progress: number;
  speed: number;
  size: number;
}

export type EventBusEvents = {
  'gesture:start': { point: TrajectoryPoint; trajectoryId: string };
  'gesture:move': { point: TrajectoryPoint; trajectoryId: string };
  'gesture:end': { points: TrajectoryPoint[]; features: TrajectoryFeatures; trajectoryId: string };
  'trajectory:features': { features: TrajectoryFeatures; trajectoryId: string };
};
