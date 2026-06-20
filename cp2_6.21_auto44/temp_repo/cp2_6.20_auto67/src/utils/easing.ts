export type EasingFunction = (t: number) => number;

export const easeOutCubic: EasingFunction = (t) => 1 - Math.pow(1 - t, 3);

export const easeInOutCubic: EasingFunction = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutQuart: EasingFunction = (t) => 1 - Math.pow(1 - t, 4);

export const easeInOutQuart: EasingFunction = (t) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

export const linear: EasingFunction = (t) => t;

export const easeOutExpo: EasingFunction = (t) =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function lerpArray(
  start: [number, number, number],
  end: [number, number, number],
  t: number
): [number, number, number] {
  return [
    lerp(start[0], end[0], t),
    lerp(start[1], end[1], t),
    lerp(start[2], end[2], t),
  ];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
