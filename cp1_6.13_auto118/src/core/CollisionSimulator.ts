interface StarData {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  mass: number;
  galaxy: 0 | 1;
}

interface SimParams {
  collisionAngle: number;
  relativeSpeed: number;
}

type MsgToWorker =
  | { type: 'init'; stars: StarData[]; params: SimParams }
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'reset'; stars: StarData[]; params: SimParams };

type MsgFromWorker =
  | { type: 'frame'; positions: Float32Array; velocities: Float32Array; elapsed: number }
  | { type: 'finished' };

const G = 0.8;
const SOFTENING = 2.0;
const DT = 1 / 60;
const TOTAL_DURATION = 60;

let positions: Float32Array;
let velocities: Float32Array;
let masses: Float32Array;
let count = 0;
let running = false;
let elapsed = 0;
let rafId: number | null = null;

function init(stars: StarData[]) {
  count = stars.length;
  positions = new Float32Array(count * 3);
  velocities = new Float32Array(count * 3);
  masses = new Float32Array(count);
  elapsed = 0;

  for (let i = 0; i < count; i++) {
    positions[i * 3] = stars[i].x;
    positions[i * 3 + 1] = stars[i].y;
    positions[i * 3 + 2] = stars[i].z;
    velocities[i * 3] = stars[i].vx;
    velocities[i * 3 + 1] = stars[i].vy;
    velocities[i * 3 + 2] = stars[i].vz;
    masses[i] = stars[i].mass;
  }
}

function step() {
  const ax = new Float32Array(count);
  const ay = new Float32Array(count);
  const az = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const xi = positions[i * 3];
    const yi = positions[i * 3 + 1];
    const zi = positions[i * 3 + 2];
    let aix = 0, aiy = 0, aiz = 0;

    for (let j = 0; j < count; j++) {
      if (i === j) continue;
      const dx = positions[j * 3] - xi;
      const dy = positions[j * 3 + 1] - yi;
      const dz = positions[j * 3 + 2] - zi;
      const distSq = dx * dx + dy * dy + dz * dz + SOFTENING * SOFTENING;
      const dist = Math.sqrt(distSq);
      const invDist3 = 1 / (distSq * dist);
      const f = G * masses[j] * invDist3;
      aix += f * dx;
      aiy += f * dy;
      aiz += f * dz;
    }
    ax[i] = aix;
    ay[i] = aiy;
    az[i] = aiz;
  }

  for (let i = 0; i < count; i++) {
    velocities[i * 3] += ax[i] * DT;
    velocities[i * 3 + 1] += ay[i] * DT;
    velocities[i * 3 + 2] += az[i] * DT;
    positions[i * 3] += velocities[i * 3] * DT;
    positions[i * 3 + 1] += velocities[i * 3 + 1] * DT;
    positions[i * 3 + 2] += velocities[i * 3 + 2] * DT;
  }

  elapsed += DT;
}

function tick() {
  if (!running) return;

  const targetFps = count > 500 ? 20 : 60;
  const frameInterval = 1000 / targetFps;

  const stepsPerFrame = count > 1000 ? 1 : (count > 500 ? 2 : 3);
  for (let s = 0; s < stepsPerFrame && elapsed < TOTAL_DURATION; s++) {
    step();
  }

  const msg: MsgFromWorker = {
    type: 'frame',
    positions: new Float32Array(positions),
    velocities: new Float32Array(velocities),
    elapsed,
  };
  (self as unknown as Worker).postMessage(msg, [msg.positions.buffer, msg.velocities.buffer]);

  if (elapsed >= TOTAL_DURATION) {
    running = false;
    (self as unknown as Worker).postMessage({ type: 'finished' } as MsgFromWorker);
    return;
  }

  rafId = (self as unknown as { setTimeout: typeof setTimeout }).setTimeout(tick, frameInterval) as unknown as number;
}

(self as unknown as Worker).onmessage = (e: MessageEvent<MsgToWorker>) => {
  const msg = e.data;
  switch (msg.type) {
    case 'init':
    case 'reset':
      init(msg.stars);
      running = false;
      if (rafId !== null) {
        (self as unknown as { clearTimeout: typeof clearTimeout }).clearTimeout(rafId);
        rafId = null;
      }
      break;
    case 'start':
      if (!running) {
        running = true;
        tick();
      }
      break;
    case 'pause':
      running = false;
      if (rafId !== null) {
        (self as unknown as { clearTimeout: typeof clearTimeout }).clearTimeout(rafId);
        rafId = null;
      }
      break;
  }
};

export {};
