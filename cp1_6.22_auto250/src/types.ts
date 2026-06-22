export type CoolingSolution =
  | 'copper_heat_sink'
  | 'aluminum_heat_sink'
  | 'thermal_paste'
  | 'microchannel'
  | 'tec';

export interface SimParams {
  solution: CoolingSolution;
  power: number;
  ambientTemp: number;
}

export interface SimMetrics {
  maxTemp: number;
  avgTemp: number;
  thermalResistance: number;
  coolingEfficiency: number;
  noCoolingMaxTemp: number;
}

export interface GridConfig {
  chipSize: [number, number, number];
  substrateSize: [number, number, number];
  heatSinkSize: [number, number, number];
  resolution: number;
}

export interface SolutionProperties {
  thermalConductivity: number;
  convectionCoeff: number;
  particleDensity: number;
  label: string;
  shortLabel: string;
}

export interface HeatFluxVec {
  x: number;
  y: number;
  z: number;
}

export interface ThermalResult {
  temperatures: number[][][];
  heatFlux: HeatFluxVec[][][];
  gridSize: [number, number, number];
  nodePositions: Array<{ pos: [number, number, number]; region: 'chip' | 'substrate' | 'heatSink' }>;
}

export interface ParticleData {
  positions: Float32Array;
  colors: Float32Array;
  velocities: Float32Array;
  count: number;
}

export interface VertexTempSample {
  meshKey: 'chip' | 'substrate' | 'heatSink';
  vertexIndex: number;
  worldPos: [number, number, number];
}

export const COOLING_SOLUTIONS: Record<CoolingSolution, SolutionProperties> = {
  copper_heat_sink: {
    thermalConductivity: 401,
    convectionCoeff: 25,
    particleDensity: 1.0,
    label: '铜散热片',
    shortLabel: 'Cu',
  },
  aluminum_heat_sink: {
    thermalConductivity: 237,
    convectionCoeff: 20,
    particleDensity: 0.9,
    label: '铝散热片',
    shortLabel: 'Al',
  },
  thermal_paste: {
    thermalConductivity: 350,
    convectionCoeff: 35,
    particleDensity: 1.2,
    label: '导热膏+散热片',
    shortLabel: 'Paste+HS',
  },
  microchannel: {
    thermalConductivity: 420,
    convectionCoeff: 120,
    particleDensity: 2.0,
    label: '微通道液冷',
    shortLabel: 'Liquid',
  },
  tec: {
    thermalConductivity: 380,
    convectionCoeff: 80,
    particleDensity: 1.5,
    label: '热电制冷',
    shortLabel: 'TEC',
  },
};

export const COLOR_LUT: Array<[number, number, number]> = [
  [0.118, 0.565, 1.0],
  [0.0, 0.749, 1.0],
  [0.0, 1.0, 1.0],
  [0.0, 1.0, 0.6],
  [0.0, 1.0, 0.0],
  [0.6, 1.0, 0.0],
  [1.0, 1.0, 0.0],
  [1.0, 0.75, 0.0],
  [1.0, 0.4, 0.0],
  [1.0, 0.27, 0.0],
];

export function tempToColor(
  temp: number,
  tMin: number,
  tMax: number,
): [number, number, number] {
  if (tMax <= tMin) return COLOR_LUT[0];
  const clamped = Math.max(0, Math.min(1, (temp - tMin) / (tMax - tMin)));
  const scaled = clamped * (COLOR_LUT.length - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const c0 = COLOR_LUT[Math.min(idx, COLOR_LUT.length - 1)];
  const c1 = COLOR_LUT[Math.min(idx + 1, COLOR_LUT.length - 1)];
  return [
    c0[0] + (c1[0] - c0[0]) * frac,
    c0[1] + (c1[1] - c0[1]) * frac,
    c0[2] + (c1[2] - c0[2]) * frac,
  ];
}
