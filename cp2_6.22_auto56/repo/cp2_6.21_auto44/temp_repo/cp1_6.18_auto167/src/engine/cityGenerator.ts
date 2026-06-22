import type { BuildingData, CityConfig, NoiseType } from '@/types';
import { BUILDING_CONSTRAINTS, uiConfig } from '@/data/uiConfig';
import { audioEngine } from './audioEngine';

const { buildingColors } = uiConfig.colorPalette;

class CityGenerator {
  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private valueNoise(seed: number, x: number, z: number, scale: number, smoothness: number): number {
    const rand = this.seededRandom(seed);
    const intX = Math.floor(x / scale);
    const intZ = Math.floor(z / scale);
    const fracX = (x / scale) - intX;
    const fracZ = (z / scale) - intZ;

    const smoothT = (t: number) => {
      const s = Math.pow(t, Math.max(1, smoothness * 4));
      return s * s * (3 - 2 * s);
    };

    const corners: Record<string, number> = {};
    const getCorner = (ix: number, iz: number): number => {
      const key = `${ix}_${iz}`;
      if (corners[key] !== undefined) return corners[key];
      const localRand = this.seededRandom(seed + ix * 73856093 + iz * 19349663);
      corners[key] = localRand();
      return corners[key];
    };

    const v00 = getCorner(intX, intZ);
    const v10 = getCorner(intX + 1, intZ);
    const v01 = getCorner(intX, intZ + 1);
    const v11 = getCorner(intX + 1, intZ + 1);

    const u = smoothT(fracX);
    const v = smoothT(fracZ);

    const i1 = this.lerp(v00, v10, u);
    const i2 = this.lerp(v01, v11, u);
    const result = this.lerp(i1, i2, v) + rand() * (1 - smoothness) * 0.15;

    return Math.max(0, Math.min(1, result));
  }

