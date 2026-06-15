export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface LineSegment {
  start: Point;
  end: Point;
}

export interface Ray {
  origin: Point;
  direction: Point;
  color: RGBColor;
  intensity: number;
  bounceCount: number;
  maxBounces: number;
}

export interface RaySegment {
  start: Point;
  end: Point;
  color: RGBColor;
  intensity: number;
}

export type MirrorShape = 'rectangle' | 'triangle';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const MAX_BOUNCES = 5;
export const RAY_COUNT_PER_LIGHT = 36;
export const BEAM_MAX_DISTANCE = 1500;
