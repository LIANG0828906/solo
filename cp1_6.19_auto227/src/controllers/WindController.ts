import type {
  BuildingType,
  OpeningRates,
  Particle,
  VentilationMetrics,
  BuildingDimensions
} from '../types';
import { BUILDING_DIMENSIONS } from '../types';

const AIR_DENSITY = 1.225;
const WIND_SPEED = 2.5;
const TRAIL_LENGTH = 5;
const MIN_PARTICLE_SPEED = 0.5;
const MAX_PARTICLE_SPEED = 3.0;

interface VelocityField {
  data: Float32Array;
  dims: { x: number; y: number; z: number };
  cellSize: { x: number; y: number; z: number };
}

interface WindState {
  particles: Particle[];
  metrics: VentilationMetrics;
}

class WindController {
  private buildingType: BuildingType;
  private openingRates: OpeningRates;
  private dimensions: BuildingDimensions;
  private velocityField: VelocityField | null = null;
  private particles: Particle[] = [];
  private metrics: VentilationMetrics;
  private particlePool: Particle[] = [];
  private needsRecalculation: boolean = true;
  private listeners: Set<(state: WindState) => void> = new Set();

  constructor() {
    this.buildingType = 'cube';
    this.openingRates = { south: 20, north: 20, east: 20, west: 20 };
    this.dimensions = BUILDING_DIMENSIONS['cube'];
    this.metrics = {
      avgWindSpeed: 0,
      maxWindSpeed: 0,
      turbulenceIntensity: 0,
      deadZoneRatio: 0,
      airChangeRate: 0
    };
    this.initializeParticlePool(100);
  }

  private initializeParticlePool(count: number): void {
    for (let i = 0; i < count; i++) {
      this.particlePool.push({
        id: i,
        position: [0, 0, 0],
        velocity: [0, 0, 0],
        speed: 0,
        trail: [],
        life: 0
      });
    }
  }

  public setParameters(type: BuildingType, rates: OpeningRates): void {
    if (this.buildingType !== type) {
      this.buildingType = type;
      this.dimensions = BUILDING_DIMENSIONS[type];
      this.needsRecalculation = true;
    }

    const ratesChanged =
      this.openingRates.south !== rates.south ||
      this.openingRates.north !== rates.north ||
      this.openingRates.east !== rates.east ||
      this.openingRates.west !== rates.west;

    if (ratesChanged) {
      this.openingRates = { ...rates };
      this.needsRecalculation = true;
    }

    if (this.needsRecalculation) {
      this.recalculateFlow();
    }
  }

  private isInsideBuilding(px: number, py: number, pz: number): boolean {
    const { width, height, depth } = this.dimensions;
    const halfW = width / 2;
    const halfD = depth / 2;

    if (px < -halfW || px > halfW || py < 0 || py > height || pz < -halfD || pz > halfD) {
      return false;
    }

    if (this.buildingType === 'cube') {
      return true;
    }

    if (this.buildingType === 'L-shape') {
      if (px > 0 && pz > 0) {
        return false;
      }
      return true;
    }

    if (this.buildingType === 'U-shape') {
      if (px > -width / 3 && px < width / 3 && pz > 0) {
        return false;
      }
      return true;
    }

    return true;
  }

  private getFacadeOpening(normal: [number, number, number]): number {
    if (normal[2] > 0.5) return this.openingRates.south / 100;
    if (normal[2] < -0.5) return this.openingRates.north / 100;
    if (normal[0] > 0.5) return this.openingRates.east / 100;
    if (normal[0] < -0.5) return this.openingRates.west / 100;
    return 0;
  }

  private isWindowPosition(
    px: number,
    py: number,
    pz: number,
    normal: [number, number, number]
  ): boolean {
    const opening = this.getFacadeOpening(normal);
    if (opening <= 0) return false;

    const { width, height, depth } = this.dimensions;
    const windowHeight = height * opening;
    const windowWidth = (normal[0] !== 0 ? depth : width) * opening;
    const yCenter = height * 0.5;

    if (py < yCenter - windowHeight / 2 || py > yCenter + windowHeight / 2) {
      return false;
    }

    if (normal[0] !== 0) {
      const halfW = windowWidth / 2;
      if (pz < -halfW || pz > halfW) return false;
    } else {
      const halfW = windowWidth / 2;
      if (px < -halfW || px > halfW) return false;
    }

    return true;
  }

