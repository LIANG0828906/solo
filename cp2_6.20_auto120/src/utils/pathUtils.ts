import * as THREE from 'three';
import type { Vec3 } from '@/types';

export function vec3ToThree(v: Vec3): THREE.Vector3 {
  return new THREE.Vector3(v[0], v[1], v[2]);
}

export function threeToVec3(v: THREE.Vector3): Vec3 {
  return [v.x, v.y, v.z];
}

export function generateControlPoints(
  start: Vec3,
  end: Vec3,
  count: number = 5
): Vec3[] {
  const startV = vec3ToThree(start);
  const endV = vec3ToThree(end);
  const direction = new THREE.Vector3().subVectors(endV, startV);
  const controlPoints: Vec3[] = [];

  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const basePoint = new THREE.Vector3().lerpVectors(startV, endV, t);

    const offsetX = (Math.random() - 0.5) * 0.6;
    const offsetY = (Math.random() - 0.5) * 0.6;
    const offsetZ = (Math.random() - 0.5) * 0.6;

    basePoint.x += offsetX;
    basePoint.y += offsetY;
    basePoint.z += offsetZ;

    controlPoints.push(threeToVec3(basePoint));
  }

  return controlPoints;
}

export function createCatmullRomCurve(
  start: Vec3,
  controlPoints: Vec3[],
  end: Vec3
): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [vec3ToThree(start)];
  controlPoints.forEach((cp) => points.push(vec3ToThree(cp)));
  points.push(vec3ToThree(end));

  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
}

export function getPointOnCurve(
  curve: THREE.CatmullRomCurve3,
  t: number
): THREE.Vector3 {
  return curve.getPoint(t);
}

export function getPointAtDistance(
  curve: THREE.CatmullRomCurve3,
  distance: number
): THREE.Vector3 {
  const length = curve.getLength();
  const t = Math.min(1, Math.max(0, distance / length));
  return curve.getPointAt(t);
}

export function getCurveLength(curve: THREE.CatmullRomCurve3): number {
  return curve.getLength();
}

export function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function generateTubeGeometry(
  curve: THREE.CatmullRomCurve3,
  radius: number = 0.08,
  tubularSegments: number = 100,
  radialSegments: number = 8
): THREE.TubeGeometry {
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
}
