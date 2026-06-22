import { LandformType, GRID_SIZE } from '../types';

export class ErosionEngine {
  private gridSize: number;

  constructor(gridSize: number = GRID_SIZE) {
    this.gridSize = gridSize;
  }

  generateHeightMap(landform: LandformType): number[][] {
    const heightMap: number[][] = [];
    const center = this.gridSize / 2;

    for (let i = 0; i < this.gridSize; i++) {
      heightMap[i] = [];
      for (let j = 0; j < this.gridSize; j++) {
        const dx = (i - center) / (this.gridSize / 2);
        const dy = (j - center) / (this.gridSize / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        let height = 0;

        switch (landform) {
          case 'mountain':
            height = this.generateMountain(dist, dx, dy);
            break;
          case 'basin':
            height = this.generateBasin(dist, dx, dy);
            break;
          case 'plain':
            height = this.generatePlain(i, j);
            break;
          case 'volcano':
            height = this.generateVolcano(dist, dx, dy);
            break;
        }

        heightMap[i][j] = height;
      }
    }

    return heightMap;
  }

  private generateMountain(dist: number, dx: number, dy: number): number {
    const base = Math.max(0, 1 - dist * 1.2);
    const ridge1 = Math.pow(Math.max(0, Math.cos(Math.atan2(dy, dx) * 3)), 2) * 0.3 * base;
    const ridge2 = Math.pow(Math.max(0, Math.sin(Math.atan2(dy, dx) * 5)), 2) * 0.2 * base;
    const noise = this.noise2D(dx * 8, dy * 8) * 0.15;
    return Math.max(0, (base + ridge1 + ridge2 + noise) * 6);
  }

  private generateBasin(dist: number, dx: number, dy: number): number {
    const center = Math.max(0, dist * 0.8 - 0.3);
    const rim = Math.pow(Math.max(0, 1 - Math.abs(dist - 0.85) * 6), 2) * 2.5;
    const noise = this.noise2D(dx * 6, dy * 6) * 0.1;
    return Math.max(0, center + rim + noise);
  }

  private generatePlain(i: number, j: number): number {
    const base = 0.8;
    const undulation = this.noise2D(i * 0.05, j * 0.05) * 0.4;
    const detail = this.noise2D(i * 0.15, j * 0.15) * 0.2;
    return Math.max(0, base + undulation + detail);
  }

  private generateVolcano(dist: number, dx: number, dy: number): number {
    const cone = Math.max(0, 1 - dist * 1.1) * 7;
    const crater = Math.pow(Math.max(0, 1 - Math.abs(dist - 0.15) * 12), 2) * 4;
    const lava = dist < 0.12 ? 5.5 - dist * 8 : 0;
    const noise = this.noise2D(dx * 10, dy * 10) * 0.2;
    let height = cone - crater + lava + noise;
    if (dist < 0.12) {
      height = 5.5 + noise * 0.3;
    }
    return Math.max(0, height);
  }

  private noise2D(x: number, y: number): number {
    const a = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    const b = Math.sin(x * 39.346 + y * 11.135) * 23421.631;
    const c = Math.sin(x * 73.982 + y * 47.441) * 68432.117;
    return ((a - Math.floor(a)) + (b - Math.floor(b)) + (c - Math.floor(c))) / 3 - 0.5;
  }

  erode(
    heightMap: number[][],
    windStrength: number,
    waterStrength: number,
    glacierStrength: number
  ): number[][] {
    const newMap = heightMap.map((row) => [...row]);
    const ws = windStrength / 100;
    const was = waterStrength / 100;
    const gs = glacierStrength / 100;

    this.applyWindErosion(newMap, ws);
    this.applyWaterErosion(newMap, was);
    this.applyGlacierErosion(newMap, gs);

    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        newMap[i][j] = Math.max(0, newMap[i][j]);
      }
    }

    return newMap;
  }

  private applyWindErosion(map: number[][], strength: number): void {
    if (strength <= 0) return;
    const threshold = 3;
    const erosionRate = strength * 0.08;

    for (let i = 1; i < this.gridSize - 1; i++) {
      for (let j = 1; j < this.gridSize - 1; j++) {
        if (map[i][j] > threshold) {
          const randomFactor = 0.5 + Math.random() * 0.5;
          const excess = map[i][j] - threshold;
          const erosion = excess * erosionRate * randomFactor * 0.1;
          map[i][j] -= erosion;

          const dirs = [
            [0, 1],
            [0, -1],
            [1, 0],
            [-1, 0],
          ];
          const dir = dirs[Math.floor(Math.random() * dirs.length)];
          const ni = i + dir[0];
          const nj = j + dir[1];
          if (ni >= 0 && ni < this.gridSize && nj >= 0 && nj < this.gridSize) {
            map[ni][nj] += erosion * 0.3;
          }
        }
      }
    }
  }

  private applyWaterErosion(map: number[][], strength: number): void {
    if (strength <= 0) return;
    const erosionRate = strength * 0.1;

    for (let i = 1; i < this.gridSize - 1; i++) {
      for (let j = 1; j < this.gridSize - 1; j++) {
        const current = map[i][j];
        const neighbors = [
          { di: -1, dj: 0, h: map[i - 1][j] },
          { di: 1, dj: 0, h: map[i + 1][j] },
          { di: 0, dj: -1, h: map[i][j - 1] },
          { di: 0, dj: 1, h: map[i][j + 1] },
        ];

        let totalSlope = 0;
        const slopes: { di: number; dj: number; slope: number }[] = [];

        for (const n of neighbors) {
          const slope = current - n.h;
          if (slope > 0) {
            totalSlope += slope;
            slopes.push({ di: n.di, dj: n.dj, slope });
          }
        }

        if (totalSlope > 0 && slopes.length > 0) {
          const erosionAmount = Math.min(current * 0.5, totalSlope * erosionRate * 0.05);
          map[i][j] -= erosionAmount;

          for (const s of slopes) {
            const ratio = s.slope / totalSlope;
            const ni = i + s.di;
            const nj = j + s.dj;
            map[ni][nj] += erosionAmount * ratio * 0.6;
          }
        }
      }
    }
  }

  private applyGlacierErosion(map: number[][], strength: number): void {
    if (strength <= 0) return;
    const erosionRate = strength * 0.04;
    const heightBonus = 1.5;

    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const heightFactor = 1 + map[i][j] / 8 * heightBonus;
        const erosion = erosionRate * heightFactor * 0.1;
        map[i][j] -= Math.min(map[i][j], erosion);
      }
    }

    for (let i = 1; i < this.gridSize - 1; i++) {
      for (let j = 1; j < this.gridSize - 1; j++) {
        const avg =
          (map[i - 1][j] +
            map[i + 1][j] +
            map[i][j - 1] +
            map[i][j + 1]) /
          4;
        map[i][j] = map[i][j] * (1 - erosionRate * 0.05) + avg * erosionRate * 0.05;
      }
    }
  }

  calculateTotalHeight(heightMap: number[][]): number {
    let total = 0;
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        total += heightMap[i][j];
      }
    }
    return total;
  }
}
