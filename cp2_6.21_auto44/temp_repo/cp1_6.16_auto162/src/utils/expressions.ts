export type ExpressionTemplate = {
  id: string;
  name: string;
  pattern: (string | null)[][];
};

const E = '#111111';
const W = '#FFFFFF';
const S = '#FFB6C1';
const H = '#FFD700';
const B = '#87CEEB';
const R = '#FF6B6B';
const T = '#FF69B4';
const O = null;

function create32x32(pattern: (string | null)[][]): (string | null)[][] {
  const full: (string | null)[][] = [];
  for (let y = 0; y < 32; y++) {
    full[y] = [];
    for (let x = 0; x < 32; x++) {
      full[y][x] = null;
    }
  }
  const h = pattern.length;
  const w = pattern[0]?.length || 0;
  const offsetY = Math.floor((32 - h) / 2);
  const offsetX = Math.floor((32 - w) / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (pattern[y][x] !== null) {
        full[y + offsetY][x + offsetX] = pattern[y][x];
      }
    }
  }
  return full;
}

const happy = [
  [O, O, H, H, H, H, H, H, H, H, H, H, O, O],
  [O, H, H, H, H, H, H, H, H, H, H, H, H, O],
  [H, H, W, W, O, O, O, O, O, O, W, W, H, H],
  [H, H, W, E, W, O, O, O, O, W, E, W, H, H],
  [H, H, W, W, O, O, O, O, O, O, W, W, H, H],
  [H, H, O, O, O, O, O, O, O, O, O, O, H, H],
  [H, H, O, S, S, O, O, O, O, S, S, O, H, H],
  [H, H, O, S, S, O, O, O, O, S, S, O, H, H],
  [H, H, O, O, O, O, O, O, O, O, O, O, H, H],
  [H, H, O, O, E, E, E, E, E, E, O, O, H, H],
  [H, H, O, E, E, E, E, E, E, E, E, O, H, H],
  [O, H, H, E, E, E, E, E, E, E, E, H, H, O],
  [O, O, H, H, H, H, H, H, H, H, H, H, O, O],
  [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
];

const surprised = [
  [O, O, H, H, H, H, H, H, H, H, H, H, O, O],
  [O, H, H, H, H, H, H, H, H, H, H, H, H, O],
  [H, H, W, W, W, O, O, O, O, W, W, W, H, H],
  [H, H, W, E, E, W, O, O, W, E, E, W, H, H],
  [H, H, W, E, E, W, O, O, W, E, E, W, H, H],
  [H, H, W, W, W, O, O, O, O, W, W, W, H, H],
  [H, H, O, O, O, O, O, O, O, O, O, O, H, H],
  [H, H, O, O, O, O, O, O, O, O, O, O, H, H],
  [H, H, O, O, O, E, E, E, E, O, O, O, H, H],
  [H, H, O, O, E, E, E, E, E, E, O, O, H, H],
  [H, H, O, O, E, E, O, O, E, E, O, O, H, H],
  [H, H, O, O, E, E, E, E, E, E, O, O, H, H],
  [H, H, O, O, O, E, E, E, E, O, O, O, H, H],
  [O, H, H, O, O, O, O, O, O, O, O, H, H, O],
];

const angry = [
  [O, O, R, R, R, R, R, R, R, R, R, R, O, O],
  [E, R, R, R, R, R, R, R, R, R, R, R, R, E],
  [R, R, E, E, O, O, O, O, O, O, E, E, R, R],
  [R, E, E, E, E, E, O, O, E, E, E, E, E, R],
  [R, R, W, W, W, O, O, O, O, W, W, W, R, R],
  [R, R, W, E, W, O, O, O, O, W, E, W, R, R],
  [R, R, W, W, W, O, O, O, O, W, W, W, R, R],
  [R, R, O, O, O, O, O, O, O, O, O, O, R, R],
  [R, R, O, O, O, O, O, O, O, O, O, O, R, R],
  [R, R, O, E, E, E, E, E, E, E, E, O, R, R],
  [R, R, E, E, E, E, E, E, E, E, E, E, R, R],
  [R, R, E, E, E, E, E, E, E, E, E, E, R, R],
  [O, R, R, O, O, O, O, O, O, O, O, R, R, O],
  [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
];

const crying = [
  [O, O, H, H, H, H, H, H, H, H, H, H, O, O],
  [O, H, H, H, H, H, H, H, H, H, H, H, H, O],
  [H, H, W, W, W, O, O, O, O, W, W, W, H, H],
  [H, H, W, E, W, O, O, O, O, W, E, W, H, H],
  [H, H, W, W, W, O, O, O, O, W, W, W, H, H],
  [B, H, B, B, O, O, O, O, O, O, B, B, H, B],
  [B, H, B, B, O, O, O, O, O, O, B, B, H, B],
  [B, H, O, O, O, O, O, O, O, O, O, O, H, B],
  [B, O, O, O, O, O, O, O, O, O, O, O, O, B],
  [H, H, O, E, E, E, E, E, E, E, E, O, H, H],
  [H, H, E, E, E, E, E, E, E, E, E, E, H, H],
  [O, H, H, E, E, E, E, E, E, E, E, H, H, O],
  [O, O, H, H, H, H, H, H, H, H, H, H, O, O],
  [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
];

const tongue = [
  [O, O, H, H, H, H, H, H, H, H, H, H, O, O],
  [O, H, H, H, H, H, H, H, H, H, H, H, H, O],
  [H, H, W, W, O, O, O, O, O, O, W, W, H, H],
  [H, H, W, E, W, O, O, O, O, W, E, W, H, H],
  [H, H, W, W, O, O, O, O, O, O, W, W, H, H],
  [H, H, O, O, O, O, O, O, O, O, O, O, H, H],
  [H, H, O, S, S, O, O, O, O, S, S, O, H, H],
  [H, H, O, O, O, O, O, O, O, O, O, O, H, H],
  [H, H, O, E, E, E, E, E, E, O, O, O, H, H],
  [H, H, E, E, E, E, E, E, E, E, E, O, H, H],
  [H, H, E, E, T, T, T, T, T, E, E, E, H, H],
  [O, H, H, E, T, T, T, T, T, E, H, H, H, O],
  [O, O, H, H, H, H, H, H, H, H, H, H, O, O],
  [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
];

const wink = [
  [O, O, H, H, H, H, H, H, H, H, H, H, O, O],
  [O, H, H, H, H, H, H, H, H, H, H, H, H, O],
  [H, H, W, W, W, O, O, O, O, E, E, E, H, H],
  [H, H, W, E, W, O, O, O, O, O, O, O, H, H],
  [H, H, W, W, W, O, O, O, O, E, E, E, H, H],
  [H, H, O, O, O, O, O, O, O, O, O, O, H, H],
  [H, H, O, S, S, O, O, O, O, S, S, O, H, H],
  [H, H, O, O, O, O, O, O, O, O, O, O, H, H],
  [H, H, O, O, E, E, E, E, E, E, O, O, H, H],
  [H, H, O, E, E, E, E, E, E, E, E, O, H, H],
  [O, H, H, E, E, E, E, E, E, E, E, H, H, O],
  [O, O, H, H, H, H, H, H, H, H, H, H, O, O],
  [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
  [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
];

const awkward = [
  [O, O, H, H, H, H, H, H, H, H, H, H, O, O],
  [O, H, H, H, H, H, H, H, H, H, H, H, H, O],
  [H, H, W, W, O, O, O, O, O, O, W, W, H, H],
  [H, H, W, E, O, O, O, O, O, O, E, W, H, H],
  [H, H, W, W, O, O, O, O, O, O, W, W, H, H],
  [H, H, O, O, O, O, O, O, O, O, O, O, H, H],
  [H, S, S, S, S, O, O, O, O, S, S, S, S, H],
  [H, S, S, S, S, O, O, O, O, S, S, S, S, H],
  [H, H, O, O, O, O, O, O, O, O, O, O, H, H],
  [H, H, O, E, E, E, E, E, E, E, E, O, H, H],
  [H, H, E, E, E, E, E, E, E, E, E, E, H, H],
  [O, H, H, E, E, E, E, E, E, E, E, H, H, O],
  [O, O, H, H, H, H, H, H, H, H, H, H, O, O],
  [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
];

const speechless = [
  [O, O, H, H, H, H, H, H, H, H, H, H, O, O],
  [O, H, H, H, H, H, H, H, H, H, H, H, H, O],
  [H, H, W, W, W, O, O, O, O, W, W, W, H, H],
  [H, H, W, E, E, W, O, O, W, E, E, W, H, H],
  [H, H, W, E, E, W, O, O, W, E, E, W, H, H],
  [H, H, W, W, W, O, O, O, O, W, W, W, H, H],
  [H, H, O, O, O, O, O, O, O, O, O, O, H, H],
  [H, H, O, O, O, O, O, O, O, O, O, O, H, H],
  [H, H, O, O, O, O, O, O, O, O, O, O, H, H],
  [H, H, O, E, E, E, E, E, E, E, E, O, H, H],
  [H, H, O, E, E, E, E, E, E, E, E, O, H, H],
  [O, H, H, O, O, O, O, O, O, O, O, H, H, O],
  [O, O, H, H, H, H, H, H, H, H, H, H, O, O],
  [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
];

export const EXPRESSIONS: ExpressionTemplate[] = [
  { id: 'happy', name: '开心', pattern: create32x32(happy) },
  { id: 'surprised', name: '惊讶', pattern: create32x32(surprised) },
  { id: 'angry', name: '生气', pattern: create32x32(angry) },
  { id: 'crying', name: '哭泣', pattern: create32x32(crying) },
  { id: 'tongue', name: '吐舌', pattern: create32x32(tongue) },
  { id: 'wink', name: '眨眼', pattern: create32x32(wink) },
  { id: 'awkward', name: '尴尬', pattern: create32x32(awkward) },
  { id: 'speechless', name: '无语', pattern: create32x32(speechless) },
];

export function getExpressionById(id: string): ExpressionTemplate | undefined {
  return EXPRESSIONS.find((e) => e.id === id);
}
