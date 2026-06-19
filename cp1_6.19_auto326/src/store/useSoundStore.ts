import { create } from 'zustand';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ReflectionPath {
  id: string;
  points: Vec3[];
  reflectionCount: number;
  energy: number;
  arrivalTime: number;
  pathLength: number;
}

export interface ReverbPoint {
  time: number;
  level: number;
  energy: number;
}

const ROOM_WIDTH = 12;
const ROOM_HEIGHT = 8;
const ROOM_DEPTH = 4;
const SPEED_OF_SOUND = 343;
const MAX_PATHS = 20;

const DEFAULT_SOURCE_POS: Vec3 = { x: -4, y: 2, z: -1 };
const DEFAULT_RECEIVER_POS: Vec3 = { x: 3, y: 2, z: 1 };
const DEFAULT_ABSORPTION: [number, number, number, number, number, number] = [0.3, 0.3, 0.3, 0.3, 0.1, 0.8];

function reflectPoint(point: Vec3, wallIndex: number): Vec3 {
  switch (wallIndex) {
    case 0: return { x: point.x, y: point.y, z: ROOM_DEPTH - point.z };
    case 1: return { x: point.x, y: point.y, z: -ROOM_DEPTH - point.z };
    case 2: return { x: -ROOM_WIDTH - point.x, y: point.y, z: point.z };
    case 3: return { x: ROOM_WIDTH - point.x, y: point.y, z: point.z };
    case 4: return { x: point.x, y: 2 * ROOM_HEIGHT - point.y, z: point.z };
    case 5: return { x: point.x, y: -point.y, z: point.z };
    default: return point;
  }
}

function distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function intersectionWithWall(from: Vec3, to: Vec3, wallIndex: number): Vec3 | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;

  let t: number;
  switch (wallIndex) {
    case 0:
      if (Math.abs(dz) < 1e-10) return null;
      t = (ROOM_DEPTH / 2 - from.z) / dz;
      break;
    case 1:
      if (Math.abs(dz) < 1e-10) return null;
      t = (-ROOM_DEPTH / 2 - from.z) / dz;
      break;
    case 2:
      if (Math.abs(dx) < 1e-10) return null;
      t = (-ROOM_WIDTH / 2 - from.x) / dx;
      break;
    case 3:
      if (Math.abs(dx) < 1e-10) return null;
      t = (ROOM_WIDTH / 2 - from.x) / dx;
      break;
    case 4:
      if (Math.abs(dy) < 1e-10) return null;
      t = (ROOM_HEIGHT - from.y) / dy;
      break;
    case 5:
      if (Math.abs(dy) < 1e-10) return null;
      t = (0 - from.y) / dy;
      break;
    default:
      return null;
  }

  if (t <= 1e-8 || t >= 1 - 1e-8) return null;

  return {
    x: from.x + t * dx,
    y: from.y + t * dy,
    z: from.z + t * dz,
  };
}

function isPointValidOnWall(point: Vec3, wallIndex: number): boolean {
  const eps = 1e-5;
  switch (wallIndex) {
    case 0:
      return Math.abs(point.z - ROOM_DEPTH / 2) < eps &&
             point.x >= -ROOM_WIDTH / 2 - eps && point.x <= ROOM_WIDTH / 2 + eps &&
             point.y >= -eps && point.y <= ROOM_HEIGHT + eps;
    case 1:
      return Math.abs(point.z + ROOM_DEPTH / 2) < eps &&
             point.x >= -ROOM_WIDTH / 2 - eps && point.x <= ROOM_WIDTH / 2 + eps &&
             point.y >= -eps && point.y <= ROOM_HEIGHT + eps;
    case 2:
      return Math.abs(point.x + ROOM_WIDTH / 2) < eps &&
             point.z >= -ROOM_DEPTH / 2 - eps && point.z <= ROOM_DEPTH / 2 + eps &&
             point.y >= -eps && point.y <= ROOM_HEIGHT + eps;
    case 3:
      return Math.abs(point.x - ROOM_WIDTH / 2) < eps &&
             point.z >= -ROOM_DEPTH / 2 - eps && point.z <= ROOM_DEPTH / 2 + eps &&
             point.y >= -eps && point.y <= ROOM_HEIGHT + eps;
    case 4:
      return Math.abs(point.y - ROOM_HEIGHT) < eps &&
             point.x >= -ROOM_WIDTH / 2 - eps && point.x <= ROOM_WIDTH / 2 + eps &&
             point.z >= -ROOM_DEPTH / 2 - eps && point.z <= ROOM_DEPTH / 2 + eps;
    case 5:
      return Math.abs(point.y) < eps &&
             point.x >= -ROOM_WIDTH / 2 - eps && point.x <= ROOM_WIDTH / 2 + eps &&
             point.z >= -ROOM_DEPTH / 2 - eps && point.z <= ROOM_DEPTH / 2 + eps;
    default:
      return false;
  }
}

