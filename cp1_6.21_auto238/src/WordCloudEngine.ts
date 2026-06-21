import { ShapeType, LayoutWord, LayoutResult, ColorTheme, Rect } from './types';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'as', 'was', 'are', 'be',
  'this', 'that', 'which', 'who', 'whom', 'its', 'his', 'her', 'their',
  'our', 'your', 'my', 'we', 'you', 'he', 'she', 'they', 'them', 'us',
  'me', 'not', 'no', 'do', 'does', 'did', 'has', 'have', 'had', 'will',
  'would', 'could', 'should', 'can', 'may', 'might', 'shall', 'if',
  'then', 'else', 'when', 'where', 'how', 'what', 'so', 'than', 'too',
  'very', 'just', 'about', 'up', 'out', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same',
  'also', 'into', 'over', 'after', 'before', 'between', 'through',
  'during', 'above', 'below', 'under', 'again', 'further', 'once',
  'here', 'there', 'any', 'these', 'those', 'am', 'been', 'being',
  'because', 'until', 'while', 'against', 'off', 'like', 'even',
  'well', 'back', 'still', 'way', 'take', 'make', 'get', 'go',
  'come', 'know', 'see', 'think', 'say', 'tell', 'use', 'find',
  'give', 'good', 'new', 'first', 'last', 'long', 'great', 'little',
  'just', 'than', 'de', 'la', 'le', 'et', 'en', 'du', 'un', 'les',
  'des', 'est', 'que', 'qui', 'dans', 'pour', 'pas', 'sur', 'ce',
  'il', 'ne', 'se', 'ce', 'son', 'sa', 'ses', 'au', 'aux', 'par',
]);

function parseText(text: string, deletedWords: Set<string>): Map<string, number> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g, ' ')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 1 &&
        !STOP_WORDS.has(w) &&
        !/^\d+$/.test(w) &&
        !deletedWords.has(w)
    );

  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }
  return freq;
}

function isInShape(
  x: number,
  y: number,
  shape: ShapeType,
  cx: number,
  cy: number,
  size: number
): boolean {
  const nx = (x - cx) / size;
  const ny = (y - cy) / size;

  switch (shape) {
    case 'circle':
      return nx * nx + ny * ny <= 1;

    case 'heart': {
      const hx = nx * 1.2;
      const hy = -ny * 1.2 + 0.4;
      const val = Math.pow(hx * hx + hy * hy - 1, 3) - hx * hx * hy * hy * hy;
      return val <= 0;
    }

    case 'cloud': {
      const circles = [
        { cx: 0, cy: -0.05, r: 0.52 },
        { cx: -0.35, cy: 0.08, r: 0.36 },
        { cx: 0.35, cy: 0.08, r: 0.36 },
        { cx: -0.2, cy: -0.32, r: 0.3 },
        { cx: 0.2, cy: -0.32, r: 0.3 },
        { cx: 0, cy: -0.48, r: 0.24 },
        { cx: -0.5, cy: 0.15, r: 0.25 },
        { cx: 0.5, cy: 0.15, r: 0.25 },
      ];
      return circles.some((c) => {
        const dx = nx - c.cx;
        const dy = ny - c.cy;
        return dx * dx + dy * dy <= c.r * c.r;
      }) && ny < 0.55;
    }

    default:
      return true;
  }
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  const pad = 6;
  return !(
    a.x + a.width + pad < b.x ||
    b.x + b.width + pad < a.x ||
    a.y + a.height + pad < b.y ||
    b.y + b.height + pad < a.y
  );
}

export function generateLayout(
  text: string,
  minWords: number,
  shape: ShapeType,
  theme: ColorTheme,
  canvasWidth: number,
  canvasHeight: number,
  deletedWords: Set<string> = new Set()
): LayoutResult {
  const freqMap = parseText(text, deletedWords);
  const sorted = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, minWords);

  if (sorted.length === 0) {
    return { words: [], canvasWidth, canvasHeight };
  }

  const maxFreq = sorted[0][1];
  const minFreq = sorted[sorted.length - 1][1];
  const freqRange = maxFreq - minFreq || 1;

  const offscreen = document.createElement('canvas');
  const ctx = offscreen.getContext('2d')!;

  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const shapeSize = Math.min(canvasWidth, canvasHeight) * 0.42;

  const minFontSize = 13;
  const maxFontSize = Math.min(68, canvasWidth / 8);

  const words: LayoutWord[] = [];
  const placedRects: Rect[] = [];

  for (const [wordText, freq] of sorted) {
    const normalized = (freq - minFreq) / freqRange;
    const fontSize = Math.round(minFontSize + normalized * (maxFontSize - minFontSize));
    const rotation = Math.random() < 0.25 ? (Math.random() < 0.5 ? 90 : -90) : 0;

    ctx.font = `bold ${fontSize}px "Segoe UI", "Microsoft YaHei", sans-serif`;
    const metrics = ctx.measureText(wordText);
    const textWidth = metrics.width + 4;
    const textHeight = fontSize * 1.25;

    let wordWidth: number;
    let wordHeight: number;
    if (rotation === 0) {
      wordWidth = textWidth;
      wordHeight = textHeight;
    } else {
      wordWidth = textHeight;
      wordHeight = textWidth;
    }

    const colorIndex = Math.floor(Math.random() * theme.colors.length);
    const color = theme.colors[colorIndex];

    let placed = false;
    const maxSteps = 3000;

    for (let step = 0; step < maxSteps; step++) {
      const angle = step * 0.18;
      const radius = 1 + step * 1.2;
      const px = cx + radius * Math.cos(angle);
      const py = cy + radius * Math.sin(angle);

      const left = px - wordWidth / 2;
      const top = py - wordHeight / 2;

      const rect: Rect = { x: left, y: top, width: wordWidth, height: wordHeight };

      const corners = [
        [left, top],
        [left + wordWidth, top],
        [left, top + wordHeight],
        [left + wordWidth, top + wordHeight],
        [px, py],
      ];

      const inShape = corners.every(([cx2, cy2]) =>
        isInShape(cx2, cy2, shape, cx, cy, shapeSize)
      );

      if (!inShape) continue;

      const hasCollision = placedRects.some((pr) => rectsOverlap(rect, pr));

      if (!hasCollision) {
        words.push({
          text: wordText,
          frequency: freq,
          fontSize,
          color,
          rotation,
          x: px,
          y: py,
          width: wordWidth,
          height: wordHeight,
        });
        placedRects.push(rect);
        placed = true;
        break;
      }
    }
  }

  return { words, canvasWidth, canvasHeight };
}
