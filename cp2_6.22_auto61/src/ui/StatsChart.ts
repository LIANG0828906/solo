export class StatsChart {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public width: number;
  public height: number;
  public maxDataPoints: number = 100;
  public populationData: number[];
  public energyData: number[];

  constructor(canvasOrWidth: HTMLCanvasElement | number, height?: number) {
    if (typeof canvasOrWidth === 'number') {
      this.width = canvasOrWidth;
      this.height = height ?? 100;
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    } else {
      this.canvas = canvasOrWidth;
      this.width = canvasOrWidth.width;
      this.height = canvasOrWidth.height;
    }
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
    this.populationData = [];
    this.energyData = [];
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.draw();
  }

  addDataPoint(population: number, avgEnergy: number): void {
    this.populationData.push(population);
    this.energyData.push(avgEnergy);

    if (this.populationData.length > this.maxDataPoints) {
      this.populationData.shift();
    }
    if (this.energyData.length > this.maxDataPoints) {
      this.energyData.shift();
    }
  }

  draw(): void {
    const { ctx, width, height } = this;
    const padding = { top: 10, right: 10, bottom: 10, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const totalPop = this.populationData.reduce((a, b) => a + (isFinite(b) ? b : 0), 0);
    const totalEnergy = this.energyData.reduce((a, b) => a + (isFinite(b) ? b : 0), 0);

    if (this.populationData.length < 2 || this.energyData.length < 2 ||
        totalPop <= 0 && totalEnergy <= 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('等待数据...', width / 2, height / 2);
      return;
    }

    const maxPopulation = Math.max(...this.populationData.filter(v => isFinite(v) && v > 0), 1);
    const maxEnergy = Math.max(...this.energyData.filter(v => isFinite(v) && v > 0), 1);
    const yMax = Math.max(maxPopulation, maxEnergy) * 1.1;
    const yMin = 0;

    if (!isFinite(yMax) || yMax <= 0) {
      return;
    }

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    for (let i = 0; i <= 5; i++) {
      const x = padding.left + (chartWidth / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }

    const dataLength = Math.min(this.populationData.length, this.energyData.length);
    if (dataLength < 2) {
      return;
    }

    const xStep = chartWidth / (this.maxDataPoints - 1);

    this.drawSmoothLine(
      this.populationData,
      padding.left,
      padding.top,
      xStep,
      chartHeight,
      yMin,
      yMax,
      '#4ade80',
      true
    );

    this.drawSmoothLine(
      this.energyData,
      padding.left,
      padding.top,
      xStep,
      chartHeight,
      yMin,
      yMax,
      '#38bdf8',
      false
    );
  }

  private drawSmoothLine(
    data: number[],
    offsetX: number,
    offsetY: number,
    xStep: number,
    chartHeight: number,
    yMin: number,
    yMax: number,
    color: string,
    fillGradient: boolean
  ): void {
    const { ctx } = this;

    if (!data || data.length < 2) {
      return;
    }

    const yRange = yMax - yMin;
    if (yRange <= 0 || !isFinite(yRange)) {
      return;
    }

    const safeYMin = Math.max(0, yMin);
    const safeYMax = Math.max(safeYMin + 1, yMax);
    const safeYRange = safeYMax - safeYMin;

    const points: { x: number; y: number }[] = [];
    const startIndex = this.maxDataPoints > data.length ? this.maxDataPoints - data.length : 0;

    for (let i = 0; i < data.length; i++) {
      const x = offsetX + (startIndex + i) * xStep;
      const value = data[i];
      const safeValue = isFinite(value) ? Math.max(0, value) : 0;
      const normalizedY = safeYRange > 0 ? (safeValue - safeYMin) / safeYRange : 0;
      const y = offsetY + chartHeight - Math.max(0, Math.min(1, normalizedY)) * chartHeight;

      if (isFinite(x) && isFinite(y) && x >= 0 && y >= 0) {
        points.push({ x, y });
      }
    }

    if (!points || points.length < 2) {
      return;
    }

    for (const p of points) {
      if (!isFinite(p.x) || !isFinite(p.y) || p.x < 0 || p.y < 0) {
        return;
      }
    }

    if (fillGradient) {
      const gradient = ctx.createLinearGradient(0, offsetY, 0, offsetY + chartHeight);
      gradient.addColorStop(0, color + '99');
      gradient.addColorStop(1, color + '00');

      ctx.beginPath();
      ctx.moveTo(points[0].x, offsetY + chartHeight);

      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      const lastPoint = points[points.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(lastPoint.x, offsetY + chartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    const lastPoint = points[points.length - 1];
    ctx.lineTo(lastPoint.x, lastPoint.y);
    ctx.stroke();
  }

  clear(): void {
    this.populationData = [];
    this.energyData = [];
    this.draw();
  }

  getElement(): HTMLCanvasElement {
    return this.canvas;
  }
}
