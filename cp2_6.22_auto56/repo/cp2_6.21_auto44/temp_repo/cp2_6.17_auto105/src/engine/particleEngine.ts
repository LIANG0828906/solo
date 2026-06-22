import { createNoise3D } from 'simplex-noise';
import { v4 as uuidv4 } from 'uuid';
import type { Particle, ControlParams, GestureForce, ParticleState } from './types';

export class ParticleEngine {
  private particles: Particle[] = [];
  private controlParams: ControlParams;
  private noise3D = createNoise3D();
  private time = 0;
  private particleStatePool: ParticleState[] = [];
  private activeCount = 0;
  private maxTrailFrames = 60;

  constructor(controlParams: ControlParams) {
    this.controlParams = { ...controlParams };
    this.maxTrailFrames = 60;
    this.initializePool();
  }

  private ensureTrailCapacity(particle: Particle): void {
    const requiredLength = this.maxTrailFrames * 3;
    if (particle.trail.length < requiredLength) {
      const newTrail = new Float32Array(requiredLength);
      newTrail.set(particle.trail);
      particle.trail = newTrail;
    }
  }

  private initializePool(): void {
    const maxParticles = 10000;
    const trailSize = this.maxTrailFrames * 3;
    for (let i = 0; i < maxParticles; i++) {
      this.particles.push({
        id: uuidv4(),
        position: new Float32Array(3),
        velocity: new Float32Array(3),
        trail: new Float32Array(trailSize),
        trailLength: 0,
        age: 0,
        life: 0,
        active: false,
      });
      this.particleStatePool.push({
        id: '',
        x: 0,
        y: 0,
        z: 0,
        age: 0,
        life: 0,
        trail: new Float32Array(trailSize),
        trailLength: 0,
      });
    }
  }

  public emit(count: number, position?: [number, number, number]): void {
    let emitted = 0;
    for (let i = 0; i < this.particles.length && emitted < count; i++) {
      if (!this.particles[i].active) {
        this.activateParticle(this.particles[i], position);
        emitted++;
      }
    }

    if (emitted < count) {
      for (let i = 0; i < this.particles.length && emitted < count; i++) {
        if (this.particles[i].active) {
          this.activateParticle(this.particles[i], position);
          emitted++;
        }
      }
    }
  }

  private activateParticle(particle: Particle, position?: [number, number, number]): void {
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.5;

    particle.position[0] = position ? position[0] + (Math.random() - 0.5) * 2 : (Math.random() - 0.5) * 10;
    particle.position[1] = position ? position[1] + (Math.random() - 0.5) * 2 : (Math.random() - 0.5) * 10;
    particle.position[2] = position ? position[2] + (Math.random() - 0.5) * 2 : (Math.random() - 0.5) * 10;

    particle.velocity[0] = Math.cos(angle1) * Math.cos(angle2) * speed;
    particle.velocity[1] = Math.sin(angle2) * speed;
    particle.velocity[2] = Math.sin(angle1) * Math.cos(angle2) * speed;

    particle.age = 0;
    particle.life = this.controlParams.particleLife * (0.8 + Math.random() * 0.4);

    this.ensureTrailCapacity(particle);
    particle.trail.fill(0);
    particle.trail[0] = particle.position[0];
    particle.trail[1] = particle.position[1];
    particle.trail[2] = particle.position[2];
    particle.trailLength = 1;

    particle.active = true;
  }

