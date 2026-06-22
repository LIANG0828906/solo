export interface HoneycombPosition {
  id?: string;
  x: number;
  y: number;
  row: number;
  col: number;
}

const SQRT3 = Math.sqrt(3);

export function calculateHoneycombLayout(
  count: number,
  containerWidth: number,
  containerHeight: number,
  sideLength: number = 120,
): HoneycombPosition[] {
  const hexWidth = sideLength * SQRT3;
  const hexHeight = sideLength * 2;
  const horizontalSpacing = hexWidth * 0.96;
  const verticalSpacing = hexHeight * 0.75;

  const cols = Math.max(3, Math.floor((containerWidth + horizontalSpacing / 2) / horizontalSpacing));
  const positions: HoneycombPosition[] = [];

  let row = 0;
  let col = 0;
  let placed = 0;
  let currentRowOffset = 0;

  const jitterAmount = sideLength * 0.06;
  const jitter = (seed: number) => {
    const v = Math.sin(seed * 9999.1) * 10000;
    return (v - Math.floor(v) - 0.5) * 2 * jitterAmount;
  };

  while (placed < count) {
    const isOddRow = row % 2 === 1;
    const rowStartX = isOddRow ? horizontalSpacing / 2 : 0;
    const effectiveCols = isOddRow ? cols - 1 : cols;
    let x = rowStartX + col * horizontalSpacing + currentRowOffset;
    let y = row * verticalSpacing;

    x += jitter(placed * 3 + 1);
    y += jitter(placed * 7 + 2);

    positions.push({ x, y, row, col });
    placed++;
    col++;

    if (col >= effectiveCols) {
      col = 0;
      row++;
      currentRowOffset = jitter(row * 13) * 0.5;
    }
  }

  const allX = positions.map(p => p.x);
  const allY = positions.map(p => p.y);
  const minX = Math.min(...allX) - hexWidth / 2;
  const minY = Math.min(...allY) - hexHeight / 2;
  const maxX = Math.max(...allX) + hexWidth / 2;
  const maxY = Math.max(...allY) + hexHeight / 2;
  const contentW = maxX - minX;
  const contentH = maxY - minY;

  const offsetX = (containerWidth - contentW) / 2 - minX;
  const offsetY = Math.max(20, (containerHeight - contentH) / 2 - minY);

  return positions.map(p => ({
    ...p,
    x: p.x + offsetX,
    y: p.y + offsetY,
  }));
}

export function hexagonPoints(cx: number, cy: number, r: number, rotationDeg: number = -90): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = ((rotationDeg + i * 60) * Math.PI) / 180;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(' ');
}

export function getResponsiveSideLength(width: number): number {
  if (width < 768) return 70;
  if (width < 1200) return 90;
  return 120;
}
