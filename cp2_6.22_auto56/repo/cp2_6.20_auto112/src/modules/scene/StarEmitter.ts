import * as THREE from 'three';
import { ColorMode } from '@/utils/colors';

export interface StarEmitterOptions {
  emitterCount?: number;
  maxParticles?: number;
  nebulaRadius?: number;
  colorMode?: ColorMode;
}

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  size: number;
}

interface Emitter {
  position: THREE.Vector3;
  emitRate: number;
  emitAccumulator: number;
  direction: THREE.Vector3;
}

export class StarEmitter {
  public mesh: THREE.Points;
  public geometry: THREE.BufferGeometry;
  public material: THREE.PointsMaterial;

  private maxParticles: number;
  private particles: Particle[];
  private emitters: Emitter[];
  private nebulaRadius: number;
  private colorMode: ColorMode;

  private positions: Float32Array;
  private colors: Float32Array;
  private opacities: Float32Array;

  private colorMap: (t: number) => { r: number; g: number; b: number };

  constructor(options: StarEmitterOptions = {}) {
    this.maxParticles = options.maxParticles || 500;
    this.nebulaRadius = options.nebulaRadius || 3.5;
    this.colorMode = options.colorMode || 'purple-green';
    this.particles = [];
    this.emitters = [];

    this.colorMap = (t) => ({
      r: 1,
      g: 0.5 + t * 0.5,
      b: t,
    });

    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.opacities = new Float32Array(this.maxParticles);

    this.initEmitters(options.emitterCount || 15);
    this.initBufferAttributes();

    this.mesh = new THREE.Points(this.geometry, this.material);
  }

  private initEmitters(count: number): void {
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = this.nebulaRadius * (0.2 + Math.random() * 0.5);

      const position = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      const direction = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();

      this.emitters.push({
        position,
        emitRate: 8 + Math.random() * 12,
        emitAccumulator: Math.random() * 2,
        direction,
      });
    }
  }

  private initBufferAttributes(): void {
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setDrawRange(0, 0);
  }

  public setColorMap(colorMap: (t: number) => { r: number; g: number; b: number }): void {
    this.colorMap = colorMap;
  }

  private spawnParticle(emitter: Emitter): void {
    if (this.particles.length >= this.maxParticles) return;

    const speed = 0.1 + Math.random() * 0.4;
    const lifetime = 2 + Math.random() * 3;

    const direction = new THREE.Vector3(
      emitter.direction.x + (Math.random() - 0.5) * 0.6,
      emitter.direction.y + (Math.random() - 0.5) * 0.6,
      emitter.direction.z + (Math.random() - 0.5) * 0.6
    ).normalize();

    const velocity = direction.multiplyScalar(speed);

    const position = emitter.position.clone();
    position.x += (Math.random() - 0.5) * 0.3;
    position.y += (Math.random() - 0.5) * 0.3;
    position.z += (Math.random() - 0.5) * 0.3;

    this.particles.push({
      position,
      velocity,
      lifetime,
      maxLifetime: lifetime,
      size: 0.05 + Math.random() * 0.08,
    });
  }

  public update(deltaTime: number): void {
    for (const emitter of this.emitters) {
      emitter.emitAccumulator += deltaTime * emitter.emitRate;

      while (emitter.emitAccumulator >= 1) {
        this.spawnParticle(emitter);
        emitter.emitAccumulator -= 1;
      }
    }

    const activeParticles: Particle[] = [];

    for (const particle of this.particles) {
      particle.lifetime -= deltaTime;

      if (particle.lifetime > 0) {
        particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
        particle.velocity.multiplyScalar(0.995);
        activeParticles.push(particle);
      }
    }

    this.particles = activeParticles;
    this.updateBufferAttributes();
  }

  private updateBufferAttributes(): void {
    const count = this.particles.length;

    for (let i = 0; i < count; i++) {
      const particle = this.particles[i];
      const i3 = i * 3;

      this.positions[i3] = particle.position.x;
      this.positions[i3 + 1] = particle.position.y;
      this.positions[i3 + 2] = particle.position.z;

      const lifeRatio = particle.lifetime / particle.maxLifetime;
      const alpha = lifeRatio;

      const color = this.colorMap(Math.max(0.3, lifeRatio));
      this.colors[i3] = color.r * alpha;
      this.colors[i3 + 1] = color.g * alpha;
      this.colors[i3 + 2] = color.b * alpha;

      this.opacities[i] = alpha;
    }

    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const colorAttr = this.geometry.attributes.color as THREE.BufferAttribute;

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;

    this.geometry.setDrawRange(0, count);
    this.geometry.computeBoundingSphere();
  }

  public updateParticleScale(scale: number): void {
    const newMax = Math.floor(this.maxParticles * scale);
    this.maxParticles = Math.max(100, newMax);

    if (this.particles.length > this.maxParticles) {
      this.particles = this.particles.slice(0, this.maxParticles);
    }

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.opacities = new Float32Array(this.maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.updateBufferAttributes();
  }

  public animate(time: number): void {
    this.mesh.rotation.y = time * 0.02;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
