import type { HeatFluxVec, ParticleData } from './types';
import { ThermalEngine } from './ThermalEngine';

const PARTICLE_LIMIT = 5000;
const STREAM_LENGTH = 15;

interface ParticleState {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number;
  seed: number;
  spawned: boolean;
}

export class FlowFieldModule {
  private readonly limit: number;
  private particles: ParticleState[];
  private positions: Float32Array;
  private colors: Float32Array;
  private velocities: Float32Array;
  private activeCount: number;
  private positionsFlat: Float32Array;
  private colorsFlat: Float32Array;
  private segsPerParticle: number;
  private baseTemp: number;
  private rangeTemp: number;
  private lastTemperatures: number[][][] | null;
  private lastHeatFlux: HeatFluxVec[][][] | null;
  private lastEngine: ThermalEngine | null;

  constructor(particleLimit: number = PARTICLE_LIMIT) {
    this.limit = particleLimit;
    this.segsPerParticle = 12;
    const totalVerts = this.limit * this.segsPerParticle;
    this.particles = [];
    this.positions = new Float32Array(this.limit * 3);
    this.colors = new Float32Array(this.limit * 3);
    this.velocities = new Float32Array(this.limit * 3);
    this.positionsFlat = new Float32Array(totalVerts * 3);
    this.colorsFlat = new Float32Array(totalVerts * 3);
    this.activeCount = 0;
    this.baseTemp = 25;
    this.rangeTemp = 80;
    this.lastTemperatures = null;
    this.lastHeatFlux = null;
    this.lastEngine = null;
  }

  private initParticles(
    density: number,
    engine: ThermalEngine,
    temperatures: number[][][],
  ): void {
    const layerZs = engine.getLayerZs();
    const zChipTop = layerZs.chip[1];
    const zChipBot = layerZs.chip[0];
    const chipBox = { x: [-10, 10], y: [-10, 10] };
    const subBox = { x: [-15, 15], y: [-15, 15] };
    const hsBox = { x: [-20, 20], y: [-20, 20] };
    const targetCount = Math.min(this.limit, Math.floor(1500 * density));
    this.particles = [];
    for (let i = 0; i < targetCount; i++) {
      const r = Math.random();
      let x = 0; let y = 0; let z = 0;
      if (r < 0.6) {
        x = chipBox.x[0] + Math.random() * (chipBox.x[1] - chipBox.x[0]);
        y = chipBox.y[0] + Math.random() * (chipBox.y[1] - chipBox.y[0]);
        z = zChipBot + Math.random() * (zChipTop - zChipBot) * 0.9;
      } else if (r < 0.85) {
        x = subBox.x[0] + Math.random() * (subBox.x[1] - subBox.x[0]);
        y = subBox.y[0] + Math.random() * (subBox.y[1] - subBox.y[0]);
        z = layerZs.substrate[0] + Math.random() * (layerZs.substrate[1] - layerZs.substrate[0]);
      } else {
        x = hsBox.x[0] + Math.random() * (hsBox.x[1] - hsBox.x[0]);
        y = hsBox.y[0] + Math.random() * (hsBox.y[1] - hsBox.y[0]);
        z = layerZs.heatSink[0] + Math.random() * (layerZs.heatSink[1] - layerZs.heatSink[0]) * 0.3;
      }
      const seed = Math.random() * 1000;
      this.particles.push({
        x, y, z,
        vx: 0, vy: 0, vz: 0,
        life: Math.random(),
        maxLife: STREAM_LENGTH,
        seed,
        spawned: true,
      });
    }
    this.activeCount = this.particles.length;
    void temperatures;
  }

  private particleColor(
    t: number,
    lifeFrac: number,
    speed: number,
  ): [number, number, number] {
    const tn = Math.max(0, Math.min(1, (t - this.baseTemp) / Math.max(1, this.rangeTemp)));
    const r0 = 1.0;
    const g0 = 1.0;
    const b0 = 1.0;
    const r1 = 1.0;
    const g1 = 165 / 255;
    const b1 = 0.0;
    let r = r0 + (r1 - r0) * tn;
    let g = g0 + (g1 - g0) * tn;
    let b = b0 + (b1 - b0) * tn;
    const alpha = Math.sin(lifeFrac * Math.PI);
    const brightness = 0.3 + 0.7 * (0.5 + 0.5 * alpha);
    const speedBoost = Math.min(1, speed / 2000);
    r *= brightness * (1 + 0.3 * speedBoost);
    g *= brightness * (1 + 0.15 * speedBoost);
    b *= brightness;
    return [Math.min(1, r), Math.min(1, g), Math.min(1, b)];
  }

