export function measureRenderTime<T>(label: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  logPerformance(label, duration);
  return result;
}

export function startFrameMonitor(): () => { fps: number; stop: () => void } {
  let frameCount = 0;
  let lastTime = performance.now();
  let currentFps = 60;
  let stopped = false;
  let rafId: number;

  function tick() {
    if (stopped) return;
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      currentFps = Math.round((frameCount * 1000) / (now - lastTime));
      frameCount = 0;
      lastTime = now;
      if (currentFps < 55) {
        console.warn(`[Performance] FPS dropped to ${currentFps}, below threshold 55`);
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return () => {
    stopped = true;
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    return {
      fps: currentFps,
      stop: () => {
        stopped = true;
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
      },
    };
  };
}

export function logPerformance(metric: string, value: number, threshold?: number): void {
  if (threshold !== undefined && value > threshold) {
    console.warn(`[Performance] ${metric}: ${value.toFixed(2)}ms exceeds threshold ${threshold}ms`);
  } else {
    console.log(`[Performance] ${metric}: ${value.toFixed(2)}ms`);
  }
}
