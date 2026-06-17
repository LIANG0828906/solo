import type { MagneticPole, Vec3, FieldLineParams, FieldLineData, BarMagnetConfig } from './types';

const K = 1.0;
const STEP_SIZE = 0.08;
const MAX_STEPS = 500;
const BOUNDARY = 8.0;

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
        const line = this.traceFieldLine(startPoints[i], northPole.id, adjustedParams.verticesPerLine);
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

  private traceFieldLine(start: Vec3, startPoleId: string, verticesPerLine: number): FieldLineData | null {
    const points: Vec3[] = [{ ...start }];
    let current = { ...start };
    let endPoleId: string | null = null;

    for (let step = 0; step < MAX_STEPS && points.length < verticesPerLine; step++) {
      const field = this.computeFieldAt(current);
      const mag = Math.sqrt(field.x ** 2 + field.y ** 2 + field.z ** 2);
      if (mag < 1e-6) break;

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
      if (hitPole) break;
    }

    if (points.length < 2) return null;
    return { points, startPoleId, endPoleId };
  }
}