  private hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16),
    ];
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private interpolateColor(colors: string[], t: number, contrast: number): string {
    const adjustedT = Math.pow(Math.max(0, Math.min(1, t)), 1 / contrast);
    const scaledT = adjustedT * (colors.length - 1);
    const index = Math.floor(scaledT);
    const frac = scaledT - index;

    if (index >= colors.length - 1) {
      return colors[colors.length - 1];
    }
    if (index < 0) {
      return colors[0];
    }

    const c1 = this.hexToRgb(colors[index]);
    const c2 = this.hexToRgb(colors[index + 1]);

    return this.rgbToHex(
      this.lerp(c1[0], c2[0], frac),
      this.lerp(c1[1], c2[1], frac),
      this.lerp(c1[2], c2[2], frac),
    );
  }

  generateCity(config: CityConfig): BuildingData[] {
    const startTime = performance.now();

    const { gridSize, density, heightScale, colorContrast, noiseType } = config;
    const { minSize, maxSize, minHeight, maxHeight, spacing, maxBuildings, maxDensityBuildings } = BUILDING_CONSTRAINTS;

    const cellSize = maxSize + spacing;
    const totalSize = gridSize * cellSize;
    const offset = -totalSize / 2 + cellSize / 2;

    const buildings: BuildingData[] = [];
    const spectrum = audioEngine.getSpectrumData(noiseType);
    const profile = audioEngine.getNoiseProfile(noiseType);

    const noiseSeed = noiseType === 'white' ? 12345 : noiseType === 'pink' ? 67890 : 13579;
    const gridNoiseScale = noiseType === 'brown' ? 12 : noiseType === 'pink' ? 8 : 3;

    const maxCount = density >= 0.95 ? maxDensityBuildings : maxBuildings;
    let id = 0;
    const cells: { x: number; z: number; height: number }[] = [];

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gz = 0; gz < gridSize; gz++) {
        let noiseValue: number;

        switch (noiseType) {
          case 'white':
            noiseValue = Math.random();
            break;
          case 'pink': {
            const base = this.valueNoise(noiseSeed, gx, gz, gridNoiseScale, profile.smoothness);
            const distFromCenter = Math.sqrt(
              Math.pow((gx / gridSize) - 0.5, 2) + Math.pow((gz / gridSize) - 0.5, 2),
            );
            const centerBoost = (1 - distFromCenter * 1.4) * profile.centerBias;
            const clusterMod = Math.round(
              this.valueNoise(noiseSeed + 100, gx, gz, 5, 0.8) * 3,
            ) / 3;
            noiseValue = Math.max(0, Math.min(1, base * (1 + centerBoost * 0.8 + clusterMod * 0.4 * profile.clusterStrength)));
            break;
          }
          case 'brown': {
            const base = this.valueNoise(noiseSeed, gx, gz, gridNoiseScale, profile.smoothness);
            const detail = this.valueNoise(noiseSeed + 200, gx, gz, gridNoiseScale * 2.5, profile.smoothness) * 0.3;
            const distFromCenter = Math.sqrt(
              Math.pow((gx / gridSize) - 0.5, 2) + Math.pow((gz / gridSize) - 0.5, 2),
            );
            const centerBoost = (1 - distFromCenter * 1.6) * profile.centerBias * 0.6;
            noiseValue = Math.max(0, Math.min(1, (base + detail) * 0.8 + centerBoost + spectrum.lowFrequency * 0.2));
            break;
          }
        }

        cells.push({ x: gx, z: gz, height: noiseValue });
      }
    }

    cells.sort((a, b) => b.height - a.height);
    const keepCount = Math.min(Math.floor(cells.length * density), maxCount);

    for (let i = 0; i < keepCount; i++) {
      const cell = cells[i];
      const spectrumIndex = Math.floor((i / keepCount) * spectrum.spectrumArray.length);
      const specBoost = spectrum.spectrumArray[Math.min(spectrumIndex, spectrum.spectrumArray.length - 1)] || 0.5;

      const rawHeight = cell.height * (0.6 + specBoost * 0.4);
      const baseHeight = minHeight + rawHeight * (maxHeight - minHeight);
      const targetHeight = baseHeight * heightScale;

      const sizeVariation = 0.5 + cell.height * 0.5;
      const buildingSize = minSize + (maxSize - minSize) * sizeVariation;

      const jitter = (BUILDING_CONSTRAINTS.maxSize - buildingSize) * 0.5;
      const worldX = offset + cell.x * cellSize + (Math.random() - 0.5) * jitter;
      const worldZ = offset + cell.z * cellSize + (Math.random() - 0.5) * jitter;

      const heightNorm = (targetHeight - minHeight * heightScale) / Math.max(0.01, (maxHeight - minHeight) * heightScale);
      const color = this.interpolateColor(buildingColors, heightNorm, colorContrast);

      buildings.push({
        id: id++,
        gridX: cell.x,
        gridZ: cell.z,
        position: [worldX, 0, worldZ],
        size: [buildingSize, targetHeight, buildingSize],
        baseHeight,
        targetHeight,
        color,
        baseColor: color,
        selected: false,
        hovered: false,
      });
    }

    const elapsed = performance.now() - startTime;
    console.debug(`City generated: ${buildings.length} buildings in ${elapsed.toFixed(1)}ms`);

    return buildings;
  }

  recalculateColors(buildings: BuildingData[], contrast: number): BuildingData[] {
    return buildings.map(b => {
      const { minHeight, maxHeight } = BUILDING_CONSTRAINTS;
      const heightNorm = (b.targetHeight - minHeight) / (maxHeight - minHeight);
      const newColor = this.interpolateColor(buildingColors, Math.max(0, Math.min(1, heightNorm)), contrast);
      return {
        ...b,
        color: b.selected ? b.color : newColor,
        baseColor: newColor,
      };
    });
  }

  updateHeights(buildings: BuildingData[], heightScale: number): BuildingData[] {
    const { minHeight, maxHeight } = BUILDING_CONSTRAINTS;
    return buildings.map(b => {
      const newTarget = b.baseHeight * heightScale;
      const heightNorm = (newTarget - minHeight * heightScale) / Math.max(0.01, (maxHeight - minHeight) * heightScale);
      return {
        ...b,
        size: [b.size[0], newTarget, b.size[2]],
        targetHeight: newTarget,
        position: [b.position[0], b.selected ? BUILDING_CONSTRAINTS.selectedLift : 0, b.position[2]],
      };
    });
  }
}

export const cityGenerator = new CityGenerator();
export default cityGenerator;
