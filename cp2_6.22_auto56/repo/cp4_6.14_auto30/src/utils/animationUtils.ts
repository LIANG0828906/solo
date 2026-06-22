import * as THREE from 'three';

export type EasingName = 'easeInOutCubic' | 'easeOutQuad' | 'linear';

export interface TweenController {
  cancel: () => void;
  isRunning: () => boolean;
}

export function linear(t: number): number {
  return t;
}

export function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export function easeInOutCubic(t: number): number {
  if (t < 0.5) {
    return 4 * t * t * t;
  }
  const f = 2 * t - 2;
  return 1 + (f * f * f) / 2;
}

const easingMap: Record<EasingName, (t: number) => number> = {
  easeInOutCubic,
  easeOutQuad,
  linear,
};

export function createTween(
  startValue: number,
  endValue: number,
  durationMs: number,
  onUpdate: (value: number) => void,
  onComplete?: () => void,
  easing: EasingName = 'easeInOutCubic'
): TweenController {
  let running = true;
  let rafId: number | null = null;
  let startTime: number | null = null;

  const easingFn = easingMap[easing] ?? easeInOutCubic;

  function step(timestamp: number): void {
    if (!running) return;

    if (startTime === null) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    const rawProgress = durationMs > 0 ? elapsed / durationMs : 1;
    const progress = Math.min(1, rawProgress);
    const easedProgress = easingFn(progress);
    const currentValue = startValue + (endValue - startValue) * easedProgress;

    try {
      onUpdate(currentValue);
    } catch (e) {
      console.error('[createTween] onUpdate error:', e);
    }

    if (progress >= 1) {
      running = false;
      if (onComplete) {
        try {
          onComplete();
        } catch (e) {
          console.error('[createTween] onComplete error:', e);
        }
      }
      return;
    }

    rafId = requestAnimationFrame(step);
  }

  rafId = requestAnimationFrame(step);

  return {
    cancel: () => {
      running = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
    isRunning: () => running,
  };
}

export function animateMaterialOpacity(
  material: THREE.Material,
  fromOpacity: number,
  toOpacity: number,
  durationMs: number,
  onComplete?: () => void
): TweenController {
  material.transparent = material.transparent || toOpacity < 1 || fromOpacity < 1;
  material.opacity = fromOpacity;

  return createTween(
    fromOpacity,
    toOpacity,
    durationMs,
    (value) => {
      material.opacity = value;
    },
    onComplete,
    'easeInOutCubic'
  );
}

export function animateGroupRotationY(
  group: THREE.Group,
  fromAngle: number,
  toAngle: number,
  durationMs: number,
  onComplete?: () => void
): TweenController {
  group.rotation.y = fromAngle;

  return createTween(
    fromAngle,
    toAngle,
    durationMs,
    (value) => {
      group.rotation.y = value;
    },
    onComplete,
    'easeInOutCubic'
  );
}
