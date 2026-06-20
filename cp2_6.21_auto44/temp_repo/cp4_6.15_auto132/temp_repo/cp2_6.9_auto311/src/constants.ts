import type { BellData } from './types';

function interpolateColor(color1: string, color2: string, factor: number): string {
  const hex = (x: string) => parseInt(x, 16);
  const r1 = hex(color1.slice(1, 3));
  const g1 = hex(color1.slice(3, 5));
  const b1 = hex(color1.slice(5, 7));
  const r2 = hex(color2.slice(1, 3));
  const g2 = hex(color2.slice(3, 5));
  const b2 = hex(color2.slice(5, 7));
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const BRONZE_COLOR = '#b87333';
const PATINA_COLOR = '#2e5e4e';

const bellNames = [
  { name: '黄钟', note: 'C4', freq: 261.6, size: 80 },
  { name: '大吕', note: 'C#4', freq: 277.2, size: 76 },
  { name: '太簇', note: 'D4', freq: 293.7, size: 72 },
  { name: '夹钟', note: 'D#4', freq: 311.1, size: 68 },
  { name: '姑洗', note: 'E4', freq: 329.6, size: 64 },
  { name: '仲吕', note: 'F4', freq: 349.2, size: 60 },
  { name: '蕤宾', note: 'F#4', freq: 370.0, size: 50 },
  { name: '林钟', note: 'G4', freq: 392.0, size: 47 },
  { name: '夷则', note: 'G#4', freq: 415.3, size: 44 },
  { name: '南吕', note: 'A4', freq: 440.0, size: 41 },
  { name: '无射', note: 'A#4', freq: 466.2, size: 35 },
  { name: '应钟', note: 'B4', freq: 493.9, size: 30 },
];

const inscriptions = [
  '黄钟', '大吕', '太簇', '夹钟', '姑洗', '仲吕',
  '蕤宾', '林钟', '夷则', '南吕', '无射', '应钟',
];

export const BELLS: BellData[] = bellNames.map((bell, index) => {
  const layer = index < 6 ? 'lower' : 'upper';
  const layerIndex = layer === 'lower' ? index : index - 6;
  const xSpacing = 1.2;
  const xStart = -2.5;
  const x = xStart + layerIndex * xSpacing;
  const y = layer === 'lower' ? 2.5 : 4.2;
  const z = 0;
  const colorFactor = index / 11;
  const color = interpolateColor(BRONZE_COLOR, PATINA_COLOR, colorFactor);

  return {
    id: index + 1,
    name: bell.name,
    note: bell.note,
    frequency: bell.freq,
    size: bell.size,
    color,
    position: [x, y, z] as [number, number, number],
    layer,
    inscription: inscriptions[index],
  };
});

export const COLORS = {
  background: '#1a1a1a',
  bronze: '#b87333',
  patina: '#2e5e4e',
  gold: '#ffd700',
  waveform: '#f0d080',
  frame: '#3e2723',
  ground: '#4a4a4a',
  accentOrange: '#ff8c00',
};

export const NOTE_COLORS = [
  '#ff6b6b', '#ffa502', '#ffd93d', '#6bcb77', '#4d96ff',
  '#845ec2', '#ff5e7e', '#f67280', '#c06c84', '#6c5b7b',
  '#355c7d', '#00adb5',
];
