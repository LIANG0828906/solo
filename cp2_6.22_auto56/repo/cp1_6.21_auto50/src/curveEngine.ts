import type { ControlPoint } from './types';

export function generateBezier(controlPoints: number[][]): string {
  if (controlPoints.length !== 2) {
    return 'cubic-bezier(0.25, 0.1, 0.25, 1)';
  }
  const [p1, p2] = controlPoints;
  const x1 = clamp(p1[0], 0, 1);
  const y1 = clamp(p1[1], 0, 1);
  const x2 = clamp(p2[0], 0, 1);
  const y2 = clamp(p2[1], 0, 1);
  return `cubic-bezier(${round(x1)}, ${round(y1)}, ${round(x2)}, ${round(y2)})`;
}

export function generateSpring(mass: number, stiffness: number, damping: number): string {
  const m = clamp(mass, 0.1, 10);
  const k = clamp(stiffness, 50, 300);
  const d = clamp(damping, 5, 50);
  return `spring(${round(m)}, ${round(k)}, ${round(d)})`;
}

export function cubicBezierValue(t: number, p1: ControlPoint, p2: ControlPoint): number {
  const clampedT = clamp(t, 0, 1);
  const cx = 3 * p1.x;
  const bx = 3 * (p2.x - p1.x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1.y;
  const by = 3 * (p2.y - p1.y) - cy;
  const ay = 1 - cy - by;

  const x = ((ax * clampedT + bx) * clampedT + cx) * clampedT;
  const y = ((ay * clampedT + by) * clampedT + cy) * clampedT;

  const targetX = clampedT;
  if (Math.abs(x - targetX) < 0.001) {
    return y;
  }

  return solveBezierY(targetX, ax, bx, cx, ay, by, cy);
}

function solveBezierY(
  targetX: number,
  ax: number,
  bx: number,
  cx: number,
  ay: number,
  by: number,
  cy: number
): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const x = ((ax * mid + bx) * mid + cx) * mid;
    if (x < targetX) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const t = (lo + hi) / 2;
  return ((ay * t + by) * t + cy) * t;
}

export function springValue(
  t: number,
  mass: number,
  stiffness: number,
  damping: number
): number {
  const clampedT = clamp(t, 0, 1);
  const m = clamp(mass, 0.1, 10);
  const k = clamp(stiffness, 50, 300);
  const d = clamp(damping, 5, 50);

  const omega0 = Math.sqrt(k / m);
  const zeta = d / (2 * Math.sqrt(k * m));

  const duration = 1;
  const scaledT = clampedT * duration * 3;

  if (zeta < 1) {
    const omega1 = omega0 * Math.sqrt(1 - zeta * zeta);
    const decay = Math.exp(-zeta * omega0 * scaledT);
    const oscillation = Math.cos(omega1 * scaledT) + (zeta * omega0 / omega1) * Math.sin(omega1 * scaledT);
    return 1 - decay * oscillation;
  } else {
    const decay = Math.exp(-omega0 * scaledT);
    return 1 - decay * (1 + omega0 * scaledT);
  }
}

export function parseCurveToFunction(curve: string): (t: number) => number {
  const bezierMatch = curve.match(/cubic-bezier\(([^)]+)\)/);
  if (bezierMatch) {
    const nums = bezierMatch[1].split(',').map(s => parseFloat(s.trim()));
    if (nums.length === 4) {
      const p1 = { x: nums[0], y: nums[1] };
      const p2 = { x: nums[2], y: nums[3] };
      return (t: number) => cubicBezierValue(t, p1, p2);
    }
  }

  const springMatch = curve.match(/spring\(([^)]+)\)/);
  if (springMatch) {
    const nums = springMatch[1].split(',').map(s => parseFloat(s.trim()));
    if (nums.length === 3) {
      return (t: number) => springValue(t, nums[0], nums[1], nums[2]);
    }
  }

  return (t: number) => t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): string {
  return (Math.round(value * 1000) / 1000).toFixed(3);
}
