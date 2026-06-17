import * as THREE from 'three';

const GRID_SIZE = 15;
const HALF_GRID = GRID_SIZE / 2;

export interface GridPosition {
  x: number;
  y: number;
  z: number;
}

export class VoxelBuilder {
  static getGridSize(): number {
    return GRID_SIZE;
  }

  static getHalfGrid(): number {
    return HALF_GRID;
  }

  static worldToGrid(worldPos: THREE.Vector3): GridPosition | null {
    const gx = Math.floor(worldPos.x + HALF_GRID);
    const gy = Math.floor(worldPos.y);
    const gz = Math.floor(worldPos.z + HALF_GRID);

    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE || gz < 0 || gz >= GRID_SIZE) {
      return null;
    }

    return { x: gx, y: gy, z: gz };
  }

  static gridToWorld(gx: number, gy: number, gz: number): THREE.Vector3 {
    return new THREE.Vector3(
      gx - HALF_GRID + 0.5,
      gy + 0.5,
      gz - HALF_GRID + 0.5
    );
  }

  static gridToWorldFromGrid(grid: GridPosition): THREE.Vector3 {
    return this.gridToWorld(grid.x, grid.y, grid.z);
  }

  static getPlacementPosition(
    intersectionPoint: THREE.Vector3,
    faceNormal: THREE.Vector3
  ): GridPosition | null {
    const offsetPos = intersectionPoint.clone().add(faceNormal.clone().multiplyScalar(0.5));
    return this.worldToGrid(offsetPos);
  }

  static getRemovalPosition(
    intersectionPoint: THREE.Vector3,
    faceNormal: THREE.Vector3
  ): GridPosition | null {
    const offsetPos = intersectionPoint.clone().sub(faceNormal.clone().multiplyScalar(0.5));
    return this.worldToGrid(offsetPos);
  }

  static isValidPosition(x: number, y: number, z: number): boolean {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE && z >= 0 && z < GRID_SIZE;
  }
}
