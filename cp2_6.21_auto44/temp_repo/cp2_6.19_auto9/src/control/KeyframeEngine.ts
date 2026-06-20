import type { LightParams, Keyframe, EasingType } from '../types';
import { LIGHT_COUNT } from '../types';

type UpdateCallback = (lights: LightParams[]) => void;

const easeInOut = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

const applyEasing = (t: number, easing: EasingType): number => {
  switch (easing) {
    case 'linear':
      return t;
    case 'easeInOut':
      return easeInOut(t);
    default:
      return t;
  }
};

const interpolateHue = (h1: number, h2: number, t: number): number => {
  let diff = h2 - h1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (h1 + diff * t + 360) % 360;
};

const interpolateLight = (
  from: LightParams,
  to: LightParams,
  t: number,
): LightParams => ({
  hue: interpolateHue(from.hue, to.hue, t),
  saturation: from.saturation + (to.saturation - from.saturation) * t,
  brightness: from.brightness + (to.brightness - from.brightness) * t,
  pattern: t < 0.5 ? from.pattern : to.pattern,
  patternSpeed: from.patternSpeed + (to.patternSpeed - from.patternSpeed) * t,
});

export class KeyframeEngine {
  private keyframes: Keyframe[] = [];
  private isPlaying = false;
  private currentTime = 0;
  private totalDuration = 0;
  private animationFrameId: number | null = null;
  private lastTimestamp: number | null = null;
  private onUpdate: UpdateCallback | null = null;
  private currentLights: LightParams[] = [];

  constructor() {
    this.currentLights = Array(LIGHT_COUNT).fill(null).map(() => ({
      hue: 0,
      saturation: 100,
      brightness: 80,
      pattern: 'static',
      patternSpeed: 1,
    }));
  }

  setKeyframes(keyframes: Keyframe[]): void {
    this.keyframes = [...keyframes];
    this.calculateTotalDuration();
    if (!this.isPlaying && this.keyframes.length > 0) {
      this.currentLights = this.keyframes[0].lights.map((l) => ({ ...l }));
      this.notifyUpdate();
    }
  }

  setOnUpdate(callback: UpdateCallback): void {
    this.onUpdate = callback;
  }

  getCurrentLights(): LightParams[] {
    return this.currentLights.map((l) => ({ ...l }));
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getTotalDuration(): number {
    return this.totalDuration;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  play(): void {
    if (this.isPlaying || this.keyframes.length < 2) return;
    this.isPlaying = true;
    this.lastTimestamp = null;
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  pause(): void {
    this.isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.lastTimestamp = null;
  }

  seek(time: number): void {
    this.currentTime = Math.max(0, Math.min(time, this.totalDuration));
    this.calculateCurrentLights();
    this.notifyUpdate();
  }

  reset(): void {
    this.pause();
    this.currentTime = 0;
    if (this.keyframes.length > 0) {
      this.currentLights = this.keyframes[0].lights.map((l) => ({ ...l }));
      this.notifyUpdate();
    }
  }

  private calculateTotalDuration(): void {
    this.totalDuration = this.keyframes.reduce((sum, kf) => sum + kf.duration, 0);
  }

  private loop(timestamp: number): void {
    if (!this.isPlaying) return;

    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
    }

    const delta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    this.currentTime += delta;

    if (this.currentTime >= this.totalDuration) {
      this.currentTime = 0;
    }

    this.calculateCurrentLights();
    this.notifyUpdate();

    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  private calculateCurrentLights(): void {
    if (this.keyframes.length === 0) return;
    if (this.keyframes.length === 1) {
      this.currentLights = this.keyframes[0].lights.map((l) => ({ ...l }));
      return;
    }

    let elapsed = 0;
    for (let i = 0; i < this.keyframes.length; i++) {
      const kf = this.keyframes[i];
      if (this.currentTime < elapsed + kf.duration) {
        const progress = (this.currentTime - elapsed) / kf.duration;
        const nextIndex = (i + 1) % this.keyframes.length;
        const t = applyEasing(progress, kf.easing);

        this.currentLights = kf.lights.map((fromLight, lightIndex) =>
          interpolateLight(fromLight, this.keyframes[nextIndex].lights[lightIndex], t),
        );
        return;
      }
      elapsed += kf.duration;
    }

    this.currentLights = this.keyframes[0].lights.map((l) => ({ ...l }));
  }

  private notifyUpdate(): void {
    if (this.onUpdate) {
      this.onUpdate(this.currentLights.map((l) => ({ ...l })));
    }
  }

  destroy(): void {
    this.pause();
    this.onUpdate = null;
  }
}
