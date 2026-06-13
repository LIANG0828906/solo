import * as THREE from 'three';
import type { ColorSystem } from './colorSystem';

export interface VoxelPosition {
  x: number;
  y: number;
  z: number;
}

export interface VoxelData {
  position: VoxelPosition;
  color: string;
  colorIndex: number;
  emissiveIntensity: number;
}

export type EditAction = 'add' | 'remove';

export interface EditResult {
  action: EditAction;
  data?: VoxelData;
}

export class VoxelEditor {
  public readonly GRID_SIZE = 30;
  public readonly CELL_SIZE = 1.0;
  public readonly VOXEL_SIZE = 0.8;

  private grid: Array<VoxelData | null>;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private gridHelper: THREE.Group;
  private colorSystem: ColorSystem;

  private readonly MAX_VOXELS = 800;
  private activeVoxelCount: number = 0;

  constructor(colorSystem: ColorSystem) {
    this.colorSystem = colorSystem;
    this.grid = new Array(this.GRID_SIZE ** 3).fill(null);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.gridHelper = this.createGridHelper();
  }

  private posToIndex(x: number, y: number, z: number): number {
    return x + y * this.GRID_SIZE + z * this.GRID_SIZE * this.GRID_SIZE;
  }

  private isValidCoord(v: number): boolean {
    return Number.isInteger(v) && v >= 0 && v < this.GRID_SIZE;
  }

