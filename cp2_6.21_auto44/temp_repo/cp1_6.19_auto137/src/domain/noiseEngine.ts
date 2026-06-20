import { NoiseSourceData } from './noiseSource';
import { CityMap } from './cityMap';

export class NoiseEngine {
  private gridSize: number;
  private worldSize: number;
  private matrix: number[][];

  constructor(gridSize: number, cityMap: CityMap) {
    this.gridSize = gridSize;
    this.worldSize = cityMap.getGridSize();
    this.matrix = [];
    for (let i = 0; i < gridSize; i++) {
      this.matrix[i] = new Array(gridSize).fill(0);
    }
  }

  calculate(sources: NoiseSourceData[]): number[][] {
    const gs = this.gridSize;
    const ws = this.worldSize;
    const cellSize = ws / gs;

    for (let i = 0; i < gs; i++) {
      for (let j = 0; j < gs; j++) {
        this.matrix[i][j] = 0;
      }
    }

    for (const source of sources) {
      if (!source.active) continue;

      const sx = source.position.x;
      const sz = source.position.z;
      const intensity = source.intensity;
      const sigma = source.diffusionRadius / 2.5;
      const sigma2x2 = 2 * sigma * sigma;
      const maxRange = source.diffusionRadius * 2.5;

      const minI = Math.max(0, Math.floor((sx - maxRange) / cellSize));
      const maxI = Math.min(gs - 1, Math.ceil((sx + maxRange) / cellSize));
      const minJ = Math.max(0, Math.floor((sz - maxRange) / cellSize));
      const maxJ = Math.min(gs - 1, Math.ceil((sz + maxRange) / cellSize));

      for (let i = minI; i <= maxI; i++) {
        for (let j = minJ; j <= maxJ; j++) {
          const px = (i + 0.5) * cellSize;
          const pz = (j + 0.5) * cellSize;
          const dx = px - sx;
          const dz = pz - sz;
          const dist2 = dx * dx + dz * dz;

          if (dist2 > maxRange * maxRange) continue;

          const contribution = intensity * Math.exp(-dist2 / sigma2x2);
          this.matrix[i][j] += contribution;
        }
      }
    }

    for (let i = 0; i < gs; i++) {
      for (let j = 0; j < gs; j++) {
        this.matrix[i][j] = Math.min(this.matrix[i][j], 100);
      }
    }

    return this.matrix;
  }
}
