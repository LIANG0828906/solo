export type EasingFunction = (t: number) => number;

export interface Keyframe<T> {
  time: number;
  value: T;
  easing?: EasingFunction;
}

export interface TimelineCallback {
  time: number;
  callback: () => void;
  triggered: boolean;
}

export interface AnimationTrack<T> {
  keyframes: Keyframe<T>[];
  interpolate: (a: T, b: T, t: number) => T;
  onUpdate?: (value: T) => void;
  currentValue: T;
}

export const Easing = {
  linear: (t: number): number => t,
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => --t * t * t + 1,
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  elasticOut: (t: number): number => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  },
  bounceOut: (t: number): number => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      t -= 1.5 / 2.75;
      return 7.5625 * t * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      t -= 2.25 / 2.75;
      return 7.5625 * t * t + 0.9375;
    } else {
      t -= 2.625 / 2.75;
      return 7.5625 * t * t + 0.984375;
    }
  }
};

export class AnimationTimeline {
  private tracks: Map<string, AnimationTrack<unknown>> = new Map();
  private callbacks: TimelineCallback[] = [];
  private currentTime: number = 0;
  private duration: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private playbackSpeed: number = 1;
  private loop: boolean = false;
  private onComplete?: () => void;

  get time(): number {
    return this.currentTime;
  }

  get totalDuration(): number {
    return this.duration;
  }

  get playing(): boolean {
    return this.isPlaying && !this.isPaused;
  }

  get paused(): boolean {
    return this.isPaused;
  }

  addTrack<T>(
    name: string,
    keyframes: Keyframe<T>[],
    interpolate: (a: T, b: T, t: number) => T,
    onUpdate?: (value: T) => void
  ): void {
    const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);

    if (sortedKeyframes.length === 0) {
      throw new Error('At least one keyframe is required');
    }

    const track: AnimationTrack<T> = {
      keyframes: sortedKeyframes,
      interpolate,
      onUpdate,
      currentValue: sortedKeyframes[0].value
    };

    this.tracks.set(name, track as unknown as AnimationTrack<unknown>);

    const lastKeyframeTime = sortedKeyframes[sortedKeyframes.length - 1].time;
    if (lastKeyframeTime > this.duration) {
      this.duration = lastKeyframeTime;
    }
  }

  addCallback(time: number, callback: () => void): void {
    this.callbacks.push({
      time,
      callback,
      triggered: false
    });

    if (time > this.duration) {
      this.duration = time;
    }
  }

  removeTrack(name: string): boolean {
    return this.tracks.delete(name);
  }

  play(loop: boolean = false, onComplete?: () => void): void {
    this.isPlaying = true;
    this.isPaused = false;
    this.loop = loop;
    this.onComplete = onComplete;
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;
    this.resetCallbacks();
    this.updateTracks(0);
  }

  reset(): void {
    this.currentTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.resetCallbacks();
    this.updateTracks(0);
  }

  seek(time: number): void {
    this.currentTime = Math.max(0, Math.min(time, this.duration));
    this.updateTracks(this.currentTime);
    this.updateCallbacks(this.currentTime);
  }

  setSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0, speed);
  }

  update(deltaTime: number): void {
    if (!this.isPlaying || this.isPaused) return;

    this.currentTime += deltaTime * this.playbackSpeed;

    if (this.currentTime >= this.duration) {
      if (this.loop) {
        this.currentTime = this.currentTime % this.duration;
        this.resetCallbacks();
      } else {
        this.currentTime = this.duration;
        this.isPlaying = false;
        if (this.onComplete) {
          this.onComplete();
        }
      }
    }

    this.updateTracks(this.currentTime);
    this.updateCallbacks(this.currentTime);
  }

  private updateTracks(time: number): void {
    for (const track of this.tracks.values()) {
      const value = this.interpolateTrack(track, time);
      track.currentValue = value;
      if (track.onUpdate) {
        track.onUpdate(value);
      }
    }
  }

  private interpolateTrack<T>(track: AnimationTrack<T>, time: number): T {
    const keyframes = track.keyframes as Keyframe<T>[];

    if (keyframes.length === 1) {
      return keyframes[0].value;
    }

    if (time <= keyframes[0].time) {
      return keyframes[0].value;
    }

    if (time >= keyframes[keyframes.length - 1].time) {
      return keyframes[keyframes.length - 1].value;
    }

    for (let i = 0; i < keyframes.length - 1; i++) {
      const k1 = keyframes[i];
      const k2 = keyframes[i + 1];

      if (time >= k1.time && time <= k2.time) {
        const segmentDuration = k2.time - k1.time;
        const localProgress = (time - k1.time) / segmentDuration;
        const easing = k2.easing || Easing.linear;
        const easedProgress = easing(localProgress);
        return track.interpolate(k1.value, k2.value, easedProgress);
      }
    }

    return keyframes[keyframes.length - 1].value;
  }

  private updateCallbacks(time: number): void {
    for (const cb of this.callbacks) {
      if (!cb.triggered && time >= cb.time) {
        cb.triggered = true;
        cb.callback();
      }
    }
  }

  private resetCallbacks(): void {
    for (const cb of this.callbacks) {
      cb.triggered = false;
    }
  }

  getTrackValue<T>(name: string): T | null {
    const track = this.tracks.get(name);
    return track ? (track.currentValue as T) : null;
  }

  dispose(): void {
    this.tracks.clear();
    this.callbacks = [];
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;
    this.duration = 0;
    this.onComplete = undefined;
  }
}

export function createNumberInterpolator(): (a: number, b: number, t: number) => number {
  return (a: number, b: number, t: number) => a + (b - a) * t;
}

export function createVector2Interpolator(): (
  a: { x: number; y: number },
  b: { x: number; y: number },
  t: number
) => { x: number; y: number } {
  return (a, b, t) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  });
}

export function createVector3Interpolator(): (
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
  t: number
) => { x: number; y: number; z: number } {
  return (a, b, t) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t
  });
}

export function createColorInterpolator(): (a: number, b: number, t: number) => number {
  return (a: number, b: number, t: number) => {
    const ar = (a >> 16) & 255;
    const ag = (a >> 8) & 255;
    const ab = a & 255;
    const br = (b >> 16) & 255;
    const bg = (b >> 8) & 255;
    const bb = b & 255;

    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);

    return (r << 16) | (g << 8) | bl;
  };
}