  public update(deltaTime: number, gestureForce: GestureForce): ParticleState[] {
    this.time += deltaTime;
    this.activeCount = 0;

    const noiseScale = 0.1;
    const noiseStrength = this.controlParams.noiseStrength;
    const damping = 0.95;
    const trailFrameCount = this.controlParams.trailFrameCount;
    const maxFrames = this.maxTrailFrames;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (!particle.active) continue;

      particle.age += deltaTime;

      if (particle.age >= particle.life) {
        particle.active = false;
        particle.trailLength = 0;
        continue;
      }

      const px = particle.position[0];
      const py = particle.position[1];
      const pz = particle.position[2];

      const ax = this.noise3D(px * noiseScale, py * noiseScale, pz * noiseScale + this.time * 0.5) * noiseStrength;
      const ay = this.noise3D(px * noiseScale + 100, py * noiseScale + 100, pz * noiseScale + this.time * 0.5) * noiseStrength;
      const az = this.noise3D(px * noiseScale + 200, py * noiseScale + 200, pz * noiseScale + this.time * 0.5) * noiseStrength;

      particle.velocity[0] += ax * deltaTime * 60;
      particle.velocity[1] += ay * deltaTime * 60;
      particle.velocity[2] += az * deltaTime * 60;

      particle.velocity[0] += gestureForce.x * gestureForce.strength * deltaTime * 60;
      particle.velocity[1] += gestureForce.y * gestureForce.strength * deltaTime * 60;
      particle.velocity[2] += gestureForce.z * gestureForce.strength * deltaTime * 60;

      particle.velocity[0] *= damping;
      particle.velocity[1] *= damping;
      particle.velocity[2] *= damping;

      particle.position[0] += particle.velocity[0] * deltaTime * 60;
      particle.position[1] += particle.velocity[1] * deltaTime * 60;
      particle.position[2] += particle.velocity[2] * deltaTime * 60;

      this.ensureTrailCapacity(particle);

      const effectiveLength = Math.min(trailFrameCount, maxFrames);

      if (particle.trailLength < effectiveLength) {
        const idx = particle.trailLength * 3;
        particle.trail[idx] = particle.position[0];
        particle.trail[idx + 1] = particle.position[1];
        particle.trail[idx + 2] = particle.position[2];
        particle.trailLength++;
      } else {
        for (let j = 0; j < effectiveLength - 1; j++) {
          particle.trail[j * 3] = particle.trail[(j + 1) * 3];
          particle.trail[j * 3 + 1] = particle.trail[(j + 1) * 3 + 1];
          particle.trail[j * 3 + 2] = particle.trail[(j + 1) * 3 + 2];
        }
        const lastIdx = (effectiveLength - 1) * 3;
        particle.trail[lastIdx] = particle.position[0];
        particle.trail[lastIdx + 1] = particle.position[1];
        particle.trail[lastIdx + 2] = particle.position[2];
        particle.trailLength = effectiveLength;
      }

      const state = this.particleStatePool[this.activeCount];
      state.id = particle.id;
      state.x = particle.position[0];
      state.y = particle.position[1];
      state.z = particle.position[2];
      state.age = particle.age;
      state.life = particle.life;

      if (state.trail.length < particle.trail.length) {
        state.trail = new Float32Array(particle.trail.length);
      }
      state.trail.set(particle.trail);
      state.trailLength = particle.trailLength;

      this.activeCount++;
    }

    return this.particleStatePool.slice(0, this.activeCount);
  }

  public reset(): void {
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].active = false;
      this.particles[i].trailLength = 0;
    }
    this.activeCount = 0;
    this.emit(this.controlParams.particleCount);
  }

  public setControlParams(params: Partial<ControlParams>): void {
    if (params.trailFrameCount !== undefined) {
      if (params.trailFrameCount > this.maxTrailFrames) {
        this.maxTrailFrames = params.trailFrameCount;
        for (let i = 0; i < this.particles.length; i++) {
          this.ensureTrailCapacity(this.particles[i]);
        }
        for (let i = 0; i < this.particleStatePool.length; i++) {
          const required = this.maxTrailFrames * 3;
          if (this.particleStatePool[i].trail.length < required) {
            this.particleStatePool[i].trail = new Float32Array(required);
          }
        }
      }
    }
    this.controlParams = { ...this.controlParams, ...params };
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public getTrailFrameCount(): number {
    return this.controlParams.trailFrameCount;
  }
}
