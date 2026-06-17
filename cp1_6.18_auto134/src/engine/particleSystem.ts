import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import { TrackNode } from './trackNode';

export interface Particle {
  id: string;
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  trackId: string;
  initialOpacity: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Map<string, Particle> = new Map();
  private particleGeometry: THREE.PlaneGeometry;
  
  private maxParticlesPerTrack: number = 200;
  private maxTotalParticles: number = 500;
  private particleSize: number = 4;
  private particleLife: number = 3;
  
  private normalEmitRate: number = 10;
  private reducedEmitRate: number = 5;
  private minVelocity: number = 2;
  private maxVelocity: number = 8;
  
  private lastEmitTime: number = 0;
  private trackParticleCounts: Map<string, number> = new Map();
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particleGeometry = new THREE.PlaneGeometry(this.particleSize, this.particleSize);
  }
  
  get totalParticles(): number {
    return this.particles.size;
  }
  
  private getCurrentEmitRate(): number {
    return this.totalParticles > this.maxTotalParticles ? this.reducedEmitRate : this.normalEmitRate;
  }
  
  public emit(track: TrackNode, count: number): void {
    if (!track) return;
    
    const trackCount = this.trackParticleCounts.get(track.id) || 0;
    if (trackCount >= this.maxParticlesPerTrack) return;
    if (this.totalParticles >= this.maxTotalParticles) return;
    
    const densityMultiplier = track.getParticleDensityMultiplier();
    const volumeFactor = track.volume / 100;
    const actualCount = Math.min(count, this.maxParticlesPerTrack - trackCount, this.maxTotalParticles - this.totalParticles);
    
    for (let i = 0; i < actualCount; i++) {
      if (Math.random() < volumeFactor * densityMultiplier * 0.1) {
        this.createParticle(track);
      }
    }
  }
  
  private createParticle(track: TrackNode): void {
    const color = new THREE.Color(track.color);
    
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(this.particleGeometry, material);
    
    const direction = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize();
    
    const nodeRadius = 50 * (track.volume / 100 * 0.6 + 0.8);
    mesh.position.copy(track.position).add(direction.clone().multiplyScalar(nodeRadius));
    
    const speed = this.minVelocity + Math.random() * (this.maxVelocity - this.minVelocity);
    const velocity = direction.clone().multiplyScalar(speed);
    
    const particle: Particle = {
      id: uuidv4(),
      mesh,
      velocity,
      life: this.particleLife,
      maxLife: this.particleLife,
      trackId: track.id,
      initialOpacity: 0.8
    };
    
    this.particles.set(particle.id, particle);
    this.scene.add(mesh);
    
    const currentCount = this.trackParticleCounts.get(track.id) || 0;
    this.trackParticleCounts.set(track.id, currentCount + 1);
  }
  
  public update(deltaTime: number, tracks: TrackNode[]): void {
    const now = performance.now();
    const emitInterval = 1000 / this.getCurrentEmitRate();
    
    if (now - this.lastEmitTime > emitInterval) {
      tracks.forEach(track => {
        const particlesToEmit = Math.ceil(track.volume / 10);
        this.emit(track, particlesToEmit);
      });
      this.lastEmitTime = now;
    }
    
    const particlesToRemove: string[] = [];
    
    this.particles.forEach((particle) => {
      particle.life -= deltaTime;
      
      if (particle.life <= 0) {
        particlesToRemove.push(particle.id);
        return;
      }
      
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime * 60));
      
      const lifeRatio = particle.life / particle.maxLife;
      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = particle.initialOpacity * lifeRatio;
      
      particle.velocity.multiplyScalar(0.98);
    });
    
    particlesToRemove.forEach(id => {
      this.removeParticle(id);
    });
  }
  
  private removeParticle(id: string): void {
    const particle = this.particles.get(id);
    if (particle) {
      this.scene.remove(particle.mesh);
      
      const material = particle.mesh.material as THREE.Material;
      material.dispose();
      
      const trackCount = this.trackParticleCounts.get(particle.trackId) || 0;
      this.trackParticleCounts.set(particle.trackId, Math.max(0, trackCount - 1));
      
      this.particles.delete(id);
    }
  }
  
  public clearTrackParticles(trackId: string): void {
    const particlesToRemove: string[] = [];
    
    this.particles.forEach((particle, id) => {
      if (particle.trackId === trackId) {
        particlesToRemove.push(id);
      }
    });
    
    particlesToRemove.forEach(id => this.removeParticle(id));
  }
  
  public dispose(): void {
    this.particles.forEach((_, id) => {
      this.removeParticle(id);
    });
    
    this.particleGeometry.dispose();
    this.particles.clear();
    this.trackParticleCounts.clear();
  }
}
