export interface LightSource {
  id: number;
  x: number;
  y: number;
  hue: number;
  brightness: number;
  radius: number;
}

export interface GlobalConfig {
  attenuation: number;
  ambientIntensity: number;
  roughness: number;
  backgroundColor: string;
}

export const CANVAS_SIZE = 600;
export const MAX_LIGHTS = 20;
export const DEFAULT_LIGHT_RADIUS = 8;
export const DEFAULT_SATURATION = 80;
export const DEFAULT_BRIGHTNESS = 80;
