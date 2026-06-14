import * as THREE from 'three';
import { ParticleSystem } from './particleSystem';

export class PhysicsEngine {
  private particleSystem: ParticleSystem;

  public rotationSpeed: number = 1.0;
  public gravityStrength: number = 2.0;
  public flatness: number = 0.5;

  private targetRotationSpeed: number = 1.0;
  private targetGravityStrength: number = 2.0;
  private targetFlatness: number = 0.5;

  private readonly TRANSITION_DURATION: number = 0.3;
  private readonly COLOR_LOW = new THREE.Color('#2563eb');
  private readonly COLOR_HIGH = new THREE.Color('#ef4444');
  private readonly GALAXY_RADIUS: number = 10;

  private currentFlatness: number = 0.5;

  constructor(particleSystem: ParticleSystem) {
    this.particleSystem = particleSystem;
  }

  public setRotationSpeed(value: number): void {
    this.targetRotationSpeed = value;
  }

  public setGravityStrength(value: number): void {
    this.targetGravityStrength = value;
  }

  public setFlatness(value: number): void {
    this.targetFlatness = value;
  }

  public reset(): void {
    this.targetRotationSpeed = 1.0;
    this.targetGravityStrength = 2.0;
    this.targetFlatness = 0.5;
    this.rotationSpeed = 1.0;
    this.gravityStrength = 2.0;
    this.flatness = 0.5;
    this.currentFlatness = 0.5;
    this.particleSystem.reset();
  }

  public update(deltaTime: number): number {
    const lerpFactor = Math.min(1, deltaTime / this.TRANSITION_DURATION);

    this.rotationSpeed += (this.targetRotationSpeed - this.rotationSpeed) * lerpFactor;
    this.gravityStrength += (this.targetGravityStrength - this.gravityStrength) * lerpFactor;
    this.flatness += (this.targetFlatness - this.flatness) * lerpFactor;

    const dt = Math.min(deltaTime, 0.033);
    const count = this.particleSystem.particleCount;
    const positions = this.particleSystem.positions;
    const velocities = this.particleSystem.velocities;
    const colors = this.particleSystem.colors;
    const initialPositions = this.particleSystem.initialPositions;

    const rotSpeed = this.rotationSpeed;
    const gravStr = this.gravityStrength;
    const flatFactor = this.flatness;

    this.currentFlatness += (flatFactor - this.currentFlatness) * Math.min(1, dt / 0.3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const initX = initialPositions[i3];
      const initY = initialPositions[i3 + 1];
      const initZ = initialPositions[i3 + 2];
      const rFlat = Math.sqrt(initX * initX + initZ * initZ) + 0.3;
      const baseAngularVel = rotSpeed * 0.4 / Math.sqrt(rFlat);

      this.particleSystem.thetas[i] += baseAngularVel * dt;
      const theta = this.particleSystem.thetas[i];

      const rTarget = this.particleSystem.radii[i] * (1.0 + (gravStr - 2.0) * 0.02);
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const targetX = sinT * rFlat;
      const targetZ = cosT * rFlat;
      const targetY = initY * this.currentFlatness;

      let px = positions[i3];
      let py = positions[i3 + 1];
      let pz = positions[i3 + 2];

      px += (targetX - px) * Math.min(1, dt * 3.0);
      pz += (targetZ - pz) * Math.min(1, dt * 3.0);
      py += (targetY - py) * Math.min(1, dt * 4.0);

      const jitter = (Math.random() - 0.5) * 0.02 * gravStr;
      px += jitter * sinT;
      pz += jitter * cosT;

      positions[i3] = px;
      positions[i3 + 1] = py;
      positions[i3 + 2] = pz;

      const speed = baseAngularVel * rFlat + Math.abs(jitter) * 10;
      const normalizedSpeed = Math.max(0.1, Math.min(1.0, speed * 0.7));
      const t = (normalizedSpeed - 0.1) / 0.9;

      colors[i3] = this.COLOR_LOW.r + (this.COLOR_HIGH.r - this.COLOR_LOW.r) * t;
      colors[i3 + 1] = this.COLOR_LOW.g + (this.COLOR_HIGH.g - this.COLOR_LOW.g) * t;
      colors[i3 + 2] = this.COLOR_LOW.b + (this.COLOR_HIGH.b - this.COLOR_LOW.b) * t;

      velocities[i3] = (targetX - px) * 10;
      velocities[i3 + 1] = (targetY - py) * 10;
      velocities[i3 + 2] = (targetZ - pz) * 10;
    }

    this.particleSystem.updatePositions();
    this.particleSystem.updateColors();

    return count;
  }
}
