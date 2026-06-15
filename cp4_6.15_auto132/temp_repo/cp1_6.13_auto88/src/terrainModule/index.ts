import { NoiseGenerator } from './noiseGenerator';

export interface TerrainParams {
  frequency: number;
  amplitude: number;
  seed: number;
  octaves: number;
  persistence: number;
}

export interface TerrainStyle {
  name: string;
  frequency: number;
  amplitude: number;
  octaves: number;
  persistence: number;
}

export const TERRAIN_STYLES: Record<string, TerrainStyle> = {
  mountains: {
    name: 'Mountains',
    frequency: 2.5,
    amplitude: 1.8,
    octaves: 6,
    persistence: 0.45
  },
  basin: {
    name: 'Basin',
    frequency: 1.5,
    amplitude: 0.6,
    octaves: 4,
    persistence: 0.5
  },
  plateau: {
    name: 'Plateau',
    frequency: 0.8,
    amplitude: 0.4,
    octaves: 3,
    persistence: 0.6
  },
  canyon: {
    name: 'Canyon',
    frequency: 3.5,
    amplitude: 1.5,
    octaves: 5,
    persistence: 0.35
  }
};

export class TerrainGenerator {
  private noiseGenerator: NoiseGenerator;
  private width: number;
  private height: number;
  private heightMap: number[];
  private params: TerrainParams;

  constructor(width: number = 256, height: number = 256) {
    this.width = width;
    this.height = height;
    this.heightMap = new Array(width * height).fill(0);
    this.params = {
      frequency: 2.0,
      amplitude: 1.0,
      seed: 42,
      octaves: 5,
      persistence: 0.5
    };
    this.noiseGenerator = new NoiseGenerator(this.params.seed);
  }

  setParams(params: Partial<TerrainParams>): void {
    this.params = { ...this.params, ...params };
    if (params.seed !== undefined) {
      this.noiseGenerator.setSeed(params.seed);
    }
  }

  generateHeightMap(): number[] {
    const { frequency, amplitude, octaves, persistence } = this.params;
    const width = this.width;
    const height = this.height;
    const map = new Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x / width) * frequency * 4;
        const ny = (y / height) * frequency * 4;
        const noise = this.noiseGenerator.octavePerlin(nx, ny, octaves, persistence);
        map[y * width + x] = Math.pow(noise, 1.2) * amplitude;
      }
    }

    this.heightMap = this.normalize(map);
    return this.heightMap;
  }

  private normalize(map: number[]): number[] {
    let min = Infinity;
    let max = -Infinity;
    
    for (const val of map) {
      min = Math.min(min, val);
      max = Math.max(max, val);
    }

    const range = max - min || 1;
    return map.map(v => (v - min) / range);
  }

  getHeightMap(): number[] {
    return this.heightMap;
  }

  setHeightMap(map: number[]): void {
    this.heightMap = map.slice();
  }

  modifyHeightMap(x: number, y: number, brushSize: number, strength: number, isRaise: boolean): void {
    const width = this.width;
    const height = this.height;
    const halfSize = brushSize / 2;

    const startX = Math.max(0, Math.floor(x - halfSize));
    const endX = Math.min(width - 1, Math.floor(x + halfSize));
    const startY = Math.max(0, Math.floor(y - halfSize));
    const endY = Math.min(height - 1, Math.floor(y + halfSize));

    for (let yy = startY; yy <= endY; yy++) {
      for (let xx = startX; xx <= endX; xx++) {
        const dx = xx - x;
        const dy = yy - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const falloff = Math.max(0, 1 - dist / halfSize);
        
        const index = yy * width + xx;
        const delta = falloff * strength * (isRaise ? 1 : -1);
        this.heightMap[index] = Math.max(0, Math.min(1, this.heightMap[index] + delta));
      }
    }
  }

  getStats(): { min: number; max: number; avg: number } {
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;

    for (const val of this.heightMap) {
      min = Math.min(min, val);
      max = Math.max(max, val);
      sum += val;
    }

    return {
      min,
      max,
      avg: sum / this.heightMap.length
    };
  }

  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  lerpToTarget(targetParams: TerrainParams, progress: number): void {
    const current = this.params;
    const lerpParam = (currentVal: number, targetVal: number) => 
      currentVal + (targetVal - currentVal) * progress;

    this.params = {
      frequency: lerpParam(current.frequency, targetParams.frequency),
      amplitude: lerpParam(current.amplitude, targetParams.amplitude),
      seed: targetParams.seed,
      octaves: targetParams.octaves,
      persistence: lerpParam(current.persistence, targetParams.persistence)
    };

    if (progress >= 1) {
      this.noiseGenerator.setSeed(targetParams.seed);
    }
  }
}
