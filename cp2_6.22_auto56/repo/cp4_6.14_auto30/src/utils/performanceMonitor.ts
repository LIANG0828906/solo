export interface LODConfig {
  shadowMapSize: number;
  antialias: boolean;
  pixelRatio: number;
}

export interface PerformanceMonitor {
  getFPS: () => number;
  onLowFPS: (callback: (currentFps: number) => void) => () => void;
  start: () => void;
  stop: () => void;
  resetLOD: () => void;
}

const LOW_FPS_CONSECUTIVE_THRESHOLD = 3;
const SAMPLE_INTERVAL_MS = 500;

const LOD_LEVELS: { name: 'high' | 'medium' | 'low'; config: LODConfig }[] = [
  {
    name: 'high',
    config: {
      shadowMapSize: 2048,
      antialias: true,
      pixelRatio: 2,
    },
  },
  {
    name: 'medium',
    config: {
      shadowMapSize: 1024,
      antialias: true,
      pixelRatio: 1.5,
    },
  },
  {
    name: 'low',
    config: {
      shadowMapSize: 512,
      antialias: false,
      pixelRatio: 1,
    },
  },
];

export function recommendLOD(
  currentFps: number,
  triangleCount: number
): LODConfig {
  let score = 0;

  if (currentFps >= 55) {
    score += 2;
  } else if (currentFps >= 30) {
    score += 1;
  } else {
    score += 0;
  }

  if (triangleCount < 50000) {
    score += 2;
  } else if (triangleCount < 200000) {
    score += 1;
  } else {
    score += 0;
  }

  if (score >= 3) {
    return LOD_LEVELS[0].config;
  } else if (score >= 1) {
    return LOD_LEVELS[1].config;
  } else {
    return LOD_LEVELS[2].config;
  }
}

export function createPerformanceMonitor(
  thresholdFps: number = 45
): PerformanceMonitor {
  let currentFps = 60;
  let frameCount = 0;
  let running = false;
  let rafId: number | null = null;
  let lastSampleTime = performance.now();
  let consecutiveLowFpsCount = 0;
  let currentLODIndex = 0;
  const lowFpsCallbacks: Set<(currentFps: number) => void> = new Set();

  function sample(): void {
    const now = performance.now();
    const elapsed = now - lastSampleTime;

    if (elapsed >= SAMPLE_INTERVAL_MS) {
      currentFps = Math.round((frameCount * 1000) / elapsed);
      frameCount = 0;
      lastSampleTime = now;

      if (currentFps < thresholdFps) {
        consecutiveLowFpsCount++;
        if (consecutiveLowFpsCount >= LOW_FPS_CONSECUTIVE_THRESHOLD) {
          lowFpsCallbacks.forEach((cb) => {
            try {
              cb(currentFps);
            } catch (e) {
              console.error('[PerformanceMonitor] onLowFPS callback error:', e);
            }
          });
          consecutiveLowFpsCount = 0;
        }
      } else {
        consecutiveLowFpsCount = 0;
      }
    }
  }

  function rafLoop(): void {
    if (!running) return;
    frameCount++;
    sample();
    rafId = requestAnimationFrame(rafLoop);
  }

  return {
    getFPS: () => currentFps,
    onLowFPS: (callback) => {
      lowFpsCallbacks.add(callback);
      return () => {
        lowFpsCallbacks.delete(callback);
      };
    },
    start: () => {
      if (running) return;
      running = true;
      frameCount = 0;
      lastSampleTime = performance.now();
      consecutiveLowFpsCount = 0;
      rafId = requestAnimationFrame(rafLoop);
    },
    stop: () => {
      running = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
    resetLOD: () => {
      currentLODIndex = 0;
    },
  };
}

export { LOD_LEVELS };