  private createGridHelper(): THREE.Group {
    const group = new THREE.Group();
    const s = this.GRID_SIZE * this.CELL_SIZE;
    const half = s / 2;

    const gridMat = new THREE.LineBasicMaterial({
      color: 0x45A29E,
      transparent: true,
      opacity: 0.08
    });

    const step = 5;
    for (let i = 0; i <= this.GRID_SIZE; i += step) {
      const p = -half + i * this.CELL_SIZE;

      const geomXY1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-half, -half, p),
        new THREE.Vector3(half, -half, p)
      ]);
      const geomXY2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(p, -half, -half),
        new THREE.Vector3(p, -half, half)
      ]);
      group.add(new THREE.Line(geomXY1, gridMat));
      group.add(new THREE.Line(geomXY2, gridMat));

      const geomXZ1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-half, p, -half),
        new THREE.Vector3(half, p, -half)
      ]);
      const geomXZ2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(p, -half, -half),
        new THREE.Vector3(p, half, -half)
      ]);
      group.add(new THREE.Line(geomXZ1, gridMat));
      group.add(new THREE.Line(geomXZ2, gridMat));

      const geomYZ1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-half, -half, p),
        new THREE.Vector3(-half, half, p)
      ]);
      const geomYZ2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-half, p, -half),
        new THREE.Vector3(-half, p, half)
      ]);
      group.add(new THREE.Line(geomYZ1, gridMat));
      group.add(new THREE.Line(geomYZ2, gridMat));
    }

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x45A29E,
      transparent: true,
      opacity: 0.25
    });

    const corners = [
      [-half, -half, -half], [half, -half, -half],
      [-half, half, -half], [half, half, -half],
      [-half, -half, half], [half, -half, half],
      [-half, half, half], [half, half, half]
    ].map(c => new THREE.Vector3(c[0], c[1], c[2]));

    const edges = [
      [0, 1], [2, 3], [4, 5], [6, 7],
      [0, 2], [1, 3], [4, 6], [5, 7],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    edges.forEach(([a, b]) => {
      const g = new THREE.BufferGeometry().setFromPoints([corners[a], corners[b]]);
      group.add(new THREE.Line(g, edgeMat));
    });

    return group;
  }

  getGridHelper(): THREE.Group {
    return this.gridHelper;
  }

  gridToWorld(x: number, y: number, z: number): THREE.Vector3 {
    const half = (this.GRID_SIZE - 1) / 2;
    return new THREE.Vector3(
      (x - half) * this.CELL_SIZE,
      (y - half) * this.CELL_SIZE,
      (z - half) * this.CELL_SIZE
    );
  }

  worldToGrid(pos: THREE.Vector3): VoxelPosition | null {
    const half = (this.GRID_SIZE - 1) / 2;
    const x = Math.round(pos.x / this.CELL_SIZE + half);
    const y = Math.round(pos.y / this.CELL_SIZE + half);
    const z = Math.round(pos.z / this.CELL_SIZE + half);

    if (!this.isValidCoord(x) || !this.isValidCoord(y) || !this.isValidCoord(z)) {
      return null;
    }
    return { x, y, z };
  }

  hasVoxel(x: number, y: number, z: number): boolean {
    if (!this.isValidCoord(x) || !this.isValidCoord(y) || !this.isValidCoord(z)) {
      return false;
    }
    return this.grid[this.posToIndex(x, y, z)] !== null;
  }

  getVoxel(x: number, y: number, z: number): VoxelData | null {
    if (!this.isValidCoord(x) || !this.isValidCoord(y) || !this.isValidCoord(z)) {
      return null;
    }
    return this.grid[this.posToIndex(x, y, z)];
  }

  getAllVoxels(): VoxelData[] {
    return this.grid.filter((v): v is VoxelData => v !== null);
  }

  getActiveVoxelCount(): number {
    return this.activeVoxelCount;
  }

  placeVoxel(x: number, y: number, z: number, colorIndex?: number): EditResult {
    if (!this.isValidCoord(x) || !this.isValidCoord(y) || !this.isValidCoord(z)) {
      return { action: 'add' };
    }

    const idx = this.posToIndex(x, y, z);
    if (this.grid[idx] !== null) {
      return { action: 'add' };
    }

    if (this.activeVoxelCount >= this.MAX_VOXELS) {
      return { action: 'add' };
    }

    const colors = this.colorSystem.getPresetColors();
    const cIdx = colorIndex !== undefined
      ? colorIndex % colors.length
      : this.colorSystem.getCurrentColorIndex();
    const color = colorIndex !== undefined
      ? colors[cIdx].hex
      : this.colorSystem.getCurrentColor();

    const data: VoxelData = {
      position: { x, y, z },
      color,
      colorIndex: cIdx,
      emissiveIntensity: this.colorSystem.getEmissiveIntensity()
    };

    this.grid[idx] = data;
    this.activeVoxelCount++;
    return { action: 'add', data };
  }

  removeVoxel(x: number, y: number, z: number): EditResult {
    if (!this.isValidCoord(x) || !this.isValidCoord(y) || !this.isValidCoord(z)) {
      return { action: 'remove' };
    }

    const idx = this.posToIndex(x, y, z);
    const data = this.grid[idx];
    if (data === null) {
      return { action: 'remove' };
    }

    this.grid[idx] = null;
    this.activeVoxelCount--;
    return { action: 'remove', data };
  }

  clearAll(): VoxelData[] {
    const removed = this.grid.filter((v): v is VoxelData => v !== null);
    this.grid.fill(null);
    this.activeVoxelCount = 0;
    return removed;
  }

  updateEmissiveIntensity(newIntensity: number): void {
    for (let i = 0; i < this.grid.length; i++) {
      const v = this.grid[i];
      if (v !== null) {
        v.emissiveIntensity = newIntensity;
      }
    }
  }

  handleClick(
    event: MouseEvent,
    domElement: HTMLElement,
    camera: THREE.Camera,
    instancedMeshes: THREE.InstancedMesh[]
  ): {
      result: EditResult;
      worldPos: THREE.Vector3 | null;
      faceNormal?: THREE.Vector3;
    } {
    const rect = domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);

    const meshes = instancedMeshes.filter(m => m.count > 0);
    const hits = meshes.length > 0
      ? this.raycaster.intersectObjects(meshes, false)
      : [];

    if (hits.length > 0) {
      const hit = hits[0];
      const hitPoint = hit.point.clone();

      const normal = hit.face?.normal?.clone()
        .transformDirection(hit.object.matrixWorld)
        .normalize() ?? new THREE.Vector3();

      const gridPos = this.worldToGrid(hitPoint);

      if (event.button === 0) {
        if (gridPos) {
          const offset = normal.clone()
            .multiplyScalar(this.CELL_SIZE * 0.5);
          const placedWorld = hitPoint.clone().add(offset);
          const placedGrid = this.worldToGrid(placedWorld);
          if (placedGrid) {
            const result = this.placeVoxel(placedGrid.x, placedGrid.y, placedGrid.z);
            const wp = result.data
              ? this.gridToWorld(placedGrid.x, placedGrid.y, placedGrid.z)
              : null;
            return { result, worldPos: wp };
          }
        }
        return { result: { action: 'add' }, worldPos: null };
      }

      if (event.button === 2) {
        if (gridPos) {
          const wp = this.gridToWorld(gridPos.x, gridPos.y, gridPos.z);
          return {
            result: this.removeVoxel(gridPos.x, gridPos.y, gridPos.z),
            worldPos: wp,
            faceNormal: normal
          };
        }
        return { result: { action: 'remove' }, worldPos: null };
      }
    }

    if (event.button === 0) {
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const point = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(plane, point)) {
        const gridPos = this.worldToGrid(point);
        if (gridPos) {
