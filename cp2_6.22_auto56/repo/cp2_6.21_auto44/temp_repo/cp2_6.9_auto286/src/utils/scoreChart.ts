export interface ChartPoint {
  x: number;
  y: number;
  moveNumber: number;
  winRate: number;
}

export const interpolateWinRates = (
  winRates: number[],
  pointsPerMove: number = 5
): ChartPoint[] => {
  if (winRates.length === 0) return [];

  const result: ChartPoint[] = [];
  const totalPoints = (winRates.length - 1) * pointsPerMove + 1;

  for (let i = 0; i < totalPoints; i++) {
    const exactMove = i / pointsPerMove;
    const moveIndex = Math.floor(exactMove);
    const t = exactMove - moveIndex;

    if (moveIndex >= winRates.length - 1) {
      result.push({
        x: exactMove,
        y: winRates[winRates.length - 1],
        moveNumber: winRates.length - 1,
        winRate: winRates[winRates.length - 1],
      });
      break;
    }

    const y0 = winRates[moveIndex];
    const y1 = winRates[moveIndex + 1];
    const smoothT = t * t * (3 - 2 * t);
    const interpolatedY = y0 + (y1 - y0) * smoothT;

    result.push({
      x: exactMove,
      y: interpolatedY,
      moveNumber: moveIndex + (t >= 0.5 ? 1 : 0),
      winRate: interpolatedY,
    });
  }

  return result;
};

export const generatePathData = (
  points: ChartPoint[],
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number }
): string => {
  if (points.length === 0) return '';

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxX = points[points.length - 1].x;

  const toCanvasX = (x: number) => padding.left + (x / maxX) * chartWidth;
  const toCanvasY = (y: number) => padding.top + (1 - y / 100) * chartHeight;

  let path = `M ${toCanvasX(points[0].x)} ${toCanvasY(points[0].y)}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = toCanvasX((prev.x + curr.x) / 2);
    const cpy = toCanvasY((prev.y + curr.y) / 2);
    path += ` Q ${toCanvasX(prev.x)} ${toCanvasY(prev.y)} ${cpx} ${cpy}`;
  }

  path += ` L ${toCanvasX(points[points.length - 1].x)} ${toCanvasY(points[points.length - 1].y)}`;
  return path;
};

export const findNearestPoint = (
  points: ChartPoint[],
  mouseX: number,
  width: number,
  padding: { left: number; right: number }
): ChartPoint | null => {
  if (points.length === 0) return null;

  const chartWidth = width - padding.left - padding.right;
  const maxX = points[points.length - 1].x;
  const targetX = ((mouseX - padding.left) / chartWidth) * maxX;

  let nearest = points[0];
  let minDist = Math.abs(points[0].x - targetX);

  for (const point of points) {
    const dist = Math.abs(point.x - targetX);
    if (dist < minDist) {
      minDist = dist;
      nearest = point;
    }
  }

  return nearest;
};
