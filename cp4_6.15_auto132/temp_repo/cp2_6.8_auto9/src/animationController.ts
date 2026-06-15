import type { WeatherHourData, WeatherUpdate } from './types';

export type AnimationTickCallback = (update: WeatherUpdate) => void;

export class AnimationController {
  private hoursData: WeatherHourData[] = [];
  private currentTime: number = 0;
  private isPlaying: boolean = false;
  private speed: number = 1;
  private lastTimestamp: number = 0;
  private tickCallback: AnimationTickCallback | null = null;
  private rafId: number | null = null;

  private readonly HOURS_PER_SECOND = 0.5;

  setData(hoursData: WeatherHourData[]): void {
    this.hoursData = hoursData;
    this.currentTime = 0;
    this.notifyTick();
  }

  onTick(callback: AnimationTickCallback): void {
    this.tickCallback = callback;
  }

  play(): void {
    if (this.isPlaying || this.hoursData.length === 0) return;
    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    this.loop();
  }

  pause(): void {
    this.isPlaying = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  togglePlay(): boolean {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  getSpeed(): number {
    return this.speed;
  }

  seekTo(time: number): void {
    this.currentTime = Math.max(0, Math.min(23.999, time));
    this.notifyTick();
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  isPlayingState(): boolean {
    return this.isPlaying;
  }

  reset(): void {
    this.pause();
    this.currentTime = 0;
    this.notifyTick();
  }

  private loop = (): void => {
    if (!this.isPlaying) return;

    const now = performance.now();
    const delta = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;

    this.currentTime += delta * this.HOURS_PER_SECOND * this.speed;

    if (this.currentTime >= 24) {
      this.currentTime = 0;
    }

    this.notifyTick();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private notifyTick(): void {
    if (!this.tickCallback || this.hoursData.length === 0) return;

    const timeIndex = Math.floor(this.currentTime);
    const progress = this.currentTime - timeIndex;
    const currentData = this.hoursData[timeIndex];
    const nextData = this.hoursData[(timeIndex + 1) % this.hoursData.length];

    this.tickCallback({
      timeIndex,
      currentData,
      nextData,
      progress
    });
  }
}
