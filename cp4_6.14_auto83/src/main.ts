import { VisualCore } from './visualCore';
import { dataManager, MetricType, CityInfo } from './dataManager';

class App {
  private visualCore!: VisualCore;
  private cities: CityInfo[] = [];
  private activeCities: Set<number> = new Set();
  private activeMetric: MetricType = 'temperature';

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      this.visualCore = new VisualCore({
        containerId: 'canvas-container',
      });
    } catch (e