import { NutrientParticle, SoilType, RootNode } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 11);

const BOUNDARY = 4;
const PARTICLE_COUNT = 3000;
const GRID_SIZE = 16;
const CELL_SIZE = (BOUNDARY * 2) / GRID_SIZE;

interface SoilNutrientProfile {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  diffusionRate: number;
}

const soilProfiles: Record<SoilType, SoilNutrientProfile> = {
  sand: { nitrogen: 0.3, phosphorus: 0.5, potassium: 0.3, diffusionRate: 0.5 },
  loam: { nitrogen: 0.7, phosphorus: 0.7, potassium: 0.7, diffusionRate: 0.3 },
  clay: { nitrogen: 0.5, phosphorus: 0.3, potassium: 0.8, diffusionRate: 0.1 },
};

class NutrientGrid {
  size: number;
  resolution: number;
  nitrogen: Float32Array;
  phosphorus: Float32Array;
  potassium: Float32Array;

  constructor(resolution: number) {
    this.size = resolution;
    this.resolution = resolution;
    const totalCells = resolution * resolution * resolution;
    this.nitrogen = new Float32Array(totalCells);
    this.phosphorus = new Float32Array(totalCells);
    this.potassium = new Float32Array(totalCells);
  }

  getIndex(x: number, y: number, z: number): number {
    return x + y * this.size + z * this.size * this.size;
  }

  getClampedIndex(x: number, y: number, z: number): number {
    const cx = Math.max(0, Math.min(this.size - 1, x));
    const cy = Math.max(0, Math.min(this.size - 1, y));
    const cz = Math.max(0, Math.min(this.size - 1, z));
    return this.getIndex(cx, cy, cz);
  }
}

let nutrientGrid: NutrientGrid | null = null;

export const initializeNutrients = (soilType: SoilType): NutrientParticle[] => {
  const profile = soilProfiles[soilType];
  nutrientGrid = new NutrientGrid(GRID_SIZE);

  for (let i = 0; i < GRID_SIZE * GRID_SIZE * GRID_SIZE; i++) {
    nutrientGrid.nitrogen[i] = profile.nitrogen * (0.8 + Math.random() * 0.4);
    nutrientGrid.phosphorus[i] = profile.phosphorus * (0.8 + Math.random() * 0.4);
    nutrientGrid.potassium[i] = profile.potassium * (0.8 + Math.random() * 0.4);
  }

  const particles: NutrientParticle[] = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (Math.random() - 0.5) * BOUNDARY * 1.9;
    const y = (Math.random() - 0.5) * BOUNDARY * 1.9;
    const z = (Math.random() - 0.5) * BOUNDARY * 1.9;

    const { nitrogen, phosphorus, potassium } = getNutrientAtPosition([x, y, z]);

    const totalNutrient = nitrogen + phosphorus + potassium;
    const baseOpacity = 0.5 + totalNutrient * 0.1;

    particles.push({
      id: generateId(),
      position: [x, y, z],
      nitrogen,
      phosphorus,
      potassium,
      baseOpacity,
    });
  }

  return particles;
};

export const getNutrientAtPosition = (
  pos: [number, number, number]
): { nitrogen: number; phosphorus: number; potassium: number } => {
  if (!nutrientGrid) {
    return { nitrogen: 0, phosphorus: 0, potassium: 0 };
  }

  const gx = ((pos[0] + BOUNDARY) / (BOUNDARY * 2)) * GRID_SIZE;
  const gy = ((pos[1] + BOUNDARY) / (BOUNDARY * 2)) * GRID_SIZE;
  const gz = ((pos[2] + BOUNDARY) / (BOUNDARY * 2)) * GRID_SIZE;

  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const z0 = Math.floor(gz);
  const x1 = Math.min(x0 + 1, GRID_SIZE - 1);
  const y1 = Math.min(y0 + 1, GRID_SIZE - 1);
  const z1 = Math.min(z0 + 1, GRID_SIZE - 1);

  const fx = gx - x0;
  const fy = gy - y0;
  const fz = gz - z0;

  const c000 = nutrientGrid.getClampedIndex(x0, y0, z0);
  const c100 = nutrientGrid.getClampedIndex(x1, y0, z0);
  const c010 = nutrientGrid.getClampedIndex(x0, y1, z0);
  const c110 = nutrientGrid.getClampedIndex(x1, y1, z0);
  const c001 = nutrientGrid.getClampedIndex(x0, y0, z1);
  const c101 = nutrientGrid.getClampedIndex(x1, y0, z1);
  const c011 = nutrientGrid.getClampedIndex(x0, y1, z1);
  const c111 = nutrientGrid.getClampedIndex(x1, y1, z1);

  const interpolate = (arr: Float32Array): number => {
    const c00 = arr[c000] * (1 - fx) + arr[c100] * fx;
    const c10 = arr[c010] * (1 - fx) + arr[c110] * fx;
    const c01 = arr[c001] * (1 - fx) + arr[c101] * fx;
    const c11 = arr[c011] * (1 - fx) + arr[c111] * fx;
    const c0 = c00 * (1 - fy) + c10 * fy;
    const c1 = c01 * (1 - fy) + c11 * fy;
    return c0 * (1 - fz) + c1 * fz;
  };

  return {
    nitrogen: Math.max(0, interpolate(nutrientGrid.nitrogen)),
    phosphorus: Math.max(0, interpolate(nutrientGrid.phosphorus)),
    potassium: Math.max(0, interpolate(nutrientGrid.potassium)),
  };
};

