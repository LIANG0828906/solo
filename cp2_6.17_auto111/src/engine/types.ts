export type LaneDirection = 'east' | 'west' | 'north' | 'south';

export interface VehicleState {
  id: string;
  position: { x: number; z: number };
  rotation: number;
  speed: number;
  targetSpeed: number;
  color: string;
  direction: LaneDirection;
  nextTurn: 'left' | 'right' | 'straight';
  turnIndicatorActive: boolean;
  turnIndicatorTimer: number;
  waitingTime: number;
  isWaiting: boolean;
  currentIntersectionId: string | null;
  path: { x: number; z: number }[];
  pathIndex: number;
}

export type TrafficLightPhase = 'GREEN_EW' | 'YELLOW_EW' | 'GREEN_NS' | 'YELLOW_NS';

export interface TrafficLightState {
  phase: TrafficLightPhase;
  timeRemaining: number;
  eastWest: { red: boolean; yellow: boolean; green: boolean };
  northSouth: { red: boolean; yellow: boolean; green: boolean };
  yellowBlinkOn: boolean;
}

export interface IntersectionState {
  id: string;
  gridX: number;
  gridZ: number;
  centerX: number;
  centerZ: number;
  trafficLight: TrafficLightState;
  totalWaitingTime: number;
  vehiclesWaited: number;
}

export interface GridConfig {
  sizeX: number;
  sizeZ: number;
  roadLength: number;
  roadWidth: number;
  intersectionSize: number;
}

export interface Statistics {
  totalVehicles: number;
  averageSpeed: number;
  congestionIndex: number;
  averageWaitingTime: number;
  averageQueueLength: number;
  maxQueueLength: number;
  trafficFlow: number;
  completedTrips: number;
}

export const VEHICLE_COLORS = [
  '#FF4444',
  '#4488FF',
  '#44CC44',
  '#FFD700',
  '#FFFFFF',
  '#C0C0C0',
  '#222222',
  '#AA44FF',
  '#FF8844',
  '#44DDDD'
];

export const STOP_LINE_DISTANCE = 12;
export const CAR_LENGTH = 4;
export const CAR_WIDTH = 1.8;
export const CAR_HEIGHT = 1.5;
export const LANE_WIDTH = 3;
export const FOLLOW_DISTANCE = 5;
export const ACCELERATION = 5;
export const DECELERATION = 8;
export const GREEN_LIGHT_REACTION_TIME = 1;
export const TURN_INDICATOR_LEAD_TIME = 3;

export function kmhToMs(kmh: number): number {
  return kmh / 3.6;
}

export function msToKmh(ms: number): number {
  return ms * 3.6;
}
