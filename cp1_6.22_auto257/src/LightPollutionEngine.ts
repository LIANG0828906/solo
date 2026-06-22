import { POLLUTION_COLOR_STOPS, PollutionRenderData, Building, LightSources } from './types';

export class LightPollutionEngine {
  private maxBarHeight: number = 80;
  private minBarHeight: number = 0;

  constructor() {}

  calculatePollutionRenderData(pollutionValue: number): PollutionRenderData {
    const clampedValue = Math.max(0, Math.min(100, pollutionValue));
    const color = this.interpolateColor(clampedValue);
    const barHeight = this.interpolateBarHeight(clampedValue);

    return {
      color,
      barHeight,
      value: clampedValue
    };
  }

  private interpolateColor(value: number): string {
    const stops = POLLUTION_COLOR_STOPS;
    
    if (value <= stops[0].value) return stops[0].color;
    if (value >= stops[stops.length - 1].value) return stops[stops.length - 1].color;

    for (let i = 0; i < stops.length - 1; i++) {
      const lower = stops[i];
      const upper = stops[i + 1];
      
      if (value >= lower.value && value <= upper.value) {
        const t = (value - lower.value) / (upper.value - lower.value);
        return this.lerpColor(lower.color, upper.color, t);
      }
    }

    return stops[stops.length - 1].color;
  }

  private lerpColor(color1: string, color2: string, t: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);

    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 };
  }

  private interpolateBarHeight(value: number): number {
    const t = value / 100;
    return this.minBarHeight + (this.maxBarHeight - this.minBarHeight) * t;
  }

  generateHeatmapData(buildings: Building[], gridSize: number, cellSize: number): number[][] {
    const cells = Math.floor(gridSize / cellSize);
    const heatmap: number[][] = [];
    const halfGrid = gridSize / 2;

    for (let i = 0; i < cells; i++) {
      heatmap[i] = [];
      for (let j = 0; j < cells; j++) {
        heatmap[i][j] = 0;
      }
    }

    buildings.forEach(building => {
      const gridX = Math.floor((building.x + halfGrid) / cellSize);
      const gridZ = Math.floor((building.z + halfGrid) / cellSize);
      
      const radius = 2;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          const gx = gridX + dx;
          const gz = gridZ + dz;
          
          if (gx >= 0 && gx < cells && gz >= 0 && gz < cells) {
            const dist = Math.sqrt(dx * dx + dz * dz);
            const influence = Math.max(0, 1 - dist / radius);
            heatmap[gz][gx] += building.currentPollution * influence * 0.3;
          }
        }
      }
    });

    let maxValue = 0;
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        maxValue = Math.max(maxValue, heatmap[i][j]);
      }
    }

    if (maxValue > 0) {
      for (let i = 0; i < cells; i++) {
        for (let j = 0; j < cells; j++) {
          heatmap[i][j] = Math.min(100, (heatmap[i][j] / maxValue) * 100);
        }
      }
    }

    return heatmap;
  }

  calculateLightSourcePercentages(sources: LightSources): Record<keyof LightSources, number> {
    const total = sources.streetLights + sources.billboards + sources.buildingLights + sources.trafficLights;
    
    if (total === 0) {
      return {
        streetLights: 25,
        billboards: 25,
        buildingLights: 25,
        trafficLights: 25
      };
    }

    return {
      streetLights: Math.round((sources.streetLights / total) * 1000) / 10,
      billboards: Math.round((sources.billboards / total) * 1000) / 10,
      buildingLights: Math.round((sources.buildingLights / total) * 1000) / 10,
      trafficLights: Math.round((sources.trafficLights / total) * 1000) / 10
    };
  }

  getPollutionLevelText(value: number): string {
    if (value < 20) return '极低';
    if (value < 40) return '较低';
    if (value < 60) return '中等';
    if (value < 80) return '较高';
    return '极高';
  }
}