export const consumeNutrientsAt = (pos: [number, number, number], amount: number = 0.05) => {
  if (!nutrientGrid) return;

  const gx = ((pos[0] + BOUNDARY) / (BOUNDARY * 2)) * GRID_SIZE;
  const gy = ((pos[1] + BOUNDARY) / (BOUNDARY * 2)) * GRID_SIZE;
  const gz = ((pos[2] + BOUNDARY) / (BOUNDARY * 2)) * GRID_SIZE;

  const influenceRadius = 2;

  for (let dx = -influenceRadius; dx <= influenceRadius; dx++) {
    for (let dy = -influenceRadius; dy <= influenceRadius; dy++) {
      for (let dz = -influenceRadius; dz <= influenceRadius; dz++) {
        const x = Math.floor(gx) + dx;
        const y = Math.floor(gy) + dy;
        const z = Math.floor(gz) + dz;

        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE || z < 0 || z >= GRID_SIZE) {
          continue;
        }

        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const falloff = Math.exp(-dist * dist * 0.5);
        const consumeAmount = amount * falloff;

        const idx = nutrientGrid.getIndex(x, y, z);
        nutrientGrid.nitrogen[idx] = Math.max(0, nutrientGrid.nitrogen[idx] - consumeAmount * 0.3);
        nutrientGrid.phosphorus[idx] = Math.max(0, nutrientGrid.phosphorus[idx] - consumeAmount * 0.3);
        nutrientGrid.potassium[idx] = Math.max(0, nutrientGrid.potassium[idx] - consumeAmount * 0.4);
      }
    }
  }
};

export const diffuseNutrients = (diffusionRate: number) => {
  if (!nutrientGrid) return;

  const tempN = new Float32Array(nutrientGrid.nitrogen);
  const tempP = new Float32Array(nutrientGrid.phosphorus);
  const tempK = new Float32Array(nutrientGrid.potassium);

  const rate = diffusionRate * 0.1;

  for (let x = 1; x < GRID_SIZE - 1; x++) {
    for (let y = 1; y < GRID_SIZE - 1; y++) {
      for (let z = 1; z < GRID_SIZE - 1; z++) {
        const idx = nutrientGrid!.getIndex(x, y, z);
        const idxXp = nutrientGrid!.getIndex(x + 1, y, z);
        const idxXm = nutrientGrid!.getIndex(x - 1, y, z);
        const idxYp = nutrientGrid!.getIndex(x, y + 1, z);
        const idxYm = nutrientGrid!.getIndex(x, y - 1, z);
        const idxZp = nutrientGrid!.getIndex(x, y, z + 1);
        const idxZm = nutrientGrid!.getIndex(x, y, z - 1);

        const lapN =
          tempN[idxXp] + tempN[idxXm] + tempN[idxYp] + tempN[idxYm] + tempN[idxZp] + tempN[idxZm] -
          6 * tempN[idx];
        const lapP =
          tempP[idxXp] + tempP[idxXm] + tempP[idxYp] + tempP[idxYm] + tempP[idxZp] + tempP[idxZm] -
          6 * tempP[idx];
        const lapK =
          tempK[idxXp] + tempK[idxXm] + tempK[idxYp] + tempK[idxYm] + tempK[idxZp] + tempK[idxZm] -
          6 * tempK[idx];

        nutrientGrid!.nitrogen[idx] = Math.max(0, tempN[idx] + rate * lapN);
        nutrientGrid!.phosphorus[idx] = Math.max(0, tempP[idx] + rate * lapP);
        nutrientGrid!.potassium[idx] = Math.max(0, tempK[idx] + rate * lapK);
      }
    }
  }
};

export const updateParticleNutrients = (
  particles: NutrientParticle[],
  roots: RootNode[]
): NutrientParticle[] => {
  if (!nutrientGrid) return particles;

  for (const root of roots) {
    if (root.isTip) {
      consumeNutrientsAt(root.position, 0.03);
    }
  }

  return particles.map((particle) => {
    const { nitrogen, phosphorus, potassium } = getNutrientAtPosition(particle.position);
    const totalNutrient = nitrogen + phosphorus + potassium;
    const baseOpacity = Math.max(0.05, Math.min(0.8, 0.2 + totalNutrient * 0.3));

    return {
      ...particle,
      nitrogen,
      phosphorus,
      potassium,
      baseOpacity,
    };
  });
};

export const getAverageNutrientConcentration = (pos: [number, number, number]): number => {
  const { nitrogen, phosphorus, potassium } = getNutrientAtPosition(pos);
  return (nitrogen + phosphorus + potassium) / 3;
};

const soilProfilesExport = soilProfiles;
export { soilProfilesExport as soilProfiles };
