import * as THREE from 'three';
import type { Exhibit } from '@/types';

const raycaster = new THREE.Raycaster();
const tempVector = new THREE.Vector3();
const tempBox = new THREE.Box3();

function createExhibitMesh(exhibit: Exhibit): THREE.Mesh {
  let geometry: THREE.BufferGeometry;

  switch (exhibit.type) {
    case 'cube':
      geometry = new THREE.BoxGeometry(1, 1, 1);
      break;
    case 'sphere':
      geometry = new THREE.SphereGeometry(0.5, 32, 32);
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
      break;
    case 'torus':
      geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 32);
      break;
    default:
      geometry = new THREE.BoxGeometry(1, 1, 1);
  }

  const mesh = new THREE.Mesh(geometry);
  mesh.position.set(...exhibit.position);
  mesh.rotation.set(...exhibit.rotation);
  mesh.scale.setScalar(exhibit.scale);
  mesh.updateMatrixWorld(true);

  return mesh;
}

export function checkOcclusions(
  cameraPosition: [number, number, number],
  exhibits: Exhibit[]
): string[] {
  const occludedIds: string[] = [];
  const meshes: Map<string, THREE.Mesh> = new Map();

  for (const exhibit of exhibits) {
    const mesh = createExhibitMesh(exhibit);
    meshes.set(exhibit.id, mesh);
  }

  const cameraPos = new THREE.Vector3(...cameraPosition);
  const meshArray = Array.from(meshes.values());

  for (const targetExhibit of exhibits) {
    const targetMesh = meshes.get(targetExhibit.id);
    if (!targetMesh) continue;

    tempBox.setFromObject(targetMesh);
    const targetCenter = tempBox.getCenter(tempVector);

    const direction = targetCenter.clone().sub(cameraPos).normalize();
    const distance = cameraPos.distanceTo(targetCenter);

    raycaster.set(cameraPos, direction);
    raycaster.far = distance - 0.01;

    const otherMeshes = meshArray.filter((m) => m !== targetMesh);
    const intersections = raycaster.intersectObjects(otherMeshes, true);

    if (intersections.length > 0) {
      occludedIds.push(targetExhibit.id);
    }
  }

  for (const mesh of meshes.values()) {
    mesh.geometry.dispose();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m) => m.dispose());
    } else {
      mesh.material.dispose();
    }
  }

  return occludedIds;
}

export function isExhibitOccluded(
  cameraPosition: [number, number, number],
  targetExhibit: Exhibit,
  allExhibits: Exhibit[]
): boolean {
  const occludedIds = checkOcclusions(cameraPosition, allExhibits);
  return occludedIds.includes(targetExhibit.id);
}

export function calculatePathLength(points: [number, number, number][]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = new THREE.Vector3(...points[i - 1]);
    const curr = new THREE.Vector3(...points[i]);
    length += prev.distanceTo(curr);
  }
  return length;
}

export function getPointOnPath(
  points: [number, number, number][],
  progress: number
): [number, number, number] {
  if (points.length === 0) return [0, 1.6, 0];
  if (points.length === 1) return points[0];
  if (progress <= 0) return points[0];
  if (progress >= 1) return points[points.length - 1];

  const totalLength = calculatePathLength(points);
  const targetDistance = totalLength * progress;

  let accumulatedDistance = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = new THREE.Vector3(...points[i - 1]);
    const curr = new THREE.Vector3(...points[i]);
    const segmentLength = prev.distanceTo(curr);

    if (accumulatedDistance + segmentLength >= targetDistance) {
      const segmentProgress =
        (targetDistance - accumulatedDistance) / segmentLength;
      const result = prev.clone().lerp(curr, segmentProgress);
      return [result.x, result.y, result.z];
    }

    accumulatedDistance += segmentLength;
  }

  return points[points.length - 1];
}

export function getPathTangent(
  points: [number, number, number][],
  progress: number
): [number, number, number] {
  if (points.length < 2) return [0, 0, -1];

  const pos = getPointOnPath(points, progress);
  const lookAhead = Math.min(progress + 0.01, 1);
  const lookAheadPos = getPointOnPath(points, lookAhead);

  const tangent = new THREE.Vector3(
    lookAheadPos[0] - pos[0],
    lookAheadPos[1] - pos[1],
    lookAheadPos[2] - pos[2]
  ).normalize();

  return [tangent.x, tangent.y, tangent.z];
}
