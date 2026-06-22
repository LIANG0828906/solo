import * as THREE from 'three';
import type { ParticleParams } from './particlePresets';

export interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  maxAge: number;
  size: number;
  seed: number;
}

export class ParticleSystem {
  private particles: ParticleData[] = [];
  private params: ParticleParams;
  private time: number = 0;
  private maxParticles: number = 15000;

  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private velocities: Float32Array;

  public pointsGeometry: THREE.BufferGeometry;
  public meshGeometry: THREE.BufferGeometry;
  public instancedMesh: THREE.InstancedMesh;

  private dummy: THREE.Object3D;
  private tempColor: THREE.Color;
  private lowColor: THREE.Color = new THREE.Color(0x00b4d8);
  private midColor: THREE.Color = new THREE.Color(0x7c3aed);
  private highColor: THREE.Color = new THREE.Color(0xef4444);

  constructor(params: ParticleParams) {
    this.params = { ...params };

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);
    this.velocities = new Float32Array(this.maxParticles * 3);

    this.pointsGeometry = new THREE.BufferGeometry();
    this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.pointsGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.pointsGeometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    const tetrahedron = new THREE.TetrahedronGeometry(0.15, 0);
    this.meshGeometry = tetrahedron;
    this.instancedMesh = new THREE.InstancedMesh(
      tetrahedron,
      new THREE.MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.4,
        vertexColors: true,
      }),
      this.maxParticles
    );

    this.dummy = new THREE.Object3D();
    this.tempColor = new THREE.Color();

    this.initParticles();
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      const particle = this.createParticle(true);
      this.particles.push(particle);
      this.updateParticleBuffers(i, particle, 0);
    }
    this.updateDrawRange();
    this.pointsGeometry.attributes.position.needsUpdate = true;
    this.pointsGeometry.attributes.color.needsUpdate = true;
    this.pointsGeometry.attributes.size.needsUpdate = true;
  }

  private createParticle(randomAge = false): ParticleData {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = Math.random() * this.params.emissionRadius;

    const spreadRad = (this.params.spreadAngle * Math.PI) / 180;
    const dirTheta = Math.random() * Math.PI * 2;
    const dirPhi = Math.acos(2 * Math.random() - 1) * (spreadRad / Math.PI);

    const position = new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi) * 0.5,
      radius * Math.sin(phi) * Math.sin(theta)
    );

    const speed = 0.5 + Math.random() * 1.5;
    const velocity = new THREE.Vector3(
      Math.sin(dirPhi) * Math.cos(dirTheta) * speed,
      Math.cos(dirPhi) * speed * 0.5,
      Math.sin(dirPhi) * Math.sin(dirTheta) * speed
    );

    return {
      position,
      velocity,
      age: randomAge ? Math.random() * this.params.lifetime : 0,
      maxAge: this.params.lifetime * (0.8 + Math.random() * 0.4),
      size: 0.3 + Math.random() * 0.7,
      seed: Math.random() * 1000,
    };
  }

  private resetParticle(particle: ParticleData): void {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = Math.random() * this.params.emissionRadius * 0.3;

    const spreadRad = (this.params.spreadAngle * Math.PI) / 180;
    const dirTheta = Math.random() * Math.PI * 2;
    const dirPhi = Math.acos(2 * Math.random() - 1) * (spreadRad / Math.PI);

    particle.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi) * 0.5,
      radius * Math.sin(phi) * Math.sin(theta)
    );

    const speed = 0.5 + Math.random() * 1.5;
    particle.velocity.set(
      Math.sin(dirPhi) * Math.cos(dirTheta) * speed,
      Math.cos(dirPhi) * speed * 0.5,
      Math.sin(dirPhi) * Math.sin(dirTheta) * speed
    );

    particle.age = 0;
    particle.maxAge = this.params.lifetime * (0.8 + Math.random() * 0.4);
    particle.size = 0.3 + Math.random() * 0.7;
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    const count = Math.min(this.params.count, this.maxParticles);

    for (let i = 0; i < count; i++) {
      const particle = this.particles[i];
      particle.age += deltaTime;

      if (particle.age >= particle.maxAge) {
        this.resetParticle(particle);
      }

      const lifeRatio = particle.age / particle.maxAge;
      const pos = particle.position;

      const vortexAngle = this.time * this.params.vortexStrength + particle.seed;
      const vortexRadius = pos.length() * 0.1;
      const vortexForce = new THREE.Vector3(
        -Math.sin(vortexAngle) * vortexRadius * this.params.vortexStrength,
        0,
        Math.cos(vortexAngle) * vortexRadius * this.params.vortexStrength
      );

      const waveOffset = Math.sin(
        this.time * this.params.waveFrequency + particle.seed + pos.x * 0.5 + pos.z * 0.5
      ) * 0.3;
      const waveForce = new THREE.Vector3(0, waveOffset, 0);

      const gravityForce = new THREE.Vector3(0, -this.params.gravity * 2, 0);

      particle.velocity.add(vortexForce.multiplyScalar(deltaTime * 0.5));
      particle.velocity.add(waveForce.multiplyScalar(deltaTime));
      particle.velocity.add(gravityForce.multiplyScalar(deltaTime));
      particle.velocity.multiplyScalar(0.99);

      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));

      this.updateParticleBuffers(i, particle, lifeRatio);
    }

    this.updateDrawRange();

    this.pointsGeometry.attributes.position.needsUpdate = true;
    this.pointsGeometry.attributes.color.needsUpdate = true;
    this.pointsGeometry.attributes.size.needsUpdate = true;

    this.updateInstancedMesh(count);
  }

  private updateParticleBuffers(index: number, particle: ParticleData, lifeRatio: number): void {
    const i3 = index * 3;

    this.positions[i3] = particle.position.x;
    this.positions[i3 + 1] = particle.position.y;
    this.positions[i3 + 2] = particle.position.z;

    this.velocities[i3] = particle.velocity.x;
    this.velocities[i3 + 1] = particle.velocity.y;
    this.velocities[i3 + 2] = particle.velocity.z;

    const speed = particle.velocity.length();
    const speedRatio = Math.min(speed / 5, 1);

    if (speedRatio < 0.5) {
      const t = speedRatio * 2;
      this.tempColor.copy(this.lowColor).lerp(this.midColor, t);
    } else {
      const t = (speedRatio - 0.5) * 2;
      this.tempColor.copy(this.midColor).lerp(this.highColor, t);
    }

    const alpha = Math.sin(lifeRatio * Math.PI);
    this.colors[i3] = this.tempColor.r * alpha;
    this.colors[i3 + 1] = this.tempColor.g * alpha;
    this.colors[i3 + 2] = this.tempColor.b * alpha;

    this.sizes[index] = particle.size * alpha;
  }

  private updateInstancedMesh(count: number): void {
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      this.dummy.position.set(
        this.positions[i3],
        this.positions[i3 + 1],
        this.positions[i3 + 2]
      );

      const scale = this.sizes[i] * 1.5;
      this.dummy.scale.set(scale, scale, scale);

      this.dummy.rotation.x = this.velocities[i3] * 0.5;
      this.dummy.rotation.y = this.velocities[i3 + 1] * 0.5;
      this.dummy.rotation.z = this.velocities[i3 + 2] * 0.5;

      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);

      const color = new THREE.Color(
        this.colors[i3],
        this.colors[i3 + 1],
        this.colors[i3 + 2]
      );
      this.instancedMesh.setColorAt(i, color);
    }

    this.instancedMesh.count = count;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  private updateDrawRange(): void {
    const count = Math.min(this.params.count, this.maxParticles);
    this.pointsGeometry.setDrawRange(0, count);
  }

  public setParams(params: ParticleParams): void {
    const oldCount = this.params.count;
    this.params = { ...params };

    if (params.count > oldCount) {
      for (let i = oldCount; i < Math.min(params.count, this.maxParticles); i++) {
        if (!this.particles[i]) {
          this.particles[i] = this.createParticle();
        }
      }
    }
  }

  public getParams(): ParticleParams {
    return { ...this.params };
  }

  public dispose(): void {
    this.pointsGeometry.dispose();
    this.meshGeometry.dispose();
    this.instancedMesh.geometry.dispose();
    if (Array.isArray(this.instancedMesh.material)) {
      this.instancedMesh.material.forEach((m) => m.dispose());
    } else {
      this.instancedMesh.material.dispose();
    }
  }
}
