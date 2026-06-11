import * as THREE from 'three';
import type { Particle } from './types';

export class ParticleEffects {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private thrustTimer: number = 0;
  private readonly maxParticles: number = 1000;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnThrustParticle(position: THREE.Vector3, direction: THREE.Vector3): void {
    if (this.particles.length >= this.maxParticles) return;
    const geo = new THREE.SphereGeometry(0.15, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);

    const spread = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3
    );
    const vel = direction.clone().negate().multiplyScalar(8).add(spread);

    this.particles.push({
      mesh,
      velocity: vel,
      life: 1.5,
      maxLife: 1.5,
      type: 'thrust'
    });
    this.scene.add(mesh);
  }

  spawnExplosion(position: THREE.Vector3, color: THREE.Color, count: number = 200): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const size = 0.1 + Math.random() * 0.2;
      const geo = new THREE.SphereGeometry(size, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 3 + Math.random() * 5;
      const vel = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      );

      this.particles.push({
        mesh,
        velocity: vel,
        life: 0.8,
        maxLife: 0.8,
        type: 'explosion'
      });
      this.scene.add(mesh);
    }
  }

  spawnCoinParticles(position: THREE.Vector3, count: number = 5): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const geo = new THREE.BoxGeometry(0.3, 0.3, 0.1);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffd54f,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);

      const theta = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      const vel = new THREE.Vector3(
        Math.cos(theta) * speed,
        2 + Math.random() * 2,
        Math.sin(theta) * speed
      );

      this.particles.push({
        mesh,
        velocity: vel,
        life: 1.0,
        maxLife: 1.0,
        type: 'coin'
      });
      this.scene.add(mesh);
    }
  }

  update(dt: number, thrustActive: boolean, airshipPos: THREE.Vector3, airshipDir: THREE.Vector3): void {
    if (thrustActive) {
      this.thrustTimer += dt;
      const spawnInterval = 1 / 40;
      while (this.thrustTimer >= spawnInterval) {
        this.thrustTimer -= spawnInterval;
        const offset = airshipDir.clone().negate().multiplyScalar(2);
        offset.y -= 0.5;
        this.spawnThrustParticle(airshipPos.clone().add(offset), airshipDir);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      const alpha = p.life / p.maxLife;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;

      if (p.type === 'coin') {
        p.velocity.y -= 5 * dt;
        p.mesh.rotation.x += dt * 5;
        p.mesh.rotation.y += dt * 3;
      }

      if (p.type === 'explosion') {
        p.velocity.multiplyScalar(1 - dt * 1.5);
      }

      p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
    }
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  dispose(): void {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    }
    this.particles = [];
  }
}
