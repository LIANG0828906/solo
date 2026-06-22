import * as THREE from 'three';
import {
  Particle,
  FieldParams,
  DEFAULT_FIELD_PARAMS,
  ELECTRON_COLOR,
  PROTON_COLOR,
  MAX_TRAIL_LENGTH,
  BOUNDARY_RADIUS,
  SHELL_MIN_RADIUS,
  SHELL_MAX_RADIUS
} from './types';

function randomInShell(): THREE.Vector3 {
  const r = SHELL_MIN_RADIUS + Math.random() * (SHELL_MAX_RADIUS - SHELL_MIN_RADIUS);
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
}

function randomDirection(): THREE.Vector3 {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi)
  );
}

export function createParticle(id: number, speed: number): Particle {
  const isElectron = Math.random() < 0.5;
  const type = isElectron ? 'electron' : 'proton';
  const position = randomInShell();
  const dir = randomDirection();
  const velocity = dir.multiplyScalar(speed);

  return {
    id,
    type,
    position: position.clone(),
    velocity: velocity.clone(),
    trail: [],
    charge: isElectron ? -1 : 1,
    mass: isElectron ? 1 : 1836,
    radius: isElectron ? 0.15 : 0.2,
    color: isElectron ? ELECTRON_COLOR.clone() : PROTON_COLOR.clone(),
    initialPosition: position.clone(),
    initialVelocity: velocity.clone(),
    highlight: false,
    glowScale: 1.0,
    glowPulse: 0
  };
}

function lorentzDerivative(
  vel: THREE.Vector3,
  charge: number,
  mass: number,
  B: THREE.Vector3
): THREE.Vector3 {
  const force = new THREE.Vector3().crossVectors(vel, B).multiplyScalar(charge / mass);
  return force;
}

export function rk4Step(
  pos: THREE.Vector3,
  vel: THREE.Vector3,
  charge: number,
  mass: number,
  B: THREE.Vector3,
  dt: number
): { newPos: THREE.Vector3; newVel: THREE.Vector3 } {
  const k1v = lorentzDerivative(vel, charge, mass, B).clone().multiplyScalar(dt);
  const k1x = vel.clone().multiplyScalar(dt);

  const v2 = vel.clone().add(k1v.clone().multiplyScalar(0.5));
  const k2v = lorentzDerivative(v2, charge, mass, B).clone().multiplyScalar(dt);
  const k2x = v2.clone().multiplyScalar(dt);

  const v3 = vel.clone().add(k2v.clone().multiplyScalar(0.5));
  const k3v = lorentzDerivative(v3, charge, mass, B).clone().multiplyScalar(dt);
  const k3x = v3.clone().multiplyScalar(dt);

  const v4 = vel.clone().add(k3v);
  const k4v = lorentzDerivative(v4, charge, mass, B).clone().multiplyScalar(dt);
  const k4x = v4.clone().multiplyScalar(dt);

  const newVel = vel.clone()
    .add(k1v.clone().multiplyScalar(1 / 6))
    .add(k2v.clone().multiplyScalar(1 / 3))
    .add(k3v.clone().multiplyScalar(1 / 3))
    .add(k4v.clone().multiplyScalar(1 / 6));

  const newPos = pos.clone()
    .add(k1x.clone().multiplyScalar(1 / 6))
    .add(k2x.clone().multiplyScalar(1 / 3))
    .add(k3x.clone().multiplyScalar(1 / 3))
    .add(k4x.clone().multiplyScalar(1 / 6));

  return { newPos, newVel };
}

export class ParticleSystem {
  particles: Particle[] = [];
  private params: FieldParams = { ...DEFAULT_FIELD_PARAMS };
  private nextId = 0;
  private magneticField = new THREE.Vector3(0, 1, 0);

  get fieldDirection(): THREE.Vector3 {
    return this.magneticField.clone();
  }

  get currentParams(): FieldParams {
    return { ...this.params };
  }

  setParams(params: Partial<FieldParams>) {
    this.params = { ...this.params, ...params };
    this.magneticField.set(0, this.params.magneticFieldStrength, 0);
    this.adjustParticleCount();
  }

  private adjustParticleCount() {
    const target = this.params.particleCount;
    while (this.particles.length < target) {
      this.particles.push(createParticle(this.nextId++, this.params.emissionSpeed));
    }
    while (this.particles.length > target) {
      this.particles.pop();
    }
  }

  resetAll() {
    this.particles = [];
    this.nextId = 0;
    this.adjustParticleCount();
  }

  reEmitAll() {
    for (const p of this.particles) {
      const newPos = randomInShell();
      const dir = randomDirection();
      const newVel = dir.multiplyScalar(this.params.emissionSpeed);
      p.position.copy(newPos);
      p.velocity.copy(newVel);
      p.initialPosition.copy(newPos);
      p.initialVelocity.copy(newVel);
      p.trail = [];
    }
  }

  update(dt: number) {
    const B = this.magneticField;
    for (const p of this.particles) {
      p.trail.push(p.position.clone());
      if (p.trail.length > MAX_TRAIL_LENGTH) {
        p.trail.shift();
      }

      const steps = Math.max(1, Math.round(dt / 0.01));
      const subDt = dt / steps;
      for (let i = 0; i < steps; i++) {
        const result = rk4Step(p.position, p.velocity, p.charge, p.mass, B, subDt);
        p.position.copy(result.newPos);
        p.velocity.copy(result.newVel);
      }

      if (p.position.length() > BOUNDARY_RADIUS) {
        const newPos = randomInShell();
        const dir = randomDirection();
        const newVel = dir.multiplyScalar(this.params.emissionSpeed);
        p.position.copy(newPos);
        p.velocity.copy(newVel);
        p.initialPosition.copy(newPos);
        p.initialVelocity.copy(newVel);
        p.trail = [];
      }

      if (p.highlight) {
        p.glowPulse += dt * 3;
        p.glowScale = 1.2 + 0.15 * Math.sin(p.glowPulse);
      } else {
        p.glowScale = 1.0;
        p.glowPulse = 0;
      }
    }
  }

  getStats(): { totalParticles: number; electronCount: number; protonCount: number; averageSpeed: number } {
    let electronCount = 0;
    let protonCount = 0;
    let totalSpeed = 0;
    for (const p of this.particles) {
      if (p.type === 'electron') electronCount++;
      else protonCount++;
      totalSpeed += p.velocity.length();
    }
    return {
      totalParticles: this.particles.length,
      electronCount,
      protonCount,
      averageSpeed: this.particles.length > 0 ? totalSpeed / this.particles.length : 0
    };
  }

  getParticleAtScreenPos(
    mouseNDC: THREE.Vector2,
    camera: THREE.Camera,
    maxDist: number = 0.5
  ): Particle | null {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouseNDC, camera);
    let closest: Particle | null = null;
    let closestDist = maxDist;
    for (const p of this.particles) {
      const dist = raycaster.ray.distanceToPoint(p.position);
      if (dist < closestDist) {
        closestDist = dist;
        closest = p;
      }
    }
    return closest;
  }
}
