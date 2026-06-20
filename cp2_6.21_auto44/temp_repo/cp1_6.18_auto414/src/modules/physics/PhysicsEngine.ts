import type { Vec3, Euler3 } from '@/stores/gameStore';

export interface MatchResult {
  isMatch: boolean;
  distance: number;
  angleDiff: number;
  score: number;
}

function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function vec3Length(v: Vec3): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

function vec3Distance(a: Vec3, b: Vec3): number {
  return vec3Length(vec3Sub(a, b));
}

function normalizeAngle(angle: number): number {
  let a = angle % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a;
}

function angleDifference(a: number, b: number): number {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(diff, Math.PI * 2 - diff);
}

function eulerAngleDifference(a: Euler3, b: Euler3): number {
  const xDiff = angleDifference(a[0], b[0]);
  const yDiff = angleDifference(a[1], b[1]);
  const zDiff = angleDifference(a[2], b[2]);
  return Math.max(xDiff, yDiff, zDiff);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  const eased = easeOutCubic(t);
  return [
    a[0] + (b[0] - a[0]) * eased,
    a[1] + (b[1] - a[1]) * eased,
    a[2] + (b[2] - a[2]) * eased,
  ];
}

export function lerpEuler(a: Euler3, b: Euler3, t: number): Euler3 {
  const eased = easeOutCubic(t);
  return [
    a[0] + (b[0] - a[0]) * eased,
    a[1] + (b[1] - a[1]) * eased,
    a[2] + (b[2] - a[2]) * eased,
  ];
}

export const DISTANCE_THRESHOLD = 0.3;
export const ANGLE_THRESHOLD_DEG = 10;
export const ANGLE_THRESHOLD = (ANGLE_THRESHOLD_DEG * Math.PI) / 180;

export function checkMatch(
  pos1: Vec3,
  rot1: Euler3,
  pos2: Vec3,
  rot2: Euler3,
  targetPos1: Vec3,
  targetRot1: Euler3,
  targetPos2: Vec3,
  targetRot2: Euler3
): MatchResult {
  const distToTarget1 = vec3Distance(pos1, targetPos1);
  const distToTarget2 = vec3Distance(pos2, targetPos2);
  const avgDistance = (distToTarget1 + distToTarget2) / 2;

  const angleDiff1 = eulerAngleDifference(rot1, targetRot1);
  const angleDiff2 = eulerAngleDifference(rot2, targetRot2);
  const avgAngleDiff = (angleDiff1 + angleDiff2) / 2;

  const isMatch = avgDistance < DISTANCE_THRESHOLD && avgAngleDiff < ANGLE_THRESHOLD;

  const distanceScore = Math.max(0, 1 - avgDistance / DISTANCE_THRESHOLD);
  const angleScore = Math.max(0, 1 - avgAngleDiff / ANGLE_THRESHOLD);
  const score = Math.round((distanceScore * 50 + angleScore * 50));

  return {
    isMatch,
    distance: avgDistance,
    angleDiff: avgAngleDiff,
    score: Math.max(5, score),
  };
}

export function getPulseIntensity(time: number, period: number = 1): number {
  const t = (time % period) / period;
  return 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
}
