import {
  ParticleParams,
  ForceFieldParams,
  RenderParams,
  ParticleData,
  Vec3,
} from '../types';
import { applyAllForces } from './forceField';

const STRIDE = 12;

interface ParticleRuntime {
  positions: Float32Array;
  velocities: Float32Array;
  ages: Float32Array;
  lifetimes: Float32Array;
  colorSeeds: Float32Array;
  trailHistory: Float32Array;
  maxCount: number;
  activeCount: number;
  trailLength: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

function lerpColor(
  colors: string[],
  t: number
): [number, number, number] {
  const n = colors.length;
  if (n === 1) return hexToRgb(colors[0]);
  const scaled = t * (n - 1);
  const idx = Math.min(Math.floor(scaled), n - 2);
  const f = scaled - idx;
  const c1 = hexToRgb(colors[idx]);
  const c2 = hexToRgb(colors[idx + 1]);
  return [
    c1[0] + (c2[0] - c1[0]) * f,
    c1[1] + (c2[1] - c1[1]) * f,
    c1[2] + (c2[2] - c1[2]) * f,
  ];
}

export class ParticleEngine {
  private rt: ParticleRuntime;
  private params: ParticleParams;
  private forces: ForceFieldParams;
  private render: RenderParams;
  private emitAccumulator: number = 0;

  constructor(
    params: ParticleParams,
    forces: ForceFieldParams,
    render: RenderParams
  ) {
    this.params = { ...params };
    this.forces = {
      gravity: { ...forces.gravity },
      vortex: { ...forces.vortex, position: { ...forces.vortex.position } },
      wind: { ...forces.wind },
    };
    this.render = { ...render, colors: [...render.colors] };

    const maxCount = 500;
    const trailLength = render.trailLength;
    this.rt = {
      positions: new Float32Array(maxCount * 3),
      velocities: new Float32Array(maxCount * 3),
      ages: new Float32Array(maxCount),
      lifetimes: new Float32Array(maxCount),
      colorSeeds: new Float32Array(maxCount),
      trailHistory: new Float32Array(maxCount * trailLength * 3),
      maxCount,
      activeCount: 0,
      trailLength,
    };
    this.reset();
  }

  reset(): void {
    this.rt.positions.fill(0);
    this.rt.velocities.fill(0);
    this.rt.ages.fill(-1);
    this.rt.lifetimes.fill(0);
    this.rt.colorSeeds.fill(0);
    this.rt.trailHistory.fill(0);
    this.rt.activeCount = 0;
    this.emitAccumulator = 0;

    const count = this.params.count;
    for (let i = 0; i < count; i++) {
      this.emitParticle(i, Math.random() * this.params.lifetime);
    }
    this.rt.activeCount = count;
  }

  private emitParticle(index: number, initialAge: number = 0): void {
    const angleRad = (this.params.emissionAngle * Math.PI) / 180;
    const spread = angleRad / 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * spread;

    const baseLen = Math.sqrt(
      this.params.velocity.x ** 2 +
      this.params.velocity.y ** 2 +
      this.params.velocity.z ** 2
    ) || 1;

    const baseNX = this.params.velocity.x / baseLen;
    const baseNY = this.params.velocity.y / baseLen;
    const baseNZ = this.params.velocity.z / baseLen;

    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    const rx = cosPhi * cosTheta;
    const ry = sinPhi;
    const rz = cosPhi * sinTheta;

    const dot = baseNX * rx + baseNY * ry + baseNZ * rz;
    const vx = (rx - baseNX * dot) + baseNX * cosPhi;
    const vy = (ry - baseNY * dot) + baseNY * cosPhi;
    const vz = (rz - baseNZ * dot) + baseNZ * cosPhi;

    const vLen = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
    const speedJitter = 0.8 + Math.random() * 0.4;
    const speed = baseLen * speedJitter;

    this.rt.positions[index * 3] = 0;
    this.rt.positions[index * 3 + 1] = 0;
    this.rt.positions[index * 3 + 2] = 0;

    this.rt.velocities[index * 3] = (vx / vLen) * speed;
    this.rt.velocities[index * 3 + 1] = (vy / vLen) * speed;
    this.rt.velocities[index * 3 + 2] = (vz / vLen) * speed;

    const lifetimeJitter = 0.7 + Math.random() * 0.6;
    this.rt.lifetimes[index] = this.params.lifetime * lifetimeJitter;
    this.rt.ages[index] = initialAge;
    this.rt.colorSeeds[index] = Math.random();

    const trailOffset = index * this.rt.trailLength * 3;
    for (let t = 0; t < this.rt.trailLength; t++) {
      this.rt.trailHistory[trailOffset + t * 3] = 0;
      this.rt.trailHistory[trailOffset + t * 3 + 1] = 0;
      this.rt.trailHistory[trailOffset + t * 3 + 2] = 0;
    }
  }

