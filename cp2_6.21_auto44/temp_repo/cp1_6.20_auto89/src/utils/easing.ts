import { EasingType, CubicBezierParams } from '../types';

const cubicBezier = (t: number, x1: number, y1: number, x2: number, y2: number): number => {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleCurveX = (t: number): number => ((ax * t + bx) * t + cx) * t;
  const sampleCurveY = (t: number): number => ((ay * t + by) * t + cy) * t;
  const sampleCurveDerivativeX = (t: number): number => (3 * ax * t + 2 * bx) * t + cx;

  const solveCurveX = (x: number): number => {
    let t2 = x;
    for (let i = 0; i < 8; i++) {
      const x2 = sampleCurveX(t2) - x;
      if (Math.abs(x2) < 1e-6) return t2;
      const d2 = sampleCurveDerivativeX(t2);
      if (Math.abs(d2) < 1e-6) break;
      t2 = t2 - x2 / d2;
    }
    let t0 = 0, t1 = 1;
    t2 = x;
    if (t2 < t0) return t0;
    if (t2 > t1) return t1;
    while (t0 < t1) {
      const x2 = sampleCurveX(t2);
      if (Math.abs(x2 - x) < 1e-6) return t2;
      if (x > x2) t0 = t2;
      else t1 = t2;
      t2 = (t1 - t0) * 0.5 + t0;
    }
    return t2;
  };

  return sampleCurveY(solveCurveX(t));
};

export const easingFunctions: Record<EasingType, (t: number) => number> = {
  linear: (t) => t,
  ease: (t) => cubicBezier(t, 0.25, 0.1, 0.25, 1),
  'ease-in': (t) => cubicBezier(t, 0.42, 0, 1, 1),
  'ease-out': (t) => cubicBezier(t, 0, 0, 0.58, 1),
  'ease-in-out': (t) => cubicBezier(t, 0.42, 0, 0.58, 1),
  'cubic-bezier': (t) => cubicBezier(t, 0.25, 0.1, 0.25, 1),
};

export const createCustomBezierEasing = (params: CubicBezierParams) => {
  return (t: number): number => cubicBezier(t, params.x1, params.y1, params.x2, params.y2);
};

export const easingToCSS = (type: EasingType, bezier?: CubicBezierParams): string => {
  if (type === 'cubic-bezier' && bezier) {
    return `cubic-bezier(${bezier.x1}, ${bezier.y1}, ${bezier.x2}, ${bezier.y2})`;
  }
  return type;
};
