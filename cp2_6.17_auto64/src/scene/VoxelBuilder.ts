import * as THREE from 'three';
import { GRID_CONSTANTS } from '../store/editorStore';
import type { Voxel } from '../store/editorStore';
import { getMaterialById } from '../materials/materialStore';

const { HALF, SIZE } = GRID_CONSTANTS;

export interface HoverResult {
  valid: boolean;
  x: number;
  y: number;
  z: number;
  faceNormal?: THREE.Vector3;
}

export class VoxelBuilder {
  private gridMin: THREE.Vector3;
  private gridMax: THREE.Vector3;

  constructor() {
    this.gridMin = new THREE.Vector3(-HALF, 0, -HALF);
    this.gridMax = new THREE.Vector3(HALF + 1, SIZE, HALF + 1);
  }

  worldToGrid(worldPos: THREE.Vector3): { x: number; y: number; z: number } {
    return {
      x: Math.floor(worldPos.x),
      y: Math.floor(worldPos.y),
      z: Math.floor(worldPos.z),
    };
  }

  gridToWorldCenter(x: number, y: number, z: number): THREE.Vector3 {
    return new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5);
  }

  isInBounds(x: number, y: number, z: number): boolean {
    return (
      x >= -HALF && x <= HALF && y >= 0 && y < SIZE && z >= -HALF && z <= HALF
    );
  }

  findVoxelAtPosition(
    voxels: Voxel[],
    x: number,
    y: number,
    z: number
  ): Voxel | undefined {
    return voxels.find((v) => v.x === x && v.y === y && v.z === z);
  }

  computeHoverFromIntersection(
    intersection: THREE.Intersection,
    voxels: Voxel[],
    isRightClick: boolean = false
  ): HoverResult {
    const point = intersection.point;
    const face = intersection.face;

    if (!face) {
      return { valid: false, x: 0, y: 0, z: 0 };
    }

    const normal = face.normal.clone();
    normal.transformDirection(intersection.object.matrixWorld);

    const eps = 0.001;

    if (isRightClick) {
      const removePoint = point.clone().add(normal.clone().multiplyScalar(-eps));
      const gridPos = this.worldToGrid(removePoint);
      if (this.findVoxelAtPosition(voxels, gridPos.x, gridPos.y, gridPos.z)) {
        return {
          valid: true,
          x: gridPos.x,
          y: gridPos.y,
          z: gridPos.z,
          faceNormal: normal,
        };
      }
      return { valid: false, x: 0, y: 0, z: 0 };
    }

    const placePoint = point.clone().add(normal.clone().multiplyScalar(eps));
    const gridPos = this.worldToGrid(placePoint);

    if (
      this.isInBounds(gridPos.x, gridPos.y, gridPos.z) &&
      !this.findVoxelAtPosition(voxels, gridPos.x, gridPos.y, gridPos.z)
    ) {
      return {
        valid: true,
        x: gridPos.x,
        y: gridPos.y,
        z: gridPos.z,
        faceNormal: normal,
      };
    }

    return { valid: false, x: 0, y: 0, z: 0 };
  }

  computeHoverFromGroundPoint(
    worldPoint: THREE.Vector3,
    voxels: Voxel[]
  ): HoverResult {
    const gridPos = this.worldToGrid(worldPoint);
    gridPos.y = 0;

    if (
      this.isInBounds(gridPos.x, gridPos.y, gridPos.z) &&
      !this.findVoxelAtPosition(voxels, gridPos.x, gridPos.y, gridPos.z)
    ) {
      return {
        valid: true,
        x: gridPos.x,
        y: gridPos.y,
        z: gridPos.z,
      };
    }

    return { valid: false, x: 0, y: 0, z: 0 };
  }

  getVoxelColor(materialId: string): string {
    const material = getMaterialById(materialId);
    return material.color;
  }
}