  generate(
    engine: ThermalEngine,
    thermalResult: { temperatures: number[][][]; heatFlux: HeatFluxVec[][][] },
    densityMultiplier: number,
  ): ParticleData {
    const { temperatures, heatFlux } = thermalResult;
    this.lastEngine = engine;
    this.lastTemperatures = temperatures;
    this.lastHeatFlux = heatFlux;

    let tMin = Infinity;
    let tMax = -Infinity;
    for (const node of engine.getGridNodes()) {
      const [x, y, z] = node.pos;
      const t = engine.sampleTemp([x, y, z], temperatures);
      if (t < tMin) tMin = t;
      if (t > tMax) tMax = t;
    }
    this.baseTemp = tMin;
    this.rangeTemp = Math.max(20, tMax - tMin);

    if (this.particles.length === 0 || Math.abs(this.particles.length - Math.floor(1500 * densityMultiplier)) > 200) {
      this.initParticles(densityMultiplier, engine, temperatures);
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const temp = engine.sampleTemp([p.x, p.y, p.z], temperatures);
      const flux = engine.sampleFlux([p.x, p.y, p.z], heatFlux);
      const fn = Math.sqrt(flux.x * flux.x + flux.y * flux.y + flux.z * flux.z);
      const scale = fn > 1e-6 ? 1 / fn : 0;
      const baseSpeed = 0.5 + Math.min(4, fn * 0.0005);
      let vx = flux.x * scale * baseSpeed;
      let vy = flux.y * scale * baseSpeed;
      let vz = flux.z * scale * baseSpeed;
      if (fn < 1) {
        const layerZs = engine.getLayerZs();
        const dir = p.z < (layerZs.heatSink[0] + layerZs.chip[1]) / 2 ? -1 : 1;
        vz += dir * 0.3;
        vx += (Math.sin(p.seed + p.life * 3) - 0.5) * 0.2;
        vy += (Math.cos(p.seed + p.life * 3) - 0.5) * 0.2;
      }
      p.vx = vx; p.vy = vy; p.vz = vz;
      this.positions[i * 3] = p.x;
      this.positions[i * 3 + 1] = p.y;
      this.positions[i * 3 + 2] = p.z;
      this.velocities[i * 3] = vx;
      this.velocities[i * 3 + 1] = vy;
      this.velocities[i * 3 + 2] = vz;
      const lifeFrac = p.life;
      const c = this.particleColor(temp, lifeFrac, fn);
      this.colors[i * 3] = c[0];
      this.colors[i * 3 + 1] = c[1];
      this.colors[i * 3 + 2] = c[2];
    }

    this.buildStreamline();
    return {
      positions: this.positionsFlat,
      colors: this.colorsFlat,
      velocities: this.velocities,
      count: this.activeCount * this.segsPerParticle,
    };
  }

