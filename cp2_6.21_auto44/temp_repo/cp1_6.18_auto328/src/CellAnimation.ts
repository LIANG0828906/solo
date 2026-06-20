import { ANIMATION_DURATION, IAnimationState } from './CellTypes';

let animationStartTime: number | null = null;
let animationFrameId: number | null = null;
let currentProgress = 0;
let isCurrentlyAnimating = false;
let onProgressCallback: ((progress: number, phase: IAnimationState['phase']) => void) | null = null;
let onCompleteCallback: (() => void) | null = null;

function getPhase(progress: number): IAnimationState['phase'] {
  if (progress <= 0) return 'idle';
  if (progress <= 0.5) return 'stretching';
  if (progress <= 0.75) return 'splitting';
  if (progress <= 0.875) return 'separating';
  if (progress < 1) return 'resetting';
  return 'idle';
}

function animate(timestamp: number): void {
  if (animationStartTime === null) {
    animationStartTime = timestamp;
  }

  const elapsed = timestamp - animationStartTime;
  currentProgress = Math.min(elapsed / ANIMATION_DURATION, 1);

  const phase = getPhase(currentProgress);

  if (onProgressCallback) {
    onProgressCallback(currentProgress, phase);
  }

  if (currentProgress < 1) {
    animationFrameId = requestAnimationFrame(animate);
  } else {
    isCurrentlyAnimating = false;
    currentProgress = 0;
    animationStartTime = null;
    if (onCompleteCallback) {
      onCompleteCallback();
    }
  }
}

export function triggerMitosis(): void {
  if (isCurrentlyAnimating) {
    return;
  }

  isCurrentlyAnimating = true;
  animationStartTime = null;
  currentProgress = 0;
  animationFrameId = requestAnimationFrame(animate);
}

export function getAnimationProgress(): number {
  return currentProgress;
}

export function isAnimating(): boolean {
  return isCurrentlyAnimating;
}

export function getCurrentPhase(): IAnimationState['phase'] {
  return getPhase(currentProgress);
}

export function setOnProgressCallback(
  callback: (progress: number, phase: IAnimationState['phase']) => void
): void {
  onProgressCallback = callback;
}

export function setOnCompleteCallback(callback: () => void): void {
  onCompleteCallback = callback;
}

export function cancelAnimation(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  isCurrentlyAnimating = false;
  currentProgress = 0;
  animationStartTime = null;
}
