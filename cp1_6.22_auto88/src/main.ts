import { StockChart } from './chart';
import { StockPanel } from './panel';
import { DataGenerator } from './data';
import type { Stock } from './types';

class StockMonitorApp {
  private chart: StockChart;
  private panel: StockPanel;
  private dataGenerator: DataGenerator;
  private fpsCounter: HTMLElement;
  private frameCount = 0;
  private lastFpsUpdate = 0;
  private currentFps = 0;
  private animationFrameId: number | null = null;

  constructor() {
    const canvas = document.getElementById('chartCanvas') as HTMLCanvasElement;
    const panel = document.getElementById('panel') as HTMLElement;
    this.fpsCounter = document.getElementById('fpsCounter') as HTMLElement;

    if (!canvas || !panel || !this.fpsCounter) {
      throw new Error('Failed to find required DOM elements');
    }

    this.chart = new StockChart(canvas);
    this.panel = new StockPanel(panel);
    this.dataGenerator = new DataGenerator();

    this.setupEventHandlers();
    this.init();
  }

  private setupEventHandlers(): void {
    this.panel.setOnStockSelect((stockId: string | null) => {
      console.log('Selected stock:', stockId);
    });

    this.panel.setOnAddAnnotation((stockId: string, text: string, color: string) => {
      this.dataGenerator.addAnnotation(stockId, text, color);
      this.chart.updateStocks(this.dataGenerator.getStocks());
    });

    this.chart.setOnTimeRangeChange(() => {
      this.panel.updateStocks(this.dataGenerator.getStocks());
    });
  }

  private init(): void {
    const initialStocks = this.dataGenerator.getStocks();
    this.chart.updateStocks(initialStocks);
    this.panel.updateStocks(initialStocks);

    this.dataGenerator.startPushing((stocks: Stock[]) => {
      this.chart.updateStocks(stocks);
      this.panel.updateStocks(stocks);
    });

    this.startRenderLoop();
  }

  private startRenderLoop(): void {
    const render = (timestamp: number) => {
      this.chart.render();
      this.updateFps(timestamp);
      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  private updateFps(timestamp: number): void {
    this.frameCount++;
    
    if (timestamp - this.lastFpsUpdate >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = timestamp;
      
      const color = this.currentFps >= 55 ? '#2ed573' : this.currentFps >= 30 ? '#ffa502' : '#ff4757';
      this.fpsCounter.textContent = `FPS: ${this.currentFps}`;
      this.fpsCounter.style.color = color;
    }
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.dataGenerator.stopPushing();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new StockMonitorApp();
    window.addEventListener('beforeunload', () => {
      app.destroy();
    });
  } catch (error) {
    console.error('Failed to initialize Stock Monitor:', error);
  }
});
