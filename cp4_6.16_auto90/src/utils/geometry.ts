export interface Point {
  x: number;
  y: number;
}

export interface NodePosition extends Point {
  id: string;
  radius: number;
}

export const calculateTimelineNodePositions = (
  count: number,
  containerWidth: number,
  nodeRadius: number = 24,
  startPadding: number = 40,
  endPadding: number = 40
): NodePosition[] => {
  if (count === 0) return [];
  
  const availableWidth = containerWidth - startPadding - endPadding;
  const spacing = count > 1 ? availableWidth / (count - 1) : 0;
  const centerY = 60;

  return Array.from({ length: count }, (_, i) => ({
    id: `node-${i}`,
    x: startPadding + i * spacing,
    y: centerY,
    radius: nodeRadius,
  }));
};

export const generateBezierPath = (
  start: Point,
  end: Point,
  curvature: number = 0.4
): string => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const offset = distance * curvature;

  const cp1x = start.x + offset;
  const cp1y = start.y;
  const cp2x = end.x - offset;
  const cp2y = end.y;

  return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
};

export const generateStraightPath = (start: Point, end: Point): string => {
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
};

export const generateDependencyPath = (
  fromNode: NodePosition,
  toNode: NodePosition,
  offsetY: number = -30
): string => {
  const startX = fromNode.x;
  const startY = fromNode.y - fromNode.radius;
  const endX = toNode.x;
  const endY = toNode.y - toNode.radius;
  const midY = Math.min(startY, endY) + offsetY;

  return `M ${startX} ${startY} 
          L ${startX} ${midY} 
          L ${endX} ${midY} 
          L ${endX} ${endY}`;
};

export const isPointInCircle = (
  point: Point,
  center: Point,
  radius: number
): boolean => {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return dx * dx + dy * dy <= radius * radius;
};

export const getArrowHeadPath = (
  end: Point,
  direction: number,
  size: number = 8
): string => {
  const angle = direction;
  const x1 = end.x + Math.cos(angle + Math.PI / 6) * size;
  const y1 = end.y + Math.sin(angle + Math.PI / 6) * size;
  const x2 = end.x + Math.cos(angle - Math.PI / 6) * size;
  const y2 = end.y + Math.sin(angle - Math.PI / 6) * size;
  
  return `M ${end.x} ${end.y} L ${x1} ${y1} M ${end.x} ${end.y} L ${x2} ${y2}`;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const getMilestonePositions = (
  milestoneCount: number,
  containerWidth: number,
  startX: number = 60,
  y: number = 100
): Point[] => {
  if (milestoneCount === 0) return [];
  
  const spacing = milestoneCount > 1 ? (containerWidth - 120) / (milestoneCount - 1) : 0;
  
  return Array.from({ length: milestoneCount }, (_, i) => ({
    x: startX + i * spacing,
    y,
  }));
};
