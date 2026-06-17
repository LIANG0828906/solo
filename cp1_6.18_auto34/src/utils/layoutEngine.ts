import type { InspirationNode } from '../types';
import { easeInOut } from '../types';

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  children: LayoutNode[];
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 50;
const HORIZONTAL_SPACING = 60;
const VERTICAL_SPACING = 80;

export function calculateTreeLayout(
  nodes: InspirationNode[],
): Map<string, { x: number; y: number }> {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const rootNodes = nodes.filter((n) => n.parentId === null);
  const positions = new Map<string, { x: number; y: number }>();

  if (rootNodes.length === 0) return positions;

  const layoutRoots: LayoutNode[] = rootNodes.map((node) =>
    buildLayoutTree(node, nodeMap, 0),
  );

  let totalWidth = 0;
  layoutRoots.forEach((root) => {
    calculateSubtreeDimensions(root);
    const rootWidth = root.width;
    layoutSubtree(root, totalWidth + rootWidth / 2, VERTICAL_SPACING, positions);
    totalWidth += rootWidth + HORIZONTAL_SPACING;
  });

  return positions;
}

function buildLayoutTree(
  node: InspirationNode,
  nodeMap: Map<string, InspirationNode>,
  depth: number,
): LayoutNode {
  const children = node.children
    .map((childId) => nodeMap.get(childId))
    .filter(
      (child): child is InspirationNode => child !== undefined && !child.collapsed,
    )
    .map((child) => buildLayoutTree(child, nodeMap, depth + 1));

  return {
    id: node.id,
    x: 0,
    y: 0,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    depth,
    children,
  };
}

function calculateSubtreeDimensions(node: LayoutNode): void {
  if (node.children.length === 0) {
    node.width = NODE_WIDTH;
    node.height = NODE_HEIGHT;
    return;
  }

  let totalChildrenWidth = 0;
  let maxChildHeight = 0;

  node.children.forEach((child) => {
    calculateSubtreeDimensions(child);
    totalChildrenWidth += child.width + HORIZONTAL_SPACING;
    maxChildHeight = Math.max(maxChildHeight, child.height);
  });

  totalChildrenWidth -= HORIZONTAL_SPACING;

  node.width = Math.max(NODE_WIDTH, totalChildrenWidth);
  node.height = NODE_HEIGHT + VERTICAL_SPACING + maxChildHeight;
}

function layoutSubtree(
  node: LayoutNode,
  centerX: number,
  y: number,
  positions: Map<string, { x: number; y: number }>,
): void {
  positions.set(node.id, { x: centerX, y });

  if (node.children.length === 0) return;

  let currentX = centerX - node.width / 2;
  const childY = y + NODE_HEIGHT + VERTICAL_SPACING;

  node.children.forEach((child) => {
    const childCenterX = currentX + child.width / 2;
    layoutSubtree(child, childCenterX, childY, positions);
    currentX += child.width + HORIZONTAL_SPACING;
  });
}

export function animateLayout(
  nodes: InspirationNode[],
  targetPositions: Map<string, { x: number; y: number }>,
  duration: number = 600,
  onUpdate: (nodeId: string, x: number, y: number) => void,
  onComplete: () => void,
): () => void {
  const startTime = performance.now();
  const startPositions = new Map(
    nodes.map((n) => [n.id, { x: n.x, y: n.y }]),
  );
  let animationId: number;

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOut(progress);

    nodes.forEach((node) => {
      const start = startPositions.get(node.id);
      const target = targetPositions.get(node.id);
      if (!start || !target) return;

      const currentX = start.x + (target.x - start.x) * easedProgress;
      const currentY = start.y + (target.y - start.y) * easedProgress;

      onUpdate(node.id, currentX, currentY);
    });

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    } else {
      onComplete();
    }
  }

  animationId = requestAnimationFrame(animate);

  return () => cancelAnimationFrame(animationId);
}