function computePathForWallSequence(
  source: Vec3,
  receiver: Vec3,
  wallSequence: number[],
  absorption: number[]
): ReflectionPath | null {
  const n = wallSequence.length;

  if (n === 0) {
    const dist = distance(source, receiver);
    return {
      id: 'direct',
      points: [{ ...source }, { ...receiver }],
      reflectionCount: 0,
      energy: 1,
      arrivalTime: (dist / SPEED_OF_SOUND) * 1000,
      pathLength: dist,
    };
  }

  const imageSources: Vec3[] = [{ ...source }];
  for (let i = 0; i < n; i++) {
    const wall = wallSequence[n - 1 - i];
    imageSources.push(reflectPoint(imageSources[i], wall));
  }

  const reflectionPoints: Vec3[] = [];
  let currentTarget: Vec3 = { ...receiver };

  for (let i = 0; i < n; i++) {
    const imgSrc = imageSources[n - i];
    const wall = wallSequence[i];
    const point = intersectionWithWall(imgSrc, currentTarget, wall);

    if (!point || !isPointValidOnWall(point, wall)) {
      return null;
    }

    reflectionPoints.push(point);
    currentTarget = point;
  }

  const points: Vec3[] = [{ ...source }, ...reflectionPoints, { ...receiver }];

  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalLength += distance(points[i], points[i + 1]);
  }

  const imgToReceiverDist = distance(imageSources[n], receiver);
  if (Math.abs(totalLength - imgToReceiverDist) > 1e-3) {
    return null;
  }

  let energy = 1;
  for (const w of wallSequence) {
    energy *= (1 - absorption[w]);
  }

  const id = 'ref_' + wallSequence.join('_');

  return {
    id,
    points,
    reflectionCount: n,
    energy,
    arrivalTime: (totalLength / SPEED_OF_SOUND) * 1000,
    pathLength: totalLength,
  };
}

function hasConsecutiveDuplicates(seq: number[]): boolean {
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] === seq[i - 1]) return true;
  }
  return false;
}

function computeReflectionPaths(
  source: Vec3,
  receiver: Vec3,
  absorption: number[]
): ReflectionPath[] {
  const allPaths: ReflectionPath[] = [];

  const direct = computePathForWallSequence(source, receiver, [], absorption);
  if (direct) allPaths.push(direct);

  const wallIndices = [0, 1, 2, 3, 4, 5];

  for (const w1 of wallIndices) {
    const seq1 = [w1];
    if (hasConsecutiveDuplicates(seq1)) continue;
    const path = computePathForWallSequence(source, receiver, seq1, absorption);
    if (path) allPaths.push(path);
  }

  for (const w1 of wallIndices) {
    for (const w2 of wallIndices) {
      const seq2 = [w1, w2];
      if (hasConsecutiveDuplicates(seq2)) continue;
      const path = computePathForWallSequence(source, receiver, seq2, absorption);
      if (path) allPaths.push(path);
    }
  }

  for (const w1 of wallIndices) {
    for (const w2 of wallIndices) {
      for (const w3 of wallIndices) {
        const seq3 = [w1, w2, w3];
        if (hasConsecutiveDuplicates(seq3)) continue;
        const path = computePathForWallSequence(source, receiver, seq3, absorption);
        if (path) allPaths.push(path);
      }
    }
  }

  allPaths.sort((a, b) => a.arrivalTime - b.arrivalTime);
  return allPaths.slice(0, MAX_PATHS);
}

