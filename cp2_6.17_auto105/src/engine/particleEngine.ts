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

  constructor(controlParams: ControlParams) {
    this.controlParams = { ...controlParams };
    this.initializePool();
  }

  private initializePool(): void {
    const maxParticles = 10000;
    for (let i = 0; i < maxParticles; i++) {
      this.particles.push({
        id: uuidv4(),
        position: new Float32Array(3),
        velocity: new Float32Array(3),
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
    particle.active = true;
  }

  public update(deltaTime: number, gestureForce: GestureForce): ParticleState[] {
    this.time += deltaTime;
    this.activeCount = 0;

    const noiseScale = 0.1;
    const noiseStrength = this.controlParams.noiseStrength;
    const damping = 0.95;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (!particle.active) continue;

      particle.age += deltaTime;

      if (particle.age >= particle.life) {
        particle.active = false;
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

      const state = this.particleStatePool[this.activeCount];
      state.id = particle.id;
      state.x = particle.position[0];
      state.y = particle.position[1];
      state.z = particle.position[2];
      state.age = particle.age;
      state.life = particle.life;

      this.activeCount++;
    }

    return this.particleStatePool.slice(0, this.activeCount);
  }

  public reset(): void {
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].active = false;
    }
    this.activeCount = 0;
    this.emit(this.controlParams.particleCount);
  }

  public setControlParams(params: Partial<ControlParams>): void {
    this.controlParams = { ...this.controlParams, ...params };
  }

  public getActiveCount(): number {
    return this.activeCount;
  }
}
