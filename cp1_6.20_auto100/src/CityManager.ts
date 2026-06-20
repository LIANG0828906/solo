import * as THREE from 'three';
import {
  BuildingParams,
  BuildingStyle,
  createBuildingMesh,
  updateBuildingHeight,
  setBuildingGlow,
  updateParticles,
  disposeBuilding,
  getHeightColor,
  randomStyle,
} from './BuildingFactory';

export interface CityConfig {
  buildingDensity: number;
  growthSpeed: number;
  maxHeight: number;
}

interface GrowthTask {
  building: BuildingParams;
  startTime: number;
  duration: number;
}

export class CityManager {
  buildings: Map<string, BuildingParams> = new Map();
  scene: THREE.Scene;
  config: CityConfig;
  growthQueue: GrowthTask[] = [];
  activeGrowths: GrowthTask[] = [];
  removeQueue: BuildingParams[] = [];
  activeRemovals: BuildingParams[] = [];
  isGrowing: boolean = false;
  growthComplete: boolean = false;
  maxConcurrentGrowths = 5;
  maxConcurrentRemovals = 20;
  animationFrameId: number | null = null;
  lastTime: number = 0;
  onGrowthComplete: (() => void) | null = null;
  onBuildingCountChange: ((count: number) => void) | null = null;
  private groundPlane: THREE.Mesh | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private cityRadius = 80;

  constructor(scene: THREE.Scene, config: CityConfig) {
    this.scene = scene;
    this.config = config;
    this.createGround();
  }

  private createGround(): void {
    if (this.groundPlane) {
      this.scene.remove(this.groundPlane);
      this.groundPlane.geometry.dispose();
      (this.groundPlane.material as THREE.Material).dispose();
    }
    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
    }

    const groundGeom = new THREE.PlaneGeometry(this.cityRadius * 2.5, this.cityRadius * 2.5);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.groundPlane = new THREE.Mesh(groundGeom, groundMat);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = -0.05;
    this.scene.add(this.groundPlane);

