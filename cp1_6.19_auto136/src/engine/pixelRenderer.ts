import { BodyPart, OutfitState, AnimationFrame } from '../types';

const GRID_SIZE = 16;
const TRANSPARENT = 'transparent';

interface PixelRegion {
  part: BodyPart;
  pixels: [number, number][];
}

const basePixelMap: PixelRegion[] = [
  { part: BodyPart.HAIR, pixels: [
    [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1],
    [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2],
    [4, 3], [5, 3], [10, 3], [11, 3],
  ]},
  { part: BodyPart.SKIN, pixels: [
    [6, 3], [7, 3], [8, 3], [9, 3],
    [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4],
    [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5],
    [6, 6], [7, 6], [8, 6], [9, 6],
  ]},
  { part: BodyPart.ACCESSORY, pixels: [
    [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0],
    [3, 1], [12, 1],
    [3, 2], [12, 2],
  ]},
  { part: BodyPart.TOP, pixels: [
    [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7],
    [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8],
    [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9],
    [5, 10], [6, 10], [7, 10], [8, 10], [9, 10], [10, 10],
  ]},
  { part: BodyPart.BOTTOM, pixels: [
    [5, 11], [6, 11], [7, 11], [8, 11], [9, 11], [10, 11],
    [5, 12], [6, 12], [9, 12], [10, 12],
  ]},
];

const leftLegPixels: [number, number][] = [
  [5, 13], [6, 13],
  [5, 14], [6, 14],
];

const rightLegPixels: [number, number][] = [
  [9, 13], [10, 13],
  [9, 14], [10, 14],
];

const leftShoePixels: [number, number][] = [
  [5, 15], [6, 15],
];

const rightShoePixels: [number, number][] = [
  [9, 15], [10, 15],
];

const leftArmPixels: [number, number][] = [
  [3, 7], [3, 8], [3, 9],
  [4, 10],
];

const rightArmPixels: [number, number][] = [
  [12, 7], [12, 8], [12, 9],
  [11, 10],
];

