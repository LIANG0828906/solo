import { ChartNode, CONFIG } from '@/types';

export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

export const snapToGrid = (value: number, gridSize: number = CONFIG.GRID_SIZE): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const snapToNearestNode = (
  node: ChartNode,
  allNodes: ChartNode[],
  snapDistance: number = CONFIG.SNAP_DISTANCE
): { x: number; y: number; snapped: boolean } => {
  let snappedX = node.x;
  let snappedY = node.y;
  let hasSnapped = false;

  for (const other of allNodes) {
    if (other.id === node.id) continue;

    const otherEdges = {
      left: other.x,
      right: other.x + other.width,
      top: other.y,
      bottom: other.y + other.height,
      centerX: other.x + other.width / 2,
      centerY: other.y + other.height / 2,
    };

    const nodeEdges = {
      left: node.x,
      right: node.x + node.width,
      top: node.y,
      bottom: node.y + node.height,
      centerX: node.x + node.width / 2,
      centerY: node.y + node.height / 2,
    };

    const snapChecks = [
      { nodeVal: nodeEdges.left, otherVal: otherEdges.left, axis: 'x' as const },
      { nodeVal: nodeEdges.left, otherVal: otherEdges.right, axis: 'x' as const },
      { nodeVal: nodeEdges.right, otherVal: otherEdges.left, axis: 'x' as const },
      { nodeVal: nodeEdges.right, otherVal: otherEdges.right, axis: 'x' as const },
      { nodeVal: nodeEdges.centerX, otherVal: otherEdges.centerX, axis: 'x' as const },
      { nodeVal: nodeEdges.top, otherVal: otherEdges.top, axis: 'y' as const },
      { nodeVal: nodeEdges.top, otherVal: otherEdges.bottom, axis: 'y' as const },
      { nodeVal: nodeEdges.bottom, otherVal: otherEdges.top, axis: 'y' as const },
      { nodeVal: nodeEdges.bottom, otherVal: otherEdges.bottom, axis: 'y' as const },
      { nodeVal: nodeEdges.centerY, otherVal: otherEdges.centerY, axis: 'y' as const },
    ];

    for (const check of snapChecks) {
      const diff = Math.abs(check.nodeVal - check.otherVal);
      if (diff < snapDistance && diff > 0) {
        const offset = check.nodeVal - (check.axis === 'x' ? node.x : node.y);
        if (check.axis === 'x') {
          snappedX = check.otherVal - offset;
        } else {
          snappedY = check.otherVal - offset;
        }
        hasSnapped = true;
      }
    }
  }

  const gridX = snapToGrid(node.x);
  const gridY = snapToGrid(node.y);
  
  if (Math.abs(node.x - gridX) < snapDistance) {
    snappedX = gridX;
    hasSnapped = true;
  }
  if (Math.abs(node.y - gridY) < snapDistance) {
    snappedY = gridY;
    hasSnapped = true;
  }

  return { x: snappedX, y: snappedY, snapped: hasSnapped };
};

export const isPointInNode = (
  px: number,
  py: number,
  node: ChartNode,
  scale: number = 1
): boolean => {
  const hitScale = scale < 1 ? 1.5 : 1;
  const padding = 4 * hitScale;
  return (
    px >= node.x - padding &&
    px <= node.x + node.width + padding &&
    py >= node.y - padding &&
    py <= node.y + node.height + padding
  );
};

export const isPointNearLine = (
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  threshold: number = 8
): boolean => {
  const lineLength = distance(x1, y1, x2, y2);
  if (lineLength === 0) return distance(px, py, x1, y1) < threshold;

  const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (lineLength * lineLength)));
  const nearestX = x1 + t * (x2 - x1);
  const nearestY = y1 + t * (y2 - y1);

  return distance(px, py, nearestX, nearestY) < threshold;
};

export const getNodeAnchorPoints = (node: ChartNode) => {
  return {
    top: { x: node.x + node.width / 2, y: node.y },
    bottom: { x: node.x + node.width / 2, y: node.y + node.height },
    left: { x: node.x, y: node.y + node.height / 2 },
    right: { x: node.x + node.width, y: node.y + node.height / 2 },
    center: { x: node.x + node.width / 2, y: node.y + node.height / 2 },
  };
};

export const getBestAnchorPoints = (fromNode: ChartNode, toNode: ChartNode) => {
  const fromAnchors = getNodeAnchorPoints(fromNode);
  const toAnchors = getNodeAnchorPoints(toNode);

  let minDist = Infinity;
  let bestFrom = fromAnchors.center;
  let bestTo = toAnchors.center;

  const fromPoints = [fromAnchors.top, fromAnchors.bottom, fromAnchors.left, fromAnchors.right, fromAnchors.center];
  const toPoints = [toAnchors.top, toAnchors.bottom, toAnchors.left, toAnchors.right, toAnchors.center];

  for (const fp of fromPoints) {
    for (const tp of toPoints) {
      const d = distance(fp.x, fp.y, tp.x, tp.y);
      if (d < minDist) {
        minDist = d;
        bestFrom = fp;
        bestTo = tp;
      }
    }
  }

  return { from: bestFrom, to: bestTo };
};

export const calculateEdgePath = (
  style: string,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): { path: string; points: { x: number; y: number }[] } => {
  const points: { x: number; y: number }[] = [];

  if (style === 'straight') {
    points.push({ x: fromX, y: fromY }, { x: toX, y: toY });
    return { path: `M ${fromX} ${fromY} L ${toX} ${toY}`, points };
  }

  if (style === 'bezier') {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const controlOffset = Math.min(Math.abs(dx), Math.abs(dy)) * 0.5 + 50;

    let cp1x = fromX + controlOffset;
    let cp1y = fromY;
    let cp2x = toX - controlOffset;
    let cp2y = toY;

    if (Math.abs(dy) > Math.abs(dx)) {
      cp1x = fromX;
      cp1y = fromY + controlOffset * Math.sign(dy);
      cp2x = toX;
      cp2y = toY - controlOffset * Math.sign(dy);
    }

    points.push({ x: fromX, y: fromY }, { x: (fromX + toX) / 2, y: (fromY + toY) / 2 }, { x: toX, y: toY });
    return { path: `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`, points };
  }

  if (style === 'step') {
    const midX = (fromX + toX) / 2;
    points.push(
      { x: fromX, y: fromY },
      { x: midX, y: fromY },
      { x: midX, y: toY },
      { x: toX, y: toY }
    );
    return { path: `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`, points };
  }

  return { path: `M ${fromX} ${fromY} L ${toX} ${toY}`, points };
};
