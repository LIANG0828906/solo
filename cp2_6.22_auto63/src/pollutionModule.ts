import * as THREE from 'three';
import type { PollutionSource } from './types';
import { windModule } from './windModule';

export class PollutionModule {
  private scene: THREE.Scene | null = null;
  private sources: PollutionSource[] = [];
  private maxSources = 3;
  private maxParticles = 2000;
  private nextSourceId = 0;

  private particles: {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    size: number;
    sourceId: number;
  }[] = [];

  private particleSystem: THREE.Points | null = null;
  private particlePositions: Float32Array | null = null;
  private particleColors: Float32Array | null = null;
  private particleSizes: Float32Array | null = null;

  private emissionAccumulator: Map<number, number> = new Map();
  private areaSize = 120;

  init(scene: THREE.Scene, areaSize: number): void {
    this.scene = scene;
    this.areaSize = areaSize;

    this.particlePositions = new Float32Array(this.maxParticles * 3);
    this.particleColors = new Float32Array(this.maxParticles * 3);
    this.particleSizes = new Float32Array(this.maxParticles);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePositions[i * 3] = 99999;
      this.particlePositions[i * 3 + 1] = 99999;
      this.particlePositions[i * 3 + 2] = 99999;
      this.particleSizes[i] = 0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.particleSystem = new THREE.Points(geo, mat);
    this.scene.add(this.particleSystem);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        position: new THREE.Vector3(99999, 99999, 99999),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        size: 0,
        sourceId: -1,
      });
    }
  }

  addSource(position: THREE.Vector3, rate: number = 5): PollutionSource | null {
    if (this.sources.length >= this.maxSources || !this.scene) return null;

    const pulseGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xff2244,
      transparent: true,
      opacity: 0.85,
    });
    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    pulseMesh.position.copy(position);
    this.scene.add(pulseMesh);

    const rangeGeo = new THREE.SphereGeometry(5, 32, 32);
    const rangeMat = new THREE.MeshBasicMaterial({
      color: 0xff6644,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    const rangeMesh = new THREE.Mesh(rangeGeo, rangeMat);
    rangeMesh.position.copy(position);
    this.scene.add(rangeMesh);

    const source: PollutionSource = {
      id: this.nextSourceId++,
      position: position.clone(),
      rate,
      mesh: pulseMesh,
      rangeMesh,
    };

    this.updateRangeRadius(source);
    this.sources.push(source);
    this.emissionAccumulator.set(source.id, 0);

    return source;
  }

  removeSource(index: number): void {
    const source = this.sources[index];
    if (!source || !this.scene) return;

    this.scene.remove(source.mesh);
    this.scene.remove(source.rangeMesh);
    source.mesh.geometry.dispose();
    (source.mesh.material as THREE.Material).dispose();
    source.rangeMesh.geometry.dispose();
    (source.rangeMesh.material as THREE.Material).dispose();
    this.emissionAccumulator.delete(source.id);

    this.sources.splice(index, 1);

    this.particles.forEach(p => {
      if (p.sourceId === source.id) {
        p.life = 0;
      }
    });
  }

  setSourceRate(index: number, rate: number): void {
    const source = this.sources[index];
    if (!source) return;
    source.rate = rate;
    this.updateRangeRadius(source);
  }

  private updateRangeRadius(source: PollutionSource): void {
    const baseRadius = 4 + source.rate * 1.8;
    source.rangeMesh.scale.setScalar(baseRadius / 5);
  }

  getSources(): PollutionSource[] {
    return this.sources;
  }

  getMaxSources(): number {
    return this.maxSources;
  }

  private spawnParticle(source: PollutionSource): void {
    const slot = this.particles.find(p => p.life <= 0);
    if (!slot) return;

    const angle = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const r = Math.random() * 0.8;

    slot.position.set(
      source.position.x + Math.sin(phi) * Math.cos(angle) * r,
      source.position.y + Math.cos(phi) * r,
      source.position.z + Math.sin(phi) * Math.sin(angle) * r
    );

    slot.velocity.set(
      (Math.random() - 0.5) * 0.5,
      Math.random() * 0.8 + 0.2,
      (Math.random() - 0.5) * 0.5
    );

    slot.life = 1;
    slot.maxLife = 2.5 + Math.random() * 2.5;
    slot.size = 0.8 + Math.random() * 0.8;
    slot.sourceId = source.id;
  }

  updateSources(delta: number, windData: { getWindVelocityAt: (pos: THREE.Vector3) => THREE.Vector3; isTransitioning: () => boolean }): void {
    this.sources.forEach(source => {
      const acc = this.emissionAccumulator.get(source.id) || 0;
      const newAcc = acc + source.rate * delta;
      const spawnCount = Math.floor(newAcc);

      for (let i = 0; i < spawnCount; i++) {
        this.spawnParticle(source);
      }

      this.emissionAccumulator.set(source.id, newAcc - spawnCount);

      const pulseMat = source.mesh.material as THREE.MeshBasicMaterial;
      const t = (performance.now() / 400) % (Math.PI * 2);
      const pulse = 1 + Math.sin(t) * 0.25;
      source.mesh.scale.setScalar(pulse);
      pulseMat.opacity = 0.6 + Math.sin(t) * 0.25;
    });

    this.updateParticles(delta, windData);
  }

  private updateParticles(delta: number, windData: { getWindVelocityAt: (pos: THREE.Vector3) => THREE.Vector3; isTransitioning: () => boolean }): void {
    if (!this.particlePositions || !this.particleColors || !this.particleSizes) return;

    const transitioning = windData.isTransitioning();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (p.life <= 0) {
        this.particlePositions[i * 3] = 99999;
        this.particlePositions[i * 3 + 1] = 99999;
        this.particlePositions[i * 3 + 2] = 99999;
        this.particleSizes[i] = 0;
        continue;
      }

      const windVel = windData.getWindVelocityAt(p.position);
      p.velocity.add(windVel.clone().multiplyScalar(delta * 2));
      p.velocity.multiplyScalar(0.97);
      p.velocity.y += delta * 0.3;

      p.position.add(p.velocity.clone().multiplyScalar(delta * 8));

      p.life -= delta / p.maxLife;

      const lifeRatio = Math.max(0, p.life);
      const expansion = 1 + (1 - lifeRatio) * 3;
      this.particleSizes[i] = p.size * expansion;

      this.particlePositions[i * 3] = p.position.x;
      this.particlePositions[i * 3 + 1] = p.position.y;
      this.particlePositions[i * 3 + 2] = p.position.z;

      let color: THREE.Color;
      if (transitioning) {
        color = new THREE.Color(0xff9800);
      } else {
        const tempT = 1 - lifeRatio;
        color = new THREE.Color().setHSL(
          THREE.MathUtils.lerp(0.15, 0.02, tempT),
          0.9,
          THREE.MathUtils.lerp(0.6, 0.5, tempT)
        );
      }

      const alpha = lifeRatio * 0.8;
      this.particleColors[i * 3] = color.r * alpha;
      this.particleColors[i * 3 + 1] = color.g * alpha;
      this.particleColors[i * 3 + 2] = color.b * alpha;
    }

    if (this.particleSystem) {
      this.particleSystem.geometry.attributes.position.needsUpdate = true;
      this.particleSystem.geometry.attributes.color.needsUpdate = true;
    }
  }
}

export const pollutionModule = new PollutionModule();
