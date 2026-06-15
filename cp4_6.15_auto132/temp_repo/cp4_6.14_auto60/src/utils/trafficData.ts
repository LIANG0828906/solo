import { v4 as uuidv4 } from 'uuid';
import type { Road, Intersection, RoadNetworkData, TrafficSnapshot, RoadTraffic, RGB } from '@/types';

const SAMPLES_PER_HOUR = 5;
const TOTAL_HOURS = 24;
const TOTAL_SAMPLES = TOTAL_HOURS * SAMPLES_PER_HOUR;

const GREEN: RGB = { r: 0x22, g: 0xc5, b: 0x5e };
const YELLOW: RGB = { r: 0xea, g: 0xb3, b: 0x08 };
const RED: RGB = { r: 0xef, g: 0x44, b: 0x44 };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function flowToColor(flow: number): string {
  const f = Math.max(0, Math.min(100, flow));
  let t: number;
  let c1: RGB;
  let c2: RGB;
  if (f <= 50) {
    t = f / 50;
    c1 = GREEN;
    c2 = YELLOW;
  } else {
    t = (f - 50) / 50;
    c1 = YELLOW;
    c2 = RED;
  }
  const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return rgbToHex({
    r: lerp(c1.r, c2.r, easeT),
    g: lerp(c1.g, c2.g, easeT),
    b: lerp(c1.b, c2.b, easeT),
  });
}

export function flowToWidth(flow: number): number {
  const f = Math.max(0, Math.min(100, flow));
  return 1 + (f / 100) * 5;
}

