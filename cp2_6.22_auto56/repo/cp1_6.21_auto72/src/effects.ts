export type FilterType = 'none' | 'invert' | 'mirror-h' | 'mirror-v' | 'blur';

export function invertColor(hex: string): string {
  if (!hex) return hex;
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = 255 - parseInt(h.substring(0, 2), 16);
  const g = 255 - parseInt(h.substring(2, 4), 16);
  const b = 255 - parseInt(h.substring(4, 6), 16);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function applyInvert(grid: (string | null)[][]): (string | null)[][] {
  return grid.map(row =>
    row.map(cell => (cell ? invertColor(cell) : cell))
  );
}

export function applyMirrorHorizontal(grid: (string | null)[][]): (string | null)[][] {
  const size = grid.length;
  const newGrid = grid.map(row => [...row]);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < Math.floor(size / 2); x++) {
      newGrid[y][size - 1 - x] = grid[y][x];
    }
  }
  return newGrid;
}

export function applyMirrorVertical(grid: (string | null)[][]): (string | null)[][] {
  const size = grid.length;
  const newGrid = grid.map(row => [...row]);
  for (let y = 0; y < Math.floor(size / 2); y++) {
    for (let x = 0; x < size; x++) {
      newGrid[size - 1 - y][x] = grid[y][x];
    }
  }
  return newGrid;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '');
  if (h.length !== 6) return null;
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
}

export function applyBlurEdges(grid: (string | null)[][]): (string | null)[][] {
  const size = grid.length;
  const newGrid = grid.map(row => [...row]);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const current = grid[y][x];
      if (current) {
        const neighbors: { r: number; g: number; b: number }[] = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < size && nx >= 0 && nx < size && grid[ny][nx]) {
              const rgb = hexToRgb(grid[ny][nx]!);
              if (rgb) neighbors.push(rgb);
            }
          }
        }
        if (neighbors.length > 0 && neighbors.length < 8) {
          const curRgb = hexToRgb(current);
          if (curRgb) {
            const avgR = (curRgb.r + neighbors.reduce((s, n) => s + n.r, 0) / neighbors.length) / 2;
            const avgG = (curRgb.g + neighbors.reduce((s, n) => s + n.g, 0) / neighbors.length) / 2;
            const avgB = (curRgb.b + neighbors.reduce((s, n) => s + n.b, 0) / neighbors.length) / 2;
            newGrid[y][x] = rgbToHex(avgR, avgG, avgB);
          }
        }
      }
    }
  }
  return newGrid;
}

export function applyFilter(
  grid: (string | null)[][],
  filter: FilterType
): (string | null)[][] {
  switch (filter) {
    case 'invert':
      return applyInvert(grid);
    case 'mirror-h':
      return applyMirrorHorizontal(grid);
    case 'mirror-v':
      return applyMirrorVertical(grid);
    case 'blur':
      return applyBlurEdges(grid);
    default:
      return grid.map(row => [...row]);
  }
}
