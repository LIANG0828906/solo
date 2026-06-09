import * as THREE from 'three';
import { TopologicalSurface, SurfaceVertex } from './surface';

interface Particle {
  mesh: THREE.Mesh;
  velocity: number;
  direction: number;
  u: number;
  v: number;
  currentVertex: SurfaceVertex;
  color: THREE.Color;
  trail: THREE.Points;
  trailPositions: THREE.Vector3[];
  trailMaxLength: number;
  bouncing: boolean;
  bounceStartTime: number;
  bounceHeight: number;
  lastPosition: THREE.Vector3;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private surface: TopologicalSurface;
  private particles: Particle[] = [];
  private particleCount: number = 150;
  private readonly particleSize: number = 0.08;
  private readonly trailDuration: number = 0.5;
  private readonly bounceHeight: number = 0.15;
  private readonly bounceDuration: number = 200;
  private morphColorStart: THREE.Color = new THREE.Color('#ff4500');
  private morphColorEnd: THREE.Color = new THREE.Color('#ffd700');

  constructor(scene: THREE.Scene, surface: TopologicalSurface) {
    this.scene = scene;
    this.surface = surface;
    this.createParticles();
  }

  private createParticles(): void {
    const geometry = new THREE.SphereGeometry(this.particleSize, 16, 16);

    for (let i = 0; i < this.particleCount; i++) {
      const vertices = this.surface.getVertices();
      const randomIdx = Math.floor(Math.random() * vertices.length);
      const vertex = vertices[randomIdx];

      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(vertex.deformedPosition);

      const trail = this.createTrail();

      const particle: Particle = {
        mesh,
        velocity: 0.3 + Math.random() * 0.5,
        direction: Math.random() > 0.5 ? 1 : -1,
        u: vertex.u,
        v: vertex.v,
        currentVertex: vertex,
        color: new THREE.Color(),
        trail,
        trailPositions: [],
        trailMaxLength: Math.floor(30 * this.trailDuration),
        bouncing: false,
        bounceStartTime: 0,
        bounceHeight: 0,
        lastPosition: vertex.deformedPosition.clone()
      };

      this.updateParticleColor(particle);
      this.particles.push(particle);
      this.scene.add(mesh);
      this.scene.add(trail);
    }
  }

  private createTrail(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(30 * 3);
    const colors = new Float32Array(30 * 3);
    const sizes = new Float32Array(30);
    const opacities = new Float32Array(30);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    return new THREE.Points(geometry, material);
  }

  private updateParticleColor(particle: Particle): void {
    const morphProgress = this.surface.getMorphProgress();
    const normal = particle.currentVertex.normal;

    if (morphProgress > 0) {
      const hue = normal.x * 0.5 + 0.5;
      const rainbowColor = new THREE.Color().setHSL(hue, 0.9, 0.7);
      const warmColor = this.morphColorStart.clone().lerp(this.morphColorEnd, normal.y * 0.5 + 0.5);
      particle.color.copy(rainbowColor.lerp(warmColor, morphProgress));
    } else {
      const hue = normal.x * 0.5 + 0.5;
      particle.color.setHSL(hue, 0.9, 0.7);
    }

    (particle.mesh.material as THREE.MeshBasicMaterial).color.copy(particle.color);
  }

  public update(deltaTime: number): void {
    const isMorphing = this.surface.isCurrentlyMorphing();
    const speedMultiplier = isMorphing ? 0.5 : 1;
    const showTrail = isMorphing;

    for (const particle of this.particles) {
      this.moveParticle(particle, deltaTime * speedMultiplier);
      this.updateParticleColor(particle);
      this.updateBounce(particle);

      if (showTrail) {
        this.updateTrail(particle);
      } else {
        this.clearTrail(particle);
      }

      this.checkDeformationBounce(particle);
    }
  }

