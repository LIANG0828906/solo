import * as THREE from 'three';
import { VenueWall } from '@/types';

export interface RayHitResult {
  wallIndex: number;
  positionX: number;
  positionY: number;
  worldPosition: THREE.Vector3;
}

export const raycastWalls = (
  walls: VenueWall[],
  raycaster: THREE.Raycaster,
  cameraPosition: THREE.Vector3
): RayHitResult | null => {
  let nearestHit: RayHitResult | null = null;
  let nearestDistance = Infinity;

  walls.forEach((wall, wallIndex) => {
    const [wx, wy, wz] = wall.position;
    const [rx, ry, rz] = wall.rotation;

    const center = new THREE.Vector3(wx, wy, wz);
    const euler = new THREE.Euler(rx, ry, rz);
    const matrix = new THREE.Matrix4().compose(
      center,
      new THREE.Quaternion().setFromEuler(euler),
      new THREE.Vector3(1, 1, 1)
    );
    const normal = new THREE.Vector3(0, 0, 1).applyEuler(euler);

    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, center);
    const intersection = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(plane, intersection);

    if (!hit) return;

    const localIntersect = intersection.clone().applyMatrix4(matrix.clone().invert());

    const halfW = wall.width / 2;
    const halfH = wall.height / 2;
    const margin = 0.3;

    if (
      localIntersect.x < -halfW - margin ||
      localIntersect.x > halfW + margin ||
      localIntersect.y < -halfH - margin ||
      localIntersect.y > halfH + margin
    ) {
      return;
    }

    const viewDir = intersection.clone().sub(cameraPosition).normalize();
    if (viewDir.dot(normal) > 0) return;

    const distance = cameraPosition.distanceTo(intersection);
    if (distance >= nearestDistance) return;

    const clampedX = Math.max(-halfW, Math.min(halfW, localIntersect.x));
    const clampedY = Math.max(-halfH, Math.min(halfH, localIntersect.y));

    const positionX = (clampedX + halfW) / wall.width;
    const positionY = (clampedY + halfH) / wall.height;

    nearestHit = {
      wallIndex,
      positionX,
      positionY,
      worldPosition: intersection,
    };
    nearestDistance = distance;
  });

  return nearestHit;
};

export const screenToRay = (
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  camera: THREE.Camera
): THREE.Raycaster => {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((clientY - rect.top) / rect.height) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
  return raycaster;
};

export const clampWorkPosition = (
  posX: number,
  posY: number,
  workWidthRatio: number,
  workHeightRatio: number
): { positionX: number; positionY: number } => {
  const halfW = workWidthRatio / 2;
  const halfH = workHeightRatio / 2;
  return {
    positionX: Math.max(halfW, Math.min(1 - halfW, posX)),
    positionY: Math.max(halfH, Math.min(1 - halfH, posY)),
  };
};

export const snapToGrid = (value: number, gridSize: number = 0.02): number => {
  return Math.round(value / gridSize) * gridSize;
};
