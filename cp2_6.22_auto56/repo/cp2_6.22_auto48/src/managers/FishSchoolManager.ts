import * as THREE from 'three';
import { FishData } from '../types';

export interface Fish {
  id: string;
  mesh: THREE.Group;
  data: FishData;
  turnTimer: number;
  nextTurnTime: number;
}

export class FishSchoolManager {
  private scene: THREE.Scene;
  private fishes: Map<string, Fish> = new Map();
  private bounds: THREE.Box3;
  private fishCount: number = 20;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.bounds = new THREE.Box3(
      new THREE.Vector3(-60, -20, -60),
      new THREE.Vector3(60, 5, 60)
    );
  }

  createSchool(count: number = 20): void {
    this.fishCount = count;
    for (let i = 0; i < count; i++) {
      this.createFish(`fish_${i}`);
    }
  }

  private createFish(id: string): void {
    const group = new THREE.Group();

    const size = 0.4 + Math.random() * 0.5;

    const bodyGeo = new THREE.SphereGeometry(size, 12, 8);
    bodyGeo.scale(1.6, 1, 1);
    const hue = 0.5 + Math.random() * 0.15;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.7, 0.5),
      roughness: 0.5,
      metalness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    const tailGeo = new THREE.ConeGeometry(size * 0.8, size * 1.2, 4);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.x = -size * 1.4;
    tail.rotation.z = Math.PI / 2;
    group.add(tail);

    const finGeo = new THREE.ConeGeometry(size * 0.5, size * 0.8, 3);
    const finMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.6, 0.4),
      roughness: 0.6,
    });
    const finTop = new THREE.Mesh(finGeo, finMat);
    finTop.position.set(0, size * 0.9, 0);
    finTop.rotation.z = Math.PI;
    group.add(finTop);

    const eyeGeo = new THREE.SphereGeometry(size * 0.15, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1 });
    const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
    eye1.position.set(size * 1.0, size * 0.25, size * 0.35);
    group.add(eye1);
    const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
    eye2.position.set(size * 1.0, size * 0.25, -size * 0.35);
    group.add(eye2);

    const sizeVec = this.bounds.getSize(new THREE.Vector3());
    const position = new THREE.Vector3(
      this.bounds.min.x + Math.random() * sizeVec.x,
      this.bounds.min.y + Math.random() * sizeVec.y,
      this.bounds.min.z + Math.random() * sizeVec.z
    );
    group.position.copy(position);

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 6
    );
    velocity.clampLength(1.5, 5);

    group.userData.materialType = 'fish';
    group.traverse((child) => {
      child.userData.materialType = 'fish';
    });
    this.scene.add(group);

    const data: FishData = {
      id,
      position: group.position,
      velocity,
      size,
    };
    const fish: Fish = {
      id,
      mesh: group,
      data,
      turnTimer: 0,
      nextTurnTime: 1 + Math.random() * 3,
    };
    this.fishes.set(id, fish);
  }

  update(delta: number, currentTime: number): void {
    this.fishes.forEach((fish) => {
      fish.turnTimer += delta;
      if (fish.turnTimer >= fish.nextTurnTime) {
        fish.turnTimer = 0;
        fish.nextTurnTime = 1.5 + Math.random() * 3;
        this.randomSteer(fish);
      }

      fish.data.position.add(fish.data.velocity.clone().multiplyScalar(delta));
      this.handleBoundaryCollision(fish);

      fish.mesh.position.copy(fish.data.position);
      const lookTarget = fish.data.position.clone().add(fish.data.velocity);
      fish.mesh.lookAt(lookTarget);

      const tailSwing = Math.sin(currentTime * 6 + fish.data.position.x) * 0.4;
      if (fish.mesh.children[1]) {
        fish.mesh.children[1].rotation.y = tailSwing;
      }
    });
  }

  private randomSteer(fish: Fish): void {
    const deltaV = new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 3
    );
    fish.data.velocity.add(deltaV);
    fish.data.velocity.clampLength(1, 5);
  }

  private handleBoundaryCollision(fish: Fish): void {
    const p = fish.data.position;
    const v = fish.data.velocity;
    const pad = 2;

    if (p.x < this.bounds.min.x + pad) { p.x = this.bounds.min.x + pad; v.x = Math.abs(v.x) * 0.8; }
    if (p.x > this.bounds.max.x - pad) { p.x = this.bounds.max.x - pad; v.x = -Math.abs(v.x) * 0.8; }
    if (p.y < this.bounds.min.y + pad) { p.y = this.bounds.min.y + pad; v.y = Math.abs(v.y) * 0.8; }
    if (p.y > this.bounds.max.y - pad) { p.y = this.bounds.max.y - pad; v.y = -Math.abs(v.y) * 0.8; }
    if (p.z < this.bounds.min.z + pad) { p.z = this.bounds.min.z + pad; v.z = Math.abs(v.z) * 0.8; }
    if (p.z > this.bounds.max.z - pad) { p.z = this.bounds.max.z - pad; v.z = -Math.abs(v.z) * 0.8; }
  }

  getFishes(): Map<string, Fish> {
    return this.fishes;
  }

  getFishCount(): number {
    return this.fishCount;
  }

  dispose(): void {
    this.fishes.forEach((fish) => {
      this.scene.remove(fish.mesh);
      fish.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.fishes.clear();
  }
}
