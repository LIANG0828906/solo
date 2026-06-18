import { BuildingAttributes, GridData } from '../types';
import { v4 as uuidv4 } from 'uuid';

const GRID_ROWS = 10;
const GRID_COLS = 10;
const CELL_SIZE = 20;
const HALF_GRID = (GRID_COLS * CELL_SIZE) / 2;
const BUILDING_HALF = 8;

export class CityBuilder {
  private gridData: GridData;

  constructor() {
    this.gridData = {
      rows: GRID_ROWS,
      cols: GRID_COLS,
      cellSize: CELL_SIZE,
      buildings: [],
    };
    this.generateInitialBuildings();
  }

  private generateInitialBuildings(): void {
    const positions: [number, number][] = [
      [1, 1], [1, 3], [1, 5], [1, 7],
      [3, 1], [3, 3], [3, 5], [3, 7],
      [5, 1], [5, 3], [5, 5], [5, 7],
      [7, 1], [7, 3], [7, 5], [7, 7],
      [2, 2], [2, 6], [4, 4], [6, 2], [6, 6],
    ];

    for (const [row, col] of positions) {
      this.gridData.buildings.push({
        id: uuidv4(),
        gridX: col,
        gridZ: row,
        worldX: this.gridToWorldX(col),
        worldZ: this.gridToWorldZ(row),
        height: 5,
        type: 'gray',
      });
    }
  }

  gridToWorldX(col: number): number {
    return -HALF_GRID + col * CELL_SIZE + CELL_SIZE / 2;
  }

  gridToWorldZ(row: number): number {
    return -HALF_GRID + row * CELL_SIZE + CELL_SIZE / 2;
  }

  worldToGrid(worldX: number, worldZ: number): { col: number; row: number } | null {
    const col = Math.floor((worldX + HALF_GRID) / CELL_SIZE);
    const row = Math.floor((worldZ + HALF_GRID) / CELL_SIZE);
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;
    return { col, row };
  }

  getBuildings(): BuildingAttributes[] {
    return this.gridData.buildings;
  }

  placeGreenBuilding(col: number, row: number): BuildingAttributes | null {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;

    const existing = this.gridData.buildings.find(
      (b) => b.gridX === col && b.gridZ === row
    );
    if (existing) return null;

    const height = 8 + Math.random() * 12;
    const building: BuildingAttributes = {
      id: uuidv4(),
      gridX: col,
      gridZ: row,
      worldX: this.gridToWorldX(col),
      worldZ: this.gridToWorldZ(row),
      height,
      type: 'green',
    };

    this.gridData.buildings.push(building);
    return building;
  }

  removeBuilding(id: string): BuildingAttributes | null {
    const index = this.gridData.buildings.findIndex((b) => b.id === id);
    if (index === -1) return null;

    const building = this.gridData.buildings[index];
    this.gridData.buildings.splice(index, 1);
    return building;
  }

  getGridData(): GridData {
    return this.gridData;
  }

  getGridLines(): { start: [number, number, number]; end: [number, number, number] }[] {
    const lines: { start: [number, number, number]; end: [number, number, number] }[] = [];

    for (let i = 0; i <= GRID_ROWS; i++) {
      const z = -HALF_GRID + i * CELL_SIZE;
      lines.push({
        start: [-HALF_GRID, 0.01, z],
        end: [HALF_GRID, 0.01, z],
      });
    }

    for (let j = 0; j <= GRID_COLS; j++) {
      const x = -HALF_GRID + j * CELL_SIZE;
      lines.push({
        start: [x, 0.01, -HALF_GRID],
        end: [x, 0.01, HALF_GRID],
      });
    }

    return lines;
  }

  getBuildingHalfSize(): number {
    return BUILDING_HALF;
  }

  getHalfGrid(): number {
    return HALF_GRID;
  }

  getGridSize(): number {
    return GRID_ROWS;
  }

  getCellSize(): number {
    return CELL_SIZE;
  }
}

export const cityBuilder = new CityBuilder();
