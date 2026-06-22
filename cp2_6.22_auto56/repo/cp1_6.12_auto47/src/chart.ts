import type { StationData } from './dataSimulator';

interface HistoryPoint {
  timestamp: number;
  value: number;
}

export interface ChartCallbacks {
  onModeChange?: (stationId: string | null) => void;
}

const AQI_COLOR_MAP: Array<{ threshold: number; color: string }> = [
  { threshold: 50, color: '#00e400' },
  { threshold: 100, color: '#ffff00' },
  { threshold: 150, color: '#ff7e00' },
  { threshold: 200, color: '#ff0000' },
  { threshold: 300, color: '#8f3f97' },
];

function getAqiColorHex(aqi: number): string {
  for (const item of AQI_COLOR_MAP) {
    if (aqi <= item.threshold) return item.color;
  }
  return AQI_COLOR_MAP[AQI_COLOR_MAP.length - 1].color;
}

const MAX_HISTORY_POINTS = 720;

export class AqiChart {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private globalHistory: HistoryPoint[] = [];
  private stationHistories: Map<string, HistoryPoint[]> = new Map();
  private stationNames: Map<string, string> = new Map();
  private selectedStationId: string | null = null;
  private dpr: number;
  private callbacks: ChartCallbacks;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: ChartCallbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
    this.setupCanvas();
    window.addEventListener('resize', this.onResize.bind(this));
    this.startRenderLoop();
  }

  private setupCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  private onResize(): void {
    this.setupCanvas();
  }

  public updateData(stations: StationData[]): void {
    const avgAqi = stations.reduce((sum, s) => sum + s.aqi, 0) / stations.length;
    const now = Date.now();

    this.globalHistory.push({ timestamp: now, value: avgAqi });
    if (this.globalHistory.length > MAX_HISTORY_POINTS) {
      this.globalHistory.shift();
    }

    stations.forEach((station) => {
      this.stationNames.set(station.id, station.name);
      if (!this.stationHistories.has(station.id)) {
        this.stationHistories.set(station.id, []);
      }
      const history = this.stationHistories.get(station.id)!;
      history.push({ timestamp: now, value: station.aqi });
      if (history.length > MAX_HISTORY_POINTS) {
        history.shift();
      }
    });
  }

  public setSelectedStation(stationId: string | null): void {
    this.selectedStationId = stationId;
    if (this.callbacks.onModeChange) {
      this.callbacks.onModeChange(stationId);
    }
  }

  private getCurrentHistory(): HistoryPoint[] {
    if (this.selectedStationId) {
      return this.stationHistories.get(this.selectedStationId) || [];
    }
    return this.globalHistory;
  }

  private getTitle(): string {
    if (this.selectedStationId) {
      return this.stationNames.get(this.selectedStationId) || '单站点视图';
    }
    return '全局视图';
  }

  private roundToNearest(n: number, step: number): number {
    return Math.ceil(n / step) * step;
  }

  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  private drawGrid(w: number, h: number, yMin: number, yMax: number): void {
    const ctx = this.ctx;
    const padding = { top: 20, right: 20, bottom: 30, left: 45 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    const yStep = yMax <= 100 ? 25 : yMax <= 200 ? 50 : 100;
    const yTicks: number[] = [];
    for (let y = this.roundToNearest(yMin, yStep); y <= yMax; y += yStep) {
      yTicks.push(y);
    }

    ctx.font = '10px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    yTicks.forEach((tick) => {
      const y = padding.top + chartH - ((tick - yMin) / (yMax - yMin)) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      ctx.fillText(tick.toString(), padding.left - 6, y);
    });

    const history = this.getCurrentHistory();
    if (history.length > 0) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const xTickCount = 5;
      for (let i = 0; i <= xTickCount; i++) {
        const idx = Math.floor((i / xTickCount) * (history.length - 1));
        const point = history[idx];
        if (point) {
          const x = padding.left + (i / xTickCount) * chartW;
          ctx.fillText(this.formatTime(point.timestamp), x, h - padding.bottom + 8);
        }
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, h - padding.bottom);
    ctx.lineTo(w - padding.right, h - padding.bottom);
    ctx.stroke();
  }

  private drawLine(w: number, h: number, yMin: number, yMax: number): void {
    const ctx = this.ctx;
    const history = this.getCurrentHistory();
    if (history.length < 2) return;

    const padding = { top: 20, right: 20, bottom: 30, left: 45 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    const lastValue = history[history.length - 1].value;
    const lineColor = getAqiColorHex(lastValue);
    gradient.addColorStop(0, lineColor + 'cc');
    gradient.addColorStop(1, lineColor + '22');

    ctx.beginPath();
    history.forEach((point, i) => {
      const x = padding.left + (i / (history.length - 1)) * chartW;
      const y = padding.top + chartH - ((point.value - yMin) / (yMax - yMin)) * chartH;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.lineTo(padding.left + chartW, h - padding.bottom);
    ctx.lineTo(padding.left, h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    const lastIdx = history.length - 1;
    const lastPoint = history[lastIdx];
    const lx = padding.left + chartW;
    const ly = padding.top + chartH - ((lastPoint.value - yMin) / (yMax - yMin)) * chartH;

    ctx.beginPath();
    ctx.arc(lx, ly, 5, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 12px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = lineColor;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${Math.round(lastPoint.value)}`, lx - 8, ly - 8);
  }

  private render = (): void => {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    this.ctx.clearRect(0, 0, w, h);

    const history = this.getCurrentHistory();
    if (history.length === 0) {
      this.ctx.font = '12px -apple-system, "PingFang SC", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('等待数据...', w / 2, h / 2);
      return;
    }

    const values = history.map((p) => p.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const yStep = rawMax <= 100 ? 25 : rawMax <= 200 ? 50 : 100;
    const yMin = Math.max(0, Math.floor(rawMin / yStep) * yStep - yStep);
    const yMax = Math.min(500, this.roundToNearest(rawMax, yStep) + yStep);

    this.drawGrid(w, h, yMin, yMax);
    this.drawLine(w, h, yMin, yMax);

    const titleEl = document.getElementById('chart-title-mode');
    if (titleEl) {
      titleEl.textContent = this.getTitle();
    }
  };

  private startRenderLoop(): void {
    const loop = () => {
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}