  public recalculateFlow(): void {
    const { segments, width, height, depth } = this.dimensions;
    const cellSize = {
      x: width / segments.x,
      y: height / segments.y,
      z: depth / segments.z
    };

    const pressure = new Float32Array(segments.x * segments.y * segments.z);
    const velocity = new Float32Array(segments.x * segments.y * segments.z * 3);

    const windDirection: [number, number, number] = [0, 0, 1];
    const dynamicPressure = 0.5 * AIR_DENSITY * WIND_SPEED * WIND_SPEED;

    for (let xi = 0; xi < segments.x; xi++) {
      for (let yi = 0; yi < segments.y; yi++) {
        for (let zi = 0; zi < segments.z; zi++) {
          const idx = (xi * segments.y + yi) * segments.z + zi;
          const px = (xi - segments.x / 2) * cellSize.x + cellSize.x / 2;
          const py = yi * cellSize.y + cellSize.y / 2;
          const pz = (zi - segments.z / 2) * cellSize.z + cellSize.z / 2;

          if (!this.isInsideBuilding(px, py, pz)) {
            pressure[idx] = 0;
            velocity[idx * 3] = 0;
            velocity[idx * 3 + 1] = 0;
            velocity[idx * 3 + 2] = 0;
            continue;
          }

          const distFromSouth = pz + depth / 2;
          const distFromNorth = depth / 2 - pz;
          const openingSouth = this.openingRates.south / 100;
          const openingNorth = this.openingRates.north / 100;

          const pIn = dynamicPressure * (1 - openingSouth * 0.7);
          const pOut = -0.2 * dynamicPressure * (1 - openingNorth * 0.5);

          const t = distFromSouth / (distFromSouth + distFromNorth + 0.001);
          pressure[idx] = pIn * (1 - t) + pOut * t;

          const openingEast = this.openingRates.east / 100;
          const openingWest = this.openingRates.west / 100;
          const distFromEast = px + width / 2;
          const distFromWest = width / 2 - px;
          const tX = distFromEast / (distFromEast + distFromWest + 0.001);
          const pInX = dynamicPressure * 0.3 * (1 - openingWest * 0.7);
          const pOutX = -0.1 * dynamicPressure * (1 - openingEast * 0.5);
          pressure[idx] += (pInX * (1 - tX) + pOutX * tX) * 0.3;
        }
      }
    }

    for (let xi = 1; xi < segments.x - 1; xi++) {
      for (let yi = 1; yi < segments.y - 1; yi++) {
        for (let zi = 1; zi < segments.z - 1; zi++) {
          const idx = (xi * segments.y + yi) * segments.z + zi;
          const px = (xi - segments.x / 2) * cellSize.x + cellSize.x / 2;
          const py = yi * cellSize.y + cellSize.y / 2;
          const pz = (zi - segments.z / 2) * cellSize.z + cellSize.z / 2;

          if (!this.isInsideBuilding(px, py, pz)) {
            continue;
          }

          const idxXp = ((xi + 1) * segments.y + yi) * segments.z + zi;
          const idxXm = ((xi - 1) * segments.y + yi) * segments.z + zi;
          const idxYp = (xi * segments.y + (yi + 1)) * segments.z + zi;
          const idxYm = (xi * segments.y + (yi - 1)) * segments.z + zi;
          const idxZp = (xi * segments.y + yi) * segments.z + (zi + 1);
          const idxZm = (xi * segments.y + yi) * segments.z + (zi - 1);

          const gradX = -(pressure[idxXp] - pressure[idxXm]) / (2 * cellSize.x * AIR_DENSITY);
          const gradY = -(pressure[idxYp] - pressure[idxYm]) / (2 * cellSize.y * AIR_DENSITY);
          const gradZ = -(pressure[idxZp] - pressure[idxZm]) / (2 * cellSize.z * AIR_DENSITY);

          velocity[idx * 3] = gradX + windDirection[0] * WIND_SPEED * 0.3;
          velocity[idx * 3 + 1] = gradY;
          velocity[idx * 3 + 2] = gradZ + windDirection[2] * WIND_SPEED * 0.7;

          const speed = Math.sqrt(
            velocity[idx * 3] ** 2 +
            velocity[idx * 3 + 1] ** 2 +
            velocity[idx * 3 + 2] ** 2
          );
          if (speed > MAX_PARTICLE_SPEED) {
            const scale = MAX_PARTICLE_SPEED / speed;
            velocity[idx * 3] *= scale;
            velocity[idx * 3 + 1] *= scale;
            velocity[idx * 3 + 2] *= scale;
          }
        }
      }
    }

    this.velocityField = {
      data: velocity,
      dims: segments,
      cellSize
    };

    this.resetParticles();
    this.calculateMetrics();
    this.needsRecalculation = false;
    this.notifyListeners();
  }

