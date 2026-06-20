import {
  IEffect,
  WaterEffect,
  StarEffect,
  FireEffect,
  SnowEffect
} from './effects';

export type EffectName = 'water' | 'star' | 'fire' | 'snow';

export class EffectManager {
  private effects: Map<EffectName, IEffect>;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private running: boolean = false;
  private onRenderCallback: ((imageData: ImageData) => void) | null = null;
  private getBaseImageDataCallback: (() => ImageData) | null = null;
  private lastActivity: number = Date.now();
  private idleTimeout: number = 5000;
  private paused: boolean = false;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', {
      willReadFrequently: true
    })!;
    this.effects = new Map();
    this.effects.set('water', new WaterEffect());
    this.effects.set('star', new StarEffect());
    this.effects.set('fire', new FireEffect());
    this.effects.set('snow', new SnowEffect());
  }

  setSize(width: number, height: number): void {
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
  }

  setOnRenderCallback(callback: (imageData: ImageData) => void): void {
    this.onRenderCallback = callback;
  }

  setGetBaseImageDataCallback(callback: () => ImageData): void {
    this.getBaseImageDataCallback = callback;
  }

  activate(effectName: EffectName): void {
    const effect = this.effects.get(effectName);
    if (effect) {
      effect.active = true;
      this.markActivity();
      this.ensureRunning();
    }
  }

  deactivate(effectName: EffectName): void {
    const effect = this.effects.get(effectName);
    if (effect) {
      effect.active = false;
    }
  }

  toggle(effectName: EffectName): boolean {
    const effect = this.effects.get(effectName);
    if (effect) {
      effect.active = !effect.active;
      if (effect.active) {
        this.markActivity();
        this.ensureRunning();
      }
      return effect.active;
    }
    return false;
  }

  isActive(effectName: EffectName): boolean {
    const effect = this.effects.get(effectName);
    return effect ? effect.active : false;
  }

  setIntensity(effectName: EffectName, value: number): void {
    const effect = this.effects.get(effectName);
    if (effect) {
      effect.intensity = Math.max(0, Math.min(100, value));
      this.markActivity();
    }
  }

  getIntensity(effectName: EffectName): number {
    const effect = this.effects.get(effectName);
    return effect ? effect.intensity : 0;
  }

  setParam(effectName: EffectName, param: string, value: number): void {
    const effect = this.effects.get(effectName);
    if (effect && effect.params) {
      effect.params[param] = value;
      this.markActivity();
    }
  }

  hasAnyActive(): boolean {
    for (const effect of this.effects.values()) {
      if (effect.active) return true;
    }
    return false;
  }

  markActivity(): void {
    this.lastActivity = Date.now();
    if (this.paused && this.hasAnyActive()) {
      this.paused = false;
      this.loop();
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.startTime = performance.now();
    this.lastActivity = Date.now();
    this.paused = false;
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private ensureRunning(): void {
    if (!this.running) {
      this.start();
    }
  }

  private loop = (): void => {
    if (!this.running) return;

    const now = Date.now();
    if (now - this.lastActivity > this.idleTimeout && !this.hasAnyActive()) {
      this.paused = true;
      this.animationFrameId = null;
      return;
    }

    if (this.hasAnyActive() && this.getBaseImageDataCallback && this.onRenderCallback) {
      const time = performance.now() - this.startTime;
      const baseImageData = this.getBaseImageDataCallback();
      const width = baseImageData.width;
      const height = baseImageData.height;

      this.offscreenCtx.putImageData(baseImageData, 0, 0);

      let currentData = this.offscreenCtx.getImageData(0, 0, width, height);

      for (const effect of this.effects.values()) {
        if (effect.active) {
          currentData = effect.render(currentData, width, height, time);
        }
      }

      this.onRenderCallback(currentData);
    } else if (this.onRenderCallback && this.getBaseImageDataCallback) {
      this.onRenderCallback(this.getBaseImageDataCallback());
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
