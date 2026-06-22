export interface CelestialBodyBase {
  id: string;
  name: string;
  englishName: string;
  type: 'sun' | 'planet';
  radius: number;
  color: number;
}

export interface OrbitParams {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  ascendingNode: number;
  perihelion: number;
  period: number;
}

export interface PhysicalParams {
  mass: number;
  density: number;
  temperature: [number, number];
  moons: number;
}

export interface RotationParams {
  period: number;
}

export interface CelestialBody extends CelestialBodyBase {
  orbit: OrbitParams;
  rotation: RotationParams;
  physical: PhysicalParams;
}

export type EventType =
  | 'timeUpdated'
  | 'planetSelected'
  | 'startMeasurement'
  | 'measurementResult'
  | 'measurementPointSelected'
  | 'speedChanged'
  | 'directionChanged'
  | 'resetView'
  | 'togglePause'
  | 'viewFocusPlanet'
  | 'bodyPositionUpdate'
  | 'exitMeasurement';

export interface TimeUpdatedPayload {
  currentTime: Date;
  epochDays: number;
  deltaDays: number;
}

export interface PlanetSelectedPayload {
  planetId: string | null;
}

export interface StartMeasurementPayload {
  fromBodyId: string;
}

export interface MeasurementResultPayload {
  fromBodyId: string;
  toBodyId: string;
  distance: number;
}

export interface MeasurementPointSelectedPayload {
  bodyId: string;
}

export type SpeedChangedPayload = number;

export type DirectionChangedPayload = 1 | -1;

export interface ResetViewPayload {}

export type TogglePausePayload = boolean;

export interface ViewFocusPlanetPayload {
  planetId: string | null;
}

export interface BodyPositionUpdatePayload {
  bodyId: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

export interface ExitMeasurementPayload {}

export type EventPayloadMap = {
  timeUpdated: TimeUpdatedPayload;
  planetSelected: PlanetSelectedPayload;
  startMeasurement: StartMeasurementPayload;
  measurementResult: MeasurementResultPayload;
  measurementPointSelected: MeasurementPointSelectedPayload;
  speedChanged: SpeedChangedPayload;
  directionChanged: DirectionChangedPayload;
  resetView: ResetViewPayload;
  togglePause: TogglePausePayload;
  viewFocusPlanet: ViewFocusPlanetPayload;
  bodyPositionUpdate: BodyPositionUpdatePayload;
  exitMeasurement: ExitMeasurementPayload;
};
