import * as THREE from 'three';
import { VoxelData, VoxelPosition } from './voxelEditor';
import { PresetVoxel } from './presetManager';
import { ColorSystem } from './colorSystem';

interface ActiveVoxel {
  instanceId: number;
  position: VoxelPosition;
  color: string;
  emissiveIntensity: number;
  animState: 'idle' | 'bounce' | 'none';
  animProgress: number;
}

interface ShardParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  startScale: number;
}

interface BounceAnimation {
  instanceId: number;
  progress: number;
  duration: number;
  peakScale: number;
}

export class SceneRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: any;

  private instancedMesh: THREE.InstancedMesh;
  private dummy: THREE.Object3D;
  private colorArray: Float32Array;
  private emissiveArray: Float32Array;
  private activeVoxels: Map<string, ActiveVoxel> = new Map();
  private freeInstanceIds: number[] = [];
  private nextInstanceId: number = 0;
  private readonly MAX_INSTANCES = 800;

  private shardParticles: ShardParticle[] = [];
  private bounceAnimations: BounceAnimation[] = [];

  private gridHelper!: THREE.GridHelper;
  private gridGroup: THREE.Group;

  private shardGeometry: THREE.BoxGeometry;

  private presetAnimationQueue: PresetVoxel[] = [];
  private presetAnimationTime: number = 0;
  private presetAnimationInterval: number = 80;
  private isPresetAnimating: boolean = false;
  private presetColorSystem: ColorSystem;

  private voxelSize = 0.8;
  private halfGrid = 15;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    controls: any,
    colorSystem: ColorSystem
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;
    this.presetColorSystem = colorSystem;
    this.dummy = new THREE.Object3D();

    const voxelGeometry = new THREE.BoxGeometry(this.voxelSize, this.voxelSize, this.voxelSize);
    const voxelMaterial = new THREE.MeshStandardMaterial({
      metalness: 0.1,
      roughness: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 1.0
    });

    this.instancedMesh = new THREE.InstancedMesh(
      voxelGeometry,
      voxelMaterial,
      this.MAX_INSTANCES
    );
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.count = 0;

    this.colorArray = new Float32Array(this.MAX_INSTANCES * 3);
    this.emissiveArray = new Float32Array(this.MAX_INSTANCES * 3);

    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
      this.colorArray,
      3
    );
    (this.instancedMesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x000000);
    (this.instancedMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;

    this.scene.add(this.instancedMesh);

    this.shardGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);

    this.gridGroup = new THREE.Group();
    this.createGridHelper();

    for (let i = 0; i < this.MAX_INSTANCES; i++) {
      this.freeInstanceIds.push(i);
    }
  }

  private createGridHelper(): void {
    const size = 30;
    const divisions = 30;

    const gridXY = new THREE.GridHelper(size, divisions, 0x45a29e, 0x45a29e);
    gridXY.rotation.x = Math.PI / 2;
    gridXY.position.z = -this.halfGrid;
    (gridXY.material as THREE.Material).opacity = 0.15;
    (gridXY.material as THREE.Material).transparent = true;

    const gridXZ = new THREE.GridHelper(size, divisions, 0x45a29e, 0x45a29e);
    gridXZ.position.y = -this.halfGrid;
    (gridXZ.material as THREE.Material).opacity = 0.15;
    (gridXZ.material as THREE.Material).transparent = true;

    const gridYZ = new THREE.GridHelper(size, divisions, 0x45a29e, 0x45a29e);
    gridYZ.rotation.z = Math.PI / 2;
    gridYZ.position.x = -this.halfGrid;
    (gridYZ.material as THREE.Material).opacity = 0.15;
    (gridYZ.material as THREE.Material).transparent = true;

    this.gridGroup.add(gridXY, gridXZ, gridYZ);
    this.scene.add(this.gridGroup);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(30, 30, 30)),
      new THREE.LineBasicMaterial({ color: 0x45a29e, transparent: true, opacity: 0.3 })
    );
    this.gridGroup.add(edges);

    this.gridHelper = gridXZ;
  }

  getVoxelObjects(): THREE.Object3D[] {
    return [this.instancedMesh];
  }

  getGridHelper(): THREE.Object3D {
    return this.gridHelper;
  }

  private getPosKey(pos: VoxelPosition): string {
    return `${pos.x},${pos.y},${pos.z}`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255
        }
      : { r: 1, g: 1, b: 1 };
  }

  private gridToWorld(x: number, y: number, z: number): THREE.Vector3 {
    return new THREE.Vector3(
      (x - this.halfGrid) * 1.0,
      (y - this.halfGrid) * 1.0,
      (z - this.halfGrid) * 1.0
    );
  }

  addVoxel(data: VoxelData): void {
    const key = this.getPosKey(data.position);
    if (this.activeVoxels.has(key)) return;
    if (this.freeInstanceIds.length === 0) return;

    const instanceId = this.freeInstanceIds.shift()!;
    const worldPos = this.gridToWorld(
      data.position.x,
      data.position.y,
      data.position.z
    );

    this.dummy.position.copy(worldPos);
    this.dummy.scale.set(0, 0, 0);
    this.dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(instanceId, this.dummy.matrix);

    const rgb = this.hexToRgb(data.color);
    const offset = instanceId * 3;
    this.colorArray[offset] = rgb.r;
    this.colorArray[offset + 1] = rgb.g;
    this.colorArray[offset + 2] = rgb.b;
    this.emissiveArray[offset] = rgb.r;
    this.emissiveArray[offset + 1] = rgb.g;
    this.emissiveArray[offset + 2] = rgb.b;

    this.instancedMesh.instanceColor!.needsUpdate = true;

    this.activeVoxels.set(key, {
      instanceId,
      position: { ...data.position },
      color: data.color,
      emissiveIntensity: data.emissiveIntensity,
      animState: 'bounce',
      animProgress: 0
    });

    this.bounceAnimations.push({
      instanceId,
      progress: 0,
      duration: 0.3,
      peakScale: 1.3
    });

    this.updateInstanceCount();
  }

  removeVoxel(data: VoxelData): void {
    const key = this.getPosKey(data.position);
    const voxel = this.activeVoxels.get(key);
    if (!voxel) return;

    this.createShardParticles(data);

    this.dummy.scale.set(0, 0, 0);
    this.dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(voxel.instanceId, this.dummy.matrix);

    const offset = voxel.instanceId * 3;
    this.colorArray[offset] = 0;
    this.colorArray[offset + 1] = 0;
    this.colorArray[offset + 2] = 0;
    this.emissiveArray[offset] = 0;
    this.emissiveArray[offset + 1] = 0;
    this.emissiveArray[offset + 2] = 0;
    this.instancedMesh.instanceColor!.needsUpdate = true;

    this.freeInstanceIds.push(voxel.instanceId);
    this.activeVoxels.delete(key);

    this.bounceAnimations = this.bounceAnimations.filter(
      b => b.instanceId !== voxel.instanceId
    );

    this.updateInstanceCount();
  }

  private createShardParticles(data: VoxelData): void {
    const worldPos = this.gridToWorld(
      data.position.x,
      data.position.y,
      data.position.z
    );
    const rgb = this.hexToRgb(data.color);
    const shardMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(rgb.r, rgb.g, rgb.b),
      emissive: new THREE.Color(rgb.r, rgb.g, rgb.b),
      emissiveIntensity: data.emissiveIntensity,
      transparent: true,
      opacity: 1.0
    });

    const corners = [
      { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 },
      { x: -1, y: 1, z: -1 }, { x: 1, y: 1, z: -1 },
      { x: -1, y: -1, z: 1 }, { x: 1, y: -1, z: 1 },
      { x: -1, y: 1, z: 1 }, { x: 1, y: 1, z: 1 }
    ];

    for (let i = 0; i < 8; i++) {
      const corner = corners[i];
      const mesh = new THREE.Mesh(this.shardGeometry, shardMaterial.clone());
      mesh.position.set(
        worldPos.x + corner.x * 0.2,
        worldPos.y + corner.y * 0.2,
        worldPos.z + corner.z * 0.2
      );
      mesh.scale.setScalar(0.4);

      const velocity = new THREE.Vector3(
        corner.x * (1.5 + Math.random() * 2),
        corner.y * (1.5 + Math.random() * 2) + 2,
        corner.z * (1.5 + Math.random() * 2)
      );

      this.scene.add(mesh);
      this.shardParticles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4,
        startScale: 0.4
      });
    }
  }

  updateAllEmissiveIntensity(intensity: number): void {
    (this.instancedMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;

    this.activeVoxels.forEach(voxel => {
      voxel.emissiveIntensity = intensity;
    });
  }

  private updateInstanceCount(): void {
    this.instancedMesh.count = this.activeVoxels.size;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  startPresetAnimation(presets: PresetVoxel[], colorSystem: ColorSystem): void {
    this.clearAll();
    this.presetAnimationQueue = [...presets];
    this.presetAnimationTime = 0;
    this.isPresetAnimating = true;
    this.presetColorSystem = colorSystem;
  }

  private updatePresetAnimation(deltaTime: number): void {
    if (!this.isPresetAnimating || this.presetAnimationQueue.length === 0) {
      this.isPresetAnimating = false;
      return;
    }

    this.presetAnimationTime += deltaTime * 1000;

    while (
      this.presetAnimationTime >= this.presetAnimationInterval &&
      this.presetAnimationQueue.length > 0 &&
      this.activeVoxels.size < this.MAX_INSTANCES
    ) {
      const preset = this.presetAnimationQueue.shift()!;
      const colors = this.presetColorSystem.getPresetColors();
      const color = colors[preset.colorIndex % colors.length]?.hex || '#ffffff';

      const voxelData: VoxelData = {
        position: { x: preset.x, y: preset.y, z: preset.z },
        color,
        emissiveIntensity: this.presetColorSystem.getEmissiveIntensity()
      };

      this.addVoxel(voxelData);
      this.presetAnimationTime -= this.presetAnimationInterval;
    }

    if (this.presetAnimationQueue.length === 0) {
      this.isPresetAnimating = false;
    }
  }

  update(deltaTime: number): void {
    this.updateBounceAnimations(deltaTime);
    this.updateShardParticles(deltaTime);
    this.updatePresetAnimation(deltaTime);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  private updateBounceAnimations(deltaTime: number): void {
    for (let i = this.bounceAnimations.length - 1; i >= 0; i--) {
      const anim = this.bounceAnimations[i];
      anim.progress += deltaTime;

      const t = Math.min(anim.progress / anim.duration, 1.0);
      const scale = this.easeOutElastic(t);

      let found = false;
      this.activeVoxels.forEach(voxel => {
        if (voxel.instanceId === anim.instanceId) {
          found = true;
          const worldPos = this.gridToWorld(
            voxel.position.x,
            voxel.position.y,
            voxel.position.z
          );
          this.dummy.position.copy(worldPos);
          this.dummy.scale.setScalar(scale);
          this.dummy.updateMatrix();
          this.instancedMesh.setMatrixAt(anim.instanceId, this.dummy.matrix);
        }
      });

      if (t >= 1.0 || !found) {
        if (found) {
          this.activeVoxels.forEach(voxel => {
            if (voxel.instanceId === anim.instanceId) {
              voxel.animState = 'idle';
            }
          });
        }
        this.bounceAnimations.splice(i, 1);
      }
    }
  }

  private easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -8 * t) * Math.sin((t * 8 - 0.75) * c4) + 1;
  }

  private updateShardParticles(deltaTime: number): void {
    const gravity = -9.8;

    for (let i = this.shardParticles.length - 1; i >= 0; i--) {
      const shard = this.shardParticles[i];
      shard.life += deltaTime;

      shard.velocity.y += gravity * deltaTime;
      shard.mesh.position.addScaledVector(shard.velocity, deltaTime);
      shard.mesh.rotation.x += deltaTime * 3;
      shard.mesh.rotation.y += deltaTime * 2;

      const lifeRatio = shard.life / shard.maxLife;
      const scale = shard.startScale * (1 - lifeRatio * 0.5);
      shard.mesh.scale.setScalar(scale);

      const material = shard.mesh.material as THREE.MeshStandardMaterial;
      material.opacity = Math.max(0, 1 - lifeRatio);
      material.emissiveIntensity = Math.max(0, 1 - lifeRatio);

      if (shard.life >= shard.maxLife) {
        this.scene.remove(shard.mesh);
        material.dispose();
        this.shardParticles.splice(i, 1);
      }
    }
  }

  clearAll(): void {
    const removeList: VoxelData[] = [];
    this.activeVoxels.forEach(voxel => {
      removeList.push({
        position: { ...voxel.position },
        color: voxel.color,
        emissiveIntensity: voxel.emissiveIntensity
      });
    });

    removeList.forEach(data => {
      const key = this.getPosKey(data.position);
      const voxel = this.activeVoxels.get(key);
      if (voxel) {
        this.createShardParticles(data);
        this.freeInstanceIds.push(voxel.instanceId);

        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(voxel.instanceId, this.dummy.matrix);

        const offset = voxel.instanceId * 3;
        this.colorArray[offset] = 0;
        this.colorArray[offset + 1] = 0;
        this.colorArray[offset + 2] = 0;
        this.emissiveArray[offset] = 0;
        this.emissiveArray[offset + 1] = 0;
        this.emissiveArray[offset + 2] = 0;
      }
    });

    this.activeVoxels.clear();
    this.bounceAnimations = [];
    this.presetAnimationQueue = [];
    this.isPresetAnimating = false;

    this.instancedMesh.instanceColor!.needsUpdate = true;
    this.updateInstanceCount();
  }

  getVoxelCount(): number {
    return this.activeVoxels.size;
  }

  isPresetAnimatingActive(): boolean {
    return this.isPresetAnimating;
  }

  dispose(): void {
    this.instancedMesh.geometry.dispose();
    (this.instancedMesh.material as THREE.Material).dispose();
    this.shardGeometry.dispose();

    this.shardParticles.forEach(shard => {
      (shard.mesh.material as THREE.Material).dispose();
    });
  }
}