function gaussian(x: number, mu: number, sigma: number): number {
  return Math.exp(-Math.pow(x - mu, 2) / (2 * sigma * sigma));
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateRoadNetwork(): RoadNetworkData {
  const gridSize = 5;
  const spacing = 25;
  const half = ((gridSize - 1) * spacing) / 2;

  const intersections: Intersection[] = [];
  const idGrid: string[][] = [];
  for (let i = 0; i < gridSize; i++) {
    idGrid[i] = [];
    for (let j = 0; j < gridSize; j++) {
      const id = uuidv4();
      const x = j * spacing - half;
      const z = i * spacing - half;
      intersections.push({
        id,
        position: [x, 0, z],
        connectedRoads: [],
      });
      idGrid[i][j] = id;
    }
  }

  const horizontalNames = ['长安街', '建国路', '平安大街', '复兴路', '阜成路'];
  const verticalNames = ['东三环', '东二环', '中轴线', '西二环', '西三环'];
  const roads: Road[] = [];
  const rand = seededRandom(42);

  for (let i = 0; i < gridSize; i++) {
    const roadId = uuidv4();
    const startIdx = idGrid[i][0];
    const endIdx = idGrid[i][gridSize - 1];
    const start = intersections.find(it => it.id === startIdx)!.position;
    const end = intersections.find(it => it.id === endIdx)!.position;
    roads.push({
      id: roadId,
      name: horizontalNames[i] || `横向主干道${i + 1}`,
      start,
      end,
      baseFlow: 30 + rand() * 30,
      peakHours: [7, 8, 9, 17, 18, 19],
    });
    for (let j = 0; j < gridSize; j++) {
      const inter = intersections.find(it => it.id === idGrid[i][j])!;
      inter.connectedRoads.push(roadId);
    }
  }

  for (let j = 0; j < gridSize; j++) {
    const roadId = uuidv4();
    const startIdx = idGrid[0][j];
    const endIdx = idGrid[gridSize - 1][j];
    const start = intersections.find(it => it.id === startIdx)!.position;
    const end = intersections.find(it => it.id === endIdx)!.position;
    roads.push({
      id: roadId,
      name: verticalNames[j] || `纵向主干道${j + 1}`,
      start,
      end,
      baseFlow: 35 + rand() * 30,
      peakHours: [7, 8, 9, 17, 18, 19],
    });
    for (let i = 0; i < gridSize; i++) {
      const inter = intersections.find(it => it.id === idGrid[i][j])!;
      inter.connectedRoads.push(roadId);
    }
  }

  return { roads, intersections };
}

function computeRoadFlow(road: Road, hour: number, randFn: () => number): number {
  let flow = road.baseFlow;
  for (const peak of road.peakHours) {
    const isMorning = peak >= 6 && peak <= 10;
    const amplitude = isMorning ? 35 : 40;
    flow += amplitude * gaussian(hour, peak, 1.2);
  }
  const noise = (randFn() - 0.5) * 15;
  flow += noise;
  if (hour >= 0 && hour < 5) {
    flow *= 0.3 + 0.1 * Math.sin((hour / 5) * Math.PI);
  }
  return Math.max(0, Math.min(100, flow));
}

class TrafficDataGenerator {
  private network: RoadNetworkData;
  private hourlyData: Map<string, number[]>;

  constructor() {
    this.network = generateRoadNetwork();
    this.hourlyData = new Map();
    this.precompute();
  }

  private precompute(): void {
    for (const road of this.network.roads) {
      const flows: number[] = [];
      const randFn = seededRandom(road.baseFlow * 1000 + road.name.length);
      for (let s = 0; s < TOTAL_SAMPLES; s++) {
        const hour = (s / SAMPLES_PER_HOUR);
        flows.push(computeRoadFlow(road, hour, randFn));
      }
      this.hourlyData.set(road.id, flows);
    }
  }

  getRoadNetwork(): RoadNetworkData {
    return this.network;
  }

  getSnapshot(timeHour: number): TrafficSnapshot {
    const t = Math.max(0, Math.min(TOTAL_HOURS, timeHour));
    const exactIdx = t * SAMPLES_PER_HOUR;
    const idx0 = Math.floor(exactIdx);
    const idx1 = Math.min(idx0 + 1, TOTAL_SAMPLES - 1);
    const frac = exactIdx - idx0;

    const roads: RoadTraffic[] = [];
    let totalFlow = 0;

    for (const road of this.network.roads) {
      const series = this.hourlyData.get(road.id)!;
      const f0 = series[idx0];
      const f1 = series[idx1];
      const flow = lerp(f0, f1, frac);
      totalFlow += flow;
      roads.push({
        roadId: road.id,
        flow,
        width: flowToWidth(flow),
        color: flowToColor(flow),
      });
    }

    const averageFlow = roads.length > 0 ? totalFlow / roads.length : 0;

    return {
      timestamp: t,
      averageFlow,
      roads,
    };
  }

  getRandomSnapshot(baseTime: number, variance: number = 10): TrafficSnapshot {
    const roads: RoadTraffic[] = [];
    let totalFlow = 0;
    const baseSnapshot = this.getSnapshot(baseTime);

    for (const rt of baseSnapshot.roads) {
      const adjustment = (Math.random() - 0.5) * variance;
      const flow = Math.max(0, Math.min(100, rt.flow + adjustment));
      totalFlow += flow;
      roads.push({
        roadId: rt.roadId,
        flow,
        width: flowToWidth(flow),
        color: flowToColor(flow),
      });
    }

    const averageFlow = roads.length > 0 ? totalFlow / roads.length : 0;

    return {
      timestamp: baseTime,
      averageFlow,
      roads,
    };
  }
}

export const trafficDataGenerator = new TrafficDataGenerator();

export function getSnapshot(timeHour: number): TrafficSnapshot {
  return trafficDataGenerator.getSnapshot(timeHour);
}

export function getRoadNetwork(): RoadNetworkData {
  return trafficDataGenerator.getRoadNetwork();
}

export function getRandomSnapshot(baseTime: number, variance?: number): TrafficSnapshot {
  return trafficDataGenerator.getRandomSnapshot(baseTime, variance);
}

export { hexToRgb, rgbToHex };
export type { TrafficSnapshot, RoadNetworkData, Road, Intersection, RoadTraffic };
