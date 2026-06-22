import EventEmitter from 'eventemitter3';

export const EventBus = new EventEmitter();

export enum Events {
  LIGHTING_UPDATED = 'lighting:updated',
  TIME_CHANGED = 'time:changed',
  STYLE_CHANGED = 'style:changed',
  MATERIAL_CHANGED = 'material:changed',
}

export interface LightingParams {
  time: number;
  elevation: number;
  azimuth: number;
  colorTemperature: number;
  intensity: number;
  color: number;
  ambientIntensity: number;
  shadowMatrix: number[];
  sunPosition: { x: number; y: number; z: number };
}