  private getVelocityAt(px: number, py: number, pz: number): [number, number, number] {
    if (!this.velocityField) return [0, 0, 0];

    const { dims, cellSize, data } = this.velocityField;
    const { width, depth } = this.dimensions;

    let xi = Math.floor((px + width / 2) / cellSize.x);
    let yi = Math.floor(py / cellSize.y);
    let zi = Math.floor((pz + depth / 2) / cellSize.z);

    xi = Math.max(0, Math.min(dims.x - 1, xi));
    yi = Math.max(0, Math.min(dims.y - 1, yi));
    zi = Math.max(0, Math.min(dims.z - 1, zi));

    const idx = (xi * dims.y + yi) * dims.z + zi;
    return [data[idx * 3], data[idx * 3 + 1], data[idx * 3 + 2]];
  }

  private getRandomInletPosition(): [number, number, number] | null {
    const { width, height, depth } = this.dimensions;
    const halfW = width / 2;
    const halfD = depth / 2;

    const openings: { normal: [number, number, number]; rate: number }[] = [
      { normal: [0, 0, -1], rate: this.openingRates.north },
      { normal: [0, 0, 1], rate: this.openingRates.south },
      { normal: [-1, 0, 0], rate: this.openingRates.west },
      { normal: [1, 0, 0], rate: this.openingRates.east }
    ];

    const totalRate = openings.reduce((sum, o) => sum + o.rate, 0);
    if (totalRate <= 0) return null;

    let rand = Math.random() * totalRate;
    let selected = openings[0];
    for (const opening of openings) {
      rand -= opening.rate;
      if (rand <= 0) {
        selected = opening;
        break;
      }
    }

    const openingRatio = selected.rate / 100;
    const windowHeight = height * openingRatio;
    const yCenter = height * 0.5;
    const yRange = windowHeight / 2;

    let px = 0, pz = 0;
    const py = yCenter + (Math.random() - 0.5) * yRange * 0.8;

    if (selected.normal[0] !== 0) {
      px = halfW * selected.normal[0] * 0.99;
      const windowWidth = depth * openingRatio;
      pz = (Math.random() - 0.5) * windowWidth * 0.8;
    } else {
      pz = halfD * selected.normal[2] * 0.99;
      const windowWidth = width * openingRatio;
      px = (Math.random() - 0.5) * windowWidth * 0.8;
    }

    return [px, py, pz];
  }

  private resetParticles(): void {
    const { openingRates } = this;
    const totalRate = openingRates.south + openingRates.north + openingRates.east + openingRates.west;
    const count = Math.round(20 + (totalRate / 240) * 80);

    this.particles = [];
    for (let i = 0; i < count && i < this.particlePool.length; i++) {
      const pos = this.getRandomInletPosition();
      if (!pos) continue;

      const particle = this.particlePool[i];
      particle.position = pos;
      particle.velocity = this.getVelocityAt(pos[0], pos[1], pos[2]);
      particle.speed = Math.sqrt(
        particle.velocity[0] ** 2 +
        particle.velocity[1] ** 2 +
        particle.velocity[2] ** 2
      );
      particle.trail = [[...pos] as [number, number, number]];
      particle.life = Math.random() * 100;
      this.particles.push(particle);
    }
  }

