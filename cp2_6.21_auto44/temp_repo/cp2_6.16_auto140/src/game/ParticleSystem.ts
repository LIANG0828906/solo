import * as THREE from 'three';
import type { Particle } from '../types';
import { randomRange } from '../utils/helpers';

const MAX_DEBRIS = 100;
const MAX_GLOW = 150;

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private debrisGeometry: THREE.BoxGeometry;
  private glowGeometry: THREE.SphereGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.debrisGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    this.glowGeometry = new THREE.SphereGeometry(0.15, 8, 8);
  }

  public spawnDebris(position: THREE.Vector3, count: number): void {
    const toSpawn = Math.min(count, MAX_DEBRIS - this.countByType('debris'));
    for (let i = 0; i < toSpawn; i++) {
      const color = new THREE.Color().setHSL(0.05, 0.5, randomRange(0.3, 0.6));
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(this.debrisGeometry, mat);
      mesh.position.copy(position);
      const velocity = new THREE.Vector3(
        randomRange(-8, 8),
        randomRange(2, 10),
        randomRange(-8, 8)
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0.3,
        maxLife: 0.3,
        color,
        type: 'debris',
      });
    }
  }

  public spawnGlow(position: THREE.Vector3, colorHex: number, count: number): void {
    const toSpawn = Math.min(count, MAX_GLOW - this.countByType('glow'));
    const color = new THREE.Color(colorHex);
    for (let i = 0; i < toSpawn; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
      });
      const mesh = new THREE.Mesh(this.glowGeometry, mat);
      mesh.position.copy(position);
      const angle = Math.random() * Math.PI * 2;
      const radius = randomRange(0.5, 2);
      const velocity = new THREE.Vector3(
        Math.cos(angle) * radius,
        randomRange(0.5, 2),
        Math.sin(angle) * radius
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0.5,
        maxLife: 0.5,
        color,
        type: 'glow',
      });
    }
  }

  public spawnSpeedLines(origin: THREE.Vector3, count: number): void {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.05, 0.05, randomRange(2, 4));
      const mat = new THREE.MeshBasicMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.6,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        origin.x + randomRange(-10, 10),
        origin.y + randomRange(0.5, 3),
        origin.z + randomRange(-30, -5)
      );
      const velocity = new THREE.Vector3(0, 0, randomRange(80, 150));
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0.3,
        maxLife: 0.3,
        color: new THREE.Color(0xaaddff),
        type: 'speedline',
      });
    }
  }

  private countByType(type: Particle['type']): number {
    return this.particles.filter((p) => p.type === type).length;
  }

  public update(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 15 * delta;
      const t = p.life / p.maxLife;
      if ((p.mesh.material as THREE.MeshBasicMaterial).transparent) {
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = t * 0.8;
      }
      const s = Math.max(0.1, t);
      p.mesh.scale.setScalar(s);
    }
  }

  public clearAll(): void {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      (p.mesh.material as THREE.Material).dispose();
    }
    this.particles = [];
  }
}
