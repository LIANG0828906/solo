import { v4 as uuidv4 } from 'uuid';

export type TopologyMode = 'torus' | 'trefoil' | 'mobius' | 'custom';
export type InteractionMode = 'edit' | 'play' | 'export';

export interface KnotConfig {
  id: string;
  type: TopologyMode;
  p?: number;
  q?: number;
  color: string;
  colorHex: number;
  center: [number, number, number];
  scale: number;
}

export interface ParticleData {
  id: string;
  knotId: string;
  position: [number, number, number];
  targetPosition: [number, number, number];
  pathProgress: number;
  color: string;
  colorHex: number;
  size: number;
}

export interface TopologyInfo {
  knotId: string;
  name: string;
  windingNumber: number;
  crossingNumber: number;
  energyValue: number;
  genus: number;
}

export interface TopologyResult {
  particles: ParticleData[];
  knots: KnotConfig[];
  knotInfos: TopologyInfo[];
  pathCache: Record<string, [number, number, number][]>;
}

export interface CalcConfig {
  mode: TopologyMode;
  particleCount: number;
  speed: number;
  knotCenters?: Record<string, [number, number, number]>;
}

const KNOT_COLORS: Array<{ str: string; hex: number }> = [
  { str: '#00D4FF', hex: 0x00d4ff },
  { str: '#FF2D95', hex: 0xff2d95 },
  { str: '#3DFFA2', hex: 0x3dffa2 },
  { str: '#FFB347', hex: 0xffb347 },
];

const DEFAULT_CENTERS: [number, number, number][] = [
  [2.2, 0, 0],
  [0, 0, 2.2],
  [-2.2, 0, 0],
  [0, 0, -2.2],
];

function hexToRgb(hex: number): [number, number, number] {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

function torusKnotPoint(theta: number, p: number, q: number, R: number, r: number): [number, number, number] {
  const cosQ = Math.cos(q * theta);
  return [
    (R + r * cosQ) * Math.cos(p * theta),
    (R + r * cosQ) * Math.sin(p * theta),
    r * Math.sin(q * theta),
  ];
}

function trefoilPoint(theta: number): [number, number, number] {
  const s = 0.42;
  return [
    s * (Math.sin(theta) + 2 * Math.sin(2 * theta)),
    s * (Math.cos(theta) - 2 * Math.cos(2 * theta)),
    s * (-Math.sin(3 * theta)),
  ];
}

function mobiusPoint(theta: number): [number, number, number] {
  const R = 1.2;
  const w = 0.35;
  const s = w * Math.sin(theta * 0.5);
  return [
    (R + s * Math.cos(theta * 0.5)) * Math.cos(theta),
    (R + s * Math.cos(theta * 0.5)) * Math.sin(theta),
    s * Math.sin(theta * 0.5),
  ];
}

function generatePath(type: TopologyMode, p: number, q: number, samples: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * Math.PI * 2;
    let pt: [number, number, number];
    switch (type) {
      case 'torus':
      default:
        pt = torusKnotPoint(t, p, q, 1.15, 0.48);
        break;
      case 'trefoil':
        pt = trefoilPoint(t);
        break;
      case 'mobius':
        pt = mobiusPoint(t);
        break;
    }
    points.push(pt);
  }
  return points;
}

function getKnotTypeAndParams(mode: TopologyMode, index: number): { type: TopologyMode; p: number; q: number; name: string } {
  if (mode === 'custom') {
    const variants = [
      { type: 'torus' as TopologyMode, p: 2, q: 3, name: 'T(2,3) 三叶环面结' },
      { type: 'torus' as TopologyMode, p: 3, q: 2, name: 'T(3,2) 镜像三叶结' },
      { type: 'torus' as TopologyMode, p: 2, q: 5, name: 'T(2,5) 五角结' },
      { type: 'torus' as TopologyMode, p: 5, q: 2, name: 'T(5,2) 索洛蒙结' },
    ];
    return variants[index % variants.length];
  }
  if (mode === 'trefoil') {
    return { type: 'trefoil', p: 0, q: 0, name: '三叶结 Trefoil' };
  }
  if (mode === 'mobius') {
    return { type: 'mobius', p: 0, q: 0, name: '莫比乌斯带 Mobius' };
  }
  const defaults = [
    { p: 2, q: 3, name: 'T(2,3) 环面结' },
    { p: 3, q: 4, name: 'T(3,4) 环面结' },
    { p: 2, q: 5, name: 'T(2,5) 环面结' },
    { p: 3, q: 5, name: 'T(3,5) 环面结' },
  ];
  return { type: 'torus', ...defaults[index % defaults.length] };
}

