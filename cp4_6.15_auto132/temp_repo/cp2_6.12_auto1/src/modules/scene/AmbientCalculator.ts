import type { SunData, WeatherMode } from '../../types';

export class AmbientCalculator {
  private worker: Worker | null = null;
  private callbacks: Map<string, (data: SunData) => void> = new Map();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    this.worker = new Worker(
      new URL('./ambientWorker.ts', import.meta.url),
      { type: 'module' }
    );
    this.worker.onmessage = (e: MessageEvent<SunData>) => {
      this.callbacks.forEach((cb) => cb(e.data));
    };
  }

  calculate(
    month: number,
    day: number,
    hour: number,
    latitude: number,
    longitude: number,
    weather: WeatherMode
  ): void {
    if (!this.worker) return;
    this.worker.postMessage({ month, day, hour, latitude, longitude, weather });
  }

  onResult(id: string, callback: (data: SunData) => void): void {
    this.callbacks.set(id, callback);
  }

  offResult(id: string): void {
    this.callbacks.delete(id);
  }

  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.callbacks.clear();
  }
}
