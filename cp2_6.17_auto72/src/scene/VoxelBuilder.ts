import * as THREE from 'three';

const GRID_SIZE = 15;
const HALF_GRID = GRID_SIZE / 2;

export class VoxelBuilder {
  static getGridSize(): number {
    return GRID_SIZE;
  }

  static getHalfGrid(): number {
    return HALF_GRID;
  }

  static snapToGrid(position: THREE.Vector3): THREE.Vector3 | null {
    const x = Math.floor(position.x + HALF_GRID);
    const y = Math.floor(position.y);
    const z = Math.floor(position.z + HALF_GRID);

    if (x < 0 || x >= GRID_SIZE || z < 0 || z >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      return null;
    }

    return new THREE.Vector3(x - HALF_GRID + 0.5, y + 0.5, z - HALF_GRID + 0.5);
  }

  static getPlacementPosition(
    intersectionPoint: THREE.Vector3,
    faceNormal: THREE.Vector3
  ): { x: number; y: number; z: number } | null {
    const placePos = intersectionPoint.clone().add(faceNormal.clone().multiplyScalar(0.5));
    const snapped = this.snapToGrid(placePos);
    if (!snapped) return null;

    const gx = Math.floor(snapped.x + HALF_GRID - 0.5);
    const gy = Math.floor(snapped.y - 0.5);
    const gz = Math.floor(snapped.z + HALF_GRID - 0.5);

    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE || gz < 0 || gz >= GRID_SIZE) {
      return null;
    }

    return { x: gx, y: gy, z: gz };
  }

  static getRemovalPosition(
    intersectionPoint: THREE.Vector3,
    faceNormal: THREE.Vector3
  ): { x: number; y: number; z: number } | null {
    const removePos = intersectionPoint.clone().sub(faceNormal.clone().multiplyScalar(0.5));
    const gx = Math.round(removePos.x + HALF_GRID - 0.5);
    const gy = Math.round(removePos.y - 0.5);
    const gz = Math.round(removePos.z + HALF_GRID - 0.5);

    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE || gz < 0 || gz >= GRID_SIZE) {
      return null;
    }

    return { x: gx, y: gy, z: gz };
  }

  static worldToGrid(worldPos: THREE.Vector3): { x: number; y: number; z: number } | null {
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
}