function computeTopologyInfo(cfg: KnotConfig, p: number, q: number, name: string): TopologyInfo {
  let windingNumber = 0;
  let crossingNumber = 0;
  let genus = 0;
  if (cfg.type === 'torus') {
    windingNumber = p;
    crossingNumber = Math.min(p, q) * (Math.max(p, q) - 1);
    genus = ((p - 1) * (q - 1)) / 2;
  } else if (cfg.type === 'trefoil') {
    windingNumber = 3;
    crossingNumber = 3;
    genus = 1;
  } else if (cfg.type === 'mobius') {
    windingNumber = 1;
    crossingNumber = 0;
    genus = 0;
  }
  const energyValue = Math.round((windingNumber * 1.2 + crossingNumber * 0.4 + genus * 2.3) * 100) / 100;
  return {
    knotId: cfg.id,
    name,
    windingNumber,
    crossingNumber,
    energyValue,
    genus,
  };
}

export function calculateTopology(config: CalcConfig): TopologyResult {
  const { mode, particleCount, knotCenters } = config;
  const perKnot = Math.max(25, Math.floor(particleCount / 4));
  const knots: KnotConfig[] = [];
  const knotInfos: TopologyInfo[] = [];
  const particles: ParticleData[] = [];
  const pathCache: Record<string, [number, number, number][]> = {};

  for (let i = 0; i < 4; i++) {
    const color = KNOT_COLORS[i];
    const { type, p, q, name } = getKnotTypeAndParams(mode, i);
    const center = knotCenters?.[`knot-${i}`] ?? DEFAULT_CENTERS[i];
    const id = `knot-${i}`;
    const knot: KnotConfig = {
      id,
      type,
      p,
      q,
      color: color.str,
      colorHex: color.hex,
      center,
      scale: 1,
    };
    knots.push(knot);

    const info = computeTopologyInfo(knot, p, q, name);
    knotInfos.push(info);

    const samples = 400;
    const rawPath = generatePath(type, p, q, samples);
    const scaledPath = rawPath.map(([x, y, z]) => [
      x + center[0],
      y + center[1],
      z + center[2],
    ] as [number, number, number]);
    pathCache[id] = scaledPath;

    for (let j = 0; j < perKnot; j++) {
      const progress = j / perKnot;
      const rawIdx = progress * samples;
      const i0 = Math.floor(rawIdx);
      const i1 = (i0 + 1) % samples;
      const f = rawIdx - i0;
      const p0 = scaledPath[i0];
      const p1 = scaledPath[i1];
      const pos: [number, number, number] = [
        p0[0] + (p1[0] - p0[0]) * f,
        p0[1] + (p1[1] - p0[1]) * f,
        p0[2] + (p1[2] - p0[2]) * f,
      ];
      particles.push({
        id: uuidv4(),
        knotId: id,
        position: [...pos] as [number, number, number],
        targetPosition: [...pos] as [number, number, number],
        pathProgress: progress,
        color: color.str,
        colorHex: color.hex,
        size: 0.085,
      });
    }
  }

  return { particles, knots, knotInfos, pathCache };
}

export function updateParticleProgress(
  particles: ParticleData[],
  pathCache: Record<string, [number, number, number][]>,
  deltaProgress: number,
  knotCenters: Record<string, [number, number, number]>,
): void {
  const samples = 400;
  for (const p of particles) {
    let progress = (p.pathProgress + deltaProgress) % 1;
    if (progress < 0) progress += 1;
    p.pathProgress = progress;
    const path = pathCache[p.knotId];
    if (!path) continue;
    const c = knotCenters[p.knotId] ?? [0, 0, 0];
    const rawIdx = progress * samples;
    const i0 = Math.floor(rawIdx) % samples;
    const i1 = (i0 + 1) % samples;
    const f = rawIdx - Math.floor(rawIdx);
    const p0 = path[i0];
    const p1 = path[i1];
    p.targetPosition = [
      (p0[0] + (p1[0] - p0[0]) * f),
      (p0[1] + (p1[1] - p0[1]) * f),
      (p0[2] + (p1[2] - p0[2]) * f),
    ];
  }
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVec3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export { hexToRgb };
