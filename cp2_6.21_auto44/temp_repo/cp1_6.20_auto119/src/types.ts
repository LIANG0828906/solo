export type PowerLevel = 1 | 2 | 3;

export interface Turbine {
  id: string;
  position: [number, number, number];
  powerLevel: PowerLevel;
  rotorDiameter: number;
  hubHeight: number;
  ratedPower: number;
  rotationSpeed: number;
}

export interface TurbineState {
  turbine: Turbine;
  effectiveWindSpeed: number;
  powerOutput: number;
  wakeInfluence: number;
  powerPercentage: number;
  index: number;
}

export interface WindParams {
  direction: number;
  speed: number;
}

export interface SimulationResult {
  turbineStates: TurbineState[];
  totalPower: number;
  timestamp: number;
}

export interface PowerDataPoint {
  time: number;
  power: number;
}

export const POWER_LEVEL_CONFIG: Record<PowerLevel, {
  rotorDiameter: number;
  hubHeight: number;
  ratedPower: number;
}> = {
  1: { rotorDiameter: 40, hubHeight: 60, ratedPower: 1.5 },
  2: { rotorDiameter: 60, hubHeight: 80, ratedPower: 3.0 },
  3: { rotorDiameter: 80, hubHeight: 100, ratedPower: 5.0 },
};

export const ROTATION_SPEED_BASE = 12;
