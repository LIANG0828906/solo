import { Unit, MapData, FogState, Position } from '../types';
import { worldToGrid, CELL_SIZE } from './terrainGenerator';

interface FogCell {
  alpha: number;
  targetAlpha: number;
}

export class FogEngine {
  private fogGrid: FogCell[][] = [];
  private visibleCells: Set<string> = new Set();
  private textureCanvas: HTMLCanvasElement;
  private textureCtx: CanvasRenderingContext2D;
  private lastUpdateTime: number = 0;
  private readonly updateInterval: number = 100;
  private resolutionScale: number = 1;

  constructor(mapWidth: number, mapHeight: number) {
    this.textureCanvas = document.createElement('canvas');
    this.textureCanvas.width = mapWidth * CELL_SIZE;
    this.textureCanvas.height = mapHeight * CELL_SIZE;
    const ctx = this.textureCanvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.textureCtx = ctx;

    for (let y = 0; y < mapHeight; y++) {
      this.fogGrid[y] = [];
      for (let x = 0; x < mapWidth; x++) {
        this.fogGrid[y][x] = { alpha: 1, targetAlpha: 1 };
      }
    }
  }

  setResolutionScale(scale: number) {
    this.resolutionScale = Math.max(0.5, Math.min(1, scale));
  }

  private castRay(
    unit: Unit,
    targetX: number,
    targetY: number,
    mapData: MapData
  ): number {
    const dx = targetX - unit.position.x;
    const dy = targetY - unit.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > unit.visionRadius) return 0;

    if (unit.visionAngle > 0) {
      const angleToTarget = Math.atan2(dy, dx);
      let angleDiff = angleToTarget - unit.facing;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      if (Math.abs(angleDiff) > unit.visionAngle / 2) return 0;
    }

    let visibility = 1;
    const steps = Math.max(1, Math.floor(distance / 8));

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = unit.position.x + dx * t;
      const py = unit.position.y + dy * t;
      const gridPos = worldToGrid(px, py);

      if (
        gridPos.x >= 0 &&
        gridPos.x < mapData.width &&
        gridPos.y >= 0 &&
        gridPos.y < mapData.height
      ) {
        const cell = mapData.grid[gridPos.y][gridPos.x];
        visibility -= cell.blockRate * t;
      }
    }

    const distanceFactor = 1 - (distance / unit.visionRadius) * 0.5;
    return Math.max(0, visibility * distanceFactor);
  }

  calculateVisibility(
    units: Unit[],
    mapData: MapData,
    currentTime: number
  ): FogState {
    if (currentTime - this.lastUpdateTime < this.updateInterval) {
      return {
        visibleCells: this.visibleCells,
        texture: this.textureCanvas,
        coverage: this.calculateCoverage(),
      };
    }
    this.lastUpdateTime = currentTime;

    this.visibleCells.clear();

    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        let maxVisibility = 0;
        const cellWorldX = x * CELL_SIZE + CELL_SIZE / 2;
        const cellWorldY = y * CELL_SIZE + CELL_SIZE / 2;

        for (const unit of units) {
          const visibility = this.castRay(unit, cellWorldX, cellWorldY, mapData);
          if (visibility > maxVisibility) {
            maxVisibility = visibility;
          }
        }

        this.fogGrid[y][x].targetAlpha = 1 - maxVisibility;
        if (maxVisibility > 0.05) {
          this.visibleCells.add(`${x},${y}`);
        }
      }
    }

    this.updateFogAlpha();
    this.renderFogTexture(mapData);

    return {
      visibleCells: this.visibleCells,
      texture: this.textureCanvas,
      coverage: this.calculateCoverage(),
    };
  }

  private updateFogAlpha() {
    const transitionSpeed = 0.08;
    for (const row of this.fogGrid) {
      for (const cell of row) {
        const diff = cell.targetAlpha - cell.alpha;
        cell.alpha += diff * transitionSpeed;
      }
    }
  }

  private calculateCoverage(): number {
    let visible = 0;
    let total = 0;
    for (const row of this.fogGrid) {
      for (const cell of row) {
        total++;
        if (cell.alpha < 0.8) visible++;
      }
    }
    return Math.round((visible / total) * 100);
  }

  private renderFogTexture(mapData: MapData) {
    const { width, height } = this.textureCanvas;
    const scale = this.resolutionScale;
    const cellSize = CELL_SIZE;

    this.textureCtx.clearRect(0, 0, width, height);

    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const cell = this.fogGrid[y]?.[x];
        if (!cell) continue;

        const alpha = cell.alpha;
        if (alpha < 0.02) continue;

        const px = x * cellSize;
        const py = y * cellSize;
        const gradient = this.textureCtx.createRadialGradient(
          px + cellSize / 2,
          py + cellSize / 2,
          0,
          px + cellSize / 2,
          py + cellSize / 2,
          cellSize
        );

        const centerAlpha = Math.max(0, alpha - 0.1);
        const edgeAlpha = Math.min(1, alpha + 0.1);

        gradient.addColorStop(0, `rgba(0, 0, 0, ${centerAlpha})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${edgeAlpha})`);

        this.textureCtx.fillStyle = gradient;
        this.textureCtx.fillRect(px, py, cellSize + 1, cellSize + 1);
      }
    }
  }

  getCellFogAlpha(gridX: number, gridY: number): number {
    return this.fogGrid[gridY]?.[gridX]?.alpha ?? 1;
  }
}
