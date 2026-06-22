import * as THREE from 'three';
import { ParticleData } from './types';

export class EffectsManager {
  private scene: THREE.Scene;
  private particles: ParticleData[] = [];
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.PointsMaterial;
  private particleSystem: THREE.Points | null = null;
  private maxParticles: number = 150;
  private emissionRate: number = 60;
  private particlesToEmit: number = 0;
  private chimneyPosition: THREE.Vector3 = new THREE.Vector3();
  private isEmitting: boolean = false;

  private glowMeshes: Map<string, THREE.Mesh> = new Map();
  private glowTimeouts: Map<string, number> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleMaterial = new THREE.PointsMaterial({
      size: 30,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.NormalBlending,
      sizeAttenuation: false,
      depthWrite: false
    });
    this.initParticleSystem();
    this.addTestParticle();
  }

  private addTestParticle(): void {
    const testParticle: ParticleData = {
      position: new THREE.Vector3(0, 3, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      size: 1,
      life: 0,
      maxLife: 999999,
      color: new THREE.Color(0xff0000)
    };
    this.particles.push(testParticle);
  }

  private initParticleSystem(): void {
    const positions = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 3);

    for (let i = 0; i < this.maxParticles; i++) {
      positions[i * 3 + 1] = -1000;
    }

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particleSystem);
  }

  public setChimneyPosition(position: THREE.Vector3): void {
    this.chimneyPosition.copy(position);
  }

  public startEmission(): void {
    this.isEmitting = true;
  }

  public stopEmission(): void {
    this.isEmitting = false;
  }

  public update(deltaTime: number): void {
    if (this.isEmitting) {
      this.particlesToEmit += this.emissionRate * deltaTime;
      while (this.particlesToEmit >= 1 && this.particles.length < this.maxParticles) {
        this.emitParticle();
        this.particlesToEmit -= 1;
      }
    }

    this.updateParticles(deltaTime);
    this.updateParticleGeometry();
  }

  private emitParticle(): void {
    const particle: ParticleData = {
      position: new THREE.Vector3(
        this.chimneyPosition.x + (Math.random() - 0.5) * 0.1,
        this.chimneyPosition.y,
        this.chimneyPosition.z + (Math.random() - 0.5) * 0.1
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        0.3,
        (Math.random() - 0.5) * 0.1
      ),
      size: 0.02,
      life: 0,
      maxLife: 1.5,
      color: new THREE.Color(0xFFFFFF)
    };
    this.particles.push(particle);
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.life += deltaTime;

      if (particle.life >= particle.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.position.z += particle.velocity.z * deltaTime;

      particle.velocity.x *= 0.98;
      particle.velocity.z *= 0.98;

      const lifeRatio = particle.life / particle.maxLife;
      particle.size = 0.02 + lifeRatio * 0.03;

      const startColor = new THREE.Color(0xFFFFFF);
      const endColor = new THREE.Color(0xB0B0B0);
      particle.color = startColor.clone().lerp(endColor, lifeRatio);
    }
  }

  private updateParticleGeometry(): void {
    const positions = this.particleGeometry.attributes.position.array as Float32Array;
    const colors = this.particleGeometry.attributes.color.array as Float32Array;

    for (let i = 0; i < this.maxParticles; i++) {
      if (i < this.particles.length) {
        const particle = this.particles[i];
        positions[i * 3] = particle.position.x;
        positions[i * 3 + 1] = particle.position.y;
        positions[i * 3 + 2] = particle.position.z;

        colors[i * 3] = particle.color.r;
        colors[i * 3 + 1] = particle.color.g;
        colors[i * 3 + 2] = particle.color.b;
      } else {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -1000;
        positions[i * 3 + 2] = 0;
      }
    }

    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.color.needsUpdate = true;
  }

  public highlightMesh(mesh: THREE.Object3D, partId: string): void {
    this.removeHighlight(partId);

    let targetMesh: THREE.Mesh | null = null;
    
    if (mesh instanceof THREE.Mesh) {
      targetMesh = mesh;
    } else {
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && !targetMesh) {
          targetMesh = child;
        }
      });
    }

    if (!targetMesh || !targetMesh.geometry) return;

    const geometry = targetMesh.geometry;
    
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.6,
      side: THREE.BackSide
    });

    const glowMesh = new THREE.Mesh(geometry, glowMaterial);
    glowMesh.scale.setScalar(1.05);
    glowMesh.position.copy(targetMesh.position);
    glowMesh.rotation.copy(targetMesh.rotation);
    
    if (targetMesh.parent) {
      targetMesh.parent.add(glowMesh);
    } else {
      this.scene.add(glowMesh);
    }

    this.glowMeshes.set(partId, glowMesh);

    const timeout = window.setTimeout(() => {
      this.removeHighlight(partId);
    }, 500);

    this.glowTimeouts.set(partId, timeout);
  }

  public removeHighlight(partId: string): void {
    const glowMesh = this.glowMeshes.get(partId);
    if (glowMesh) {
      if (glowMesh.parent) {
        glowMesh.parent.remove(glowMesh);
      } else {
        this.scene.remove(glowMesh);
      }
      this.glowMeshes.delete(partId);
    }

    const timeout = this.glowTimeouts.get(partId);
    if (timeout) {
      clearTimeout(timeout);
      this.glowTimeouts.delete(partId);
    }
  }

  public removeAllHighlights(): void {
    for (const partId of this.glowMeshes.keys()) {
      this.removeHighlight(partId);
    }
  }

  public getParticleCount(): number {
    return this.particles.length;
  }

  public dispose(): void {
    this.stopEmission();
    this.removeAllHighlights();
    
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
      this.particleGeometry.dispose();
      this.particleMaterial.dispose();
    }
    
    this.particles = [];
  }
}
