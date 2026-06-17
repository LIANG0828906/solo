import { emojiSets, EmojiStyle, EmojiItem } from './emojiData';

export interface PixelBlock {
  col: number;
  row: number;
  r: number;
  g: number;
  b: number;
}

export interface MosaicCell {
  col: number;
  row: number;
  emoji: string;
  r: number;
  g: number;
  b: number;
  distance: number;
}

export function pixelate(image: HTMLImageElement, cellSize: number): PixelBlock[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  ctx.drawImage(image, 0, 0);

  const cols = Math.ceil(canvas.width / cellSize);
  const rows = Math.ceil(canvas.height / cellSize);
  const blocks: PixelBlock[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const sx = col * cellSize;
      const sy = row * cellSize;
      const sw = Math.min(cellSize, canvas.width - sx);
      const sh = Math.min(cellSize, canvas.height - sy);

      const imageData = ctx.getImageData(sx, sy, sw, sh);
      const data = imageData.data;
      let r = 0, g = 0, b = 0, count = 0;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 0) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
      }

      if (count > 0) {
        blocks.push({
          col,
          row,
          r: Math.round(r / count),
          g: Math.round(g / count),
          b: Math.round(b / count),
        });
      } else {
        blocks.push({ col, row, r: 255, g: 255, b: 255 });
      }
    }
  }

  return blocks;
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function matchEmoji(
  blocks: PixelBlock[],
  style: EmojiStyle,
  threshold: number,
): MosaicCell[] {
  const set = emojiSets[style];
  if (!set || set.length === 0) return [];

  const maxDist = 255 * Math.sqrt(3);
  const distThreshold = threshold * maxDist;

  return blocks.map(block => {
    let best: EmojiItem | null = null;
    let bestDist = Infinity;

    for (const item of set) {
      const d = colorDistance(block.r, block.g, block.b, item.r, item.g, item.b);
      if (d < bestDist) {
        bestDist = d;
        best = item;
      }
    }

    if (!best) {
      return {
        col: block.col,
        row: block.row,
        emoji: '⬜',
        r: block.r,
        g: block.g,
        b: block.b,
        distance: bestDist,
      };
    }

    if (bestDist > distThreshold) {
      return {
        col: block.col,
        row: block.row,
        emoji: best.char,
        r: block.r,
        g: block.g,
        b: block.b,
        distance: bestDist,
      };
    }

    return {
      col: block.col,
      row: block.row,
      emoji: best.char,
      r: block.r,
      g: block.g,
      b: block.b,
      distance: bestDist,
    };
  });
}
