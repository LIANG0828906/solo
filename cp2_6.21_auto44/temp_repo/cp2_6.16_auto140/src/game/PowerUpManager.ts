import * as THREE from 'three';
import type { PowerUpData, PowerUpType } from '../types';
import { POWERUP_COLORS } from '../types';
import { generateId, getRoadWorldWidth, computeAABB, randomRange, randomChoice } from '../utils/helpers';

export class PowerUpManager {
  private scene: THREE.Scene;
  public powerUps: PowerUpData[] = [];
  private spawnTimer = 2;
  private halfRoadWidth: number;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.halfRoadWidth = getRoadWorldWidth() / 2 - 2;
  }

  private createMesh(type: PowerUpType): THREE.Mesh {
    const geo = new THREE.SphereGeometry(0.7, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: POWERUP_COLORS[type],
      emissive: POWERUP_COLORS[type],
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);

    const outerGeo = new THREE.RingGeometry(0.9, 1.0, 24);
    const outerMat = new THREE.MeshBasicMaterial({
      color: POWERUP_COLORS[type],
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.rotation.x = Math.PI / 2;
    mesh.add(outer);

    return mesh;
  }

  public spawn(): void {
    const types: PowerUpType[] = ['speed', 'shield', 'double'];
    const type = randomChoice(types);
    const x = randomRange(-this.halfRoadWidth, this.halfRoadWidth);
    const z = -500;
    const pos = new THREE.Vector3(x, 1.5, z);

    const mesh = this.createMesh(type);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.powerUps.push({
      id: generateId(),
      type,
      position: pos,
      mesh,
      aabb: computeAABB(pos, 1.5, 1.5),
    });
  }

  public update(speed: number, delta: number, playerZ: number): void {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.position.z += speed * delta;
      pu.mesh.position.copy(pu.position);
      pu.mesh.position.y = 1.5 + Math.sin(Date.now() * 0.003 + i) * 0.3;
      pu.mesh.rotation.y += delta * 3;
      pu.aabb = computeAABB(pu.position, 1.5, 1.5);

      if (pu.position.z > playerZ + 80) {
        this.scene.remove(pu.mesh);
        (pu.mesh.material as THREE.Material).dispose();
        this.powerUps.splice(i, 1);
      }
    }

    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = randomRange(2, 5);
    }
  }

  public removePowerUp(id: string): void {
    const idx = this.powerUps.findIndex((p) => p.id === id);
    if (idx >= 0) {
      this.scene.remove(this.powerUps[idx].mesh);
      (this.powerUps[idx].mesh.material as THREE.Material).dispose();
      this.powerUps.splice(idx, 1);
    }
  }

  public clearAll(): void {
    for (const pu of this.powerUps) {
      this.scene.remove(pu.mesh);
      (pu.mesh.material as THREE.Material).dispose();
    }
    this.powerUps = [];
    this.spawnTimer = 2;
  }
}
