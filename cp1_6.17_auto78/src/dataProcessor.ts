export interface RoadSkeleton {
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
}

export interface TimeSlotData {
  time: string;
  grid: number[][];
  roadNames: string[][];
}

export interface TrafficDataset {
  timeSlots: TimeSlotData[];
  roadSkeletons: RoadSkeleton[];
}

export const GRID_SIZE = 60;
export const TIME_SLOTS = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '20:00'];

const ROAD_PREFIXES = ['中山路', '人民路', '解放路', '建设路', '和平路', '文化路', '长江路', '黄河路', '珠江路', '松花江路'];
const ROAD_SUFFIXES = ['东段', '西段', '南段', '北段', '中段', '一环', '二环', '三环', '延长线', '快速路'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function generateRoadNames(): string[][] {
  const names: string[][] = [];
  const rand = seededRandom(42);
  for (let z = 0; z < GRID_SIZE; z++) {
    const row: string[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      if ((x % 6 === 0 || z % 6 === 0) && rand() > 0.3) {
        const prefix = ROAD_PREFIXES[Math.floor(rand() * ROAD_PREFIXES.length)];
        const suffix = ROAD_SUFFIXES[Math.floor(rand() * ROAD_SUFFIXES.length)];
        row.push(`${prefix}${suffix}`);
      } else {
        row.push('');
      }
    }
    names.push(row);
  }
  return names;
}

function generateGrid(timeSlotIdx: number): number[][] {
  const grid: number[][] = [];
  const rand = seededRandom(1000 + timeSlotIdx);
  const timeFactor = [0.7, 0.95, 0.5, 0.85, 0.45, 0.6, 0.9, 1.0, 0.55][timeSlotIdx];

  const hotSpots = [
    { cx: 15, cz: 15, r: 8, inten: 0.9 },
    { cx: 45, cz: 20, r: 10, inten: 0.85 },
    { cx: 30, cz: 40, r: 12, inten: 0.95 },
    { cx: 10, cz: 50, r: 6, inten: 0.75 },
    { cx: 50, cz: 50, r: 7, inten: 0.8 },
    { cx: 30, cz: 15, r: 9, inten: 0.88 },
    { cx: 5, cz: 30, r: 7, inten: 0.7 },
    { cx: 55, cz: 35, r: 6, inten: 0.72 },
  ];

  for (let z = 0; z < GRID_SIZE; z++) {
    const row: number[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      let density = 0.05 + rand() * 0.1;

      for (const spot of hotSpots) {
        const dx = x - spot.cx;
        const dz = z - spot.cz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < spot.r) {
          const falloff = 1 - dist / spot.r;
          density += spot.inten * falloff * falloff * timeFactor;
        }
      }

      if (x % 6 === 0 || z % 6 === 0) {
        density += 0.15 + rand() * 0.1;
      }

      density = Math.min(1.0, density);
      row.push(density);
    }
    grid.push(row);
  }
  return grid;
}

function generateRoadSkeletons(): RoadSkeleton[] {
  const skeletons: RoadSkeleton[] = [];
  for (let i = 0; i < GRID_SIZE; i += 6) {
    skeletons.push({ startX: i, startZ: 0, endX: i, endZ: GRID_SIZE - 1 });
    skeletons.push({ startX: 0, startZ: i, endX: GRID_SIZE - 1, endZ: i });
  }
  return skeletons;
}

export function generateMockData(): TrafficDataset {
  const roadNames = generateRoadNames();
  const timeSlots: TimeSlotData[] = TIME_SLOTS.map((time, idx) => ({
    time,
    grid: generateGrid(idx),
    roadNames
  }));
  return {
    timeSlots,
    roadSkeletons: generateRoadSkeletons()
  };
}

export function gridToDensityArray(grid: number[][]): Float32Array {
  const arr = new Float32Array(GRID_SIZE * GRID_SIZE);
  for (let z = 0; z < GRID_SIZE; z++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      arr[z * GRID_SIZE + x] = grid[z][x];
    }
  }
  return arr;
}

export function lerpDensityArray(
  from: Float32Array,
  to: Float32Array,
  t: number,
  out: Float32Array
): void {
  const len = from.length;
  for (let i = 0; i < len; i++) {
    out[i] = from[i] + (to[i] - from[i]) * t;
  }
}

export function getDensityLevel(density: number): 'low' | 'mid' | 'high' {
  if (density < 0.35) return 'low';
  if (density < 0.7) return 'mid';
  return 'high';
}

export function getDensityLevelText(level: 'low' | 'mid' | 'high'): string {
  return { low: '低流量', mid: '中流量', high: '高流量' }[level];
}

export function getSuggestion(density: number, x: number, z: number): string {
  const level = getDensityLevel(density);
  const altX = (x + 12) % GRID_SIZE;
  const altZ = (z + 8) % GRID_SIZE;
  if (level === 'high') {
    return `当前路段严重拥堵，建议提前从 ${altX > 30 ? '东' : '西'}${altZ > 30 ? '南' : '北'}方向绕行平行道路，预计可节省约15~20分钟通行时间。`;
  } else if (level === 'mid') {
    return `当前路段车流量较大，建议保持安全车距，或选择周边支路分流通行。`;
  }
  return `当前路段通行顺畅，可按正常路线行驶。`;
}
