import { v4 as uuidv4 } from 'uuid';
import { Mineral, StarFieldConfig, Star, Coordinate, MineralType, COLLECT_DURATION } from './types';

export class StarField {
  private config: StarFieldConfig;
  private minerals: Mineral[] = [];
  private stars: Star[] = [];
  private gridCells: (Mineral[])[] = [];

  constructor(width: number = 800, height: number = 800, gridSize: number = 8) {
    this.config = { width, height, gridSize };
    this.generateStars();
    this.generateMinerals();
  }

  private generateStars(): void {
    const starCount = 100;
    this.stars = [];
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.config.width,
        y: Math.random() * this.config.height,
        size: Math.random() * 2 + 0.5,
        opacity: 0.5 + Math.random() * 0.5,
        twinkleSpeed: 2 + Math.random() * 2,
        twinkleOffset: Math.random() * Math.PI * 2
      });
    }
  }

  private generateMinerals(): void {
    const { gridSize, width, height } = this.config;
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;
    this.minerals = [];
    this.gridCells = [];

    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        const mineralCount = Math.floor(Math.random() * 4);
        const cellMinerals: Mineral[] = [];
        
        for (let i = 0; i < mineralCount; i++) {
          const types: MineralType[] = ['gold', 'iron', 'crystal'];
          const typeWeights = [0.2, 0.5, 0.3];
          let rand = Math.random();
          let type: MineralType = 'iron';
          let cumulative = 0;
          for (let j = 0; j < types.length; j++) {
            cumulative += typeWeights[j];
            if (rand < cumulative) {
              type = types[j];
              break;
            }
          }

          const mineral: Mineral = {
            id: uuidv4(),
            gridX: gx,
            gridY: gy,
            x: gx * cellWidth + 10 + Math.random() * (cellWidth - 20),
            y: gy * cellHeight + 10 + Math.random() * (cellHeight - 20),
            size: 4 + Math.random() * 4,
            type,
            opacity: 1,
            scale: 1,
            collecting: false,
            collectProgress: 0
          };
          this.minerals.push(mineral);
          cellMinerals.push(mineral);
        }
        this.gridCells.push(cellMinerals);
      }
    }
  }

  getMinerals(): Mineral[] {
    return this.minerals.filter(m => m.opacity > 0);
  }

  getAllMinerals(): Mineral[] {
    return this.minerals;
  }

  getStars(): Star[] {
    return this.stars;
  }

  getCoordinates(): Coordinate {
    return { x: this.config.width, y: this.config.height };
  }

  getConfig(): StarFieldConfig {
    return this.config;
  }

  getGridCell(gx: number, gy: number): Mineral[] {
    if (gx < 0 || gx >= this.config.gridSize || gy < 0 || gy >= this.config.gridSize) {
      return [];
    }
    return this.gridCells[gy * this.config.gridSize + gx].filter(m => m.opacity > 0);
  }

  getMineralById(id: string): Mineral | undefined {
    return this.minerals.find(m => m.id === id);
  }

  removeMineral(id: string): void {
    const mineral = this.minerals.find(m => m.id === id);
    if (mineral) {
      mineral.opacity = 0;
      const cellIndex = mineral.gridY * this.config.gridSize + mineral.gridX;
      const cellMinerals = this.gridCells[cellIndex];
      const idx = cellMinerals.findIndex(m => m.id === id);
      if (idx !== -1) {
        cellMinerals.splice(idx, 1);
      }
    }
  }

  startCollecting(id: string): void {
    const mineral = this.minerals.find(m => m.id === id);
    if (mineral) {
      mineral.collecting = true;
    }
  }

  gridToPixel(gx: number, gy: number): Coordinate {
    const cellWidth = this.config.width / this.config.gridSize;
    const cellHeight = this.config.height / this.config.gridSize;
    return {
      x: gx * cellWidth + cellWidth / 2,
      y: gy * cellHeight + cellHeight / 2
    };
  }

  pixelToGrid(x: number, y: number): { gridX: number; gridY: number } {
    const cellWidth = this.config.width / this.config.gridSize;
    const cellHeight = this.config.height / this.config.gridSize;
    return {
      gridX: Math.floor(x / cellWidth),
      gridY: Math.floor(y / cellHeight)
    };
  }

  setMinerals(minerals: Mineral[]): void {
    this.minerals = minerals;
    const { gridSize } = this.config;
    this.gridCells = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
      this.gridCells.push([]);
    }
    for (const m of minerals) {
      const cellIndex = m.gridY * gridSize + m.gridX;
      if (cellIndex >= 0 && cellIndex < this.gridCells.length && m.opacity > 0) {
        this.gridCells[cellIndex].push(m);
      }
    }
  }
}
