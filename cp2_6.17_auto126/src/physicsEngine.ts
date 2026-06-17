import type { MagneticPole, Vec3, FieldLineParams, FieldLineData, BarMagnetConfig } from './types';

const K = 1.0;
const STEP_SIZE = 0.08;
const MAX_STEPS = 500;
const BOUNDARY = 8.0;
const SPEED_RANDOM_RANGE = 0.2;
const COLOR_SATURATION_ZONE = 0.2;
const MIN_FIELD_MAG = 1e-6;
const SPEED_DISTANCE_THRESHOLD = 2.0;
const SPEED_NEAR_FACTOR = 1.5;
const SPEED_FAR_FACTOR = 0.8;
const SPEED_FALLOFF_DISTANCE = 6.0;
const MIN_VERTICES_FOR_SEGMENTED_COLOR = 5;

export class PhysicsEngine {
  private poles: MagneticPole[] = [];
  private barMagnetConfig: BarMagnetConfig;
  private defaultBarPoleIds: { north: string; south: string } | null = null;

  constructor(barMagnetConfig: BarMagnetConfig) {
    this.barMagnetConfig = barMagnetConfig;
  }

  initDefaultBarMagnet(): void {
    const halfLen = this.barMagnetConfig.length / 2;
    const northPole: MagneticPole = {
      id: 'bar-north',
      type: 'N',
      position: { x: halfLen, y: 0, z: 0 },
      strength: 2.0,
      radius: 0.25
    };
    const southPole: MagneticPole = {
      id: 'bar-south',
      type: 'S',
      position: { x: -halfLen, y: 0, z: 0 },
      strength: 2.0,
      radius: 0.25
    };
    this.poles.push(northPole, southPole);
    this.defaultBarPoleIds = { north: northPole.id, south: southPole.id };
  }

  getPoles(): MagneticPole[] {
    return this.poles;
  }