  private resetParticle(particle: Particle): void {
    const pos = this.getRandomInletPosition();
    if (pos) {
      particle.position = pos;
      particle.velocity = this.getVelocityAt(pos[0], pos[1], pos[2]);
      particle.speed = Math.sqrt(
        particle.velocity[0] ** 2 +
        particle.velocity[1] ** 2 +
        particle.velocity[2] ** 2
      );
      particle.trail = [[...pos] as [number, number, number]];
      particle.life = 0;
    }
  }

  private rk4Step(
    pos: [number, number, number],
    dt: number
  ): [number, number, number] {
    const v1 = this.getVelocityAt(pos[0], pos[1], pos[2]);

    const p2: [number, number, number] = [
      pos[0] + v1[0] * dt * 0.5,
      pos[1] + v1[1] * dt * 0.5,
      pos[2] + v1[2] * dt * 0.5
    ];
    const v2 = this.getVelocityAt(p2[0], p2[1], p2[2]);

    const p3: [number, number, number] = [
      pos[0] + v2[0] * dt * 0.5,
      pos[1] + v2[1] * dt * 0.5,
      pos[2] + v2[2] * dt * 0.5
    ];
    const v3 = this.getVelocityAt(p3[0], p3[1], p3[2]);

    const p4: [number, number, number] = [
      pos[0] + v3[0] * dt,
      pos[1] + v3[1] * dt,
      pos[2] + v3[2] * dt
    ];
    const v4 = this.getVelocityAt(p4[0], p4[1], p4[2]);

    return [
      pos[0] + (v1[0] + 2 * v2[0] + 2 * v3[0] + v4[0]) * dt / 6,
      pos[1] + (v1[1] + 2 * v2[1] + 2 * v3[1] + v4[1]) * dt / 6,
      pos[2] + (v1[2] + 2 * v2[2] + 2 * v3[2] + v4[2]) * dt / 6
    ];
  }

  public update(delta: number): void {
    if (this.needsRecalculation) {
      this.recalculateFlow();
      return;
    }

    const dt = Math.min(delta, 0.033);
    const { width, height, depth } = this.dimensions;
    const halfW = width / 2;
    const halfD = depth / 2;

    let totalSpeed = 0;
    let maxSpeed = 0;
    let speedVariance = 0;
    const speeds: number[] = [];

    for (const particle of this.particles) {
      particle.trail.unshift([...particle.position] as [number, number, number]);
      if (particle.trail.length > TRAIL_LENGTH) {
        particle.trail.pop();
      }

      const newPos = this.rk4Step(particle.position, dt);

      if (!this.isInsideBuilding(newPos[0], newPos[1], newPos[2])) {
        this.resetParticle(particle);
        continue;
      }

      particle.position = newPos;
      particle.velocity = this.getVelocityAt(newPos[0], newPos[1], newPos[2]);
      particle.speed = Math.sqrt(
        particle.velocity[0] ** 2 +
        particle.velocity[1] ** 2 +
        particle.velocity[2] ** 2
      );

      if (particle.speed < MIN_PARTICLE_SPEED * 0.3) {
        particle.life += dt * 2;
      } else {
        particle.life += dt;
      }

      if (particle.life > 15) {
        this.resetParticle(particle);
        continue;
      }

      const margin = 0.1;
      if (
        newPos[0] < -halfW + margin || newPos[0] > halfW - margin ||
        newPos[1] < margin || newPos[1] > height - margin ||
        newPos[2] < -halfD + margin || newPos[2] > halfD - margin
      ) {
        const normal: [number, number, number] = [0, 0, 0];
        if (newPos[2] > halfD - margin) normal[2] = 1;
        else if (newPos[2] < -halfD + margin) normal[2] = -1;
        else if (newPos[0] > halfW - margin) normal[0] = 1;
        else if (newPos[0] < -halfW + margin) normal[0] = -1;
        else if (newPos[1] > height - margin) normal[1] = 1;
        else if (newPos[1] < margin) normal[1] = -1;

        if (normal[1] !== 0) {
          this.resetParticle(particle);
          continue;
        }

        if (!this.isWindowPosition(newPos[0], newPos[1], newPos[2], normal)) {
          this.resetParticle(particle);
          continue;
        }
      }

      totalSpeed += particle.speed;
      maxSpeed = Math.max(maxSpeed, particle.speed);
      speeds.push(particle.speed);
    }

    if (speeds.length > 0) {
      const avgSpeed = totalSpeed / speeds.length;
      for (const s of speeds) {
        speedVariance += (s - avgSpeed) ** 2;
      }
      speedVariance /= speeds.length;
      const stdDev = Math.sqrt(speedVariance);

      this.metrics.avgWindSpeed = Number(avgSpeed.toFixed(2));
      this.metrics.maxWindSpeed = Number(maxSpeed.toFixed(2));
      this.metrics.turbulenceIntensity = Number((avgSpeed > 0 ? stdDev / avgSpeed : 0).toFixed(2));
    }

    this.notifyListeners();
  }