  private moveParticle(particle: Particle, deltaTime: number): void {
    const vertices = this.surface.getVertices();
    const vSegments = this.surface.getVSegments();

    particle.u += particle.velocity * particle.direction * deltaTime * 0.5;

    const twoPi = Math.PI * 2;
    if (particle.u > twoPi) {
      particle.u -= twoPi;
      particle.v = -particle.v;
      particle.direction *= -1;
    } else if (particle.u < 0) {
      particle.u += twoPi;
      particle.v = -particle.v;
      particle.direction *= -1;
    }

    const halfWidth = 0.3;
    if (particle.v > halfWidth) {
      particle.v = halfWidth;
      particle.direction *= -1;
    } else if (particle.v < -halfWidth) {
      particle.v = -halfWidth;
      particle.direction *= -1;
    }

    const uIndex = Math.floor((particle.u / twoPi) * 360) % 360;
    const vIndex = Math.floor(((particle.v + halfWidth) / (halfWidth * 2)) * vSegments);
    const clampedVIndex = Math.max(0, Math.min(vSegments, vIndex));
    const vertexIndex = uIndex * (vSegments + 1) + clampedVIndex;

    if (vertexIndex >= 0 && vertexIndex < vertices.length) {
      particle.currentVertex = vertices[vertexIndex];
      particle.lastPosition.copy(particle.mesh.position);

      let targetPosition = particle.currentVertex.deformedPosition.clone();

      if (particle.bouncing) {
        const elapsed = performance.now() - particle.bounceStartTime;
        const progress = Math.min(elapsed / this.bounceDuration, 1);
        const bounceOffset = Math.sin(progress * Math.PI) * this.bounceHeight;
        const normalOffset = particle.currentVertex.normal.clone().multiplyScalar(bounceOffset);
        targetPosition.add(normalOffset);
      }

      particle.mesh.position.copy(targetPosition);
    }
  }

  private updateBounce(particle: Particle): void {
    if (particle.bouncing) {
      const elapsed = performance.now() - particle.bounceStartTime;
      if (elapsed > this.bounceDuration) {
        particle.bouncing = false;
      }
    }
  }

  private updateTrail(particle: Particle): void {
    const position = particle.mesh.position.clone();
    particle.trailPositions.unshift(position.clone());

    if (particle.trailPositions.length > particle.trailMaxLength) {
      particle.trailPositions.pop();
    }

    const positions = particle.trail.geometry.attributes.position.array as Float32Array;
    const colors = particle.trail.geometry.attributes.color.array as Float32Array;
    const opacities = particle.trail.geometry.attributes.opacity.array as Float32Array;
    const sizes = particle.trail.geometry.attributes.size.array as Float32Array;

    for (let i = 0; i < particle.trailMaxLength; i++) {
      if (i < particle.trailPositions.length) {
        const pos = particle.trailPositions[i];
        positions[i * 3] = pos.x;
        positions[i * 3 + 1] = pos.y;
        positions[i * 3 + 2] = pos.z;

        const alpha = 0.6 * (1 - i / particle.trailMaxLength);
        colors[i * 3] = particle.color.r;
        colors[i * 3 + 1] = particle.color.g;
        colors[i * 3 + 2] = particle.color.b;
        opacities[i] = alpha;
        sizes[i] = 0.05 * (1 - i / particle.trailMaxLength * 0.5);
      } else {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        opacities[i] = 0;
      }
    }

    particle.trail.geometry.attributes.position.needsUpdate = true;
    particle.trail.geometry.attributes.color.needsUpdate = true;
    particle.trail.geometry.attributes.opacity.needsUpdate = true;
    particle.trail.geometry.attributes.size.needsUpdate = true;
  }

  private clearTrail(particle: Particle): void {
    if (particle.trailPositions.length > 0) {
      particle.trailPositions = [];
      const opacities = particle.trail.geometry.attributes.opacity.array as Float32Array;
      opacities.fill(0);
      particle.trail.geometry.attributes.opacity.needsUpdate = true;
    }
  }

  private checkDeformationBounce(particle: Particle): void {
    const energy = this.surface.getDeformationEnergy();
    if (energy > 0.1 && !particle.bouncing) {
      const distance = particle.mesh.position.distanceTo(particle.currentVertex.position);
      if (distance > 0.05) {
        this.triggerBounce(particle);
      }
    }
  }

  private triggerBounce(particle: Particle): void {
    particle.bouncing = true;
    particle.bounceStartTime = performance.now();
  }

  public getAverageVelocity(): number {
    if (this.particles.length === 0) return 0;
    const total = this.particles.reduce((sum, p) => sum + p.velocity, 0);
    return total / this.particles.length;
  }

  public getParticleCount(): number {
    return this.particleCount;
  }

  public getParticles(): Particle[] {
    return this.particles;
  }

  public dispose(): void {
    for (const particle of this.particles) {
      this.scene.remove(particle.mesh);
      this.scene.remove(particle.trail);
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
      particle.trail.geometry.dispose();
      (particle.trail.material as THREE.Material).dispose();
    }
    this.particles = [];
  }
}
