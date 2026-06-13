import { SimplexNoise, waveRipple, fbmNoise } from './algorithms';

export type GridType = 'square' | 'hexagon' | 'triangle';

export interface MosaicCell {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  shape: GridType;
  rotation: number;
  scale: number;
  row: number;
  col: number;
}

export interface GenerateParams {
  palette: string[];
  gridType: GridType;
  density: number;
  seed?: number;
  canvasWidth: number;
  canvasHeight: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function interpolateColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return rgbToHex(
    c1.r + (c2.r - c1.r) * t,
    c1.g + (c2.g - c1.g) * t,
    c1.b + (c2.b - c1.b) * t
  );
}

function getColorFromPalette(
  palette: string[],
  value: number,
  blendMode: 'smooth' | 'stepped' = 'smooth'
): string {
  const normalized = (value + 1) / 2;
  const index = normalized * (palette.length - 1);

  if (blendMode === 'stepped') {
    return palette[Math.floor(Math.min(Math.max(index, 0), palette.length - 1))];
  }

  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const t = index - lower;

  if (lower === upper) {
    return palette[lower];
  }

  return interpolateColor(
    palette[Math.max(0, Math.min(lower, palette.length - 1))],
    palette[Math.max(0, Math.min(upper, palette.length - 1))],
    t
  );
}

export function generatePattern(params: GenerateParams): MosaicCell[] {
  const { palette, gridType, density, seed, canvasWidth, canvasHeight } = params;
  const actualSeed = seed ?? Math.random() * 10000;
  const noise = new SimplexNoise(actualSeed);
  const cells: MosaicCell[] = [];

  const cols = density;
  const rows = Math.floor(density * (canvasHeight / canvasWidth));
  const cellWidth = canvasWidth / cols;
  const cellHeight = canvasHeight / rows;

  const time = actualSeed % 1000;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let x = col * cellWidth;
      let y = row * cellHeight;
      let w = cellWidth;
      let h = cellHeight;

      if (gridType === 'hexagon') {
        const hexWidth = cellWidth;
        const hexHeight = cellWidth * Math.sqrt(3) / 2;
        const offset = row % 2 === 0 ? 0 : hexWidth / 2;
        x = col * hexWidth + offset;
        y = row * hexHeight * 0.75;
        w = hexWidth;
        h = hexHeight;
      } else if (gridType === 'triangle') {
        const triWidth = cellWidth;
        const triHeight = cellWidth * Math.sqrt(3) / 2;
        y = row * triHeight;
        w = triWidth;
        h = triHeight;
      }

      const nx = col / cols * 4;
      const ny = row / rows * 4;

      const noiseVal = fbmNoise(noise, nx, ny, 4);
      const rippleVal = waveRipple(col * 0.3, row * 0.3, time, 4);
      const combined = noiseVal * 0.6 + rippleVal * 0.4;

      const color = getColorFromPalette(palette, combined, 'smooth');

      const detailNoise = noise.noise2D(nx * 3, ny * 3);
      const scale = 0.9 + detailNoise * 0.1;
      const rotation = noise.noise2D(nx * 2, ny * 2) * 10;

      cells.push({
        id: `cell-${row}-${col}`,
        x,
        y,
        width: w,
        height: h,
        color,
        shape: gridType,
        rotation,
        scale,
        row,
        col,
      });
    }
  }

  return cells;
}

export function updateCellColor(
  cells: MosaicCell[],
  row: number,
  col: number,
  color: string
): MosaicCell[] {
  return cells.map((cell) =>
    cell.row === row && cell.col === col ? { ...cell, color } : cell
  );
}

export function updateRegionColor(
  cells: MosaicCell[],
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  color: string
): MosaicCell[] {
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);

  return cells.map((cell) =>
    cell.row >= minRow &&
    cell.row <= maxRow &&
    cell.col >= minCol &&
    cell.col <= maxCol
      ? { ...cell, color }
      : cell
  );
}
