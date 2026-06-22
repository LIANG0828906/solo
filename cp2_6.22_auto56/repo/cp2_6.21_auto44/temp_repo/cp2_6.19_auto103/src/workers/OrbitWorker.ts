interface OrbitData {
  orbitRadius: number;
  orbitSpeed: number;
  phase: number;
}

interface WorkerInput {
  type: 'init' | 'update';
  time?: number;
  deltaTime?: number;
  timeScale?: number;
  orbits?: OrbitData[];
}

interface WorkerOutput {
  positions: Array<{ x: number; y: number; z: number }>;
  degradeTexture: boolean;
}

let orbits: OrbitData[] = [];
let accumulatedTime = 0;
let frameCount = 0;
let lastFpsCheckTime = 0;
let currentFps = 60;

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const data = e.data;

  if (data.type === 'init' && data.orbits) {
    orbits = data.orbits.map((o) => ({ ...o }));
    accumulatedTime = 0;
    frameCount = 0;
    lastFpsCheckTime = performance.now();
    return;
  }

  if (data.type === 'update') {
    const time = data.time ?? 0;
    const deltaTime = data.deltaTime ?? 0;
    const timeScale = data.timeScale ?? 1;

    accumulatedTime += deltaTime * timeScale;

    frameCount++;
    const now = performance.now();
    if (now - lastFpsCheckTime >= 1000) {
      currentFps = (frameCount * 1000) / (now - lastFpsCheckTime);
      frameCount = 0;
      lastFpsCheckTime = now;
    }

    const positions = orbits.map((orbit) => {
      const angle = orbit.phase + accumulatedTime * orbit.orbitSpeed;
      return {
        x: Math.cos(angle) * orbit.orbitRadius,
        y: 0,
        z: Math.sin(angle) * orbit.orbitRadius,
      };
    });

    const output: WorkerOutput = {
      positions,
      degradeTexture: currentFps < 45,
    };

    self.postMessage(output);
  }
};

export {};