  private calculateMetrics(): void {
    if (!this.velocityField) return;

    const { dims } = this.velocityField;
    const data = this.velocityField.data;
    let totalCells = 0;
    let deadCells = 0;
    let totalSpeed = 0;
    let maxSpeed = 0;
    const speeds: number[] = [];

    for (let xi = 0; xi < dims.x; xi++) {
      for (let yi = 0; yi < dims.y; yi++) {
        for (let zi = 0; zi < dims.z; zi++) {
          const idx = (xi * dims.y + yi) * dims.z + zi;
          const px = (xi - dims.x / 2) * this.velocityField.cellSize.x;
          const py = yi * this.velocityField.cellSize.y;
          const pz = (zi - dims.z / 2) * this.velocityField.cellSize.z;

          if (!this.isInsideBuilding(px, py, pz)) continue;

          totalCells++;
          const vx = data[idx * 3];
          const vy = data[idx * 3 + 1];
          const vz = data[idx * 3 + 2];
          const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

          if (speed < 0.2) deadCells++;
          totalSpeed += speed;
          maxSpeed = Math.max(maxSpeed, speed);
          speeds.push(speed);
        }
      }
    }

    const avgSpeed = totalCells > 0 ? totalSpeed / totalCells : 0;
    let variance = 0;
    for (const s of speeds) {
      variance += (s - avgSpeed) ** 2;
    }
    variance = speeds.length > 0 ? variance / speeds.length : 0;
    const stdDev = Math.sqrt(variance);

    const { width, height, depth } = this.dimensions;
    let volume = width * height * depth;
    if (this.buildingType === 'L-shape') {
      volume -= (width / 2) * height * (depth / 2);
    } else if (this.buildingType === 'U-shape') {
      volume -= (width / 3) * height * (depth / 2);
    }

    const totalOpeningRate = (this.openingRates.south + this.openingRates.north + this.openingRates.east + this.openingRates.west) / 100;
    const avgOpeningArea = (width * height + depth * height) * 2 * totalOpeningRate / 4;
    const flowRate = avgOpeningArea * avgSpeed * 3600;
    const airChangeRate = volume > 0 ? flowRate / volume : 0;

    this.metrics.avgWindSpeed = Number(avgSpeed.toFixed(2));
    this.metrics.maxWindSpeed = Number(maxSpeed.toFixed(2));
    this.metrics.turbulenceIntensity = Number((avgSpeed > 0 ? stdDev / avgSpeed : 0).toFixed(2));
    this.metrics.deadZoneRatio = Number(totalCells > 0 ? deadCells / totalCells : 0).toFixed(2) as unknown as number;
    this.metrics.deadZoneRatio = Number(this.metrics.deadZoneRatio);
    this.metrics.airChangeRate = Number(airChangeRate.toFixed(1));
  }

  public getParticles(): Particle[] {
    return this.particles;
  }

  public getMetrics(): VentilationMetrics {
    return { ...this.metrics };
  }

  public subscribe(callback: (state: WindState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const state: WindState = {
      particles: this.particles,
      metrics: { ...this.metrics }
    };
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  public forceRecalculate(): void {
    this.needsRecalculation = true;
  }
}

export const windController = new WindController();
export type { WindState };