  updateParams(
    params: ParticleParams,
    forces: ForceFieldParams,
    render: RenderParams
  ): void {
    const needsReset =
      params.count !== this.params.count ||
      params.velocity.x !== this.params.velocity.x ||
      params.velocity.y !== this.params.velocity.y ||
      params.velocity.z !== this.params.velocity.z ||
      params.emissionAngle !== this.params.emissionAngle ||
      params.lifetime !== this.params.lifetime;

    this.params = { ...params };
    this.forces = {
      gravity: { ...forces.gravity },
      vortex: { ...forces.vortex, position: { ...forces.vortex.position } },
      wind: { ...forces.wind },
    };
    this.render = { ...render, colors: [...render.colors] };

    if (render.trailLength !== this.rt.trailLength) {
      const oldTrailLen = this.rt.trailLength;
      this.rt.trailLength = render.trailLength;
      const newTrail = new Float32Array(this.rt.maxCount * render.trailLength * 3);
      for (let i = 0; i < this.rt.maxCount; i++) {
        const copyLen = Math.min(oldTrailLen, render.trailLength);
        for (let t = 0; t < copyLen; t++) {
          newTrail[i * render.trailLength * 3 + t * 3] =
            this.rt.trailHistory[i * oldTrailLen * 3 + t * 3];
          newTrail[i * render.trailLength * 3 + t * 3 + 1] =
            this.rt.trailHistory[i * oldTrailLen * 3 + t * 3 + 1];
          newTrail[i * render.trailLength * 3 + t * 3 + 2] =
            this.rt.trailHistory[i * oldTrailLen * 3 + t * 3 + 2];
        }
      }
      this.rt.trailHistory = newTrail;
    }

    if (needsReset) {
      this.reset();
    }
  }

  step(dt: number): ParticleData {
    const count = this.params.count;
    const pos: Vec3 = { x: 0, y: 0, z: 0 };
    const vel: Vec3 = { x: 0, y: 0, z: 0 };

    for (let i = 0; i < count; i++) {
      this.rt.ages[i] += dt;

      if (this.rt.ages[i] >= this.rt.lifetimes[i]) {
        this.emitParticle(i, 0);
        continue;
      }

      pos.x = this.rt.positions[i * 3];
      pos.y = this.rt.positions[i * 3 + 1];
      pos.z = this.rt.positions[i * 3 + 2];
      vel.x = this.rt.velocities[i * 3];
      vel.y = this.rt.velocities[i * 3 + 1];
      vel.z = this.rt.velocities[i * 3 + 2];

      applyAllForces(
        pos,
        vel,
        this.forces.gravity,
        this.forces.vortex,
        this.forces.wind,
        dt
      );

      const drag = 0.995;
      vel.x *= drag;
      vel.y *= drag;
      vel.z *= drag;

      pos.x += vel.x * dt;
      pos.y += vel.y * dt;
      pos.z += vel.z * dt;

      this.rt.positions[i * 3] = pos.x;
      this.rt.positions[i * 3 + 1] = pos.y;
      this.rt.positions[i * 3 + 2] = pos.z;
      this.rt.velocities[i * 3] = vel.x;
      this.rt.velocities[i * 3 + 1] = vel.y;
      this.rt.velocities[i * 3 + 2] = vel.z;

      const trailOffset = i * this.rt.trailLength * 3;
      for (let t = this.rt.trailLength - 1; t > 0; t--) {
        this.rt.trailHistory[trailOffset + t * 3] =
          this.rt.trailHistory[trailOffset + (t - 1) * 3];
        this.rt.trailHistory[trailOffset + t * 3 + 1] =
          this.rt.trailHistory[trailOffset + (t - 1) * 3 + 1];
        this.rt.trailHistory[trailOffset + t * 3 + 2] =
          this.rt.trailHistory[trailOffset + (t - 1) * 3 + 2];
      }
      this.rt.trailHistory[trailOffset] = pos.x;
      this.rt.trailHistory[trailOffset + 1] = pos.y;
      this.rt.trailHistory[trailOffset + 2] = pos.z;
    }

    this.rt.activeCount = count;
    return this.buildRenderData();
  }

  private buildRenderData(): ParticleData {
    const count = this.rt.activeCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 4);
    const trailLen = this.rt.trailLength;
    const trailPositions = new Float32Array(count * trailLen * 2 * 3);
    const trailColors = new Float32Array(count * trailLen * 2 * 4);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = this.rt.positions[i * 3];
      positions[i * 3 + 1] = this.rt.positions[i * 3 + 1];
      positions[i * 3 + 2] = this.rt.positions[i * 3 + 2];

      const lifeT = this.rt.ages[i] / this.rt.lifetimes[i];
      const alpha = 1.0 - lifeT;
      const colorT = this.rt.colorSeeds[i] * 0.3 + lifeT * 0.7;
      const [r, g, b] = lerpColor(this.render.colors, Math.min(colorT, 0.999));

      colors[i * 4] = r;
      colors[i * 4 + 1] = g;
      colors[i * 4 + 2] = b;
      colors[i * 4 + 3] = alpha;

      const trailOffset = i * trailLen * 3;
      for (let t = 0; t < trailLen - 1; t++) {
        const segIdx = (i * trailLen + t) * 2;
        trailPositions[segIdx * 3] = this.rt.trailHistory[trailOffset + t * 3];
        trailPositions[segIdx * 3 + 1] = this.rt.trailHistory[trailOffset + t * 3 + 1];
        trailPositions[segIdx * 3 + 2] = this.rt.trailHistory[trailOffset + t * 3 + 2];
        trailPositions[segIdx * 3 + 3] = this.rt.trailHistory[trailOffset + (t + 1) * 3];
        trailPositions[segIdx * 3 + 4] = this.rt.trailHistory[trailOffset + (t + 1) * 3 + 1];
        trailPositions[segIdx * 3 + 5] = this.rt.trailHistory[trailOffset + (t + 1) * 3 + 2];

        const segAlpha = alpha * (1 - t / trailLen) * 0.5;
        trailColors[segIdx * 4] = r;
        trailColors[segIdx * 4 + 1] = g;
        trailColors[segIdx * 4 + 2] = b;
        trailColors[segIdx * 4 + 3] = segAlpha;
        trailColors[segIdx * 4 + 4] = r;
        trailColors[segIdx * 4 + 5] = g;
        trailColors[segIdx * 4 + 6] = b;
        trailColors[segIdx * 4 + 7] = segAlpha * 0.8;
      }
    }

    return { positions, colors, trailPositions, trailColors };
  }
}
