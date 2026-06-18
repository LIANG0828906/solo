export interface Point {
  x: number;
  y: number;
}

export interface NodeBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CARD_WIDTH = 120;
export const CARD_HEIGHT = 80;
export const CONTROL_POINT_OFFSET = 50;

export function getAnchorPoint(node: NodeBounds, targetPoint: Point): Point {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;

  const dx = targetPoint.x - centerX;
  const dy = targetPoint.y - centerY;

  const halfW = node.width / 2;
  const halfH = node.height / 2;

  if (Math.abs(dx) * halfH > Math.abs(dy) * halfW) {
    return {
      x: dx > 0 ? node.x + node.width : node.x,
      y: centerY + (dy / Math.abs(dx)) * halfH
    };
  } else {
    return {
      x: centerX + (dx / Math.abs(dy)) * halfW,
      y: dy > 0 ? node.y + node.height : node.y
    };
  }
}

export function getControlPoints(from: Point, to: Point): { cp1: Point; cp2: Point } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const offsetX = (dx / distance) * CONTROL_POINT_OFFSET;
  const offsetY = (dy / distance) * CONTROL_POINT_OFFSET;

  const perpX = -offsetY;
  const perpY = offsetX;

  return {
    cp1: {
      x: from.x + offsetX + perpX * 0.5,
      y: from.y + offsetY + perpY * 0.5
    },
    cp2: {
      x: to.x - offsetX - perpX * 0.5,
      y: to.y - offsetY - perpY * 0.5
    }
  };
}

export function getBezierPath(from: Point, to: Point): string {
  const { cp1, cp2 } = getControlPoints(from, to);
  return `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`;
}

export function getMidpoint(from: Point, to: Point): Point {
  const { cp1, cp2 } = getControlPoints(from, to);
  const t = 0.5;
  const mt = 1 - t;

  return {
    x: mt * mt * mt * from.x + 3 * mt * mt * t * cp1.x + 3 * mt * t * t * cp2.x + t * t * t * to.x,
    y: mt * mt * mt * from.y + 3 * mt * mt * t * cp1.y + 3 * mt * t * t * cp2.y + t * t * t * to.y
  };
}