    this.gridHelper = new THREE.GridHelper(this.cityRadius * 2.5, 60, 0x2a2a4e, 0x1a1a3e);
    (this.gridHelper.material as THREE.Material).transparent = true;
    (this.gridHelper.material as THREE.Material).opacity = 0.4;
    this.scene.add(this.gridHelper);
  }

  generateInitialCity(): void {
    this.clearAll();
    const count = this.config.buildingDensity;
    for (let i = 0; i < count; i++) {
      const building = this.generateBuilding(i, count);
      if (building.mesh) {
        this.scene.add(building.mesh);
        this.buildings.set(building.id, building);
      }
    }
    this.onBuildingCountChange?.(this.buildings.size);
  }

  private generateBuilding(index: number, total: number): BuildingParams {
    const angle = Math.random() * Math.PI * 2;
    const distFrac = Math.pow(Math.random(), 0.6);
    const dist = distFrac * this.cityRadius * 0.85;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    const heightPower = Math.pow(Math.random(), 2.5);
    const rawHeight = this.config.maxHeight * (1 - heightPower * 0.85);
    const targetHeight = Math.max(5, Math.min(this.config.maxHeight, rawHeight + 3));

    const widthBase = 3 + Math.random() * 5;
    const depthBase = 3 + Math.random() * 5;
    const width = targetHeight > this.config.maxHeight * 0.7 ? widthBase * 1.3 : widthBase;
    const depth = targetHeight > this.config.maxHeight * 0.7 ? depthBase * 1.2 : depthBase;

    const normalizedHeight = targetHeight / this.config.maxHeight;
    const color = getHeightColor(normalizedHeight);

    const style = targetHeight > this.config.maxHeight * 0.6
      ? (Math.random() < 0.5 ? 'coneTop' : 'prism')
      : randomStyle();

    const position = new THREE.Vector3(x, 0.1, z);

    return createBuildingMesh({
      position,
      targetHeight,
      width,
      depth,
      color,
      style,
    });
  }

  adjustDensity(newDensity: number): void {
    const currentCount = this.buildings.size;
    const diff = newDensity - currentCount;

    if (diff > 0) {
      const toAdd = Math.min(diff, 20);
      for (let i = 0; i < toAdd; i++) {
        const building = this.generateBuilding(
          currentCount + i,
          newDensity
        );
        if (building.mesh) {
          this.scene.add(building.mesh);
          this.buildings.set(building.id, building);
          this.startBuildingGrowth(building);
        }
      }
    } else if (diff < 0) {
      const toRemove = Math.min(-diff, 20);
      const buildingArray = Array.from(this.buildings.values());
      for (let i = 0; i < toRemove && buildingArray.length > 0; i++) {
        const idx = Math.floor(Math.random() * buildingArray.length);
        const building = buildingArray.splice(idx, 1)[0];
        building.isRemoving = true;
        this.removeQueue.push(building);
      }
    }

    this.config.buildingDensity = newDensity;
    this.onBuildingCountChange?.(this.buildings.size);
  }

  startGrowth(): void {
    this.isGrowing = true;
    this.growthComplete = false;

    const unGrown = Array.from(this.buildings.values()).filter(
      (b) => b.currentHeight < b.targetHeight * 0.99 && !b.isRemoving
    );

    const shuffled = unGrown.sort(() => Math.random() - 0.5);
    for (const building of shuffled) {
      const baseDuration = 0.5 + Math.random() * 1.5;
      const duration = baseDuration / this.config.growthSpeed;
      this.growthQueue.push({
        building,
        startTime: 0,
        duration,
      });
    }

    this.scheduleGrowth();
  }

  private scheduleGrowth(): void {
    while (
      this.activeGrowths.length < this.maxConcurrentGrowths &&
      this.growthQueue.length > 0
    ) {
      const task = this.growthQueue.shift()!;
      task.startTime = performance.now() / 1000;
      task.building.isGrowing = true;
      this.activeGrowths.push(task);
    }
  }

  private startBuildingGrowth(building: BuildingParams): void {
    const baseDuration = 0.5 + Math.random() * 1.0;
    const duration = baseDuration / this.config.growthSpeed;
    const task: GrowthTask = {
      building,
      startTime: performance.now() / 1000,
      duration,
    };
    building.isGrowing = true;
    this.growthQueue.push(task);
    this.scheduleGrowth();
  }

  update(time: number): void {
    const now = time;
    const deltaTime = Math.min(0.05, now - this.lastTime);
    this.lastTime = now;

    this.processGrowth(now);
    this.processRemovals(deltaTime);
    this.processActiveRemovals(deltaTime);

    for (const building of this.buildings.values()) {
      if (building.isGrowing || building.currentHeight > 0) {
        updateParticles(building, deltaTime);
      }
    }
  }

  private processGrowth(now: number): void {
    this.scheduleGrowth();

    const completed: GrowthTask[] = [];
    for (const task of this.activeGrowths) {
      const elapsed = now - task.startTime;
      const t = Math.min(1, elapsed / task.duration);
      const eased = 1 - Math.pow(1 - t, 3);

      updateBuildingHeight(task.building, eased);

      if (t < 1) {
        const glowIntensity = Math.sin(t * Math.PI) * 2;
        setBuildingGlow(task.building, true, glowIntensity);
      } else {
        updateBuildingHeight(task.building, 1);
        setBuildingGlow(task.building, false, 0);
        task.building.isGrowing = false;
        task.building.currentHeight = task.building.targetHeight;
        completed.push(task);
      }
    }

    for (const task of completed) {
      const idx = this.activeGrowths.indexOf(task);
      if (idx !== -1) this.activeGrowths.splice(idx, 1);
    }

    if (
      this.isGrowing &&
      this.activeGrowths.length === 0 &&
      this.growthQueue.length === 0
    ) {
      this.isGrowing = false;
      this.growthComplete = true;
      this.onGrowthComplete?.();
    }
  }

  private processRemovals(_deltaTime: number): void {
    while (
      this.activeRemovals.length < this.maxConcurrentRemovals &&
      this.removeQueue.length > 0
    ) {
      const building = this.removeQueue.shift()!;
      this.activeRemovals.push(building);
    }
  }

  private processActiveRemovals(deltaTime: number): void {
    const completed: BuildingParams[] = [];
    for (const building of this.activeRemovals) {
      if (!building.mesh) {
        completed.push(building);
        continue;
      }
      const currentScale = building.mesh.scale.y;
      const newScale = currentScale - deltaTime * 2;
      if (newScale <= 0.01) {
        this.scene.remove(building.mesh);
        this.buildings.delete(building.id);
        disposeBuilding(building);
        completed.push(building);
      } else {
        building.mesh.scale.y = newScale;
      }
    }

    for (const b of completed) {
      const idx = this.activeRemovals.indexOf(b);
      if (idx !== -1) this.activeRemovals.splice(idx, 1);
    }
  }

  getBuildingById(id: string): BuildingParams | undefined {
    return this.buildings.get(id);
  }

  highlightBuilding(id: string): void {
    const building = this.buildings.get(id);
    if (building) {
      setBuildingGlow(building, true, 1.5);
      if (building.highlightMesh) {
        building.highlightMesh.visible = true;
      }
    }
  }

  unhighlightBuilding(id: string): void {
    const building = this.buildings.get(id);
    if (building) {
      setBuildingGlow(building, false, 0);
      if (building.highlightMesh) {
        building.highlightMesh.visible = false;
      }
    }
  }

  clearAll(): void {
    for (const building of this.buildings.values()) {
      if (building.mesh) {
        this.scene.remove(building.mesh);
        disposeBuilding(building);
      }
    }
    this.buildings.clear();
    this.growthQueue = [];
    this.activeGrowths = [];
    this.removeQueue = [];
    this.activeRemovals = [];
    this.isGrowing = false;
    this.growthComplete = false;
  }

  dispose(): void {
    this.clearAll();
    if (this.groundPlane) {
      this.scene.remove(this.groundPlane);
      this.groundPlane.geometry.dispose();
      (this.groundPlane.material as THREE.Material).dispose();
    }
    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
    }
  }
}
