import { Plant, ResourcePoint } from './engine';

const CANVAS_W = 800;
const CANVAS_H = 600;
const CHART_H = 130;

interface ChartData {
  plantCount: number[];
  avgGrowth: number[];
  avgRadius: number[];
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private chartCtx: CanvasRenderingContext2D;
  private chartData: ChartData = {
    plantCount: [],
    avgGrowth: [],
    avgRadius: [],
  };
  private maxChartPoints = 1000;

  constructor(
    private canvas: HTMLCanvasElement,
    private chartCanvas: HTMLCanvasElement
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.chartCtx = chartCanvas.getContext('2d')!;
  }

  pushChartData(plantCount: number, avgGrowth: number, avgRadius: number): void {
    this.chartData.plantCount.push(plantCount);
    this.chartData.avgGrowth.push(avgGrowth);
    this.chartData.avgRadius.push(avgRadius);
    if (this.chartData.plantCount.length > this.maxChartPoints) {
      this.chartData.plantCount.shift();
      this.chartData.avgGrowth.shift();
      this.chartData.avgRadius.shift();
    }
  }

  clearChart(): void {
    this.chartData = { plantCount: [], avgGrowth: [], avgRadius: [] };
  }

  render(
    plants: Plant[],
    lightPoints: ResourcePoint[],
    waterPoints: ResourcePoint[]
  ): void {
    this.drawSimulation(plants, lightPoints, waterPoints);
    this.drawChart();
  }

  private drawSimulation(
    plants: Plant[],
    lightPoints: ResourcePoint[],
    waterPoints: ResourcePoint[]
  ): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (const rp of lightPoints) {
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(52, 152, 219, ${0.3 * rp.amount})`;
      ctx.fill();
    }

    for (const rp of waterPoints) {
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(236, 240, 241, ${0.3 * rp.amount})`;
      ctx.fill();
    }

    for (const plant of plants) {
      if (!plant.alive) continue;

      const alpha = Math.min(1, plant.resources / 50);
      const h = plant.hue;
      const s = 65 + (1 - alpha) * 20;
      const l = 30 + alpha * 25;

      ctx.beginPath();
      ctx.arc(plant.x, plant.y, plant.collectionRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${h}, ${s}%, ${l}%, 0.12)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(plant.x, plant.y, plant.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${0.5 + alpha * 0.4})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(plant.x, plant.y, plant.radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${h}, ${s - 10}%, ${l + 15}%, ${0.3 + alpha * 0.3})`;
      ctx.fill();
    }
  }

  private drawChart(): void {
    const ctx = this.chartCtx;
    const w = this.chartCanvas.width;
    const h = CHART_H;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, w, h);

    const padding = { top: 20, right: 130, bottom: 25, left: 45 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();
    }

    const countData = this.chartData.plantCount;
    const growthData = this.chartData.avgGrowth;
    const radiusData = this.chartData.avgRadius;

    if (countData.length < 2) return;

    const maxCount = Math.max(10, ...countData);
    const maxGrowth = Math.max(1, ...growthData);
    const maxRadius = Math.max(30, ...radiusData);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'right';
    ctx.fillText(String(Math.round(maxCount)), padding.left - 5, padding.top + 4);
    ctx.fillText('0', padding.left - 5, padding.top + chartH + 4);

    this.drawLine(countData, maxCount, '#e74c3c', padding, chartW, chartH);
    this.drawLine(growthData, maxGrowth, '#f1c40f', padding, chartW, chartH);
    this.drawLine(radiusData, maxRadius, '#9b59b6', padding, chartW, chartH);

    this.drawLegend(ctx, w, padding);
  }

  private drawLine(
    data: number[],
    maxVal: number,
    color: string,
    padding: { top: number; right: number; bottom: number; left: number },
    chartW: number,
    chartH: number
  ): void {
    const ctx = this.chartCtx;
    const len = data.length;
    const step = chartW / Math.max(1, len - 1);

    ctx.beginPath();
    for (let i = 0; i < len; i++) {
      const x = padding.left + i * step;
      const y = padding.top + chartH - (data[i] / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  private drawLegend(
    ctx: CanvasRenderingContext2D,
    w: number,
    padding: { top: number; right: number; bottom: number; left: number }
  ): void {
    const legendX = w - padding.right + 10;
    let legendY = padding.top + 5;
    const items = [
      { label: '植物总数', color: '#e74c3c' },
      { label: '平均速度', color: '#f1c40f' },
      { label: '平均半径', color: '#9b59b6' },
    ];
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    for (const item of items) {
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, legendY - 4, 12, 3);
      ctx.fillText(item.label, legendX + 16, legendY);
      legendY += 18;
    }
  }
}
