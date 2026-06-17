import type { Crystal } from '../../store/gameStore';

const HEX_SIZE = 12;
const SQRT3 = Math.sqrt(3);
const HEX_WIDTH = 2 * HEX_SIZE;
const HEX_HEIGHT = SQRT3 * HEX_SIZE;
const GRID_COLS = 80;
const GRID_ROWS = 80;

export interface HexPos {
  q: number;
  r: number;
}

export function hexToPixel(q: number, r: number): { x: number; y: number } {
  const x = q * HEX_WIDTH * 0.75;
  const y = r * HEX_HEIGHT + (q & 1 ? HEX_HEIGHT * 0.5 : 0);
  return { x, y };
}

export function pixelToHex(px: number, py: number): HexPos {
  const q = Math.round(px / (HEX_WIDTH * 0.75));
  const adjustedY = py - (q & 1 ? HEX_HEIGHT * 0.5 : 0);
  const r = Math.round(adjustedY / HEX_HEIGHT);
  return { q: Math.max(0, Math.min(GRID_COLS - 1, q)), r: Math.max(0, Math.min(GRID_ROWS - 1, r)) };
}

function offsetToCube(q: number, r: number): { x: number; y: number; z: number } {
  const cx = q;
  const cz = r - (q - (q & 1)) / 2;
  const cy = -cx - cz;
  return { x: cx, y: cy, z: cz };
}

export function hexDistance(q1: number, r1: number, q2: number, r2: number): number {
  const a = offsetToCube(q1, r1);
  const b = offsetToCube(q2, r2);
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
}

export function getCanvasSize(): { width: number; height: number } {
  const maxQ = GRID_COLS - 1;
  const maxR = GRID_ROWS - 1;
  const lastHex = hexToPixel(maxQ, maxR);
  return {
    width: lastHex.x + HEX_SIZE + 2,
    height: lastHex.y + HEX_HEIGHT * 0.5 + 2,
  };
}

export function getPathWaypoints(): { x: number; y: number }[] {
  const hexWaypoints: HexPos[] = [
    { q: 5, r: 2 },
    { q: 74, r: 2 },
    { q: 74, r: 20 },
    { q: 5, r: 20 },
    { q: 5, r: 40 },
    { q: 74, r: 40 },
    { q: 74, r: 58 },
    { q: 5, r: 58 },
    { q: 40, r: 77 },
  ];
  return hexWaypoints.map((h) => hexToPixel(h.q, h.r));
}

export interface WaveFieldResult {
  amplitudes: Float32Array;
  cols: number;
  rows: number;
  step: number;
  calcTime: number;
}

export function calculateWaveField(
  crystals: Crystal[],
  time: number,
  forcedStep?: number
): WaveFieldResult {
  const startTime = performance.now();
  const baseStep = forcedStep ?? 1;
  const cols = Math.ceil(GRID_COLS / baseStep);
  const rows = Math.ceil(GRID_ROWS / baseStep);
  const amplitudes = new Float32Array(cols * rows);

  const temporalFreq = 2.5;
  const omega = 2 * Math.PI * temporalFreq;

  for (let cq = 0; cq < cols; cq++) {
    const gq = cq * baseStep;
    for (let cr = 0; cr < rows; cr++) {
      const gr = cr * baseStep;
      let totalAmp = 0;

      for (let i = 0; i < crystals.length; i++) {
        const crystal = crystals[i];
        const dist = hexDistance(gq, gr, crystal.q, crystal.r);
        const effectiveRadius = crystal.baseRadius;
        if (dist > effectiveRadius + 1) continue;

        const spatialFreq = (crystal.frequency + crystal.frequencyOffset) / 220;
        const k = 2 * Math.PI * spatialFreq / 3.0;

        const attenuation = 1 / Math.max(1, Math.sqrt(dist));
        const edgeFade = dist <= effectiveRadius ? 1 : Math.max(0, 1 - (dist - effectiveRadius));
        const wave = Math.sin(k * dist - omega * time);
        totalAmp += wave * attenuation * edgeFade;
      }

      amplitudes[cq * rows + cr] = totalAmp;
    }
  }

  const calcTime = performance.now() - startTime;

  let step = baseStep;
  if (forcedStep === undefined && calcTime > 12) {
    step = 2;
  }

  return { amplitudes, cols, rows, step, calcTime };
}

export function getAmplitudeAt(
  field: WaveFieldResult,
  q: number,
  r: number
): number {
  const fq = Math.floor(q / field.step);
  const fr = Math.floor(r / field.step);
  if (fq < 0 || fq >= field.cols || fr < 0 || fr >= field.rows) return 0;
  return field.amplitudes[fq * field.rows + fr];
}

export function amplitudeToColor(amplitude: number): string {
  const absAmp = Math.abs(amplitude);
  if (absAmp > 0.7) {
    const t = Math.min(1, (absAmp - 0.7) / 0.8);
    const r = 255;
    const g = Math.round(107 + (165 - 107) * (1 - t));
    const b = Math.round(53 * (1 - t));
    return `rgba(${r},${g},${b},${0.3 + t * 0.5})`;
  } else if (absAmp > 0.1) {
    const t = Math.min(1, absAmp / 0.7);
    const r = Math.round(58 + (114 - 58) * t);
    const g = Math.round(12 + (9 - 12) * t);
    const b = Math.round(163 + (183 - 163) * t);
    return `rgba(${r},${g},${b},${0.15 + t * 0.25})`;
  }
  return 'transparent';
}

export { HEX_SIZE, HEX_HEIGHT, HEX_WIDTH, GRID_COLS, GRID_ROWS, SQRT3 };
