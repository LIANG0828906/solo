import * as THREE from 'three';

export const GRID_SIZE = 20;
export const CELL_SIZE = 1;
export const MAX_VOXELS = 8000;
export const GROUND_COLOR = '#808080';

export const PRESET_COLORS: string[] = [
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#5AC8FA',
  '#007AFF',
  '#AF52DE',
  '#FF2D55',
  '#A2845E',
  '#FFFFFF'
];

export interface Voxel {
  x: number;
  y: number;
  z: number;
  color: string;
  isGround: boolean;
  scale: number;
  targetScale: number;
}

export interface FlyingVoxel {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  life: number;
}

type VoxelKey = string;

export class SceneManager {
  private scene: THREE.Scene;
  private voxels: Map<VoxelKey, Voxel> = new Map();
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private boxGeometry: THREE.BoxGeometry;
  private groundPlane: THREE.Mesh;
  private flyingVoxels: FlyingVoxel[] = [];
  private dirty: boolean = true;
  private dummy: THREE.Object3D = new THREE.Object3D();
  public onSceneChange?: () => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.boxGeometry = new THREE.BoxGeometry(CELL_SIZE * 0.98, CELL_SIZE * 0.98, CELL_SIZE * 0.98);
    
    this.groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.0
      })
    );
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.set(
      (GRID_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2,
      0,
      (GRID_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2
    );
    this.groundPlane.name = 'groundPlane';
    this.scene.add(this.groundPlane);

    this.initGround();
  }

  private getKey(x: number, y: number, z: number): VoxelKey {
    return `${x},${y},${z}`;
  }

  private isInBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE && z >= 0 && z < GRID_SIZE;
  }

  public getTotalVoxelCount(): number {
    return this.voxels.size;
  }

  public getGroundPlane(): THREE.Mesh {
    return this.groundPlane;
  }

  public getVoxels(): Map<VoxelKey, Voxel> {
    return this.voxels;
  }

  public getInstancedMeshes(): THREE.InstancedMesh[] {
    return Array.from(this.instancedMeshes.values());
  }

  private initGround(): void {
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const key = this.getKey(x, 0, z);
        this.voxels.set(key, {
          x,
          y: 0,
          z,
          color: GROUND_COLOR,
          isGround: true,
          scale: 1,
          targetScale: 1
        });
      }
    }
    this.rebuildMeshes();
  }

  public hasVoxel(x: number, y: number, z: number): boolean {
    return this.voxels.has(this.getKey(x, y, z));
  }

  public getVoxel(x: number, y: number, z: number): Voxel | undefined {
    return this.voxels.get(this.getKey(x, y, z));
  }

  public addVoxel(x: number, y: number, z: number, color: string): boolean {
    if (!this.isInBounds(x, y, z)) return false;
    const key = this.getKey(x, y, z);
    if (this.voxels.has(key)) return false;

    let nonGroundCount = 0;
    for (const v of this.voxels.values()) {
      if (!v.isGround) nonGroundCount++;
    }
    if (nonGroundCount + 1 > MAX_VOXELS - GRID_SIZE * GRID_SIZE) {
      return false;
    }

    this.voxels.set(key, {
      x,
      y,
      z,
      color,
      isGround: false,
      scale: 0,
      targetScale: 1
    });

    this.dirty = true;
    this.onSceneChange?.();
    return true;
  }

  public removeVoxel(x: number, y: number, z: number): boolean {
    const key = this.getKey(x, y, z);
    const voxel = this.voxels.get(key);
    if (!voxel || voxel.isGround) return false;

    voxel.targetScale = 0;
    this.dirty = true;
    this.onSceneChange?.();
    return true;
  }

  public brushPlace(centerX: number, centerY: number, centerZ: number, color: string, brushSize: number): number {
    let count = 0;
    const radius = Math.floor(brushSize / 2);
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dz = -radius; dz <= radius; dz++) {
          const dist = Math.abs(dx) + Math.abs(dy) + Math.abs(dz);
          if (dist <= radius) {
            if (this.addVoxel(centerX + dx, centerY + dy, centerZ + dz, color)) {
              count++;
            }
          }
        }
      }
    }
    return count;
  }

  public brushRemove(centerX: number, centerY: number, centerZ: number, brushSize: number): number {
    let count = 0;
    const radius = Math.floor(brushSize / 2);
    const toRemove: [number, number, number][] = [];

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dz = -radius; dz <= radius; dz++) {
          const dist = Math.abs(dx) + Math.abs(dy) + Math.abs(dz);
          if (dist <= radius) {
            const vx = centerX + dx;
            const vy = centerY + dy;
            const vz = centerZ + dz;
            const voxel = this.getVoxel(vx, vy, vz);
            if (voxel && !voxel.isGround) {
              toRemove.push([vx, vy, vz]);
            }
          }
        }
      }
    }

    for (const [x, y, z] of toRemove) {
      if (this.removeVoxel(x, y, z)) count++;
    }
    return count;
  }

  public clearScene(callback?: () => void): void {
    const flyingPromises: Promise<void>[] = [];

    for (const [key, voxel] of this.voxels.entries()) {
      if (voxel.isGround) continue;

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(voxel.color),
        metalness: 0.1,
        roughness: 0.8
      });
      const mesh = new THREE.Mesh(this.boxGeometry.clone(), material);
      
      mesh.position.set(
        voxel.x * CELL_SIZE,
        voxel.y * CELL_SIZE,
        voxel.z * CELL_SIZE
      );

      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 15 + 5,
        (Math.random() - 0.5) * 10
      );

      const rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * Math.PI * 4,
        (Math.random() - 0.5) * Math.PI * 4,
        (Math.random() - 0.5) * Math.PI * 4
      );

      mesh.castShadow = true;
      this.scene.add(mesh);

      const flying: FlyingVoxel = {
        mesh,
        velocity: direction,
        rotationSpeed,
        life: 0.5
      };
      this.flyingVoxels.push(flying);
      this.voxels.delete(key);
    }

    this.dirty = true;
    this.onSceneChange?.();

    setTimeout(() => {
      callback?.();
    }, 550);
  }

  private rebuildMeshes(): void {
    for (const mesh of this.instancedMeshes.values()) {
      this.scene.remove(mesh);
      mesh.dispose();
    }
    this.instancedMeshes.clear();

    const colorGroups = new Map<string, Voxel[]>();
    for (const voxel of this.voxels.values()) {
      if (!colorGroups.has(voxel.color)) {
        colorGroups.set(voxel.color, []);
      }
      colorGroups.get(voxel.color)!.push(voxel);
    }

    for (const [color, list] of colorGroups.entries()) {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        metalness: 0.1,
        roughness: 0.8
      });

      const instancedMesh = new THREE.InstancedMesh(
        this.boxGeometry,
        material,
        list.length
      );
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
      instancedMesh.name = `voxels_${color}`;

      for (let i = 0; i < list.length; i++) {
        const v = list[i];
        this.dummy.position.set(
          v.x * CELL_SIZE,
          v.y * CELL_SIZE,
          v.z * CELL_SIZE
        );
        const s = v.scale;
        this.dummy.scale.set(s, s, s);
        this.dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, this.dummy.matrix);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      this.instancedMeshes.set(color, instancedMesh);
      this.scene.add(instancedMesh);
    }

    this.dirty = false;
  }

  public update(deltaTime: number): void {
    const gravity = -30;
    const removeList: number[] = [];

    for (let i = this.flyingVoxels.length - 1; i >= 0; i--) {
      const f = this.flyingVoxels[i];
      f.velocity.y += gravity * deltaTime;
      
      f.mesh.position.add(f.velocity.clone().multiplyScalar(deltaTime));
      f.mesh.rotation.x += f.rotationSpeed.x * deltaTime;
      f.mesh.rotation.y += f.rotationSpeed.y * deltaTime;
      f.mesh.rotation.z += f.rotationSpeed.z * deltaTime;

      f.life -= deltaTime;
      if (f.life <= 0) {
        this.scene.remove(f.mesh);
        (f.mesh.material as THREE.Material).dispose();
        (f.mesh.geometry as THREE.BufferGeometry).dispose();
        this.flyingVoxels.splice(i, 1);
      }
    }

    let needsMeshUpdate = false;
    const keysToDelete: string[] = [];
    const animSpeed = 1 / 0.3;

    for (const [key, voxel] of this.voxels.entries()) {
      if (voxel.scale !== voxel.targetScale) {
        const diff = voxel.targetScale - voxel.scale;
        const step = animSpeed * deltaTime;
        
        if (Math.abs(diff) <= step) {
          voxel.scale = voxel.targetScale;
        } else {
          voxel.scale += Math.sign(diff) * step;
        }
        
        if (voxel.scale <= 0 && voxel.targetScale === 0 && !voxel.isGround) {
          keysToDelete.push(key);
        }
        needsMeshUpdate = true;
      }
    }

    for (const key of keysToDelete) {
      this.voxels.delete(key);
    }
    if (keysToDelete.length > 0) this.dirty = true;

    if (this.dirty) {
      this.rebuildMeshes();
    } else if (needsMeshUpdate) {
      this.updateInstanceMatrices();
    }
  }

  private updateInstanceMatrices(): void {
    const colorIndexMap = new Map<string, number>();
    for (const [color, mesh] of this.instancedMeshes.entries()) {
      colorIndexMap.set(color, 0);
    }

    for (const voxel of this.voxels.values()) {
      const mesh = this.instancedMeshes.get(voxel.color);
      if (!mesh) continue;
      
      const idx = colorIndexMap.get(voxel.color) || 0;
      colorIndexMap.set(voxel.color, idx + 1);

      this.dummy.position.set(
        voxel.x * CELL_SIZE,
        voxel.y * CELL_SIZE,
        voxel.z * CELL_SIZE
      );
      const s = Math.max(0.001, voxel.scale);
      this.dummy.scale.set(s, s, s);
      this.dummy.updateMatrix();
      mesh.setMatrixAt(idx, this.dummy.matrix);
    }

    for (const mesh of this.instancedMeshes.values()) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  public dispose(): void {
    for (const mesh of this.instancedMeshes.values()) {
      this.scene.remove(mesh);
      mesh.dispose();
    }
    this.instancedMeshes.clear();
    this.voxels.clear();
    this.boxGeometry.dispose();
    (this.groundPlane.material as THREE.Material).dispose();
    this.groundPlane.geometry.dispose();
    this.scene.remove(this.groundPlane);
  }
}
