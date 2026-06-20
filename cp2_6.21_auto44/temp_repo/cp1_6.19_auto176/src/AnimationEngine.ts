import type { AnimationMode } from './types';
import { eventBus, EVENTS } from './eventBus';

export class NeonAnimationEngine {
  private segmentCount: number = 0;
  private mode: AnimationMode = 'static';
  private speedFactor: number = 1;
  private playing: boolean = false;
  private rafId: number | null = null;
  private lastTime: number = 0;
  private elapsed: number = 0;
  private blinkData: { delay: number; period: number; onTime: number; offTime: number }[] = [];
  private brightnessFactors: number[] = [];

  constructor(segmentCount: number = 0, mode: AnimationMode = 'static') {
    this.segmentCount = segmentCount;
    this.mode = mode;
    this.ensureBrightnessFactors();
    this.generateBlinkData();
  }

  private ensureBrightnessFactors(): void {
    if (this.brightnessFactors.length !== this.segmentCount) {
      this.brightnessFactors = new Array(this.segmentCount).fill(1);
    }
  }

  private generateBlinkData(): void {
    this.blinkData = [];
    for (let i = 0; i < this.segmentCount; i++) {
      const delay = 0.2 + Math.random() * 1.0;
      const onTime = 0.5;
      const offTime = 0.3;
      this.blinkData.push({
        delay,
        period: onTime + offTime,
        onTime,
        offTime
      });
    }
  }

  setSegmentCount(count: number): void {
    if (count !== this.segmentCount) {
      this.segmentCount = count;
      this.ensureBrightnessFactors();
      this.generateBlinkData();
    }
  }

  setMode(mode: AnimationMode): void {
    this.mode = mode;
    eventBus.emit(EVENTS.MODE_CHANGED, mode);
    if (mode === 'static') {
      this.brightnessFactors = new Array(this.segmentCount).fill(1);
      eventBus.emit(EVENTS.FRAME_UPDATE, [...this.brightnessFactors]);
    }
  }

  getMode(): AnimationMode {
    return this.mode;
  }

  setSpeed(factor: number): void {
    this.speedFactor = Math.max(0.1, factor);
  }

  play(): void {
    if (this.playing) return;
    this.playing = true;
    this.lastTime = performance.now();
    eventBus.emit(EVENTS.PLAY_STATE_CHANGED, true);
    this.startLoop();
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    eventBus.emit(EVENTS.PLAY_STATE_CHANGED, false);
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  private startLoop(): void {
    if (this.rafId !== null) return;

    const tick = (now: number) => {
      if (!this.playing) return;

      const delta = (now - this.lastTime) / 1000;
      this.lastTime = now;

      const factors = this.update(delta);
      eventBus.emit(EVENTS.FRAME_UPDATE, factors);

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  update(deltaTime: number): number[] {
    const dt = deltaTime * this.speedFactor;
    this.elapsed += dt;

    this.ensureBrightnessFactors();
    if (this.segmentCount === 0) return this.brightnessFactors;

    switch (this.mode) {
      case 'static':
        this.brightnessFactors.fill(1);
        break;

      case 'blink':
        this.updateBlink();
        break;

      case 'chase':
        this.updateChase();
        break;

      case 'breathe':
        this.updateBreathe();
        break;
    }

    return [...this.brightnessFactors];
  }

  private updateBlink(): void {
    const t = this.elapsed;

    for (let i = 0; i < this.segmentCount; i++) {
      const data = this.blinkData[i];
      const phase = ((t + data.delay) % data.period + data.period) % data.period;

      let brightness: number;
      if (phase < data.onTime) {
        const localT = phase / data.onTime;
        brightness = this.smoothStep(localT);
      } else {
        const localT = (phase - data.onTime) / data.offTime;
        brightness = 1 - this.smoothStep(localT);
      }
      brightness = Math.max(0.05, brightness);
      this.brightnessFactors[i] = brightness;
    }
  }

  private updateChase(): void {
    const n = this.segmentCount;
    if (n === 0) return;

    const segmentInterval = 0.15;
    const totalCycle = n * segmentInterval * 2;
    const t = this.elapsed % totalCycle;

    const windowPosition = t / segmentInterval;

    for (let i = 0; i < n; i++) {
      let distance: number;
      if (windowPosition < n) {
        distance = Math.abs(windowPosition - i);
      } else {
        distance = Math.abs((windowPosition - n) - i);
      }

      const windowWidth = 1.5;
      if (distance < windowWidth) {
        const localT = distance / windowWidth;
        this.brightnessFactors[i] = this.smoothStep(1 - localT);
      } else {
        this.brightnessFactors[i] = 0.05;
      }
    }
  }

  private updateBreathe(): void {
    const period = 2.0;
    const t = (this.elapsed % period) / period;
    const brightness = 0.75 + 0.25 * Math.sin(t * Math.PI * 2);

    for (let i = 0; i < this.segmentCount; i++) {
      this.brightnessFactors[i] = Math.max(0.05, brightness);
    }
  }

  private smoothStep(x: number): number {
    const t = Math.max(0, Math.min(1, x));
    return t * t * (3 - 2 * t);
  }

  getBrightnessFactors(): number[] {
    return [...this.brightnessFactors];
  }

  dispose(): void {
    this.pause();
  }
}
