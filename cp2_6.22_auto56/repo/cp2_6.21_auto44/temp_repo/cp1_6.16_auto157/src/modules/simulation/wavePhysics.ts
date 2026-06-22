import { SceneElement, SoundSource, Obstacle, Absorber } from '../store';

export interface ReflectionPath {
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  reflectX: number;
  reflectZ: number;
  birthTime: number;
}

export interface SoundFieldConfig {
  roomWidth: number;
  roomDepth: number;
  resolution: number;
}

const SPEED_OF_SOUND = 343;
const AIR_ABSORPTION = 0.01;

export function calculateSoundField(
  elements: SceneElement[],
  config: SoundFieldConfig
): number[][] {
  const { roomWidth, roomDepth, resolution } = config;
  const cols = resolution;
  const rows = resolution;
  const cellW = roomWidth / cols;
  const cellD = roomDepth / rows;

  const sources = elements.filter((e): e is SoundSource => e.type === 'source');
  const obstacles = elements.filter((e): e is Obstacle => e.type === 'obstacle');
  const absorbers = elements.filter((e): e is Absorber => e.type === 'absorber');

  const field: number[][] = [];

  for (let r = 0; r < rows; r++) {
    field[r] = [];
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5) * cellW;
      const pz = (r + 0.5) * cellD;

      let totalPressure = 0;

      for (const src of sources) {
        const dx = px - src.x;
        const dz = pz - src.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.1) {
          totalPressure += src.amplitude;
          continue;
        }

        const attenuation = src.amplitude / (1 + dist * AIR_ABSORPTION + dist * dist * 0.0001);

        let obsBlocked = false;
        for (const obs of obstacles) {
          if (lineIntersectsRect(src.x, src.z, px, pz, obs)) {
            obsBlocked = true;
            break;
          }
        }

        if (!obsBlocked) {
          totalPressure += attenuation;
        }

        for (const obs of obstacles) {
          const mirrorX = 2 * getClosestEdge(src.x, obs) - src.x;
          const mirrorZ = src.z;
          const mdx = px - mirrorX;
          const mdz = pz - mirrorZ;
          const mdist = Math.sqrt(mdx * mdx + mdz * mdz);
          if (mdist > 0.1) {
            const refAtt = attenuation * 0.5 / (1 + mdist * 0.005);
            totalPressure += refAtt;
          }
        }

        for (const abs of absorbers) {
          const adx = px - abs.x;
          const adz = pz - abs.z;
          const adist = Math.sqrt(adx * adx + adz * adz);
          if (adist < Math.max(abs.width, abs.depth) * 0.8) {
            totalPressure *= (1 - abs.absorptionCoeff * 0.3);
          }
        }
      }

      field[r][c] = Math.max(0, 20 * Math.log10(Math.max(totalPressure, 1e-10)));
    }
  }

  return field;
}

function lineIntersectsRect(
  x1: number, z1: number,
  x2: number, z2: number,
  obs: Obstacle
): boolean {
  const hw = obs.width / 2;
  const hd = obs.depth / 2;
  const ox = obs.x;
  const oz = obs.z;

  const left = ox - hw;
  const right = ox + hw;
  const top = oz - hd;
  const bottom = oz + hd;

  if ((x1 >= left && x1 <= right && z1 >= top && z1 <= bottom) ||
      (x2 >= left && x2 <= right && z2 >= top && z2 <= bottom)) {
    return true;
  }

  const edges: [number, number, number, number][] = [
    [left, top, right, top],
    [right, top, right, bottom],
    [right, bottom, left, bottom],
    [left, bottom, left, top],
  ];

  for (const [ex1, ez1, ex2, ez2] of edges) {
    if (segmentsIntersect(x1, z1, x2, z2, ex1, ez1, ex2, ez2)) {
      return true;
    }
  }
  return false;
}

function segmentsIntersect(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): boolean {
  const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
  if (Math.abs(d) < 1e-10) return false;
  const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
  const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function getClosestEdge(val: number, obs: Obstacle): number {
  const hw = obs.width / 2;
  const left = obs.x - hw;
  const right = obs.x + hw;
  return Math.abs(val - left) < Math.abs(val - right) ? left : right;
}

export function getReflectionPaths(
  sources: SoundSource[],
  obstacles: Obstacle[],
  roomWidth: number,
  roomDepth: number
): ReflectionPath[] {
  const paths: ReflectionPath[] = [];
  const now = performance.now();

  for (const src of sources) {
    for (const obs of obstacles) {
      const hw = obs.width / 2;
      const hd = obs.depth / 2;
      const edges = [
        { x: obs.x - hw, z: obs.z },
        { x: obs.x + hw, z: obs.z },
        { x: obs.x, z: obs.z - hd },
        { x: obs.x, z: obs.z + hd },
      ];

      for (const edge of edges) {
        const dx = edge.x - src.x;
        const dz = edge.z - src.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.5) continue;

        const reflectLen = Math.min(dist * 0.6, 5);
        const dirX = dx / dist;
        const dirZ = dz / dist;

        const normX = edge.x - obs.x;
        const normZ = edge.z - obs.z;
        const normLen = Math.sqrt(normX * normX + normZ * normZ);
        const nX = normLen > 0.01 ? normX / normLen : 1;
        const nZ = normLen > 0.01 ? normZ / normLen : 0;

        const dot = dirX * nX + dirZ * nZ;
        const refDirX = dirX - 2 * dot * nX;
        const refDirZ = dirZ - 2 * dot * nZ;

        paths.push({
          startX: src.x,
          startZ: src.z,
          endX: edge.x,
          endZ: edge.z,
          reflectX: edge.x + refDirX * reflectLen,
          reflectZ: edge.z + refDirZ * reflectLen,
          birthTime: now,
        });
      }
    }

    const wallPaths = getWallReflections(src, roomWidth, roomDepth);
    paths.push(...wallPaths.map(p => ({ ...p, birthTime: now })));
  }

  return paths;
}

function getWallReflections(
  src: SoundSource,
  roomWidth: number,
  roomDepth: number
): Omit<ReflectionPath, 'birthTime'>[] {
  const paths: Omit<ReflectionPath, 'birthTime'>[] = [];
  const walls = [
    { wx: 0, wz: src.z, nx: 1, nz: 0 },
    { wx: roomWidth, wz: src.z, nx: -1, nz: 0 },
    { wx: src.x, wz: 0, nx: 0, nz: 1 },
    { wx: src.x, wz: roomDepth, nx: 0, nz: -1 },
  ];

  for (const wall of walls) {
    const dx = wall.wx - src.x;
    const dz = wall.wz - src.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.5) continue;
    const reflectLen = Math.min(dist * 0.4, 4);
    const dirX = dx / dist;
    const dirZ = dz / dist;
    const dot = dirX * wall.nx + dirZ * wall.nz;
    const refDirX = dirX - 2 * dot * wall.nx;
    const refDirZ = dirZ - 2 * dot * wall.nz;

    paths.push({
      startX: src.x,
      startZ: src.z,
      endX: wall.wx,
      endZ: wall.wz,
      reflectX: wall.wx + refDirX * reflectLen,
      reflectZ: wall.wz + refDirZ * reflectLen,
    });
  }

  return paths;
}

export function estimateWavelength(frequency: number): number {
  return SPEED_OF_SOUND / frequency;
}