function computeRT60(absorption: number[]): number {
  const volume = ROOM_WIDTH * ROOM_HEIGHT * ROOM_DEPTH;

  const frontBackArea = ROOM_WIDTH * ROOM_HEIGHT;
  const leftRightArea = ROOM_HEIGHT * ROOM_DEPTH;
  const topBottomArea = ROOM_WIDTH * ROOM_DEPTH;

  const areas = [
    frontBackArea,
    frontBackArea,
    leftRightArea,
    leftRightArea,
    topBottomArea,
    topBottomArea,
  ];

  let totalAbsorption = 0;
  for (let i = 0; i < 6; i++) {
    totalAbsorption += areas[i] * absorption[i];
  }

  if (totalAbsorption < 1e-10) return 0;
  return 0.161 * volume / totalAbsorption;
}

function computeReverbCurve(paths: ReflectionPath[]): ReverbPoint[] {
  const duration = 2000;
  const step = 10;
  const points: ReverbPoint[] = [];

  const arrivalEvents: { time: number; energy: number }[] = paths.map(p => ({
    time: p.arrivalTime,
    energy: p.energy,
  }));
  arrivalEvents.sort((a, b) => a.time - b.time);

  let totalEnergy = 0;
  for (const e of arrivalEvents) {
    totalEnergy += e.energy;
  }

  let remainingEnergy = totalEnergy;
  let eventIndex = 0;

  for (let t = 0; t <= duration; t += step) {
    while (eventIndex < arrivalEvents.length && arrivalEvents[eventIndex].time <= t) {
      remainingEnergy -= arrivalEvents[eventIndex].energy;
      eventIndex++;
    }

    const energy = Math.max(0, remainingEnergy);

    let level = 0;
    if (energy > 1e-12) {
      level = 100 + 20 * Math.log10(energy);
    }
    level = Math.max(0, Math.min(100, level));

    points.push({
      time: t,
      level,
      energy,
    });
  }

  return points;
}

export interface SoundStore {
  roomWidth: number;
  roomHeight: number;
  roomDepth: number;

  sourcePos: Vec3;
  receiverPos: Vec3;

  wallAbsorption: [number, number, number, number, number, number];

  reflectionPaths: ReflectionPath[];
  reverbCurve: ReverbPoint[];
  rt60: number;

  selectedPathId: string | null;

  setSourcePos: (pos: Vec3) => void;
  setReceiverPos: (pos: Vec3) => void;
  setWallAbsorption: (index: number, value: number) => void;
  setSelectedPathId: (id: string | null) => void;
  recomputeAll: () => void;
}

export const useSoundStore = create<SoundStore>((set, get) => ({
  roomWidth: ROOM_WIDTH,
  roomHeight: ROOM_HEIGHT,
  roomDepth: ROOM_DEPTH,

  sourcePos: { ...DEFAULT_SOURCE_POS },
  receiverPos: { ...DEFAULT_RECEIVER_POS },

  wallAbsorption: [...DEFAULT_ABSORPTION] as [number, number, number, number, number, number],

  reflectionPaths: [],
  reverbCurve: [],
  rt60: 0,

  selectedPathId: null,

  setSourcePos: (pos: Vec3) => {
    set({ sourcePos: { ...pos } });
    get().recomputeAll();
  },

  setReceiverPos: (pos: Vec3) => {
    set({ receiverPos: { ...pos } });
    get().recomputeAll();
  },

  setWallAbsorption: (index: number, value: number) => {
    const absorption = [...get().wallAbsorption] as [number, number, number, number, number, number];
    absorption[index] = value;
    set({ wallAbsorption: absorption });
    get().recomputeAll();
  },

  setSelectedPathId: (id: string | null) => {
    set({ selectedPathId: id });
  },

  recomputeAll: () => {
    const { sourcePos, receiverPos, wallAbsorption } = get();
    const paths = computeReflectionPaths(sourcePos, receiverPos, wallAbsorption);
    const rt60 = computeRT60(wallAbsorption);
    const curve = computeReverbCurve(paths);
    set({
      reflectionPaths: paths,
      rt60,
      reverbCurve: curve,
    });
  },
}));

useSoundStore.getState().recomputeAll();