  addPole(pole: Omit<MagneticPole, 'id'>): MagneticPole {
    const newPole: MagneticPole = {
      ...pole,
      id: `pole-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    };
    this.poles.push(newPole);
    return newPole;
  }

  removePole(id: string): boolean {
    const idx = this.poles.findIndex(p => p.id === id);
    if (idx >= 0) {
      this.poles.splice(idx, 1);
      return true;
    }
    return false;
  }

  clearCustomPoles(): void {
    if (!this.defaultBarPoleIds) return;
    this.poles = this.poles.filter(
      p => p.id === this.defaultBarPoleIds!.north || p.id === this.defaultBarPoleIds!.south
    );
  }

  computeFieldAt(pos: Vec3): Vec3 {
    let bx = 0, by = 0, bz = 0;
    for (const pole of this.poles) {
      const dx = pos.x - pole.position.x;
      const dy = pos.y - pole.position.y;
      const dz = pos.z - pole.position.z;
      const r2 = dx * dx + dy * dy + dz * dz;
      const r = Math.sqrt(r2);
      if (r < 0.05) continue;
      const r3 = r2 * r;
      const sign = pole.type === 'N' ? 1 : -1;
      const mag = K * pole.strength * sign;
      bx += mag * dx / r3;
      by += mag * dy / r3;
      bz += mag * dz / r3;
    }
    return { x: bx, y: by, z: bz };
  }

  computeFieldLines(params: FieldLineParams): FieldLineData[] {
    const adjustedParams = this.adjustParamsForPerformance(params);
    const lines: FieldLineData[] = [];
    const northPoles = this.poles.filter(p => p.type === 'N');
    if (northPoles.length === 0) return lines;

    const linesPerPole = Math.ceil(adjustedParams.totalLines / northPoles.length);

    for (const northPole of northPoles) {
      const startPoints = this.generateStartPoints(northPole, linesPerPole);
      for (let i = 0; i < startPoints.length && lines.length < adjustedParams.totalLines; i++) {
        const baseSpeedRandom = 1.0 + (Math.random() * 2 - 1) * SPEED_RANDOM_RANGE;
        const line = this.traceFieldLine(
          startPoints[i],
          northPole.id,
          adjustedParams.verticesPerLine,
          baseSpeedRandom,
          params
        );
        if (line && line.points.length >= 3) {
          lines.push(line);
        }
      }
    }
    return lines;
  }

  private adjustParamsForPerformance(params: FieldLineParams): FieldLineParams {
    const poleCount = this.poles.length;
    const threshold = 6;
    const maxVertices = 15000;
    if (poleCount <= threshold) return params;

    const currentVertices = params.totalLines * params.verticesPerLine;
    if (currentVertices <= maxVertices) return params;

    const ratio = maxVertices / currentVertices;
    const newTotalLines = Math.max(50, Math.floor(params.totalLines * ratio));
    const newVertices = Math.max(10, Math.floor(maxVertices / newTotalLines));
    return {
      ...params,
      totalLines: newTotalLines,
      verticesPerLine: newVertices
    };
  }

  private generateStartPoints(pole: MagneticPole, count: number): Vec3[] {
    const points: Vec3[] = [];
    const phiStep = Math.PI * (3 - Math.sqrt(5));
    const r = pole.radius + 0.02;
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phiStep * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      points.push({
        x: pole.position.x + x * r,
        y: pole.position.y + y * r,
        z: pole.position.z + z * r
      });
    }
    return points;
  }

  private getMinDistanceToAnyPole(pos: Vec3): number {
    let minDist = Infinity;
    for (const pole of this.poles) {
      const dx = pos.x - pole.position.x;
      const dy = pos.y - pole.position.y;
      const dz = pos.z - pole.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      minDist = Math.min(minDist, dist);
    }
    return minDist;
  }

  private computeSpeedFactor(pos: Vec3): number {
    const minDist = this.getMinDistanceToAnyPole(pos);
    const threshold = SPEED_DISTANCE_THRESHOLD;

    if (minDist <= threshold) {
      const t = minDist / threshold;
      return SPEED_NEAR_FACTOR - (SPEED_NEAR_FACTOR - 1.0) * t;
    } else {
      const maxDist = SPEED_FALLOFF_DISTANCE;
      const t = Math.min(1.0, (minDist - threshold) / (maxDist - threshold));
      return 1.0 - (1.0 - SPEED_FAR_FACTOR) * t;
    }
  }

  private parseColor(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16)
    };
  }

  private toHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private lerpColor(t: number, colorN: string, colorS: string): string {
    const cN = this.parseColor(colorN);
    const cS = this.parseColor(colorS);
    const r = cN.r + (cS.r - cN.r) * t;
    const g = cN.g + (cS.g - cN.g) * t;
    const b = cN.b + (cS.b - cN.b) * t;
    return this.toHex(r, g, b);
  }

  private computeColors(points: Vec3[], params: FieldLineParams): string[] {
    const colors: string[] = [];
    const len = points.length;
    const satZone = COLOR_SATURATION_ZONE;

    if (len < MIN_VERTICES_FOR_SEGMENTED_COLOR) {
      for (let i = 0; i < len; i++) {
        const t = i / Math.max(1, len - 1);
        colors.push(this.lerpColor(t, params.colorN, params.colorS));
      }
      return colors;
    }

    for (let i = 0; i < len; i++) {
      const t = i / Math.max(1, len - 1);

      if (t < satZone) {
        colors.push(params.colorN);
      } else if (t > 1 - satZone) {
        colors.push(params.colorS);
      } else {
        const innerT = (t - satZone) / (1 - 2 * satZone);
        colors.push(this.lerpColor(innerT, params.colorN, params.colorS));
      }
    }
    return colors;
  }

  private traceFieldLine(
    start: Vec3,
    startPoleId: string,
    verticesPerLine: number,
    baseSpeedRandom: number,
    params: FieldLineParams
  ): FieldLineData | null {
    const points: Vec3[] = [{ ...start }];
    const speedFactors: number[] = [];
    let current = { ...start };
    let endPoleId: string | null = null;

    const startSpeedFactor = this.computeSpeedFactor(start);
    speedFactors.push(startSpeedFactor * baseSpeedRandom);

    for (let step = 0; step < MAX_STEPS && points.length < verticesPerLine; step++) {
      const field = this.computeFieldAt(current);
      const mag = Math.sqrt(field.x ** 2 + field.y ** 2 + field.z ** 2);
      if (mag < MIN_FIELD_MAG) break;

      const nx = field.x / mag;
      const ny = field.y / mag;
      const nz = field.z / mag;

      current = {
        x: current.x + nx * STEP_SIZE,
        y: current.y + ny * STEP_SIZE,
        z: current.z + nz * STEP_SIZE
      };

      if (
        Math.abs(current.x) > BOUNDARY ||
        Math.abs(current.y) > BOUNDARY ||
        Math.abs(current.z) > BOUNDARY
      ) {
        break;
      }

      let hitPole = false;
      for (const pole of this.poles) {
        if (pole.id === startPoleId) continue;
        const dx = current.x - pole.position.x;
        const dy = current.y - pole.position.y;
        const dz = current.z - pole.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < pole.radius) {
          hitPole = true;
          endPoleId = pole.id;
          current = { ...pole.position };
          break;
        }
      }

      points.push({ ...current });
      const pointSpeedFactor = this.computeSpeedFactor(current);
      speedFactors.push(pointSpeedFactor * baseSpeedRandom);

      if (hitPole) break;
    }

    if (points.length < 2) return null;

    while (speedFactors.length < points.length) {
      const lastSpeed = speedFactors[speedFactors.length - 1] || baseSpeedRandom;
      speedFactors.push(lastSpeed);
    }

    const colors = this.computeColors(points, params);

    return {
      points,
      startPoleId,
      endPoleId,
      speedFactors,
      colors,
      baseSpeedRandom
    };
  }
}
