import { Vector3, NavData } from '../types';

export const calculateAzimuth = (from: Vector3, to: Vector3): number => {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  return Math.atan2(dx, dz);
};

export const calculateDistance = (from: Vector3, to: Vector3): number => {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  return Math.sqrt(dx * dx + dz * dz);
};

export const calculateElevation = (from: Vector3, to: Vector3): number => {
  const distance = calculateDistance(from, to);
  const heightDiff = to.y - from.y;
  if (distance === 0) return 0;
  return Math.atan2(heightDiff, distance);
};

export const calculateHeightDiff = (from: Vector3, to: Vector3): number => {
  return to.y - from.y;
};

export const normalizeAngle = (angle: number): number => {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
};

export const isFacingAway = (
  playerFacing: number,
  targetAzimuth: number
): boolean => {
  const diff = Math.abs(normalizeAngle(targetAzimuth - playerFacing));
  return diff > Math.PI / 2;
};

export const isNearTarget = (distance: number): boolean => {
  return distance < 10;
};

export const computeNavData = (
  playerPos: Vector3,
  playerFacing: number,
  targetPos: Vector3
): NavData => {
  const azimuth = calculateAzimuth(playerPos, targetPos);
  const distance = calculateDistance(playerPos, targetPos);
  const elevation = calculateElevation(playerPos, targetPos);
  const heightDiff = calculateHeightDiff(playerPos, targetPos);

  return {
    azimuth,
    distance,
    elevation,
    heightDiff,
    isFacingAway: isFacingAway(playerFacing, azimuth),
    isNearTarget: isNearTarget(distance),
  };
};

export const radToDeg = (rad: number): number => {
  return (rad * 180) / Math.PI;
};

export const degToRad = (deg: number): number => {
  return (deg * Math.PI) / 180;
};
