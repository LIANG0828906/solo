import type { BrainstormNode } from '@/types';

export function getBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.abs(x2 - x1);
  const dy = y2 - y1;
  const controlOffset = Math.min(Math.max(dx * 0.5, 40), 200);

  const cp1x = x1 + controlOffset;
  const cp1y = y1;
  const cp2x = x2 - controlOffset;
  const cp2y = y2;

  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

export function isPointInNode(x: number, y: number, node: BrainstormNode): boolean {
  return (
    x >= node.x &&
    x <= node.x + node.width &&
    y >= node.y &&
    y <= node.y + node.height
  );
}

export function checkCollision(
  node: BrainstormNode,
  nodes: BrainstormNode[]
): BrainstormNode | null {
  for (const other of nodes) {
    if (other.id === node.id) continue;
    const overlapX =
      node.x < other.x + other.width &&
      node.x + node.width > other.x &&
      node.y < other.y + other.height &&
      node.y + node.height > other.y;
    if (overlapX) {
      return other;
    }
  }
  return null;
}

export function resolveCollision(
  node: BrainstormNode,
  nodes: BrainstormNode[]
): { x: number; y: number } {
  let { x, y } = node;
  let collided = checkCollision({ ...node, x, y }, nodes);
  let attempt = 0;

  while (collided && attempt < 10) {
    const dx = x - (collided.x + collided.width / 2);
    const dy = y - (collided.y + collided.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    x += (dx / dist) * 20;
    y += (dy / dist) * 20;
    collided = checkCollision({ ...node, x, y }, nodes);
    attempt++;
  }

  return { x, y };
}

export function screenToCanvas(
  screenX: number,
  screenY: number,
  viewOffset: { x: number; y: number },
  viewScale: number
): { x: number; y: number } {
  return {
    x: (screenX - viewOffset.x) / viewScale,
    y: (screenY - viewOffset.y) / viewScale,
  };
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getNodeCenter(node: BrainstormNode): { x: number; y: number } {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  };
}
