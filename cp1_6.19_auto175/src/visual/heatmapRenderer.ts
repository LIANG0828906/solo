
import type { Particle, HeatmapGrid } from '../types';
import type { IHeatmapRenderer } from '../api';
import { GRID_SIZE_X, GRID_SIZE_Y, GRID_SIZE_Z, CELL_SIZE, HOTSPOT_THRESHOLD, BOUNDARY_SIZE } from '../api';

function lerpColor(color1: number[], color2: number[], t: number): number[] {
  return [
    Math.round(color1[0] + (color2[0] - color1[0]) * t),
    Math.round(color1[1] + (color2[1] - color1[1]) * t),
    Math.round(color1[2] + (color2[2] - color1[2]) * t)
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function getDensityColor(density: number, maxDensity: number): string {
  if (maxDensity === 0) return '#0000FF';
  
  const t = Math.min(density / maxDensity, 1);
  
  const blue = [0, 0, 255];
  const cyan = [0, 255, 255];
  const green = [0, 255, 0];
  const yellow = [255, 255, 0];
  const red = [255, 0, 0];
  
  let color: number[];
  
  if (t < 0.25) {
    color = lerpColor(blue, cyan, t / 0.25);
  } else if (t < 0.5) {
    color = lerpColor(cyan, green, (t - 0.25) / 0.25);
  } else if (t < 0.75) {
    color = lerpColor(green, yellow, (t - 0.5) / 0.25);
  } else {
    color = lerpColor(yellow, red, (t - 0.75) / 0.25);
  }
  
  return rgbToHex(color[0], color[1], color[2]);
}

export class HeatmapRenderer implements IHeatmapRenderer {
  computeHeatmap(particles: Particle[]): HeatmapGrid[] {
    const grid: number[][][] = [];
    
    for (let i = 0; i < GRID_SIZE_X; i++) {
      grid[i] = [];
      for (let j = 0; j < GRID_SIZE_Y; j++) {
        grid[i][j] = [];
        for (let k = 0; k < GRID_SIZE_Z; k++) {
          grid[i][j][k] = 0;
        }
      }
    }
    
    const halfBoundary = BOUNDARY_SIZE / 2;
    const offsetX = halfBoundary;
    const offsetY = halfBoundary;
    const offsetZ = halfBoundary * 0.5;
    
    for (const p of particles) {
      const i = Math.floor((p.x + offsetX) / CELL_SIZE);
      const j = Math.floor((p.y + offsetY) / CELL_SIZE);
      const k = Math.floor((p.z + offsetZ) / CELL_SIZE);
      
      if (i >= 0 && i < GRID_SIZE_X && j >= 0 && j < GRID_SIZE_Y && k >= 0 && k < GRID_SIZE_Z) {
        grid[i][j][k]++;
      }
    }
    
    let maxDensity = 0;
    for (let i = 0; i < GRID_SIZE_X; i++) {
      for (let j = 0; j < GRID_SIZE_Y; j++) {
        for (let k = 0; k < GRID_SIZE_Z; k++) {
          if (grid[i][j][k] > maxDensity) {
            maxDensity = grid[i][j][k];
          }
        }
      }
    }
    
    const result: HeatmapGrid[] = [];
    
    for (let i = 0; i < GRID_SIZE_X; i++) {
      for (let j = 0; j < GRID_SIZE_Y; j++) {
        for (let k = 0; k < GRID_SIZE_Z; k++) {
          const density = grid[i][j][k];
          if (density > 0) {
            result.push({
              i,
              j,
              k,
              density,
              color: getDensityColor(density, maxDensity),
              worldX: i * CELL_SIZE - offsetX + CELL_SIZE / 2,
              worldY: j * CELL_SIZE - offsetY + CELL_SIZE / 2,
              worldZ: k * CELL_SIZE - offsetZ + CELL_SIZE / 2,
              isHotspot: density >= HOTSPOT_THRESHOLD
            });
          }
        }
      }
    }
    
    return result;
  }
}

export const heatmapRenderer = new HeatmapRenderer();
