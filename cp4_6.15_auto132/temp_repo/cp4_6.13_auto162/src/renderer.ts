import { Ecosystem } from './ecosystem.js';
import { Plant, Herbivore, Carnivore, TrailPoint } from './entities.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLANT_SIZE,
  HERBIVORE_SIZE,
  CARNIVORE_SIZE,
  PLANT_COLOR,
  HERBIVORE_COLOR,
  CARNIVORE_COLOR,
  GRID_SPACING,
  GRID_ALPHA,
  GRID_COLOR,
  TRAIL_ALPHA,
  TRAIL_DURATION,
  FADE_DURATION,
} from './config.js';

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  chartCanvas: HTMLCanvasElement;
  chartCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, chartCanvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.chartCanvas = chartCanvas;
    this.chartCtx = chartCanvas.getContext('2d')!;
  }

  render(ecosystem: Ecosystem): void {
    this.clear();
    this.drawBackground();
    this.drawGrid();

    const currentTime = ecosystem.simulationTime;

    this.drawTrails(ecosystem.herbivores, HERBIVORE_COLOR, currentTime);
    this.drawTrails(ecosystem.carnivores, CARNIVORE_COLOR, currentTime);

    this.drawPlants(ecosystem.plants, currentTime);
    this.drawHerbivores(ecosystem.herbivores, currentTime);
    this.drawCarnivores(ecosystem.carnivores, currentTime);

    this.drawChart(ecosystem);
  }

  clear(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f0c29');
    gradient.addColorStop(0.5, '#302b63');
    gradient.addColorStop(1, '#24243e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  drawGrid(): void {
    this.ctx.strokeStyle = GRID_COLOR;
    this.ctx.globalAlpha = GRID_ALPHA;
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SPACING) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, CANVAS_HEIGHT);
      this.ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SPACING) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CANVAS_WIDTH, y);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  private getFadeAlpha(entity: { isDying: boolean; deathStartTime: number }, currentTime: number): number {
    if (!entity.isDying) return 1;
    const elapsed = currentTime - entity.deathStartTime;
    return Math.max(0, 1 - elapsed / FADE_DURATION);
  }

  drawTrails(entities: Array<{ trail: TrailPoint[]; isDying: boolean; deathStartTime: number }>, color: string, currentTime: number): void {
    for (const entity of entities) {
      const entityAlpha = this.getFadeAlpha(entity, currentTime);
      if (entityAlpha <= 0) continue;

      for (const point of entity.trail) {
        const age = currentTime - point.timestamp;
        if (age > TRAIL_DURATION) continue;
        const alpha = (1 - age / TRAIL_DURATION) * TRAIL_ALPHA * entityAlpha;
        const size = 3 + (1 - age / TRAIL_DURATION) * 3;

        this.ctx.beginPath();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = color;
        this.ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.ctx.globalAlpha = 1;
  }

  drawPlants(plants: Plant[], currentTime: number): void {
    for (const plant of plants) {
      const alpha = this.getFadeAlpha(plant, currentTime);
      if (alpha <= 0) continue;

      const sway = plant.getSway(currentTime);
      const x = plant.x + sway;
      const y = plant.y;

      this.ctx.beginPath();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = PLANT_COLOR;
      this.ctx.arc(x, y, PLANT_SIZE / 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.globalAlpha = alpha * 0.5;
      this.ctx.fillStyle = PLANT_COLOR;
      this.ctx.arc(x, y, PLANT_SIZE / 2 + 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  drawHerbivores(herbivores: Herbivore[], currentTime: number): void {
    for (const h of herbivores) {
      const alpha = this.getFadeAlpha(h, currentTime);
      if (alpha <= 0) continue;

      const size = HERBIVORE_SIZE;
      const angle = Math.atan2(h.vy, h.vx) || 0;

      this.ctx.save();
      this.ctx.translate(h.x, h.y);
      this.ctx.rotate(angle);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = HERBIVORE_COLOR;

      this.ctx.beginPath();
      this.ctx.moveTo(size * 0.7, 0);
      this.ctx.lineTo(-size * 0.5, -size * 0.5);
      this.ctx.lineTo(-size * 0.5, size * 0.5);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.globalAlpha = alpha * 0.6;
      this.ctx.stroke();

      this.ctx.restore();
    }
    this.ctx.globalAlpha = 1;
  }

  drawCarnivores(carnivores: Carnivore[], currentTime: number): void {
    for (const c of carnivores) {
      const alpha = this.getFadeAlpha(c, currentTime);
      if (alpha <= 0) continue;

      const size = CARNIVORE_SIZE;
      const angle = Math.atan2(c.vy, c.vx) || 0;

      this.ctx.save();
      this.ctx.translate(c.x, c.y);
      this.ctx.rotate(angle);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = CARNIVORE_COLOR;

      this.ctx.beginPath();
      this.ctx.moveTo(size * 0.7, 0);
      this.ctx.lineTo(0, -size * 0.5);
      this.ctx.lineTo(-size * 0.7, 0);
      this.ctx.lineTo(0, size * 0.5);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.globalAlpha = alpha * 0.6;
      this.ctx.stroke();

      this.ctx.restore();
    }
    this.ctx.globalAlpha = 1;
  }

  drawChart(ecosystem: Ecosystem): void {
    const ctx = this.chartCtx;
    const w = this.chartCanvas.width;
    const h = this.chartCanvas.height;
    const pad = 5;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad + (i * (h - pad * 2)) / 4;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const x = pad + (i * (w - pad * 2)) / 6;
      ctx.beginPath();
      ctx.moveTo(x, pad);
      ctx.lineTo(x, h - pad);
      ctx.stroke();
    }

    const history = ecosystem.statsHistory;
    const allCounts = [
      ...history.plants,
      ...history.herbivores,
      ...history.carnivores,
      15,
    ];
    const maxCount = Math.max(...allCounts, 1);

    this.drawChartLine(ctx, history.plants, PLANT_COLOR, w, h, pad, maxCount);
    this.drawChartLine(ctx, history.herbivores, HERBIVORE_COLOR, w, h, pad, maxCount);
    this.drawChartLine(ctx, history.carnivores, CARNIVORE_COLOR, w, h, pad, maxCount);
  }

  private drawChartLine(
    ctx: CanvasRenderingContext2D,
    data: number[],
    color: string,
    w: number,
    h: number,
    pad: number,
    maxCount: number,
  ): void {
    if (data.length < 2) return;

    const plotW = w - pad * 2;
    const plotH = h - pad * 2;
    const stepX = plotW / Math.max(data.length - 1, 1);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const x = pad + i * stepX;
      const normalized = Math.min(data[i] / maxCount, 1);
      const y = pad + plotH - normalized * plotH;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    ctx.fillStyle = color;
    for (let i = 0; i < data.length; i++) {
      const x = pad + i * stepX;
      const normalized = Math.min(data[i] / maxCount, 1);
      const y = pad + plotH - normalized * plotH;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