const weaponPixels: [number, number][] = [
  [13, 5], [13, 6], [13, 7], [13, 8], [13, 9],
  [12, 5], [14, 5],
];

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [255, 255, 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function interpolateColor(color1: string, color2: string, factor: number): string {
  if (color1 === TRANSPARENT || color2 === TRANSPARENT) {
    return factor < 0.5 ? color1 : color2;
  }
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  return rgbToHex(
    r1 + (r2 - r1) * factor,
    g1 + (g2 - g1) * factor,
    b1 + (b2 - b1) * factor
  );
}

function applyTopPattern(
  matrix: string[][],
  color: string,
  pattern: string | undefined
): void {
  if (pattern === 'stripes') {
    for (let y = 7; y <= 10; y++) {
      for (let x = 4; x <= 11; x++) {
        if (matrix[y][x] === color && y % 2 === 0) {
          matrix[y][x] = interpolateColor(color, '#FFFFFF', 0.3);
        }
      }
    }
  } else if (pattern === 'checker') {
    for (let y = 7; y <= 10; y++) {
      for (let x = 4; x <= 11; x++) {
        if (matrix[y][x] === color && (x + y) % 2 === 0) {
          matrix[y][x] = interpolateColor(color, '#000000', 0.2);
        }
      }
    }
  }
}

export function generatePixelMatrix(
  outfit: OutfitState,
  frame: AnimationFrame,
  flashStates: Map<BodyPart, number>,
  currentTime: number,
  topPattern?: string
): string[][] {
  const matrix: string[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(TRANSPARENT));

  const getColor = (part: BodyPart): string => {
    const baseColor = outfit[part];
    const flashStart = flashStates.get(part);
    if (flashStart !== undefined) {
      const elapsed = currentTime - flashStart;
      const duration = 200;
      if (elapsed < duration) {
        const factor = elapsed / duration;
        return interpolateColor('#FFFFFF', baseColor, factor);
      }
    }
    return baseColor;
  };

  for (const region of basePixelMap) {
    if (region.part === BodyPart.ACCESSORY && outfit[BodyPart.ACCESSORY] === TRANSPARENT) {
      continue;
    }
    const color = getColor(region.part);
    for (const [x, y] of region.pixels) {
      const offsetY = Math.round(frame.yOffset);
      const newY = y + offsetY;
      if (newY >= 0 && newY < GRID_SIZE) {
        matrix[newY][x] = color;
      }
    }
  }

  applyTopPattern(matrix, outfit[BodyPart.TOP], topPattern);

  const bottomColor = getColor(BodyPart.BOTTOM);
  const leftLegOffset = Math.round(frame.leftLegOffset);
  for (const [x, y] of leftLegPixels) {
    const newY = y + Math.round(frame.yOffset) + leftLegOffset;
    if (newY >= 0 && newY < GRID_SIZE) {
      matrix[newY][x] = bottomColor;
    }
  }

  const rightLegOffset = Math.round(frame.rightLegOffset);
  for (const [x, y] of rightLegPixels) {
    const newY = y + Math.round(frame.yOffset) + rightLegOffset;
    if (newY >= 0 && newY < GRID_SIZE) {
      matrix[newY][x] = bottomColor;
    }
  }

  const shoeColor = getColor(BodyPart.SHOES);
  for (const [x, y] of leftShoePixels) {
    const newY = y + Math.round(frame.yOffset) + leftLegOffset;
    if (newY >= 0 && newY < GRID_SIZE) {
      matrix[newY][x] = shoeColor;
    }
  }
  for (const [x, y] of rightShoePixels) {
    const newY = y + Math.round(frame.yOffset) + rightLegOffset;
    if (newY >= 0 && newY < GRID_SIZE) {
      matrix[newY][x] = shoeColor;
    }
  }

  const skinColor = getColor(BodyPart.SKIN);
  const leftArmOffset = Math.round(frame.leftArmOffset);
  for (const [x, y] of leftArmPixels) {
    const newY = y + Math.round(frame.yOffset) + leftArmOffset;
    if (newY >= 0 && newY < GRID_SIZE) {
      matrix[newY][x] = skinColor;
    }
  }

  const rightArmOffset = Math.round(frame.rightArmOffset);
  for (const [x, y] of rightArmPixels) {
    const newY = y + Math.round(frame.yOffset) + rightArmOffset;
    if (newY >= 0 && newY < GRID_SIZE) {
      matrix[newY][x] = skinColor;
    }
  }

  if (outfit[BodyPart.WEAPON] !== TRANSPARENT) {
    const weaponColor = getColor(BodyPart.WEAPON);
    for (const [x, y] of weaponPixels) {
      const newY = y + Math.round(frame.yOffset) + rightArmOffset;
      if (newY >= 0 && newY < GRID_SIZE && x >= 0 && x < GRID_SIZE) {
        matrix[newY][x] = weaponColor;
      }
    }
  }

  return matrix;
}

export function drawToCanvas(
  ctx: CanvasRenderingContext2D,
  matrix: string[][],
  pixelSize: number
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      const color = matrix[y][x];
      if (color !== TRANSPARENT) {
        ctx.fillStyle = color;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }
  }
}

export function drawWardrobeIcon(
  ctx: CanvasRenderingContext2D,
  color: string,
  size: number = 64
): void {
  ctx.clearRect(0, 0, size, size);
  
  const pixelSize = size / 16;
  
  for (let y = 2; y < 14; y++) {
    for (let x = 4; x < 12; x++) {
      const dx = x - 8;
      const dy = y - 8;
      if (dx * dx + dy * dy < 30) {
        ctx.fillStyle = color;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }
  }
  
  ctx.fillStyle = interpolateColor(color, '#000000', 0.2);
  for (let y = 3; y < 13; y++) {
    ctx.fillRect(4 * pixelSize, y * pixelSize, pixelSize / 2, pixelSize);
  }
  for (let x = 5; x < 12; x++) {
    ctx.fillRect(x * pixelSize, 13 * pixelSize, pixelSize, pixelSize / 2);
  }
}
