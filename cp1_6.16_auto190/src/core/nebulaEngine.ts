import type { NebulaParams, ParticleData } from '../store/useNebulaStore';
import NebulaWorker from './nebulaWorker?worker';

export type ParticleUpdateCallback = (data: ParticleData) => void;

export class NebulaEngine {
  private worker: Worker | null = null;
  private callback: ParticleUpdateCallback | null = null;
  private isAnimating: boolean = false;
  private lastTime: number = 0;
  private animationId: number | null = null;
  private params: NebulaParams | null = null;
  private initialized: boolean = false;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    const worker = new NebulaWorker();
    this.worker = worker;
    worker.onmessage = (e) => {
      if (e.data.type === 'particles' && this.callback) {
        const data: ParticleData = {
          positions: new Float32Array(e.data.positions),
          colors: new Float32Array(e.data.colors),
          sizes: new Float32Array(e.data.sizes)
        };
        this.callback(data);
      }
    };
  }

  public setUpdateCallback(callback: ParticleUpdateCallback) {
    this.callback = callback;
  }

  public init(params: NebulaParams) {
    this.params = { ...params };
    this.initialized = true;
    if (this.worker) {
      this.worker.postMessage({
        type: 'init',
        params: this.params
      });
    }
  }

  public updateParams(params: NebulaParams) {
    const oldParams = this.params;
    this.params = { ...params };

    if (!this.initialized) {
      this.init(params);
      return;
    }

    const needRegenerate =
      !oldParams ||
      oldParams.particleCount !== params.particleCount ||
      oldParams.shape !== params.shape;

    if (needRegenerate && this.worker) {
      this.worker.postMessage({
        type: 'regenerate',
        params: this.params
      });
    }
  }

  public start() {
    if (this.isAnimating || !this.initialized) return;
    this.isAnimating = true;
    this.lastTime = performance.now();
    this.animate();
  }

  public stop() {
    this.isAnimating = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = () => {
    if (!this.isAnimating || !this.worker || !this.params) return;

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    const time = now / 1000;

    this.worker.postMessage({
      type: 'animate',
      delta,
      time,
      params: this.params
    });

    this.animationId = requestAnimationFrame(this.animate);
  };

  public destroy() {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.callback = null;
    this.initialized = false;
  }
}

export const nebulaEngine = new NebulaEngine();
