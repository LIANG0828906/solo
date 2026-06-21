import { MindMapNode, NodePosition } from '../types';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;
const H_GAP = 80;
const V_GAP = 30;

export interface LayoutResult {
  positions: Record<string, NodePosition>;
  connections: Array<{ fromX: number; fromY: number; toX: number; toY: number }>;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

function measureSubtreeHeight(
  nodeId: string,
  nodes: Record<string, MindMapNode>
): number {
  const node = nodes[nodeId];
  if (!node || node.collapsed || node.childrenIds.length === 0) {
    return NODE_HEIGHT;
  }
  let total = 0;
  for (let i = 0; i < node.childrenIds.length; i++) {
    const childId = node.childrenIds[i];
    total += measureSubtreeHeight(childId, nodes);
    if (i < node.childrenIds.length - 1) total += V_GAP;
  }
  return Math.max(NODE_HEIGHT, total);
}

function layoutSubtree(
  nodeId: string,
  x: number,
  yStart: number,
  nodes: Record<string, MindMapNode>,
  positions: Record<string, NodePosition>,
  connections: Array<{ fromX: number; fromY: number; toX: number; toY: number }>
): number {
  const node = nodes[nodeId];
  if (!node) return yStart;

  const subtreeH = measureSubtreeHeight(nodeId, nodes);
  const nodeY = yStart + subtreeH / 2 - NODE_HEIGHT / 2;

  positions[nodeId] = {
    x,
    y: nodeY,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  };

  const fromX = x + NODE_WIDTH;
  const fromY = nodeY + NODE_HEIGHT / 2;

  if (!node.collapsed && node.childrenIds.length > 0) {
    const childX = x + NODE_WIDTH + H_GAP;
    let currentY = yStart;

    for (const childId of node.childrenIds) {
      const childSubtreeH = measureSubtreeHeight(childId, nodes);
      const childNodeY = currentY + childSubtreeH / 2 - NODE_HEIGHT / 2;
      const toX = childX;
      const toY = childNodeY + NODE_HEIGHT / 2;

      connections.push({ fromX, fromY, toX, toY });

      layoutSubtree(childId, childX, currentY, nodes, positions, connections);
      currentY += childSubtreeH + V_GAP;
    }
  }

  return yStart + subtreeH;
}

export function computeLayout(rootId: string, nodes: Record<string, MindMapNode>): LayoutResult {
  const positions: Record<string, NodePosition> = {};
  const connections: Array<{ fromX: number; fromY: number; toX: number; toY: number }> = [];

  const rootSubtreeH = measureSubtreeHeight(rootId, nodes);
  const startX = 0;
  const startY = -rootSubtreeH / 2;

  layoutSubtree(rootId, startX, startY, nodes, positions, connections);

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const id in positions) {
    const p = positions[id];
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x + p.width);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y + p.height);
  }

  return {
    positions,
    connections,
    bounds: { minX, maxX, minY, maxY },
  };
}
