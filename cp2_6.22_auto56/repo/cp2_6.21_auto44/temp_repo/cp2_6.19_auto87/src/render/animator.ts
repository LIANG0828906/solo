export type EasingFunction = (t: number) => number;

export const Easing = {
  linear: (t: number): number => t,

  easeOutQuad: (t: number): number => t * (2 - t),

  easeInQuad: (t: number): number => t * t,

  easeInOutQuad: (t: number): number =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),

  easeInCubic: (t: number): number => t * t * t,

  easeOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  easeOutElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

export interface Animation {
  id: string;
  startTime: number;
  duration: number;
  easing: EasingFunction;
  onUpdate: (progress: number, easedProgress: number) => void;
  onComplete?: () => void;
  delay?: number;
}

export class Animator {
  private animations: Map<string, Animation>;
  private currentTime: number;

  constructor() {
    this.animations = new Map();
    this.currentTime = 0;
  }

  update(deltaTime: number): void {
    this.currentTime += deltaTime;

    const toRemove: string[] = [];

    for (const [id, anim] of this.animations) {
      const delay = anim.delay || 0;
      const elapsed = this.currentTime - anim.startTime - delay;

      if (elapsed < 0) continue;

      const rawProgress = Math.min(elapsed / anim.duration, 1);
      const easedProgress = anim.easing(rawProgress);

      anim.onUpdate(rawProgress, easedProgress);

      if (rawProgress >= 1) {
        toRemove.push(id);
        if (anim.onComplete) {
          anim.onComplete();
        }
      }
    }

    for (const id of toRemove) {
      this.animations.delete(id);
    }
  }

  addAnimation(
    id: string,
    duration: number,
    easing: EasingFunction,
    onUpdate: (progress: number, easedProgress: number) => void,
    onComplete?: () => void,
    delay?: number
  ): void {
    this.animations.set(id, {
      id,
      startTime: this.currentTime,
      duration,
      easing,
      onUpdate,
      onComplete,
      delay
    });
  }

  removeAnimation(id: string): void {
    this.animations.delete(id);
  }

  hasAnimation(id: string): boolean {
    return this.animations.has(id);
  }

  clearAll(): void {
    this.animations.clear();
  }

  getActiveCount(): number {
    return this.animations.size;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpAngle(a: number, b: number, t: number): number {
  const diff = b - a;
  const adjusted = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
  return a + adjusted * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