  private buildStreamline(): void {
    const segs = this.segsPerParticle;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      let x = p.x; let y = p.y; let z = p.z;
      const stepLife = 1 / segs;
      for (let s = 0; s < segs; s++) {
        const lifeBack = p.life - s * stepLife * 0.8;
        const effLife = ((lifeBack % 1) + 1) % 1;
        const fade = Math.sin(effLife * Math.PI);
        const idxOut = (i * segs + s) * 3;
        this.positionsFlat[idxOut] = x + (Math.sin(p.seed + s * 0.7) * 0.05);
        this.positionsFlat[idxOut + 1] = y + (Math.cos(p.seed + s * 0.7) * 0.05);
        this.positionsFlat[idxOut + 2] = z;
        const baseR = this.colors[i * 3];
        const baseG = this.colors[i * 3 + 1];
        const baseB = this.colors[i * 3 + 2];
        const f = Math.max(0.1, fade);
        this.colorsFlat[idxOut] = baseR * f;
        this.colorsFlat[idxOut + 1] = baseG * f;
        this.colorsFlat[idxOut + 2] = baseB * f;
        const fwd = (segs - s) / segs;
        x -= p.vx * 0.4 * fwd;
        y -= p.vy * 0.4 * fwd;
        z -= p.vz * 0.4 * fwd;
      }
    }
  }

  animate(dt: number): ParticleData | null {
    if (!this.lastEngine || !this.lastTemperatures || !this.lastHeatFlux) return null;
    const engine = this.lastEngine;
    const temperatures = this.lastTemperatures;
    const heatFlux = this.lastHeatFlux;
    const layerZs = engine.getLayerZs();
    const zBottom = layerZs.heatSink[0] - 1;
    const zTop = layerZs.chip[1] + 1;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life += dt * 0.35;
      if (p.life >= 1) {
        p.life -= 1;
        const r = Math.random();
        const chipBox = { x: [-10, 10], y: [-10, 10] };
        const subBox = { x: [-15, 15], y: [-15, 15] };
        if (r < 0.65) {
          p.x = chipBox.x[0] + Math.random() * (chipBox.x[1] - chipBox.x[0]);
          p.y = chipBox.y[0] + Math.random() * (chipBox.y[1] - chipBox.y[0]);
          p.z = layerZs.chip[0] + Math.random() * (layerZs.chip[1] - layerZs.chip[0]) * 0.9;
        } else if (r < 0.9) {
          p.x = subBox.x[0] + Math.random() * (subBox.x[1] - subBox.x[0]);
          p.y = subBox.y[0] + Math.random() * (subBox.y[1] - subBox.y[0]);
          p.z = layerZs.substrate[0] + Math.random() * (layerZs.substrate[1] - layerZs.substrate[0]);
        } else {
          p.x = -20 + Math.random() * 40;
          p.y = -20 + Math.random() * 40;
          p.z = layerZs.heatSink[0] + Math.random() * (layerZs.heatSink[1] - layerZs.heatSink[0]) * 0.2;
        }
      }
      const flux = engine.sampleFlux([p.x, p.y, p.z], heatFlux);
      const fn = Math.sqrt(flux.x * flux.x + flux.y * flux.y + flux.z * flux.z);
      const scale = fn > 1e-6 ? 1 / fn : 0;
      const baseSpeed = 2 + Math.min(10, fn * 0.002);
      let vx = flux.x * scale * baseSpeed;
      let vy = flux.y * scale * baseSpeed;
      let vz = flux.z * scale * baseSpeed;
      if (fn < 10) {
        vz -= 0.5;
        vx += Math.sin(p.seed + p.life * 5) * 0.8;
        vy += Math.cos(p.seed + p.life * 5) * 0.8;
      }
      p.vx = vx; p.vy = vy; p.vz = vz;
      p.x += vx * dt;
      p.y += vy * dt;
      p.z += vz * dt;
      if (p.z < zBottom || p.z > zTop ||
          Math.abs(p.x) > 30 || Math.abs(p.y) > 30) {
        p.life = 0.999;
      }
      this.positions[i * 3] = p.x;
      this.positions[i * 3 + 1] = p.y;
      this.positions[i * 3 + 2] = p.z;
      this.velocities[i * 3] = vx;
      this.velocities[i * 3 + 1] = vy;
      this.velocities[i * 3 + 2] = vz;
      const temp = engine.sampleTemp([p.x, p.y, p.z], temperatures);
      const c = this.particleColor(temp, p.life, fn);
      this.colors[i * 3] = c[0];
      this.colors[i * 3 + 1] = c[1];
      this.colors[i * 3 + 2] = c[2];
    }

    this.buildStreamline();
    return {
      positions: this.positionsFlat,
      colors: this.colorsFlat,
      velocities: this.velocities,
      count: this.activeCount * this.segsPerParticle,
    };
  }

  getStreamlineCount(): number {
    return this.activeCount * this.segsPerParticle;
  }

  getMaxVertices(): number {
    return this.limit * this.segsPerParticle;
  }
}
