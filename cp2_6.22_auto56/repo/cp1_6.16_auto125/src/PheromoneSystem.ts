import * as THREE from 'three';
import { PheromonePoint, Worker } from './types';

export class PheromoneSystem {
  private scene: THREE.Scene;
  private pheromones: Map<number, PheromonePoint> = new Map();
  private nextPheromoneId: number = 0;
  private readonly MAX_PHEROMONES: number = 500;
  private readonly PHEROMONE_RADIUS: number = 0.1;
  private decayRate: number = 0.05;
  private baseDecayRate: number = 0.05;
  private enhancedDecayRate: number = 0.025;
  private isEnhanced: boolean = false;
  private onPheromoneUpdateCallbacks: Array<() => void> = [];
  private gridSize: number = 50;
  private cellSize: number = 1;
  private gridMap: Map<string, Array<number>> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public getActiveCount(): number {
    return this.pheromones.size;
  }

  public setEnhancedMode(enabled: boolean): void {
    this.isEnhanced = enabled;
    this.decayRate = enabled ? this.enhancedDecayRate : this.baseDecayRate;
  }

  public addPheromoneUpdateCallback(callback: () => void): void {
    this.onPheromoneUpdateCallbacks.push(callback);
  }

  public addPheromone(position: THREE.Vector3, intensity: number = 1.0): void {
    if (this.pheromones.size >= this.MAX_PHEROMONES) {
      this.removeOldPheromones(Math.floor(this.MAX_PHEROMONES * 0.1));
    }

    const id = this.nextPheromoneId++;
    const color = new THREE.Color(0x00FF00);
    const geometry = new THREE.SphereGeometry(this.PHEROMONE_RADIUS, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: intensity * 0.6,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.position.y += 0.1;

    this.scene.add(mesh);

    const pheromone: PheromonePoint = {
      id,
      position: position.clone(),
      intensity,
      createdAt: performance.now(),
      color,
      mesh,
    };

    this.pheromones.set(id, pheromone);
    this.addToGrid(pheromone);
    this.notifyUpdate();
  }

  private addToGrid(pheromone: PheromonePoint): void {
    const key = this.getGridKey(pheromone.position);
    if (!this.gridMap.has(key)) {
      this.gridMap.set(key, []);
    }
    this.gridMap.get(key)!.push(pheromone.id);
  }

  private removeFromGrid(pheromone: PheromonePoint): void {
    const key = this.getGridKey(pheromone.position);
    const list = this.gridMap.get(key);
    if (list) {
      const idx = list.indexOf(pheromone.id);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
      if (list.length === 0) {
        this.gridMap.delete(key);
      }
    }
  }

  private getGridKey(position: THREE.Vector3): string {
    const gx = Math.floor(position.x / this.cellSize);
    const gz = Math.floor(position.z / this.cellSize);
    return `${gx},${gz}`;
  }

  private removeOldPheromones(count: number): void {
    const sorted = Array.from(this.pheromones.values())
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, count);

    for (const p of sorted) {
      this.removePheromone(p.id);
    }
  }

  private removePheromone(id: number): void {
    const pheromone = this.pheromones.get(id);
    if (pheromone) {
      this.scene.remove(pheromone.mesh);
      pheromone.mesh.geometry.dispose();
      (pheromone.mesh.material as THREE.Material).dispose();
      this.removeFromGrid(pheromone);
      this.pheromones.delete(id);
    }
  }

  public getPheromoneIntensityAt(position: THREE.Vector3, radius: number = 2): number {
    let totalIntensity = 0;
    const cellsToCheck = this.getSurroundingGridKeys(position, radius);

    for (const key of cellsToCheck) {
      const ids = this.gridMap.get(key);
      if (!ids) continue;
      for (const id of ids) {
        const p = this.pheromones.get(id);
        if (!p) continue;
        const dist = p.position.distanceTo(position);
        if (dist < radius) {
          totalIntensity += p.intensity * (1 - dist / radius);
        }
      }
    }
    return totalIntensity;
  }

