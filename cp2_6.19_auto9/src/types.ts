export type BlinkPattern = 'static' | 'breathing' | 'strobe' | 'wave';
export type EasingType = 'linear' | 'easeInOut';

export interface LightParams {
  hue: number;
  saturation: number;
  brightness: number;
  pattern: BlinkPattern;
  patternSpeed: number;
}

export interface Keyframe {
  id: string;
  duration: number;
  easing: EasingType;
  lights: LightParams[];
}

export interface LightShowProject {
  version: string;
  createdAt: number;
  keyframes: Keyframe[];
  currentLightIndex: number;
}

export const LIGHT_COUNT = 6;
export const MAX_KEYFRAMES = 10;
export const DEFAULT_DURATION = 2000;

export const createDefaultLightParams = (hue: number): LightParams => ({
  hue,
  saturation: 100,
  brightness: 80,
  pattern: 'static',
  patternSpeed: 1,
});

export const createInitialLights = (): LightParams[] => {
  const hues = [0, 60, 120, 180, 240, 300];
  return hues.map(createDefaultLightParams);
};
