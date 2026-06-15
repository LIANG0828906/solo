import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

export interface GreeneryConfig {
  type: 'tree' | 'shrub';
  x: number;
  z: number;
  id: string;
}

interface AnimatedPlant {
  id: string;
  config: GreeneryConfig;
  group: THREE.Group;
  phase: 'growing' | 'idle' | 'shrinking';
  progress: number;
  startTime: number;
  highlight?: THREE.Mesh;
}

export class GreeneryManager {
  private scene: THREE.Scene;
  private plants: Map<string, AnimatedPlant> = new Map();
  private maxPlants = 60;
  private groundPlane: THREE.Mesh;
  private onConfigChange: (configs: GreeneryConfig[]) => void;
  private raycaster: THREE.Raycaster;

  constructor(
    scene: THREE.Scene,
    groundPlane: THREE.Mesh,
    onConfigChange: (configs: GreeneryConfig[]) => void
  ) {
    this.scene = scene;
    this.groundPlane = groundPlane;
    this.onConfigChange = onConfigChange;
    this.raycaster = new THREE.Raycaster();
  }

  addTree(x: number, z: number): string | null {
    if (this.plants.size >= this.maxPlants) return null;

    const id = uuidv4();
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 2, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1;
    trunk.castShadow = true;
    group.add(trunk);

    const canopyGeo = new THREE.SphereGeometry(1.5, 16, 12);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 3;
    canopy.castShadow = true;
    group.add(canopy);

    const highlightGeo = new THREE.RingGeometry(1.8, 2.1, 32);
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0x2e8b57,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const highlight = new THREE.Mesh(highlightGeo, highlightMat);
    highlight.rotation.x = -Math.PI / 2;
    highlight.position.y = 0.05;
    group.add(highlight);

    group.scale.set(0, 0, 0);
    this.scene.add(group);

    const config: GreeneryConfig = { type: 'tree', x, z, id };
    const plant: AnimatedPlant = {
      id,
      config,
      group,
      phase: 'growing',
      progress: 0,
      startTime: performance.now(),
      highlight,
    };

    this.plants.set(id, plant);
    this.notifyChange();
    return id;
  }

  addShrub(x: number, z: number): string | null {
    if (this.plants.size >= this.maxPlants) return null;

    const id = uuidv4();
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const shrubGeo = new THREE.SphereGeometry(0.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const shrubMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const shrub = new THREE.Mesh(shrubGeo, shrubMat);
    shrub.position.y = 0;
    shrub.castShadow = true;
    group.add(shrub);

    const highlightGeo = new THREE.RingGeometry(1.0, 1.3, 32);
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0x228b22,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const highlight = new THREE.Mesh(highlightGeo, highlightMat);
    highlight.rotation.x = -Math.PI / 2;
    highlight.position.y = 0.05;
    group.add(highlight);

    group.scale.set(0, 0, 0);
    this.scene.add(group);

    const config: GreeneryConfig = { type: 'shrub', x, z, id };
    const plant: AnimatedPlant = {
      id,
      config,
      group,
      phase: 'growing',
      progress: 0,
      startTime: performance.now(),
      highlight,
    };

    this.plants.set(id, plant);
    this.notifyChange();
    return id;
  }

  removePlant(id: string): void {
    const plant = this.plants.get(id);
    if (!plant) return;
    plant.phase = 'shrinking';
    plant.startTime = performance.now();
  }

  findPlantAtPosition(worldX: number, worldZ: number): string | null {
    let closestId: string | null = null;
    let closestDist = Infinity;

    for (const [id, plant] of this.plants) {
      if (plant.phase === 'shrinking') continue;
      const dx = worldX - plant.config.x;
      const dz = worldZ - plant.config.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const hitRadius = plant.config.type === 'tree' ? 1.5 : 0.8;
      if (dist < hitRadius && dist < closestDist) {
        closestDist = dist;
        closestId = id;
      }
    }
    return closestId;
  }

  update(time: number): void {
    const toRemove: string[] = [];

    for (const [id, plant] of this.plants) {
      const elapsed = (time - plant.startTime) / 1000;

      if (plant.phase === 'growing') {
        const t = Math.min(elapsed / 0.3, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        plant.group.scale.setScalar(ease);
        if (t >= 1) {
          plant.phase = 'idle';
          plant.group.scale.setScalar(1);
        }
      } else if (plant.phase === 'shrinking') {
        const t = Math.min(elapsed / 0.25, 1);
        const ease = 1 - t;
        plant.group.scale.setScalar(Math.max(0, ease));
        if (t >= 1) {
          toRemove.push(id);
        }
      } else {
        if (plant.highlight) {
          const breathe = 0.15 + 0.1 * Math.sin(time * 0.003 + plant.config.x);
          plant.highlight.material.opacity = breathe;
        }
      }
    }

    for (const id of toRemove) {
      const plant = this.plants.get(id);
      if (plant) {
        this.scene.remove(plant.group);
        plant.group.traverse(obj => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (obj.material instanceof THREE.Material) {
              obj.material.dispose();
            }
          }
        });
        this.plants.delete(id);
      }
    }

    if (toRemove.length > 0) {
      this.notifyChange();
    }
  }

  getGreenConfig(): GreeneryConfig[] {
    return Array.from(this.plants.values())
      .filter(p => p.phase !== 'shrinking')
      .map(p => p.config);
  }

  getPlantCount(): number {
    return Array.from(this.plants.values()).filter(p => p.phase !== 'shrinking').length;
  }

  getCoveragePercent(): number {
    let totalArea = 0;
    for (const plant of this.plants.values()) {
      if (plant.phase === 'shrinking') continue;
      if (plant.config.type === 'tree') {
        totalArea += Math.PI * 1.5 * 1.5;
      } else {
        totalArea += Math.PI * 0.8 * 0.8;
      }
    }
    const gridArea = 50 * 50;
    return Math.min((totalArea / gridArea) * 100, 100);
  }

  clearAll(): void {
    for (const [id, plant] of this.plants) {
      this.scene.remove(plant.group);
      plant.group.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (obj.material instanceof THREE.Material) {
            obj.material.dispose();
          }
        }
      });
    }
    this.plants.clear();
    this.notifyChange();
  }

  private notifyChange(): void {
    this.onConfigChange(this.getGreenConfig());
  }
}