  public getDirectionToNest(position: THREE.Vector3, nestPosition: THREE.Vector3): THREE.Vector3 {
    let gradient = new THREE.Vector3();
    const checkRadius = 4;
    const samples = 8;

    for (let i = 0; i < samples; i++) {
      const angle = (i / samples) * Math.PI * 2;
      const samplePos = new THREE.Vector3(
        position.x + Math.cos(angle) * checkRadius,
        position.y,
        position.z + Math.sin(angle) * checkRadius
      );
      const intensity = this.getPheromoneIntensityAt(samplePos, 2);
      gradient.x += Math.cos(angle) * intensity;
      gradient.z += Math.sin(angle) * intensity;
    }

    if (gradient.length() > 0.1) {
      gradient.normalize();
      const toNest = new THREE.Vector3().subVectors(nestPosition, position);
      toNest.y = 0;
      toNest.normalize();
      gradient.lerp(toNest, 0.3);
      gradient.normalize();
      return gradient;
    } else {
      const toNest = new THREE.Vector3().subVectors(nestPosition, position);
      toNest.y = 0;
      toNest.normalize();
      return toNest;
    }
  }

  private getSurroundingGridKeys(position: THREE.Vector3, radius: number): Array<string> {
    const keys: Array<string> = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const gx = Math.floor(position.x / this.cellSize);
    const gz = Math.floor(position.z / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        keys.push(`${gx + dx},${gz + dz}`);
      }
    }
    return keys;
  }

  public checkAndApplyStackEffect(position: THREE.Vector3): boolean {
    const nearPheromones: Array<PheromonePoint> = [];
    const radius = 2;
    const cellsToCheck = this.getSurroundingGridKeys(position, radius);

    for (const key of cellsToCheck) {
      const ids = this.gridMap.get(key);
      if (!ids) continue;
      for (const id of ids) {
        const p = this.pheromones.get(id);
        if (!p) continue;
        if (p.position.distanceTo(position) < radius) {
          nearPheromones.push(p);
        }
      }
    }

    const now = performance.now();
    const oldPheromones = nearPheromones.filter(p => now - p.createdAt > 2000);
    
    if (nearPheromones.length >= 10 && oldPheromones.length >= 5) {
      for (const p of nearPheromones) {
        p.intensity = Math.min(p.intensity * 2, 3.0);
        p.color.setHex(0x00FFFF);
        const mat = p.mesh.material as THREE.MeshBasicMaterial;
        mat.color.copy(p.color);
        mat.opacity = Math.min(p.intensity * 0.6, 0.9);
      }
      this.notifyUpdate();
      return true;
    }
    return false;
  }

  public update(deltaTime: number, workers: Array<Worker>): void {
    const toRemove: Array<number> = [];
    const now = performance.now();

    for (const [id, pheromone] of this.pheromones) {
      pheromone.intensity -= this.decayRate * deltaTime * 60;
      if (pheromone.intensity <= 0.01) {
        toRemove.push(id);
        continue;
      }

      const mat = pheromone.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.min(pheromone.intensity * 0.6, 0.8);

      if (now - pheromone.createdAt > 100 && !pheromone.color.equals(new THREE.Color(0x00FF00))) {
        pheromone.color.lerp(new THREE.Color(0x00FF00), deltaTime * 2);
        mat.color.copy(pheromone.color);
      }
    }

    for (const id of toRemove) {
      this.removePheromone(id);
    }

    const releaseInterval = 100;
    for (const worker of workers) {
      if (worker.state === 'dead') continue;
      if (now - worker.lastPheromoneTime >= releaseInterval) {
        if (worker.state === 'moving_to_target' || worker.state === 'returning_to_nest') {
          this.addPheromone(worker.position, worker.carryingFood ? 1.5 : 1.0);
          worker.lastPheromoneTime = now;
        }
      }
    }

    if (toRemove.length > 0) {
      this.notifyUpdate();
    }
  }

  private notifyUpdate(): void {
    for (const callback of this.onPheromoneUpdateCallbacks) {
      callback();
    }
  }

  public dispose(): void {
    for (const id of Array.from(this.pheromones.keys())) {
      this.removePheromone(id);
    }
    this.gridMap.clear();
  }
}
