import { MindMapNode, NODE_WIDTH, NODE_HEIGHT, GRID_SIZE } from '@/types';

export function snapToGrid(value: number, gridSize: number = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

export function generateBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const offset = dx * 0.3;
  const cx1 = x1 + offset;
  const cy1 = y1;
  const cx2 = x2 - offset;
  const cy2 = y2;
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

export function checkOverlap(
  node1: { x: number; y: number },
  node2: { x: number; y: number },
  width: number = NODE_WIDTH,
  height: number = NODE_HEIGHT,
  padding: number = 10
): boolean {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return (
    node1.x - halfWidth - padding < node2.x + halfWidth &&
    node1.x + halfWidth + padding > node2.x - halfWidth &&
    node1.y - halfHeight - padding < node2.y + halfHeight &&
    node1.y + halfHeight + padding > node2.y - halfHeight
  );
}

export function resolveCollisions(
  nodes: MindMapNode[],
  draggedId: string,
  newX: number,
  newY: number
): MindMapNode[] {
  const result = nodes.map((node) =>
    node.id === draggedId ? { ...node, x: newX, y: newY } : node
  );

  const draggedNode = result.find((n) => n.id === draggedId);
  if (!draggedNode) return result;

  const otherNodes = result.filter((n) => n.id !== draggedId);
  let adjustedX = draggedNode.x;
  let adjustedY = draggedNode.y;

  for (const other of otherNodes) {
    if (checkOverlap({ x: adjustedX, y: adjustedY }, other)) {
      const dx = adjustedX - other.x;
      const dy = adjustedY - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const minDistance = Math.max(NODE_WIDTH, NODE_HEIGHT) + 10;
      const moveDistance = minDistance - distance;
      adjustedX += (dx / distance) * moveDistance;
      adjustedY += (dy / distance) * moveDistance;
    }
  }

  return result.map((node) =>
    node.id === draggedId ? { ...node, x: adjustedX, y: adjustedY } : node
  );
}
