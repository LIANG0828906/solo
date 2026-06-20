import * as THREE from 'three';
import type { GeoCoordinate } from '../data/types';

export const EARTH_RADIUS = 2;
export const GLOBE_SEGMENTS = 64;

export function latLngToVector3(lat: number, lng: number, radius = EARTH_RADIUS): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

export function geoCoordToVec3(coord: GeoCoordinate, radius = EARTH_RADIUS): THREE.Vector3 {
  return latLngToVector3(coord.lat, coord.lng, radius);
}

export function createStarfield(count = 800, radius = 50): { positions: Float32Array; colors: Float32Array; sizes: Float32Array } {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const r = radius * (0.8 + Math.random() * 0.4);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);

    const brightness = 0.5 + Math.random() * 0.5;
    const tint = Math.random();
    if (tint < 0.7) {
      colors[i3] = brightness;
      colors[i3 + 1] = brightness;
      colors[i3 + 2] = brightness * 1.2;
    } else if (tint < 0.9) {
      colors[i3] = brightness * 0.8;
      colors[i3 + 1] = brightness * 0.9;
      colors[i3 + 2] = brightness;
    } else {
      colors[i3] = brightness;
      colors[i3 + 1] = brightness * 0.8;
      colors[i3 + 2] = brightness * 0.9;
    }

    sizes[i] = 0.5 + Math.random() * 2;
  }

  return { positions, colors, sizes };
}

export function createArcCurve(
  start: THREE.Vector3,
  end: THREE.Vector3,
  height = 1,
  segments = 30,
): { positions: Float32Array; midPoint: THREE.Vector3 } {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const distance = start.distanceTo(end);
  const arcHeight = height + distance * 0.15;

  const midNormalized = mid.clone().normalize();
  const controlPoint = midNormalized.multiplyScalar(EARTH_RADIUS + arcHeight);

  const curve = new THREE.QuadraticBezierCurve3(start, controlPoint, end);
  const points = curve.getPoints(segments);

  const positions = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i++) {
    const i3 = i * 3;
    positions[i3] = points[i].x;
    positions[i3 + 1] = points[i].y;
    positions[i3 + 2] = points[i].z;
  }

  return { positions, midPoint: controlPoint };
}
