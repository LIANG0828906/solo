export interface DensityGrid {
  size: number;
  cells: number[][];
  averageDensity: number;
  cornerDensities: [number, number, number, number];
}

interface DensityCell {
  current: number;
  target: number;
}

const GRID_SIZE = 4;
const UPDATE_INTERVAL = 2000;

export class DataManager {
  private grid: DensityCell[][];
  private lastUpdateTime: number = 0;
  private startTime: number = 0;
  private densityGrid: DensityGrid;

  constructor() {
    this.grid = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      this.grid[i] = [];
      for (let j = 0; j < GRID_SIZE; j++) {
        const initial = 20 + Math.random() * 30;
        this.grid[i][j] = {
          current: initial,
          target: initial
        };
      }
    }

    this.densityGrid = {
      size: GRID_SIZE,
      cells: [],
      averageDensity: 0,
      cornerDensities: [0, 0, 0, 0]
    };

    this.startTime = performance.now();
    this.updateDensityGrid();
  }

  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  private generateTargetDensities(): void {
    const time = (performance.now() - this.startTime) / 1000;
    
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const centerX = (GRID_SIZE - 1) / 2;
        const centerY = (GRID_SIZE - 1) / 2;
        const distFromCenter = Math.sqrt(
          Math.pow(i - centerX, 2) + Math.pow(j - centerY, 2)
        );
        const maxDist = Math.sqrt(2) * centerX;
        const centerFactor = 1 - (distFromCenter / maxDist) * 0.5;

        const wave1 = Math.sin(time * 0.3 + i * 0.8 + j * 0.5) * 0.5 + 0.5;
        const wave2 = Math.sin(time * 0.5 + i * 1.2 - j * 0.7) * 0.3 + 0.3;
        const noise = (Math.sin(i * 12.9898 + j * 78.233 + time * 0.7) * 43758.5453) % 1;
        const noiseVal = Math.abs(noise) * 0.3;

        let base = (wave1 * 0.4 + wave2 * 0.3 + noiseVal + 0.2) * centerFactor;
        base = this.smoothstep(0, 1, base);
        
        const minDensity = 5 + Math.random() * 15;
        const maxDensity = 75 + Math.random() * 25;
        const target = minDensity + base * (maxDensity - minDensity);
        
        this.grid[i][j].target = Math.max(0, Math.min(100, target));
      }
    }

    const hotspots = 2;
    for (let h = 0; h < hotspots; h++) {
      const hi = Math.floor(Math.random() * GRID_SIZE);
      const hj = Math.floor(Math.random() * GRID_SIZE);
      const hotspotValue = 70 + Math.random() * 30;
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          const ni = hi + di;
          const nj = hj + dj;
          if (ni >= 0 && ni < GRID_SIZE && nj >= 0 && nj < GRID_SIZE) {
            const falloff = 1 - (Math.abs(di) + Math.abs(dj)) / 3;
            this.grid[ni][nj].target = Math.max(
              this.grid[ni][nj].target,
              hotspotValue * falloff
            );
          }
        }
      }
    }
  }

  getDensityGrid(currentTime: number): DensityGrid {
    if (currentTime - this.lastUpdateTime >= UPDATE_INTERVAL) {
      this.generateTargetDensities();
      this.lastUpdateTime = currentTime;
    }

    this.updateDensityGrid();
    return this.densityGrid;
  }

  private updateDensityGrid(): void {
    const transitionSpeed = 1 / 1500;

    this.densityGrid.cells = [];
    let sum = 0;

    for (let i = 0; i < GRID_SIZE; i++) {
      this.densityGrid.cells[i] = [];
      for (let j = 0; j < GRID_SIZE; j++) {
        const cell = this.grid[i][j];
        const diff = cell.target - cell.current;
        cell.current += diff * transitionSpeed * 16;
        cell.current = Math.max(0, Math.min(100, cell.current));
        
        this.densityGrid.cells[i][j] = cell.current;
        sum += cell.current;
      }
    }

    this.densityGrid.averageDensity = sum / (GRID_SIZE * GRID_SIZE);
    this.densityGrid.cornerDensities = [
      this.grid[0][0].current,
      this.grid[0][GRID_SIZE - 1].current,
      this.grid[GRID_SIZE - 1][0].current,
      this.grid[GRID_SIZE - 1][GRID_SIZE - 1].current
    ];
  }

  getGridSize(): number {
    return GRID_SIZE;
  }
}
