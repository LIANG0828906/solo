import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  baseSize: number;
  sizeOffset: number;
  opacity: number;
  life: number;
  maxLife: number;
  active: boolean;
}

interface VolcanoVent {
  position: THREE.Vector3;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private vents: VolcanoVent[] = [];
  private maxParticles: number;
  private spawnTimer: number = 0;
  private spawnInterval: number = 2;
  private normalSpawnCount: number = 10;
  private degradedSpawnCount: number = 5;
  private riseSpeed: number = 0.2;
  private fadeHeight: number = 3;
  private baseColor: THREE.Color = new THREE.Color('#87CEEB');
  private baseOpacity: number = 0.4;

  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;

  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  constructor(ventPositions: THREE.Vector3[] = [], maxParticles: number = 1000) {
    this.maxParticles = maxParticles;
    this.vents = ventPositions.map((pos) => ({ position: pos.clone() }));

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        position: new THREE.Vector3(0, -1000, 0),
        velocity: new THREE.Vector3(),
        baseSize: 0,
        sizeOffset: 0,
        opacity: 0,
        life: 0,
        maxLife: 0,
        active: false,
      });
      this.positions[i * 3 + 1] = -1000;
    }

    this.updateAttributes();
  }

  public addVent(position: THREE.Vector3): void {
    this.vents.push({ position: position.clone() });
  }

  public setVents(ventPositions: THREE.Vector3[]): void {
    this.vents = ventPositions.map((pos) => ({ position: pos.clone() }));
  }

  private spawnParticle(vent: VolcanoVent): void {
    const inactiveIndex = this.particles.findIndex((p) => !p.active);
    if (inactiveIndex === -1) return;

    const particle = this.particles[inactiveIndex];
    const radius = 0.05 + Math.random() * 0.1;

    particle.position.copy(vent.position);
    particle.position.x += (Math.random() - 0.5) * 0.2;
    particle.position.z += (Math.random() - 0.5) * 0.2;

    particle.velocity.set(
      (Math.random() - 0.5) * 0.05,
      this.riseSpeed * (0.8 + Math.random() * 0.4),
      (Math.random() - 0.5) * 0.05
    );

    particle.baseSize = radius;
    particle.sizeOffset = Math.random() * Math.PI * 2;
    particle.opacity = this.baseOpacity;
    particle.life = 0;
    particle.maxLife = this.fadeHeight / this.riseSpeed;
    particle.active = true;
  }

  private spawnParticles(count: number): void {
    if (this.vents.length === 0) return;

    for (let i = 0; i < count; i++) {
      const vent = this.vents[Math.floor(Math.random() * this.vents.length)];
      this.spawnParticle(vent);
    }
  }

  private updateAttributes(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      const particle = this.particles[i];

      if (particle.active) {
        this.positions[i * 3] = particle.position.x;
        this.positions[i * 3 + 1] = particle.position.y;
        this.positions[i * 3 + 2] = particle.position.z;

        this.colors[i * 3] = this.baseColor.r;
        this.colors[i * 3 + 1] = this.baseColor.g;
        this.colors[i * 3 + 2] = this.baseColor.b;

        this.sizes[i] = particle.baseSize;
      } else {
        this.positions[i * 3 + 1] = -1000;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  public update(deltaTime: number, isDegraded: boolean = false): void {
    this.spawnTimer += deltaTime;
    const spawnCount = isDegraded ? this.degradedSpawnCount : this.normalSpawnCount;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer -= this.spawnInterval;
      this.spawnParticles(spawnCount);
    }

    const time = performance.now() * 0.001;

    for (let i = 0; i < this.maxParticles; i++) {
      const particle = this.particles[i];
      if (!particle.active) continue;

      particle.life += deltaTime;

      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.position.z += particle.velocity.z * deltaTime;

      const lifeRatio = particle.life / particle.maxLife;
      const breatheScale = 1 + Math.sin(time * 2 + particle.sizeOffset) * 0.15;
      const currentSize = particle.baseSize * breatheScale;
      this.sizes[i] = currentSize;

      const fadeStart = 0.6;
      if (lifeRatio > fadeStart) {
        particle.opacity = this.baseOpacity * (1 - (lifeRatio - fadeStart) / (1 - fadeStart));
      } else {
        particle.opacity = this.baseOpacity * Math.min(lifeRatio / 0.1, 1);
      }

      this.colors[i * 3] = this.baseColor.r;
      this.colors[i * 3 + 1] = this.baseColor.g;
      this.colors[i * 3 + 2] = this.baseColor.b;

      this.positions[i * 3] = particle.position.x;
      this.positions[i * 3 + 1] = particle.position.y;
      this.positions[i * 3 + 2] = particle.position.z;

      if (particle.life >= particle.maxLife) {
        particle.active = false;
        this.positions[i * 3 + 1] = -1000;
      }
    }

    this.material.opacity = 1;
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  public getPoints(): THREE.Points {
    return this.points;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.particles = [];
    this.vents = [];
  }
}
