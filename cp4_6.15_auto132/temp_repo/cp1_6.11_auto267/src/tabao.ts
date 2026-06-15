export interface RubbingPoint {
  x: number;
  y: number;
  force: number;
  inkAmount: number;
  radius: number;
  timestamp: number;
}

export interface RubbingMetrics {
  coverage: number;
  totalInk: number;
  uniformity: number;
  clarity: number;
}

export interface TabaoConfig {
  minRadius: number;
  maxRadius: number;
  minInkOpacity: number;
  maxInkOpacity: number;
  minPressTime: number;
  maxPressTime: number;
  featherAmount: number;
}

const DEFAULT_CONFIG: TabaoConfig = {
  minRadius: 5,
  maxRadius: 20,
  minInkOpacity: 0.25,
  maxInkOpacity: 0.8,
  minPressTime: 500,
  maxPressTime: 3000,
  featherAmount: 0.4
};

export class TabaoSimulator {
  private config: TabaoConfig;
  private rubbingPoints: RubbingPoint[] = [];
  private startTime: number = 0;
  private lastPosition: { x: number; y: number } | null = null;
  private coverageMap: Uint8Array | null = null;
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;

  constructor(config?: Partial<TabaoConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  startPress(x: number, y: number): void {
    this.startTime = performance.now();
    this.lastPosition = { x, y };
  }

  addPoint(x: number, y: number, currentTime: number): RubbingPoint {
    const pressDuration = currentTime - this.startTime;
    const timeRatio = Math.min(pressDuration / this.config.maxPressTime, 1);
    
    let force = 1;
    if (this.lastPosition) {
      const dx = x - this.lastPosition.x;
      const dy = y - this.lastPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const dt = currentTime - (this.rubbingPoints.length > 0 
        ? this.rubbingPoints[this.rubbingPoints.length - 1].timestamp 
        : this.startTime);
      
      if (dt > 0) {
        const speed = distance / dt;
        force = Math.max(0.1, 1 - speed * 0.02);
      }
    }

    const inkAmount = this.config.minInkOpacity + 
      (this.config.maxInkOpacity - this.config.minInkOpacity) * timeRatio;
    
    const radius = this.config.minRadius + 
      (this.config.maxRadius - this.config.minRadius) * force;

    const point: RubbingPoint = {
      x,
      y,
      force,
      inkAmount,
      radius,
      timestamp: currentTime
    };

    this.rubbingPoints.push(point);
    this.lastPosition = { x, y };

    return point;
  }

  endPress(): RubbingPoint[] {
    const points = [...this.rubbingPoints];
    return points;
  }

  clear(): void {
    this.rubbingPoints = [];
    this.coverageMap = null;
  }

  renderInk(
    ctx: CanvasRenderingContext2D,
    point: RubbingPoint,
    width: number,
    height: number
  ): void {
    this.canvasWidth = width;
    this.canvasHeight = height;

    const gradient = ctx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, point.radius
    );

    const featherRadius = point.radius * (1 - this.config.featherAmount);
    
    gradient.addColorStop(0, `rgba(26, 26, 26, ${point.inkAmount})`);
    gradient.addColorStop(0.6, `rgba(26, 26, 26, ${point.inkAmount * 0.8})`);
    gradient.addColorStop(0.85, `rgba(26, 26, 26, ${point.inkAmount * 0.3})`);
    gradient.addColorStop(1, 'rgba(26, 26, 26, 0)');

    ctx.beginPath();
    ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    this.updateCoverage(point);
  }

  private updateCoverage(point: RubbingPoint): void {
    if (!this.coverageMap) {
      this.coverageMap = new Uint8Array(this.canvasWidth * this.canvasHeight);
    }

    const minX = Math.max(0, Math.floor(point.x - point.radius));
    const maxX = Math.min(this.canvasWidth - 1, Math.ceil(point.x + point.radius));
    const minY = Math.max(0, Math.floor(point.y - point.radius));
    const maxY = Math.min(this.canvasHeight - 1, Math.ceil(point.y + point.radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - point.x;
        const dy = y - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= point.radius) {
          const idx = y * this.canvasWidth + x;
          const coverage = 1 - (dist / point.radius) * 0.5;
          this.coverageMap[idx] = Math.min(255, this.coverageMap[idx] + coverage * 255);
        }
      }
    }
  }

  calculateMetrics(): RubbingMetrics {
    const startTime = performance.now();
    
    if (!this.coverageMap || this.coverageMap.length === 0) {
      return { coverage: 0, totalInk: 0, uniformity: 0, clarity: 0 };
    }

    let coveredPixels = 0;
    let totalInkValue = 0;
    const values: number[] = [];
    const step = 4;

    for (let i = 0; i < this.coverageMap.length; i += step) {
      const value = this.coverageMap[i];
      totalInkValue += value;
      if (value > 20) {
        coveredPixels++;
      }
      if (value > 0) {
        values.push(value);
      }
    }

    const totalPixels = this.coverageMap.length / step;
    const coverage = (coveredPixels / totalPixels) * 100;
    const totalInk = (totalInkValue / (totalPixels * 255)) * 100;

    let uniformity = 0;
    if (values.length > 0) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      uniformity = Math.max(0, 100 - (stdDev / mean) * 50);
    }

    const clarity = coverage >= 60 
      ? Math.min(100, (coverage * 0.5 + uniformity * 0.5))
      : Math.min(100, coverage * 0.6);

    const calcTime = performance.now() - startTime;
    if (calcTime > 200) {
      console.warn(`Coverage calculation took ${calcTime}ms, exceeding 200ms limit`);
    }

    return { coverage, totalInk, uniformity, clarity };
  }

  getRubbingPoints(): RubbingPoint[] {
    return [...this.rubbingPoints];
  }

  getForcePercentage(): number {
    if (this.rubbingPoints.length === 0) return 50;
    const recentPoints = this.rubbingPoints.slice(-10);
    const avgForce = recentPoints.reduce((sum, p) => sum + p.force, 0) / recentPoints.length;
    return Math.round(avgForce * 100);
  }

  createIntensityMap(
    width: number,
    height: number,
    clarity: number
  ): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#F5E6C8';
    ctx.fillRect(0, 0, width, height);

    for (const point of this.rubbingPoints) {
      const gradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, point.radius
      );

      const alpha = point.inkAmount * (clarity >= 60 ? 1 : 0.6);
      
      gradient.addColorStop(0, `rgba(26, 26, 26, ${alpha})`);
      gradient.addColorStop(0.6, `rgba(26, 26, 26, ${alpha * 0.8})`);
      gradient.addColorStop(0.85, `rgba(26, 26, 26, ${alpha * 0.3})`);
      gradient.addColorStop(1, 'rgba(26, 26, 26, 0)');

      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    if (clarity < 60) {
      this.addNoise(ctx, width, height, 0.6);
    }

    return ctx.getImageData(0, 0, width, height);
  }

  private addNoise(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    opacity: number
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 100 * opacity;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }

    ctx.putImageData(imageData, 0, 0);
  }
}
