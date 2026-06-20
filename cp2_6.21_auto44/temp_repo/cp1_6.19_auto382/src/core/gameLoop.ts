import { useGameStore } from '@/store/gameStore';

let animationFrameId: number | null = null;
let lastTimestamp = 0;
let frameCount = 0;

export function startGameLoop() {
  if (animationFrameId !== null) return;
  lastTimestamp = performance.now();
  frameCount = 0;
  loop(lastTimestamp);
}

export function stopGameLoop() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function loop(timestamp: number) {
  const deltaMs = Math.min(timestamp - lastTimestamp, 100);
  lastTimestamp = timestamp;
  frameCount++;

  useGameStore.getState().tick(deltaMs, frameCount);

  animationFrameId = requestAnimationFrame(loop);
}

export function isGameLoopRunning(): boolean {
  return animationFrameId !== null;
}
