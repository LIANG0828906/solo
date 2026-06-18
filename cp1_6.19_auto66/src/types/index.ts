export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Landmark {
  id: string;
  name: string;
  position: Vector3;
  color: string;
}

export interface PlayerState {
  position: Vector3;
  facing: number;
}

export interface NavData {
  azimuth: number;
  distance: number;
  elevation: number;
  heightDiff: number;
  isFacingAway: boolean;
  isNearTarget: boolean;
}

export type TargetId = string | null;
