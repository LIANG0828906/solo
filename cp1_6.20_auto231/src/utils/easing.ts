export type EasingFn = (t: number) => number;

export const easeInOutQuad: EasingFn = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export const easeInOutCubic: EasingFn = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutCubic: EasingFn = (t) => 1 - Math.pow(1 - t, 3);

export const easeOutQuad: EasingFn = (t) => 1 - (1 - t) * (1 - t);

export const easeInOutSine: EasingFn = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface AnimateOptions {
  duration: number;
  onUpdate: (progress: number) => void;
  onComplete?: () => void;
  easing?: EasingFn;
}

export function animate({
  duration,
  onUpdate,
  onComplete,
  easing = easeInOutCubic,
}: AnimateOptions): () => void {
  const startTime = performance.now();
  let rafId: number;
  let cancelled = false;

  const tick = (now: number) => {
    if (cancelled) return;
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    onUpdate(easing(t));
    if (t < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      onComplete?.();
    }
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}
