import * as THREE from 'three';
import type { PipeData, CollisionPair } from '../types';

function closestPointsOnSegments(
  p1: THREE.Vector3, p2: THREE.Vector3,
  p3: THREE.Vector3, p4: THREE.Vector3
): { pointA: THREE.Vector3; pointB: THREE.Vector3; distance: number } {
  const d1 = new THREE.Vector3().subVectors(p2, p1);
  const d2 = new THREE.Vector3().subVectors(p4, p3);
  const r = new THREE.Vector3().subVectors(p1, p3);

  const a = d1.dot(d1);
  const e = d2.dot(d2);
  const f = d2.dot(r);

  const c = d1.dot(r);
  const b = d1.dot(d2);

  const denom = a * e - b * b;

  let s: number;
  let t: number;

  if (denom < 1e-10) {
    s = 0;
    t = f / e;
  } else {
    s = (b * f - c * e) / denom;
    t = (a * f - b * c) / denom;
  }

  s = Math.max(0, Math.min(1, s));
  t = Math.max(0, Math.min(1, t));

  const pointA = new THREE.Vector3().addVectors(p1, d1.clone().multiplyScalar(s));
  const pointB = new THREE.Vector3().addVectors(p3, d2.clone().multiplyScalar(t));
  const distance = pointA.distanceTo(pointB);

  return { pointA, pointB, distance };
}

export function detectCollisions(pipes: PipeData[]): CollisionPair[] {
  const collisions: CollisionPair[] = [];

  for (let i = 0; i < pipes.length; i++) {
    for (let j = i + 1; j < pipes.length; j++) {
      const pipeA = pipes[i];
      const pipeB = pipes[j];

      const a1 = new THREE.Vector3(pipeA.start.x, pipeA.start.y, pipeA.start.z);
      const a2 = new THREE.Vector3(pipeA.end.x, pipeA.end.y, pipeA.end.z);
      const b1 = new THREE.Vector3(pipeB.start.x, pipeB.start.y, pipeB.start.z);
      const b2 = new THREE.Vector3(pipeB.end.x, pipeB.end.y, pipeB.end.z);

      const result = closestPointsOnSegments(a1, a2, b1, b2);

      const threshold = pipeA.radius + pipeB.radius + 0.5;
      if (result.distance < threshold) {
        const midpoint = new THREE.Vector3()
          .addVectors(result.pointA, result.pointB)
          .multiplyScalar(0.5);

        collisions.push({
          pipeA,
          pipeB,
          closestPoint: { x: midpoint.x, y: midpoint.y, z: midpoint.z },
          minDistance: result.distance,
        });
      }
    }
  }

  return collisions;
}
