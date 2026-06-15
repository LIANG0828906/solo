import * as THREE from 'three';
import { ColorSystem } from './colorSystem';

export interface VoxelPosition {
  x: number;
  y: number;
  z: number;
}

export interface VoxelData {
  position: VoxelPosition;
  color: string;
  emissiveIntensity: number;
}

export type AnimationCallback = (
  position: VoxelPosition,
  type: 'add' | 'remove',
  data?: VoxelData
) => void;

export class VoxelEditor {
  private readonly GRID_SIZE = 30;
  private readonly HALF = 15;
  private grid: (VoxelData | null)[];
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private colorSystem: ColorSystem;
  private animationCallback?: AnimationCallback;
  private activeVoxelsCount: number = 0;
  private readonly MAX_ACTIVE = 800;

  constructor(colorSystem: ColorSystem) {
    this.colorSystem = colorSystem;
    this.grid = new Array(this.GRID_SIZE * this.GRID_SIZE * this.GRID_SIZE).fill(null);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  private getIndex(x: number, y: number, z: number): number {
    return x + y * this.GRID_SIZE + z * this.GRID_SIZE * this.GRID_SIZE;
  }

  private isValidPosition(x: number, y: number, z: number): boolean {
    return x >= 0 && x < this.GRID_SIZE
      && y >= 0 && y < this.GRID_SIZE
      && z >= 0 && z < this.GRID_SIZE;
  }

  private gridToWorld(x: number, y: number, z: number): THREE.Vector3 {
    return new THREE.Vector3(
      (x - this.HALF) * 1.0,
      (y - this.HALF) * 1.0,
      (z - this.HALF) * 1.0
    );
  }

  private worldToGrid(pos: THREE.Vector3): VoxelPosition {
    return {
      x: Math.round(pos.x + this.HALF),
      y: Math.round(pos.y + this.HALF),
      z: Math.round(pos.z + this.HALF)
    };
  }

  setAnimationCallback(callback: AnimationCallback): void {
    this.animationCallback = callback;
  }

  getVoxel(x: number, y: number, z: number): VoxelData | null {
    if (!this.isValidPosition(x, y, z)) return null;
    return this.grid[this.getIndex(x, y, z)];
  }

  hasVoxel(x: number, y: number, z: number): boolean {
    if (!this.isValidPosition(x, y, z)) return false;
    return this.grid[this.getIndex(x, y, z)] !== null;
  }

  addVoxel(x: number, y: number, z: number): VoxelData | null {
    if (!this.isValidPosition(x, y, z)) {
      console.warn(`Invalid voxel position: (${x}, ${y}, ${z})`);
      return null;
    }

    if (this.hasVoxel(x, y, z)) return null;
    if (this.activeVoxelsCount >= this.MAX_ACTIVE) {
      console.warn('Max voxel limit reached');
      return null;
    }

    const color = this.colorSystem.getCurrentColor();
    const emissiveIntensity = this.colorSystem.getEmissiveIntensity();

    const data: VoxelData = {
      position: { x, y, z },
      color,
      emissiveIntensity
    };

    this.grid[this.getIndex(x, y, z)] = data;
    this.activeVoxelsCount++;

    if (this.animationCallback) {
      this.animationCallback(data.position, 'add', data);
    }

    return data;
  }

  removeVoxel(x: number, y: number, z: number): VoxelData | null {
    if (!this.isValidPosition(x, y, z)) {
      console.warn(`Invalid voxel position: (${x}, ${y}, ${z})`);
      return null;
    }

    const index = this.getIndex(x, y, z);
    const data = this.grid[index];
    if (!data) return null;

    this.grid[index] = null;
    this.activeVoxelsCount--;

    if (this.animationCallback) {
      this.animationCallback(data.position, 'remove', data);
    }

    return data;
  }

  updateAllEmissiveIntensity(intensity: number): void {
    for (let i = 0; i < this.grid.length; i++) {
      const voxel = this.grid[i];
      if (voxel) {
        voxel.emissiveIntensity = intensity;
      }
    }
  }

  handleMouseClick(
    event: MouseEvent,
    camera: THREE.PerspectiveCamera,
    canvas: HTMLCanvasElement,
    voxelObjects: THREE.Object3D[],
    gridHelper: THREE.Object3D
  ): { type: 'add' | 'remove'; position: VoxelPosition | null } {
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);

    if (event.button === 2) {
      const intersects = this.raycaster.intersectObjects(voxelObjects, false);
      if (intersects.length > 0) {
        const hit = intersects[0];
        const worldPos = new THREE.Vector3();
        hit.object.getWorldPosition(worldPos);
        const gridPos = this.worldToGrid(worldPos);

        if (this.isValidPosition(gridPos.x, gridPos.y, gridPos.z)) {
          this.removeVoxel(gridPos.x, gridPos.y, gridPos.z);
          return { type: 'remove', position: gridPos };
        }
      }
      return { type: 'remove', position: null };
    }

    if (event.button === 0) {
      const allTargets = [...voxelObjects, gridHelper];
      const intersects = this.raycaster.intersectObjects(allTargets, false);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const hitPoint = hit.point.clone();
        const normal = hit.face?.normal?.clone() || new THREE.Vector3(0, 1, 0);
        normal.transformDirection(hit.object.matrixWorld);

        const voxelSize = 0.8;
        hitPoint.add(normal.multiplyScalar(voxelSize * 0.51));

        let worldPos: THREE.Vector3;
        if (hit.object === gridHelper) {
          worldPos = hitPoint.clone();
        } else {
          const objPos = new THREE.Vector3();
          hit.object.getWorldPosition(objPos);
          worldPos = objPos.add(normal.multiplyScalar(voxelSize));
        }

        const gridPos = this.worldToGrid(worldPos);

        if (this.isValidPosition(gridPos.x, gridPos.y, gridPos.z)) {
          this.addVoxel(gridPos.x, gridPos.y, gridPos.z);
          return { type: 'add', position: gridPos };
        } else {
          console.warn(`Clicked position out of bounds: (${gridPos.x}, ${gridPos.y}, ${gridPos.z})`);
        }
      }
      return { type: 'add', position: null };
    }

    return { type: 'add', position: null };
  }

  clearAll(): VoxelData[] {
    const removed: VoxelData[] = [];
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i]) {
        removed.push(this.grid[i]!);
        this.grid[i] = null;
      }
    }
    this.activeVoxelsCount = 0;
    return removed;
  }

  getActiveVoxels(): VoxelData[] {
    return this.grid.filter((v): v is VoxelData => v !== null);
  }

  getVoxelCount(): number {
    return this.activeVoxelsCount;
  }

  getGridSize(): number {
    return this.GRID_SIZE;
  }
}
