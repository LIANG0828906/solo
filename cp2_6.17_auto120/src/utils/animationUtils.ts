import type { Keyframe } from '../types/animation';

export const MAX_DURATION = 4;
export const MIN_DURATION = 0;
export const TIME_STEP = 0.1;
export const TICK_COUNT = 40;

export const clampTime = (time: number): number => {
  const clamped = Math.max(MIN_DURATION, Math.min(MAX_DURATION, time));
  return Math.round(clamped * 10) / 10;
};

export const sortKeyframes = (keyframes: Keyframe[]): Keyframe[] => {
  return [...keyframes].sort((a, b) => a.time - b.time);
};

export const formatTime = (time: number): string => {
  return time.toFixed(1) + 's';
};

export const formatPercent = (time: number, duration: number): string => {
  return ((time / duration) * 100).toFixed(1) + '%';
};

export const buildTransformString = (t: {
  translateX: number;
  translateY: number;
  rotate: number;
  scale: number;
}): string => {
  return `translate(${t.translateX}px, ${t.translateY}px) rotate(${t.rotate}deg) scale(${t.scale})`;
};

export const cubicBezierToString = (curve: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}): string => {
  const x1 = curve.x1.toFixed(2);
  const y1 = curve.y1.toFixed(2);
  const x2 = curve.x2.toFixed(2);
  const y2 = curve.y2.toFixed(2);
  return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
};
