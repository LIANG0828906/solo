import type { MindMapNode } from '@/types/mindMap';
import {
  NODE_COLORS,
  DEFAULT_SIBLING_GAP,
  LEVEL_GAP,
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
} from '@/types/mindMap';

interface LayoutOptions {
  siblingGap?: number;
  levelGap?: number;
  rootX?: number;
  rootY?: number;
}

interface SubtreeMeasure {
  width: number;
  height: number;
}

function measureSubtree(
  nodeId: string,
  nodes: Record<string, MindMapNode>,
  siblingGap: number,
  levelGap: number
): SubtreeMeasure {
  const node = nodes[nodeId];
  if (!node || node.children.length === 0) {
    return {
      width: node?.width ?? DEFAULT_NODE_WIDTH,
      height: (node?.height ?? DEFAULT_NODE_HEIGHT) + levelGap,
    };
  }

  let childrenTotalWidth = 0;
  let maxChildHeight = 0;

  node.children.forEach((childId, index) => {
    const measure = measureSubtree(childId, nodes, siblingGap, levelGap);
    childrenTotalWidth += measure.width;
    if (index > 0) childrenTotalWidth += siblingGap;
    maxChildHeight = Math.max(maxChildHeight, measure.height);
  });

  const nodeWidth = node?.width ?? DEFAULT_NODE_WIDTH;
  const totalWidth = Math.max(nodeWidth, childrenTotalWidth);
  const nodeHeight = node?.height ?? DEFAULT_NODE_HEIGHT;
  const totalHeight = nodeHeight + levelGap + maxChildHeight;

  return { width: totalWidth, height: totalHeight };
}

function placeSubtree(
  nodeId: string,
  nodes: Record<string, MindMapNode>,
  centerX: number,
  topY: number,
  siblingGap: number,
  levelGap: number
): void {
  const node = nodes[nodeId];
  if (!node) return;

  const nodeHeight = node.height ?? DEFAULT_NODE_HEIGHT;
  const level = node.level;
  node.color = NODE_COLORS[Math.min(level, 3)] ?? NODE_COLORS[3];
  node.x = centerX - (node.width ?? DEFAULT_NODE_WIDTH) / 2;
  node.y = topY;

  if (node.children.length === 0) return;

  const childMeasures: SubtreeMeasure[] = node.children.map((childId) =>
    measureSubtree(childId, nodes, siblingGap, levelGap)
  );

  let totalChildrenWidth = 0;
  childMeasures.forEach((m, i) => {
    totalChildrenWidth += m.width;
    if (i > 0) totalChildrenWidth += siblingGap;
  });

  const childrenStartX = centerX - totalChildrenWidth / 2;
  let currentX = childrenStartX;
  const childTopY = topY + nodeHeight + levelGap;

  node.children.forEach((childId, index) => {
    const measure = childMeasures[index];
    const childCenterX = currentX + measure.width / 2;
    placeSubtree(childId, nodes, childCenterX, childTopY, siblingGap, levelGap);
    currentX += measure.width + siblingGap;
  });
}

export function calculateLayout(
  nodes: Record<string, MindMapNode>,
  rootId: string,
  options: LayoutOptions = {}
): Record<string, MindMapNode> {
  const {
    siblingGap = DEFAULT_SIBLING_GAP,
    levelGap = LEVEL_GAP,
    rootX = 0,
    rootY = 0,
  } = options;

  const newNodes: Record<string, MindMapNode> = JSON.parse(JSON.stringify(nodes));
  placeSubtree(rootId, newNodes, rootX, rootY, siblingGap, levelGap);
  return newNodes;
}

export function findParentId(
  nodeId: string,
  nodes: Record<string, MindMapNode>
): string | null {
  for (const [, node] of Object.entries(nodes)) {
    if (node.children.includes(nodeId)) {
      return node.id;
    }
  }
  return null;
}

export function getDescendantIds(
  nodeId: string,
  nodes: Record<string, MindMapNode>
): Set<string> {
  const descendants = new Set<string>();
  const stack = [nodeId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const node = nodes[current];
    if (!node) continue;
    for (const childId of node.children) {
      descendants.add(childId);
      stack.push(childId);
    }
  }

  return descendants;
}

interface NearestParentResult {
  parentId: string;
  insertIndex: number;
}

export function findNearestParent(
  draggedId: string,
  nodes: Record<string, MindMapNode>
): NearestParentResult | null {
  const dragged = nodes[draggedId];
  if (!dragged) return null;

  const descendants = getDescendantIds(draggedId, nodes);
  const candidates = Object.values(nodes).filter(
    (n) => n.id !== draggedId && !descendants.has(n.id)
  );

  if (candidates.length === 0) return null;

  const draggedCenterX = dragged.x + (dragged.width ?? DEFAULT_NODE_WIDTH) / 2;
  const draggedCenterY = dragged.y + (dragged.height ?? DEFAULT_NODE_HEIGHT) / 2;

  let bestId: string | null = null;
  let bestScore = Infinity;

  for (const candidate of candidates) {
    if (candidate.level > dragged.level) continue;

    const candCenterX =
      candidate.x + (candidate.width ?? DEFAULT_NODE_WIDTH) / 2;
    const candCenterY =
      candidate.y + (candidate.height ?? DEFAULT_NODE_HEIGHT) / 2;

    const dx = draggedCenterX - candCenterX;
    const dy = draggedCenterY - candCenterY;
    let dist = Math.sqrt(dx * dx + dy * dy);

    const levelDiff = dragged.level - candidate.level;
    dist += levelDiff * 20;

    if (dy < -10) {
      dist += 200;
    }

    if (dist < bestScore) {
      bestScore = dist;
      bestId = candidate.id;
    }
  }

  if (!bestId) return null;

  const parent = nodes[bestId];
  let insertIndex = parent.children.length;

  for (let i = 0; i < parent.children.length; i++) {
    const sibling = nodes[parent.children[i]];
    if (sibling && dragged.y < sibling.y) {
      insertIndex = i;
      break;
    }
  }

  return { parentId: bestId, insertIndex };
}

export function updateLevels(
  nodeId: string,
  nodes: Record<string, MindMapNode>,
  level: number
): void {
  const node = nodes[nodeId];
  if (!node) return;
  node.level = level;
  node.color = NODE_COLORS[Math.min(level, 3)] ?? NODE_COLORS[3];
  for (const childId of node.children) {
    updateLevels(childId, nodes, level + 1);
  }
}
