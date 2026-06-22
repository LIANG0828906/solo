import * as THREE from 'three';
import type { ObstacleData, ObstacleType } from '../types';
import { generateId, getRoadWorldWidth, computeAABB, randomRange } from '../utils/helpers';

export class ObstacleManager {
  private scene: THREE.Scene;
  public obstacles: ObstacleData[] = [];
  private spawnTimer = 0;
  private halfRoadWidth: number;
  private warningLines: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.halfRoadWidth = getRoadWorldWidth() / 2 - 2;
  }

  private createBarrier(): THREE.Mesh {
    const geo = new THREE.BoxGeometry(2, 1.5, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x4a4a52,
      roughness: 0.8,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const highlight = new THREE.Mesh(
      new THREE.BoxGeometry(2.05, 0.2, 1.05),
      new THREE.MeshStandardMaterial({
        color: 0xff3333,
        emissive: 0xff0000,
        emissiveIntensity: 0.4,
      })
    );
    highlight.position.y = 0.7;
    mesh.add(highlight);
    return mesh;
  }

  private createWreck(): THREE.Group {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.2, 4.5),
      new THREE.MeshStandardMaterial({
        color: 0x3a3a40,
        roughness: 0.9,
        metalness: 0.2,
      })
    );
    body.position.y = 0.8;
    body.rotation.y = Math.PI * (Math.random() - 0.5) * 0.5;
    group.add(body);

    const highlight = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.15, 4.6),
      new THREE.MeshStandardMaterial({
        color: 0xff3333,
        emissive: 0xff0000,
        emissiveIntensity: 0.3,
      })
    );
    highlight.position.y = 1.4;
    group.add(highlight);

    return group;
  }

  private createDynamicTruck(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xcc2222,
      metalness: 0.5,
      roughness: 0.4,
    });
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 2.4), mat);
    cab.position.set(0, 1.1, 1.2);
    group.add(cab);
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 5), mat);
    trailer.position.set(0, 1.2, -2.5);
    group.add(trailer);
    return group;
  }

  private createWarningLine(x: number, z: number): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(0.3, 20);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff2222,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.2, z);
    return mesh;
  }

  public spawn(distance: number): void {
    const difficulty = Math.min(distance / 5000, 1);
    const types: ObstacleType[] = ['barrier', 'wreck'];
    if (difficulty > 0.3) types.push('dynamicTruck');

    const type = types[Math.floor(Math.random() * types.length)];
    const lane = Math.random() < 0.5 ? -1 : 1;
    const x = lane * randomRange(2, this.halfRoadWidth);
    const z = -500;

    let mesh: THREE.Mesh | THREE.Group;
    let width = 2;
    let depth = 1;

    if (type === 'barrier') {
      mesh = this.createBarrier();
      width = 2;
      depth = 1;
    } else if (type === 'wreck') {
      mesh = this.createWreck();
      width = 2.4;
      depth = 4.5;
    } else {
      mesh = this.createDynamicTruck();
      width = 2.4;
      depth = 7.5;
    }

    mesh.position.set(x, 0, z);
    this.scene.add(mesh);

    const pos = new THREE.Vector3(x, 0, z);
    const obstacle: ObstacleData = {
      id: generateId(),
      type,
      position: pos,
      mesh,
      aabb: computeAABB(pos, width, depth),
      isDynamic: type === 'dynamicTruck',
      warningActive: type === 'dynamicTruck',
      moveDirection: Math.random() < 0.5 ? 1 : -1,
    };

    if (type === 'dynamicTruck') {
      const warning = this.createWarningLine(x, z - 30);
      this.scene.add(warning);
      this.warningLines.push(warning);
      setTimeout(() => {
        obstacle.warningActive = false;
      }, 1000);
    }

    this.obstacles.push(obstacle);
  }

  public update(speed: number, delta: number, playerZ: number, distance: number): void {
    const moveSpeed = speed;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.position.z += moveSpeed * delta;
      if (obs.isDynamic && !obs.warningActive) {
        obs.position.x += (obs.moveDirection || 1) * 10 * delta;
        obs.position.x = Math.max(-this.halfRoadWidth, Math.min(this.halfRoadWidth, obs.position.x));
      }
      obs.mesh.position.copy(obs.position);
      obs.aabb = computeAABB(obs.position, 2.4, obs.type === 'wreck' ? 4.5 : obs.type === 'dynamicTruck' ? 7.5 : 1);

      if (obs.position.z > playerZ + 80) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    for (let i = this.warningLines.length - 1; i >= 0; i--) {
      const w = this.warningLines[i];
      w.position.z += moveSpeed * delta;
      const opacity = Math.max(0, (w.material as THREE.MeshBasicMaterial).opacity - delta * 1.5);
      (w.material as THREE.MeshBasicMaterial).opacity = opacity;
      if (w.position.z > playerZ + 80 || opacity <= 0) {
        this.scene.remove(w);
        (w.material as THREE.Material).dispose();
        this.warningLines.splice(i, 1);
      }
    }

    this.spawnTimer -= delta;
    const spawnInterval = Math.max(0.4, 1.5 - distance / 8000);
    if (this.spawnTimer <= 0) {
      this.spawn(distance);
      this.spawnTimer = spawnInterval;
    }
  }

  public removeObstacle(id: string): void {
    const idx = this.obstacles.findIndex((o) => o.id === id);
    if (idx >= 0) {
      this.scene.remove(this.obstacles[idx].mesh);
      this.obstacles.splice(idx, 1);
    }
  }

  public clearAll(): void {
    for (const obs of this.obstacles) {
      this.scene.remove(obs.mesh);
    }
    for (const w of this.warningLines) {
      this.scene.remove(w);
      (w.material as THREE.Material).dispose();
    }
    this.obstacles = [];
    this.warningLines = [];
    this.spawnTimer = 1;
  }
}
