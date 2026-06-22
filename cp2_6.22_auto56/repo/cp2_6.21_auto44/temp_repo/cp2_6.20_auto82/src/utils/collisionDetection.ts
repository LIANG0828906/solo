import * as THREE from 'three';
import { Pipeline, CollisionResult, PipelinePoint } from '@/types';

function createPipelineBox3(pipeline: Pipeline): THREE.Box3 {
  const radius = pipeline.diameter / 2 / 1000;
  const start = new THREE.Vector3(pipeline.start.x, pipeline.start.y, pipeline.start.z);
  const end = new THREE.Vector3(pipeline.end.x, pipeline.end.y, pipeline.end.z);

  const box = new THREE.Box3();
  box.setFromCenterAndSize(
    new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5),
    new THREE.Vector3(
      Math.abs(end.x - start.x) + radius * 2,
      Math.abs(end.y - start.y) + radius * 2,
      Math.abs(end.z - start.z) + radius * 2
    )
  );

  return box;
}

function findCollisionPoint(
  pipelineA: Pipeline,
  pipelineB: Pipeline
): PipelinePoint | null {
  const startA = new THREE.Vector3(pipelineA.start.x, pipelineA.start.y, pipelineA.start.z);
  const endA = new THREE.Vector3(pipelineA.end.x, pipelineA.end.y, pipelineA.end.z);
  const startB = new THREE.Vector3(pipelineB.start.x, pipelineB.start.y, pipelineB.start.z);
  const endB = new THREE.Vector3(pipelineB.end.x, pipelineB.end.y, pipelineB.end.z);

  const dirA = new THREE.Vector3().subVectors(endA, startA);
  const dirB = new THREE.Vector3().subVectors(endB, startB);

  const r = new THREE.Vector3().subVectors(startA, startB);
  const a = dirA.dot(dirA);
  const e = dirB.dot(dirB);
  const f = dirB.dot(r);

  if (a < 0.0001 || e < 0.0001) return null;

  const cross = new THREE.Vector3().crossVectors(dirA, dirB);
  const denom = cross.lengthSq();

  if (denom < 0.0001) {
    const midA = new THREE.Vector3().addVectors(startA, endA).multiplyScalar(0.5);
    const midB = new THREE.Vector3().addVectors(startB, endB).multiplyScalar(0.5);
    return {
      x: (midA.x + midB.x) / 2,
      y: (midA.y + midB.y) / 2,
      z: (midA.z + midB.z) / 2,
    };
  }

  const b = dirA.dot(dirB);
  const c = dirA.dot(r);

  const s = Math.max(0, Math.min(1, (b * f - c * e) / (a * e - b * b)));
  const t = Math.max(0, Math.min(1, (a * f - b * c) / (a * e - b * b)));

  const closestPointA = new THREE.Vector3().addVectors(
    startA,
    dirA.clone().multiplyScalar(s)
  );
  const closestPointB = new THREE.Vector3().addVectors(
    startB,
    dirB.clone().multiplyScalar(t)
  );

  const distance = closestPointA.distanceTo(closestPointB);
  const radiusA = pipelineA.diameter / 2 / 1000;
  const radiusB = pipelineB.diameter / 2 / 1000;

  if (distance < radiusA + radiusB) {
    const midPoint = new THREE.Vector3()
      .addVectors(closestPointA, closestPointB)
      .multiplyScalar(0.5);
    return { x: midPoint.x, y: midPoint.y, z: midPoint.z };
  }

  return null;
}

export function checkCollisions(pipelines: Pipeline[]): CollisionResult[] {
  const collisions: CollisionResult[] = [];

  for (let i = 0; i < pipelines.length; i++) {
    for (let j = i + 1; j < pipelines.length; j++) {
      const pipelineA = pipelines[i];
      const pipelineB = pipelines[j];

      const boxA = createPipelineBox3(pipelineA);
      const boxB = createPipelineBox3(pipelineB);

      if (boxA.intersectsBox(boxB)) {
        const collisionPoint = findCollisionPoint(pipelineA, pipelineB);
        if (collisionPoint) {
          collisions.push({
            id: `col-${i}-${j}`,
            pipelineAId: pipelineA.id,
            pipelineBId: pipelineB.id,
            point: collisionPoint,
          });
        }
      }
    }
  }

  return collisions;
}

export function calculateTotalLength(pipelines: Pipeline[]): number {
  let total = 0;
  for (const pipeline of pipelines) {
    const dx = pipeline.end.x - pipeline.start.x;
    const dy = pipeline.end.y - pipeline.start.y;
    const dz = pipeline.end.z - pipeline.start.z;
    total += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return total;
}

export function calculateSectionUtilization(
  pipelines: Pipeline[],
  corridorWidth: number,
  corridorHeight: number
): number {
  const corridorArea = corridorWidth * corridorHeight;
  let totalPipelineArea = 0;

  for (const pipeline of pipelines) {
    const radius = pipeline.diameter / 2 / 1000;
    totalPipelineArea += Math.PI * radius * radius;
  }

  return (totalPipelineArea / corridorArea) * 100;
}

export function snapToAngleGrid(
  start: PipelinePoint,
  end: PipelinePoint,
  gridDegrees: number = 10
): PipelinePoint {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dz = end.z - start.z;
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (length < 0.001) return end;

  const yaw = Math.atan2(dx, dz);
  const pitch = Math.asin(dy / length);

  const gridRad = (gridDegrees * Math.PI) / 180;
  const snappedYaw = Math.round(yaw / gridRad) * gridRad;
  const snappedPitch = Math.round(pitch / gridRad) * gridRad;

  return {
    x: start.x + length * Math.sin(snappedYaw) * Math.cos(snappedPitch),
    y: start.y + length * Math.sin(snappedPitch),
    z: start.z + length * Math.cos(snappedYaw) * Math.cos(snappedPitch),
  };
}

export function findNearestEndpoint(
  point: PipelinePoint,
  pipelines: Pipeline[],
  excludePipelineId: string,
  threshold: number = 0.03
): { point: PipelinePoint; pipelineId: string } | null {
  let nearest: { point: PipelinePoint; pipelineId: string; dist: number } | null = null;

  for (const pipeline of pipelines) {
    if (pipeline.id === excludePipelineId) continue;

    for (const endpoint of [pipeline.start, pipeline.end]) {
      const dx = point.x - endpoint.x;
      const dy = point.y - endpoint.y;
      const dz = point.z - endpoint.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < threshold && (!nearest || dist < nearest.dist)) {
        nearest = { point: endpoint, pipelineId: pipeline.id, dist };
      }
    }
  }

  return nearest ? { point: nearest.point, pipelineId: nearest.pipelineId } : null;
}
