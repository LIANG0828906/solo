import * as THREE from 'three';
import type { Particle } from '../types';
import { 
  LJ_EPSILON, 
  LJ_SIGMA, 
  BOUNDARY_RADIUS, 
  TRAIL_LENGTH,
  createParticle 
} from '../types';
import { useSimulationStore } from '../stores/simulationStore';

export class SimulationEngine {
  private particles: Particle[] = [];
  private forces: THREE.Vector3[] = [];
  private dt: number = 0.016;

  constructor(initialCount: number = 100) {
    this.initParticles(initialCount);
  }

  private initParticles(count: number): void {
    this.particles = [];
    this.forces = [];
    
    for (let i = 0; i < count; i++) {
      this.particles.push(createParticle());
      this.forces.push(new THREE.Vector3());
    }
  }

  public getParticles(): Particle[] {
    return this.particles;
  }

  public setParticleCount(count: number): void {
    const currentCount = this.particles.length;
    
    if (count > currentCount) {
      for (let i = currentCount; i < count; i++) {
        this.particles.push(createParticle());
        this.forces.push(new THREE.Vector3());
      }
    } else if (count < currentCount) {
      this.particles.splice(count);
      this.forces.splice(count);
    }
  }

  public reset(): void {
    const store = useSimulationStore.getState();
    this.initParticles(store.particleCount);
  }

  private calculateLJForce(pi: Particle, pj: Particle): THREE.Vector3 {
    const store = useSimulationStore.getState();
    const dx = pj.position.x - pi.position.x;
    const dy = pj.position.y - pi.position.y;
    const dz = pj.position.z - pi.position.z;
    const r2 = dx * dx + dy * dy + dz * dz;
    
    if (r2 < 0.01) return new THREE.Vector3();
    
    const r = Math.sqrt(r2);
    const sigmaOverR = LJ_SIGMA / r;
    const sigmaOverR6 = Math.pow(sigmaOverR, 6);
    const sigmaOverR12 = sigmaOverR6 * sigmaOverR6;
    
    const gravity = store.gravityCoeff;
    const repulsion = store.repulsionCoeff;
    
    const magnitude = 24 * LJ_EPSILON / r * (2 * repulsion * sigmaOverR12 - gravity * sigmaOverR6);
    
    return new THREE.Vector3(
      magnitude * dx / r,
      magnitude * dy / r,
      magnitude * dz / r
    );
  }

  private calculateBoundaryForce(particle: Particle): THREE.Vector3 {
    const dist = particle.position.length();
    
    if (dist < BOUNDARY_RADIUS) return new THREE.Vector3();
    
    const direction = particle.position.clone().normalize();
    const magnitude = (dist - BOUNDARY_RADIUS) * 2.0;
    
    return direction.multiplyScalar(-magnitude);
  }

  private calculateTemperatureForce(): THREE.Vector3 {
    const store = useSimulationStore.getState();
    const tempFactor = Math.sqrt(store.temperature) * 0.1;
    
    return new THREE.Vector3(
      (Math.random() - 0.5) * tempFactor,
      (Math.random() - 0.5) * tempFactor,
      (Math.random() - 0.5) * tempFactor
    );
  }

  public step(): void {
    const store = useSimulationStore.getState();
    if (!store.isRunning) return;
    
    for (let i = 0; i < this.particles.length; i++) {
      this.forces[i].set(0, 0, 0);
    }
    
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const force = this.calculateLJForce(this.particles[i], this.particles[j]);
        this.forces[i].add(force);
        this.forces[j].sub(force);
      }
    }
    
    for (let i = 0; i < this.particles.length; i++) {
      const boundaryForce = this.calculateBoundaryForce(this.particles[i]);
      this.forces[i].add(boundaryForce);
      
      if (store.temperature > 0.1) {
        const tempForce = this.calculateTemperatureForce();
        this.forces[i].add(tempForce);
      }
    }
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const force = this.forces[i];
      
      const acceleration = force.clone();
      particle.velocity.add(acceleration.multiplyScalar(this.dt));
      particle.velocity.multiplyScalar(0.995);
      particle.position.add(particle.velocity.clone().multiplyScalar(this.dt));
      
      if (store.showTrails) {
        particle.trail.unshift(particle.position.clone());
        if (particle.trail.length > TRAIL_LENGTH) {
          particle.trail.pop();
        }
      }
    }
  }

  public getPositions(): Float32Array {
    const positions = new Float32Array(this.particles.length * 3);
    
    for (let i = 0; i < this.particles.length; i++) {
      positions[i * 3] = this.particles[i].position.x;
      positions[i * 3 + 1] = this.particles[i].position.y;
      positions[i * 3 + 2] = this.particles[i].position.z;
    }
    
    return positions;
  }

  public getColors(): Float32Array {
    const colors = new Float32Array(this.particles.length * 3);
    
    for (let i = 0; i < this.particles.length; i++) {
      const color = new THREE.Color(this.particles[i].color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return colors;
  }

  public getBonds(): Float32Array {
    const store = useSimulationStore.getState();
    if (!store.showBonds) return new Float32Array();
    
    const bonds: number[] = [];
    let bondCount = 0;
    
    for (let i = 0; i < this.particles.length && bondCount < 50; i++) {
      for (let j = i + 1; j < this.particles.length && bondCount < 50; j++) {
        const dist = this.particles[i].position.distanceTo(this.particles[j].position);
        
        if (dist < 1.0) {
          bonds.push(
            this.particles[i].position.x,
            this.particles[i].position.y,
            this.particles[i].position.z,
            this.particles[j].position.x,
            this.particles[j].position.y,
            this.particles[j].position.z
          );
          bondCount++;
        }
      }
    }
    
    return new Float32Array(bonds);
  }
}
