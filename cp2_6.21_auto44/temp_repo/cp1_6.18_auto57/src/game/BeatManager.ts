import { defaultBeats } from '../data/beats';
import {
  COLOR_SEQUENCE,
  COLOR_TRANSITION_DURATION,
  LIGHT_MIN_RADIUS,
  LIGHT_MAX_RADIUS,
  lerpColor,
  colorToCSS,
  ColorRGB,
} from '../config/visualConfig';

export class BeatManager {
  private bpm: number;
  private lastBeatTime: number;
  private beatCount: number;
  private colorIndex: number;
  private transitionStart: number;
  private isTransitioning: boolean;
  private currentColor: ColorRGB;
  private targetColor: ColorRGB;
  private pulseStart: number;

  constructor() {
    this.bpm = defaultBeats.bpm;
    this.lastBeatTime = 0;
    this.beatCount = 0;
    this.colorIndex = 0;
    this.transitionStart = 0;
    this.isTransitioning = false;
    this.currentColor = { ...COLOR_SEQUENCE[0] };
    this.targetColor = { ...COLOR_SEQUENCE[0] };
    this.pulseStart = 0;
  }

  getBpm(): number {
    return this.bpm;
  }

  setBpm(bpm: number): void {
    this.bpm = Math.max(60, Math.min(180, bpm));
  }

  getBeatCount(): number {
    return this.beatCount;
  }

  getBeatInterval(): number {
    return 60000 / this.bpm;
  }

  getCurrentColor(): ColorRGB {
    return this.currentColor;
  }

  getCurrentRadius(now: number): number {
    if (this.beatCount === 0) return LIGHT_MIN_RADIUS;

    const beatInterval = this.getBeatInterval();
    const pulseDuration = beatInterval * 0.5;
    const elapsed = now - this.pulseStart;

    if (elapsed >= pulseDuration) {
      return LIGHT_MIN_RADIUS;
    }

    const t = elapsed / pulseDuration;
    if (t < 0.5) {
      const expand = t / 0.5;
      return LIGHT_MIN_RADIUS + (LIGHT_MAX_RADIUS - LIGHT_MIN_RADIUS) * expand;
    } else {
      const contract = (t - 0.5) / 0.5;
      return LIGHT_MAX_RADIUS - (LIGHT_MAX_RADIUS - LIGHT_MIN_RADIUS) * contract;
    }
  }

  update(now: number): boolean {
    const interval = this.getBeatInterval();

    if (this.lastBeatTime === 0) {
      this.lastBeatTime = now;
      this.pulseStart = now;
      return false;
    }

    let beatTriggered = false;

    while (now - this.lastBeatTime >= interval) {
      this.lastBeatTime += interval;
      this.beatCount++;
      beatTriggered = true;

      this.colorIndex = (this.colorIndex + 1) % COLOR_SEQUENCE.length;
      this.targetColor = { ...COLOR_SEQUENCE[this.colorIndex] };
      this.transitionStart = now;
      this.isTransitioning = true;
      this.pulseStart = now;
    }

    if (this.isTransitioning) {
      const elapsed = now - this.transitionStart;
      const progress = Math.min(elapsed / COLOR_TRANSITION_DURATION, 1);
      const prevIndex = (this.colorIndex - 1 + COLOR_SEQUENCE.length) % COLOR_SEQUENCE.length;
      const prevColor = COLOR_SEQUENCE[prevIndex];
      this.currentColor = lerpColor(prevColor, this.targetColor, progress);

      if (progress >= 1) {
        this.isTransitioning = false;
        this.currentColor = { ...this.targetColor };
      }
    }

    return beatTriggered;
  }

  reset(): void {
    this.beatCount = 0;
    this.colorIndex = 0;
    this.lastBeatTime = 0;
    this.isTransitioning = false;
    this.currentColor = { ...COLOR_SEQUENCE[0] };
    this.targetColor = { ...COLOR_SEQUENCE[0] };
    this.pulseStart = 0;
  }
}
