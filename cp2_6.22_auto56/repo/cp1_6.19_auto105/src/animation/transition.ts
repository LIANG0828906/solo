export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export interface AnimationController {
  start: (duration: number, onUpdate: (progress: number) => void, onComplete?: () => void) => void;
  stop: () => void;
  isRunning: () => boolean;
}

export function createAnimationController(): AnimationController {
  let animationId: number | null = null;
  let running = false;

  const start = (
    duration: number,
    onUpdate: (progress: number) => void,
    onComplete?: () => void
  ) => {
    if (running) return;

    running = true;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      onUpdate(progress);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        running = false;
        animationId = null;
        onComplete?.();
      }
    };

    animationId = requestAnimationFrame(animate);
  };

  const stop = () => {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    running = false;
  };

  const isRunning = () => running;

  return { start, stop, isRunning };
}

export const REPAIR_ANIMATION_DURATION = 2000;
export const CUTAWAY_ANIMATION_DURATION = 1500;
export const TRANSITION_EASE = easeOutCubic;
