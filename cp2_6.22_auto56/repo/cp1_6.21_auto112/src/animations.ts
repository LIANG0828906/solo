export type EasingFunction = (t: number) => number;

export const easeLinear: EasingFunction = (t) => t;

export const easeOutCubic: EasingFunction = (t) => 1 - Math.pow(1 - t, 3);

export const easeInOutQuad: EasingFunction = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export const easeOutElastic: EasingFunction = (t) => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

export interface Animation {
  startTime: number;
  duration: number;
  easing: EasingFunction;
  onUpdate: (progress: number) => void;
  onComplete?: () => void;
}

export class AnimationManager {
  private animations: Set<Animation> = new Set();
  private running = false;
  private rafId: number | null = null;

  add(animation: Omit<Animation, 'startTime'>): void {
    const fullAnim: Animation = {
      startTime: performance.now(),
      duration: animation.duration,
      easing: animation.easing,
      onUpdate: animation.onUpdate,
      onComplete: animation.onComplete
    };
    this.animations.add(fullAnim);
    if (!this.running) {
      this.start();
    }
  }

  private start(): void {
    this.running = true;
    const tick = () => {
      const now = performance.now();
      const completed: Animation[] = [];

      this.animations.forEach((anim) => {
        const elapsed = now - anim.startTime;
        const rawProgress = Math.min(elapsed / anim.duration, 1);
        const easedProgress = anim.easing(rawProgress);
        anim.onUpdate(easedProgress);
        if (rawProgress >= 1) {
          completed.push(anim);
        }
      });

      completed.forEach((anim) => {
        this.animations.delete(anim);
        if (anim.onComplete) {
          anim.onComplete();
        }
      });

      if (this.animations.size > 0) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.running = false;
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.running = false;
    this.animations.clear();
  }

  hasAnimations(): boolean {
    return this.animations.size > 0;
  }
}

export const animationManager = new AnimationManager();

export interface TreasureAnimState {
  scale: number;
  rotation: number;
  opacity: number;
  active: boolean;
}

export interface FogAnimState {
  opacity: number;
  targetOpacity: number;
  startOpacity: number;
  startTime: number;
  duration: number;
  animating: boolean;
}

export interface PlayerShakeState {
  offset: number;
  active: boolean;
  startTime: number;
  duration: number;
}

export class ScoreAnimState {
  colorT: number = 0;
  startTime: number = 0;
  duration: number = 600;
  active: boolean = false;

  trigger(): void {
    this.active = true;
    this.startTime = performance.now();
  }

  update(now: number): string {
    if (!this.active) return '#FFFFFF';
    const t = Math.min((now - this.startTime) / this.duration, 1);
    if (t >= 1) {
      this.active = false;
      return '#FFFFFF';
    }
    this.colorT = t < 0.5 ? t * 2 : (1 - t) * 2;
    return lerpColor('#FFFFFF', '#FFD700', this.colorT);
  }
}

export class WinAnimState {
  active: boolean = false;
  startTime: number = 0;
  duration: number = 2000;

  trigger(): void {
    this.active = true;
    this.startTime = performance.now();
  }

  getProgress(now: number): number {
    if (!this.active) return 0;
    return Math.min((now - this.startTime) / this.duration, 1);
  }

  getBgAlpha(now: number): number {
    const p = this.getProgress(now);
    if (p < 0.15) return p / 0.15;
    if (p > 0.85) return (1 - p) / 0.15;
    return 1;
  }

  isComplete(now: number): boolean {
    return this.active && (now - this.startTime) >= this.duration;
  }

  reset(): void {
    this.active = false;
    this.startTime = 0;
  }
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  };
}
