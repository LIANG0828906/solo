export type ColorHex = string;
export type SequenceHash = string;

export interface GenerateResult {
  sequence: ColorHex[];
  hash: SequenceHash;
}

export const PRESET_COLORS: ColorHex[] = [
  '#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33A6', '#33FFF5',
  '#FFC300', '#C70039', '#900C3F', '#581845', '#1ABC9C', '#2ECC71',
  '#3498DB', '#9B59B6', '#34495E', '#F1C40F', '#E67E22', '#E74C3C',
  '#ECF0F1', '#95A5A6', '#BDC3C7', '#7F8C8D', '#2E2E2E', '#333333',
];

const REMOVE_16: ColorHex[] = ['#BDC3C7', '#7F8C8D', '#95A5A6', '#ECF0F1', '#34495E', '#581845', '#2E2E2E', '#333333'];
const REMOVE_12: ColorHex[] = ['#E74C3C', '#E67E22', '#C70039', '#900C3F'];

export function hashSequence(seq: ColorHex[]): SequenceHash {
  let h1 = 0xdeadbeef ^ 0x9e3779b9;
  let h2 = 0x41c6ce57 ^ 0x85ebca6b;
  for (let i = 0; i < seq.length; i++) {
    const s = i.toString(16) + '|' + seq[i];
    for (let j = 0; j < s.length; j++) {
      const ch = s.charCodeAt(j);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
  return 'ch_' + hex.toUpperCase();
}

export function matchSequence(selected: ColorHex[], targetHash: SequenceHash): boolean {
  return hashSequence(selected) === targetHash;
}

export function buildColorPool(level: number): ColorHex[] {
  let pool = [...PRESET_COLORS];
  if (level >= 3) {
    pool = pool.filter((c) => !REMOVE_16.includes(c));
  }
  if (level >= 5) {
    pool = pool.filter((c) => !REMOVE_12.includes(c));
  }
  return pool;
}

export function pickLevelTimeLimit(level: number): number {
  return level >= 5 ? 45 : 60;
}

export function generateCode(pool: ColorHex[]): GenerateResult {
  const n = pool.length;
  if (n < 5) {
    throw new Error('Color pool too small');
  }
  const idx: number[] = [];
  while (idx.length < 5) {
    const r = Math.floor(Math.random() * n);
    if (!idx.includes(r)) idx.push(r);
  }
  const sequence = idx.map((i) => pool[i]);
  return { sequence, hash: hashSequence(sequence) };
}

export function computePenaltyPerFail(level: number): number {
  return level >= 2 ? 5 : 0;
}

export function darkenColor(hex: ColorHex, percent: number = 0.1): ColorHex {
  const h = hex.replace('#', '');
  const num = parseInt(h, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const f = 1 - percent;
  const rr = Math.max(0, Math.min(255, Math.round(r * f)));
  const gg = Math.max(0, Math.min(255, Math.round(g * f)));
  const bb = Math.max(0, Math.min(255, Math.round(b * f)));
  return '#' + ((rr << 16) | (gg << 8) | bb).toString(16).padStart(6, '0').toUpperCase();
}
