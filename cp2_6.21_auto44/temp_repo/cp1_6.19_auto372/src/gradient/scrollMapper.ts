import type { GradientNode } from '@/types';

export interface MappedNodes {
  nodeA: GradientNode;
  nodeB: GradientNode;
  localT: number;
}

export function mapScrollToNodes(progress: number, nodes: GradientNode[]): MappedNodes {
  const sorted = [...nodes].sort((a, b) => a.position - b.position);
  if (sorted.length === 0) {
    throw new Error('nodes is empty');
  }
  if (sorted.length === 1) {
    return { nodeA: sorted[0], nodeB: sorted[0], localT: 0 };
  }
  const p = Math.max(0, Math.min(1, progress)) * 100;
  let idx = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (p >= sorted[i].position && p <= sorted[i + 1].position) {
      idx = i;
      break;
    }
    if (p > sorted[i + 1].position) idx = i;
  }
  const nodeA = sorted[idx];
  const nodeB = sorted[Math.min(idx + 1, sorted.length - 1)];
  if (nodeA.position === nodeB.position) {
    return { nodeA, nodeB, localT: 0 };
  }
  const localT = (p - nodeA.position) / (nodeB.position - nodeA.position);
  return { nodeA, nodeB, localT: Math.max(0, Math.min(1, localT)) };
}

export interface ThrottledUpdater {
  update: (value: number) => void;
  destroy: () => void;
}

export function createThrottledUpdater(
  callback: (value: number) => void,
  maxFPS = 30,
  minFPS = 20,
): ThrottledUpdater {
  let rafId: number | null = null;
  let lastEmit = 0;
  let lastValue: number | null = null;
  let pending = false;
  let strikeCount = 0;
  let currentFPS = maxFPS;

  const emit = (value: number) => {
    const now = performance.now();
    const minInterval = 1000 / currentFPS;
    if (now - lastEmit < minInterval) {
      strikeCount++;
      if (strikeCount > 5 && currentFPS > minFPS) {
        currentFPS = minFPS;
        strikeCount = 0;
      }
      if (!pending) {
        pending = true;
        rafId = requestAnimationFrame(() => {
          pending = false;
          if (lastValue !== null) {
            emit(lastValue);
            lastValue = null;
          }
        });
      }
      return;
    }
    strikeCount = Math.max(0, strikeCount - 1);
    if (strikeCount === 0 && currentFPS < maxFPS) {
      currentFPS = maxFPS;
    }
    lastEmit = now;
    callback(value);
  };

  return {
    update: (value: number) => {
      lastValue = value;
      emit(value);
    },
    destroy: () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}
