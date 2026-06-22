import type {
  Point2D,
  HeatmapPoint,
  VisitorPath,
  HallConfig,
} from '../types';

export class HeatmapRenderer {
  private hall: HallConfig;
  private offscreenCanvas: HTMLCanvasElement | null = null;

  constructor(hall: HallConfig) {
    this.hall = hall;
  }

  generateHeatmapData(paths: VisitorPath[]): HeatmapPoint[] {
    const data: HeatmapPoint[] = [];
    const gridSize = this.hall.gridSize;
    const cols = Math.ceil(this.hall.width / gridSize);
    const rows = Math.ceil(this.hall.height / gridSize);

    const intensityGrid: number[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(0));
    const dwellTimeGrid: number[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(0));

    for (const path of paths) {
      for (const point of path.points) {
        const gridX = Math.floor(point.position.x / gridSize);
        const gridY = Math.floor(point.position.y / gridSize);

        if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
          const intensity = point.dwellTime > 0 ? 1 : 0.3;
          intensityGrid[gridY][gridX] += intensity;
          dwellTimeGrid[gridY][gridX] += point.dwellTime;
        }
      }
    }

    let maxIntensity = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        maxIntensity = Math.max(maxIntensity, intensityGrid[y][x]);
      }
    }

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (intensityGrid[y][x] > 0) {
          data.push({
            position: {
              x: (x + 0.5) * gridSize,
              y: (y + 0.5) * gridSize,
            },
            intensity: maxIntensity > 0 ? intensityGrid[y][x] / maxIntensity : 0,
            dwellTime: dwellTimeGrid[y][x],
          });
        }
      }
    }

    return data;
  }

  renderHeatmap(
    data: HeatmapPoint[],
    width: number,
    height: number,
    scale: number,
    offset: Point2D
  ): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;

    if (!this.offscreenCanvas) {
      this.offscreenCanvas = document.createElement('canvas');
    }

    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;

    const ctx = this.offscreenCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, width, height);

    for (const point of data) {
      const screenX = point.position.x * scale + offset.x;
      const screenY = point.position.y * scale + offset.y;
      const radius = (this.hall.gridSize * scale) / 2;

      const gradient = ctx.createRadialGradient(
        screenX,
        screenY,
        0,
        screenX,
        screenY,
        radius * 2
      );

      const color = this.getIntensityColor(point.intensity);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    return this.offscreenCanvas;
  }

  private getIntensityColor(intensity: number): string {
    const clamped = Math.max(0, Math.min(1, intensity));

    const r = Math.floor(255 * clamped);
    const g = Math.floor(255 * (1 - Math.abs(clamped - 0.5) * 2));
    const b = Math.floor(255 * (1 - clamped));

    return `rgba(${r}, ${g}, ${b}, 0.8)`;
  }

  updateHallConfig(hall: HallConfig): void {
    this.hall = hall;
  }
}
