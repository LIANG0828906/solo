import type { CSSProperties } from 'react';

export type PropertyValue = string | number;

export interface PropertyMap {
  [propertyPath: string]: PropertyValue;
}

export interface BezierControlPoints {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface AnimatableElement {
  id: string;
  name: string;
  color: string;
  initialStyles: CSSProperties;
}

export interface KeyframeNode {
  id: string;
  elementId: string;
  time: number;
  properties: PropertyMap;
  easing: BezierControlPoints;
}

export type PlayState = 'stopped' | 'playing' | 'paused';

export type PlaybackSpeed = 0.5 | 1 | 2;

export interface AnimationTimeline {
  duration: number;
  currentTime: number;
  playState: PlayState;
  playbackSpeed: PlaybackSpeed;
}

export const ELEMENT_COLORS = [
  '#4E8CFF',
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#C084FC',
];

export const DEFAULT_EASING: BezierControlPoints = {
  x1: 0.25,
  y1: 0.1,
  x2: 0.25,
  y2: 1.0,
};

export const PROPERTY_INPUT_TYPES = [
  'transform.translateX',
  'transform.translateY',
  'transform.rotate',
  'transform.scale',
  'transform.scaleX',
  'transform.scaleY',
  'transform.skewX',
  'transform.skewY',
  'opacity',
  'background-color',
  'width',
  'height',
  'border-radius',
  'box-shadow',
] as const;

export type PropertyInputType = (typeof PROPERTY_INPUT_TYPES)[number];
