import * as THREE from 'three';
import { scaleLinear } from 'd3-scale';

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
  trail: THREE.Vector3[];
  trailTimestamps: number[];
  active: boolean;
}

export interface BuildingAABB {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export interface ParticleSnapshot {
  timestamp: number;
  particles: Array<{
    position: [number, number, number];
    color: [number, number, number, number];
    trail: [number, number, number][];
    active: boolean;
  }>;
}

interface ParticleSystemConfig {
  particleCount?: number;
  emissionRate?: number;
  windSpeedRange?: [number, number];
  trailLength?: number;
  trailFadeTime?: number;
  historyMaxFrames?: number;
  targetFPS?: number;
}

const DEFAULT_CONFIG: Required<ParticleSystemConfig> = {
  particleCount: 300,
  emissionRate: 30,
  windSpeedRange: [0.5, 15],
  trailLength: 30,
  trailFadeTime: 1.5,
  historyMaxFrames: 1800,
  targetFPS: 24,
};

const COLOR_SCALE = scaleLinear<string>()
  .domain([0, 1])
  .range(['#3498DB', '#E74C3C']);

export class ParticleSystem {
  private config: Required<ParticleSystemConfig>;
  private particles: Particle[] = [];
  private buildings: BuildingAABB[] = [];
  private emissionPlane: { min: THREE.Vector3; max: THREE.Vector3 } | null = null;
  private windDirection = new THREE.Vector3(1, 0.1, 1).normalize();
  private currentTime = 0;
  private isEmitting = false;
  private lastFrameTime = 0;
  private frameInterval: number;
  private animationFrameId: number | null = null;
  private history: ParticleSnapshot[] = [];
  private emissionAccumulator = 0;
  private currentWindSpeed = 5;
  private onSnapshotCallback: ((snapshot: ParticleSnapshot) => void) | null = null;

  constructor(config: ParticleSystemConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.frameInterval = 1000 / this.config.targetFPS;
    this.initializeParticles();
  }

