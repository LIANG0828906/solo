import * as THREE from 'three';
import { TerrainEngine } from './TerrainEngine';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private terrain: TerrainEngine;
  private maxParticles: number;
  private particles: Particle[] = [];

  public geometry: THREE.BufferGeometry;
  public material: THREE.PointsMaterial;
  public points: THREE.Points;

  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  private emitTimer = 0;

  private fountainTimers: { x: number; z: number; time: number }[] = [];

  constructor(scene: THREE.Scene, terrain: TerrainEngine, maxParticles: number = 1500) {
    this.scene = scene;
    this.terrain = terrain;
    this.maxParticles = maxParticles;

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.sizes = new Float32Array(maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  spawnParticle(x: number, y: number, z: number, intensity: number = 1): void {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }

    const angle = Math.random() * Math.PI * 2;
    const speed = (0.5 + Math.random() * 1.5) * intensity;
    const upwardSpeed = (2 + Math.random() * 4) * intensity;

    const velocity = new THREE.Vector3(
      Math.cos(angle) * speed,
      upwardSpeed,
      Math.sin(angle) * speed
    );

    const life = 0.5 + Math.random() * 1.0;

    this.particles.push({
      position: new THREE.Vector3(x, y, z),
      velocity,
      life,
      maxLife: life,
      size: 0.15 + Math.random() * 0.2,
    });
  }

  spawnFountain(x: number, z: number, duration: number): void {
    this.fountainTimers.push({ x, z, time: duration });
  }

  spawnPoolEdgeFountains(centerX: number, centerZ: number, radius: number): void {
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const fx = centerX + Math.cos(angle) * (radius * 0.8 + Math.random() * 0.5);
      const fz = centerZ + Math.sin(angle) * (radius * 0.8 + Math.random() * 0.5);
      this.spawnFountain(fx, fz, 2);
    }
  }

  private updateBuffers(): void {
    const positionAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const colorAttr = this.geometry.attributes.color as THREE.BufferAttribute;
    const sizeAttr = this.geometry.attributes.size as THREE.BufferAttribute;

    for (let i = 0; i < this.maxParticles; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        const t = 1 - p.life / p.maxLife;

        this.positions[i * 3] = p.position.x;
        this.positions[i * 3 + 1] = p.position.y;
        this.positions[i * 3 + 2] = p.position.z;

        const brightYellow = new THREE.Color(1, 0.95, 0.3);
        const orange = new THREE.Color(1, 0.4, 0.05);
        const darkRed = new THREE.Color(0.4, 0.05, 0.02);

        const col = new THREE.Color();
        if (t < 0.5) {
          col.copy(brightYellow).lerp(orange, t * 2);
        } else {
          col.copy(orange).lerp(darkRed, (t - 0.5) * 2);
        }

        this.colors[i * 3] = col.r;
        this.colors[i * 3 + 1] = col.g;
        this.colors[i * 3 + 2] = col.b;

        this.sizes[i] = p.size * (1 - t * 0.5);
      } else {
        this.positions[i * 3] = 0;
        this.positions[i * 3 + 1] = -1000;
        this.positions[i * 3 + 2] = 0;
        this.sizes[i] = 0;
      }
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;

    this.geometry.setDrawRange(0, Math.min(this.particles.length, this.maxParticles));
  }

  update(deltaTime: number, heightModifiers: Float32Array): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= deltaTime;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y -= 8 * deltaTime;
      p.position.addScaledVector(p.velocity, deltaTime);
    }

    this.emitTimer += deltaTime;
    if (this.emitTimer > 0.03) {
      this.emitTimer = 0;

      const positionAttr = this.terrain.geometry.attributes.position;
      const count = positionAttr.count;
      const emitCount = Math.min(5, Math.floor(this.particles.length / 100) + 2);

      for (let i = 0; i < emitCount; i++) {
        const idx = Math.floor(Math.random() * count);
        const y = positionAttr.getY(idx);
        if (y > 0.5) {
          const x = positionAttr.getX(idx);
          const z = positionAttr.getZ(idx);
          this.spawnParticle(x, y, z, y / 10);
        }
      }
    }

    for (let i = this.fountainTimers.length - 1; i >= 0; i--) {
      const ft = this.fountainTimers[i];
      ft.time -= deltaTime;

      if (ft.time <= 0) {
        this.fountainTimers.splice(i, 1);
        continue;
      }

      const y = this.terrain.getHeightAt(ft.x, ft.z);
      const particleCount = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < particleCount; j++) {
        const ox = (Math.random() - 0.5) * 0.5;
        const oz = (Math.random() - 0.5) * 0.5;
        this.spawnParticle(ft.x + ox, y, ft.z + oz, 1.2);
      }
    }

    this.updateBuffers();
  }

  getActiveCount(): number {
    return this.particles.length;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.points);
  }
}
