const G = 0.8;
const SOFTENING = 2.0;
const DT = 1 / 60;
const SIM_DURATION = 60;
const CELL_SIZE = 30;

let positions: Float32Array;
let velocities: Float32Array;
let masses: Float32Array;
let starCount = 0;
let running = false;
let frameId = 0;
let simulationTime = 0;
let lastFrameTime = 0;
let loopTimeout: ReturnType<typeof setTimeout> | null = null;

function initData(stars: Array<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; mass: number; galaxy: number }>) {
  starCount = stars.length;
  positions = new Float32Array(starCount * 3);
  velocities = new Float32Array(starCount * 3);
  masses = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    const s = stars[i];
    positions[i * 3] = s.x;
    positions[i * 3 + 1] = s.y;
    positions[i * 3 + 2] = s.z;
    velocities[i * 3] = s.vx;
    velocities[i * 3 + 1] = s.vy;
    velocities[i * 3 + 2] = s.vz;
    masses[i] = s.mass;
  }

  frameId = 0;
  simulationTime = 0;
}

function buildGrid(): Map<string, number[]> {
  const grid = new Map<string, number[]>();
  const invCell = 1 / CELL_SIZE;
  for (let i = 0; i < starCount; i++) {
    const ix = Math.floor(positions[i * 3] * invCell);
    const iy = Math.floor(positions[i * 3 + 1] * invCell);
    const iz = Math.floor(positions[i * 3 + 2] * invCell);
    const key = ix + ',' + iy + ',' + iz;
    let cell = grid.get(key);
    if (!cell) {
      cell = [];
      grid.set(key, cell);
    }
    cell.push(i);
  }
  return grid;
}

function physicsStep() {
  const grid = buildGrid();
  const invCell = 1 / CELL_SIZE;
  const softSq = SOFTENING * SOFTENING;

  const ax = new Float32Array(starCount);
  const ay = new Float32Array(starCount);
  const az = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    const px = positions[i * 3];
    const py = positions[i * 3 + 1];
    const pz = positions[i * 3 + 2];

    const ix = Math.floor(px * invCell);
    const iy = Math.floor(py * invCell);
    const iz = Math.floor(pz * invCell);

    let aix = 0;
    let aiy = 0;
    let aiz = 0;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = (ix + dx) + ',' + (iy + dy) + ',' + (iz + dz);
          const cell = grid.get(key);
          if (!cell) continue;

          for (let k = 0; k < cell.length; k++) {
            const j = cell[k];
            if (j === i) continue;

            const rx = positions[j * 3] - px;
            const ry = positions[j * 3 + 1] - py;
            const rz = positions[j * 3 + 2] - pz;

            const distSq = rx * rx + ry * ry + rz * rz + softSq;
            const dist = Math.sqrt(distSq);
            const invDist3 = 1 / (distSq * dist);
            const f = G * masses[j] * invDist3;

            aix += f * rx;
            aiy += f * ry;
            aiz += f * rz;
          }
        }
      }
    }

    ax[i] = aix;
    ay[i] = aiy;
    az[i] = aiz;
  }

  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    velocities[i3] += ax[i] * DT;
    velocities[i3 + 1] += ay[i] * DT;
    velocities[i3 + 2] += az[i] * DT;
    positions[i3] += velocities[i3] * DT;
    positions[i3 + 1] += velocities[i3 + 1] * DT;
    positions[i3 + 2] += velocities[i3 + 2] * DT;
  }

  simulationTime += DT;
}

function getFrameInterval(): number {
  return starCount <= 500 ? (1000 / 60) : (1000 / 20);
}

function getStepsPerFrame(): number {
  return starCount <= 500 ? 2 : 1;
}

function sendFrame() {
  const posCopy = new Float32Array(positions);
  const velCopy = new Float32Array(velocities);
  frameId++;

  const msg = {
    type: 'frame' as const,
    positions: posCopy,
    velocities: velCopy,
    elapsed: simulationTime,
    timestamp: performance.now(),
    frameId,
  };

  (self as unknown as Worker).postMessage(msg, [msg.positions.buffer, msg.velocities.buffer]);
}

function tick() {
  if (!running) return;

  const now = performance.now();
  const frameInterval = getFrameInterval();
  const elapsed = now - lastFrameTime;

  if (elapsed >= frameInterval) {
    const steps = getStepsPerFrame();
    for (let s = 0; s < steps; s++) {
      physicsStep();
      if (simulationTime >= SIM_DURATION) {
        running = false;
        sendFrame();
        (self as unknown as Worker).postMessage({ type: 'finished', elapsed: simulationTime });
        return;
      }
    }
    sendFrame();
    lastFrameTime = now;
  }

  loopTimeout = setTimeout(tick, 0);
}

function startLoop() {
  running = true;
  lastFrameTime = performance.now();
  tick();
}

function pauseLoop() {
  running = false;
  if (loopTimeout !== null) {
    clearTimeout(loopTimeout);
    loopTimeout = null;
  }
}

(self as unknown as Worker).onmessage = (e: MessageEvent) => {
  try {
    const msg = e.data;

    switch (msg.type) {
      case 'init': {
        if (!msg.stars || msg.stars.length === 0) {
          (self as unknown as Worker).postMessage({ type: 'error', message: 'No star data provided' });
          return;
        }
        pauseLoop();
        initData(msg.stars);
        break;
      }
      case 'start': {
        if (starCount === 0) {
          (self as unknown as Worker).postMessage({ type: 'error', message: 'No stars initialized' });
          return;
        }
        if (!running) {
          startLoop();
        }
        break;
      }
      case 'pause': {
        pauseLoop();
        break;
      }
      case 'reset': {
        pauseLoop();
        if (!msg.stars || msg.stars.length === 0) {
          (self as unknown as Worker).postMessage({ type: 'error', message: 'No star data provided' });
          return;
        }
        initData(msg.stars);
        break;
      }
      case 'terminate': {
        pauseLoop();
        break;
      }
    }
  } catch (err) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
};

export {};