  private initializeParticles(): void {
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0,
        color: new THREE.Color(),
        trail: [],
        trailTimestamps: [],
        active: false,
      });
    }
  }

  setEmissionPlane(northWest: THREE.Vector3, southEast: THREE.Vector3): void {
    this.emissionPlane = {
      min: northWest.clone(),
      max: southEast.clone(),
    };
  }

  setBuildings(buildings: BuildingAABB[]): void {
    this.buildings = buildings.map((b) => ({
      min: b.min.clone(),
      max: b.max.clone(),
    }));
  }

  setWindDirection(direction: THREE.Vector3): void {
    this.windDirection.copy(direction).normalize();
  }

  setWindSpeed(speed: number): void {
    this.currentWindSpeed = Math.max(
      this.config.windSpeedRange[0],
      Math.min(this.config.windSpeedRange[1], speed)
    );
  }

  setOnSnapshotCallback(callback: (snapshot: ParticleSnapshot) => void): void {
    this.onSnapshotCallback = callback;
  }

  startEmission(): void {
    if (this.isEmitting) return;
    this.isEmitting = true;
    this.lastFrameTime = performance.now();
    this.animationLoop();
  }

  stopEmission(): void {
    this.isEmitting = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  seekToTime(targetTime: number): void {
    if (targetTime < 0) targetTime = 0;

    const nearestFrame = this.findNearestHistoryFrame(targetTime);
    if (nearestFrame) {
      this.restoreFromSnapshot(nearestFrame);
      this.currentTime = nearestFrame.timestamp;
      const remainingTime = targetTime - this.currentTime;
      if (remainingTime > 0) {
        this.simulateSteps(remainingTime);
      }
    } else {
      this.reset();
      this.currentTime = 0;
      this.simulateSteps(targetTime);
    }
  }

  private findNearestHistoryFrame(targetTime: number): ParticleSnapshot | null {
    if (this.history.length === 0) return null;

    let left = 0;
    let right = this.history.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (this.history[mid].timestamp === targetTime) {
        return this.history[mid];
      } else if (this.history[mid].timestamp < targetTime) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    if (right >= 0) return this.history[right];
    if (left < this.history.length) return this.history[left];

    return null;
  }

  private restoreFromSnapshot(snapshot: ParticleSnapshot): void {
    snapshot.particles.forEach((particleData, index) => {
      const particle = this.particles[index];
      particle.position.set(...particleData.position);
      particle.color.setRGB(particleData.color[0], particleData.color[1], particleData.color[2]);
      particle.trail = particleData.trail.map((t) => new THREE.Vector3(...t));
      particle.trailTimestamps = particle.trail.map(() => snapshot.timestamp);
      particle.active = particleData.active;
    });
  }

  private simulateSteps(duration: number): void {
    const stepSize = 1 / 60;
    let remaining = duration;

    while (remaining > 0) {
      const dt = Math.min(stepSize, remaining);
      this.update(dt);
      remaining -= dt;
    }
  }

  private animationLoop = (): void => {
    if (!this.isEmitting) return;

    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000;

    if (deltaTime >= this.frameInterval / 1000) {
      this.update(deltaTime);
      this.captureSnapshot();
      this.lastFrameTime = now;
    }

    this.animationFrameId = requestAnimationFrame(this.animationLoop);
  };

  private update(dt: number): void {
    this.currentTime += dt;
    this.emissionAccumulator += this.config.emissionRate * dt;

    while (this.emissionAccumulator >= 1) {
      this.emitParticle();
      this.emissionAccumulator -= 1;
    }

    this.particles.forEach((particle) => {
      if (!particle.active) return;

      particle.life -= dt;
      if (particle.life <= 0) {
        particle.active = false;
        return;
      }

      const oldPos = particle.position.clone();
      particle.position.add(particle.velocity.clone().multiplyScalar(dt));
      this.checkCollisions(particle, oldPos);
      this.updateTrail(particle, this.currentTime);
      this.updateParticleColor(particle);
    });
  }

  private emitParticle(): void {
    if (!this.emissionPlane) return;

    const inactiveParticle = this.particles.find((p) => !p.active);
    if (!inactiveParticle) return;

    const { min, max } = this.emissionPlane;
    inactiveParticle.position.set(
      min.x + Math.random() * (max.x - min.x),
      min.y + Math.random() * (max.y - min.y),
      min.z + Math.random() * (max.z - min.z)
    );

    const speed = this.currentWindSpeed * (0.8 + Math.random() * 0.4);
    const turbulence = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.3
    );

    inactiveParticle.velocity
      .copy(this.windDirection)
      .multiplyScalar(speed)
      .add(turbulence);

    inactiveParticle.life = 4 + Math.random() * 3;
    inactiveParticle.maxLife = inactiveParticle.life;
    inactiveParticle.trail = [];
    inactiveParticle.trailTimestamps = [];
    inactiveParticle.active = true;

    this.updateParticleColor(inactiveParticle);
  }

  private checkCollisions(particle: Particle, oldPos: THREE.Vector3): void {
    for (const building of this.buildings) {
      if (this.intersectsAABB(particle.position, building)) {
        this.resolveCollision(particle, oldPos, building);
      }
    }
  }

  private intersectsAABB(point: THREE.Vector3, aabb: BuildingAABB): boolean {
    return (
      point.x >= aabb.min.x &&
      point.x <= aabb.max.x &&
      point.y >= aabb.min.y &&
      point.y <= aabb.max.y &&
      point.z >= aabb.min.z &&
      point.z <= aabb.max.z
    );
  }

  private resolveCollision(
    particle: Particle,
    oldPos: THREE.Vector3,
    building: BuildingAABB
  ): void {
    const velocity = particle.velocity.clone();
    particle.position.copy(oldPos);

    const normal = new THREE.Vector3();
    const center = new THREE.Vector3(
      (building.min.x + building.max.x) / 2,
      (building.min.y + building.max.y) / 2,
      (building.min.z + building.max.z) / 2
    );

    const toParticle = particle.position.clone().sub(center);
    const halfSize = new THREE.Vector3(
      (building.max.x - building.min.x) / 2,
      (building.max.y - building.min.y) / 2,
      (building.max.z - building.min.z) / 2
    );

    const dx = Math.abs(toParticle.x) - halfSize.x;
    const dy = Math.abs(toParticle.y) - halfSize.y;
    const dz = Math.abs(toParticle.z) - halfSize.z;

    if (dx >= dy && dx >= dz) {
      normal.set(Math.sign(toParticle.x), 0, 0);
    } else if (dy >= dx && dy >= dz) {
      normal.set(0, Math.sign(toParticle.y), 0);
    } else {
      normal.set(0, 0, Math.sign(toParticle.z));
    }

    const dot = velocity.dot(normal);
    particle.velocity.sub(normal.multiplyScalar(2 * dot));
    particle.velocity.multiplyScalar(0.7);

    const offset = particle.velocity.clone().normalize().multiplyScalar(0.1);
    particle.position.add(offset);
  }

  private updateTrail(particle: Particle, currentTime: number): void {
    particle.trail.push(particle.position.clone());
    particle.trailTimestamps.push(currentTime);

    if (particle.trail.length > this.config.trailLength) {
      particle.trail.shift();
      particle.trailTimestamps.shift();
    }

    const cutoffTime = currentTime - this.config.trailFadeTime;
    while (
      particle.trailTimestamps.length > 0 &&
      particle.trailTimestamps[0] < cutoffTime
    ) {
      particle.trail.shift();
      particle.trailTimestamps.shift();
    }
  }

  private updateParticleColor(particle: Particle): void {
    const speed = particle.velocity.length();
    const normalizedSpeed =
      (speed - this.config.windSpeedRange[0]) /
      (this.config.windSpeedRange[1] - this.config.windSpeedRange[0]);

    const clampedSpeed = Math.max(0, Math.min(1, normalizedSpeed));
    const colorHex = COLOR_SCALE(clampedSpeed);
    particle.color.set(colorHex);
  }

  private captureSnapshot(): void {
    const snapshot: ParticleSnapshot = {
      timestamp: this.currentTime,
      particles: this.particles.map((p) => ({
        position: [p.position.x, p.position.y, p.position.z] as [
          number,
          number,
          number
        ],
        color: [p.color.r, p.color.g, p.color.b, 0.65] as [
          number,
          number,
          number,
          number
        ],
        trail: p.trail.map(
          (t) => [t.x, t.y, t.z] as [number, number, number]
        ),
        active: p.active,
      })),
    };

    this.history.push(snapshot);
    if (this.history.length > this.config.historyMaxFrames) {
      this.history.shift();
    }

    if (this.onSnapshotCallback) {
      this.onSnapshotCallback(snapshot);
    }
  }

  getParticles(): Particle[] {
    return this.particles.filter((p) => p.active);
  }

  getAllParticles(): Particle[] {
    return this.particles;
  }

  getHistory(): ParticleSnapshot[] {
    return this.history;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getTrailFadeTime(): number {
    return this.config.trailFadeTime;
  }

  reset(): void {
    this.particles.forEach((p) => {
      p.active = false;
      p.trail = [];
      p.trailTimestamps = [];
    });
    this.history = [];
    this.currentTime = 0;
    this.emissionAccumulator = 0;
  }

  dispose(): void {
    this.stopEmission();
    this.history = [];
    this.particles = [];
  }
}
