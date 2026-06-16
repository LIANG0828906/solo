import { MindMapNode, Position, LAYOUT_CONFIG } from '../types';

function randomOffset(): number {
  return (Math.random() - 0.5) * 2 * LAYOUT_CONFIG.randomOffset;
}

function polarToCartesian(center: Position, radius: number, angle: number): Position {
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };
}

export interface LayoutResult {
  root: MindMapNode | null;
}

function cloneNode(node: MindMapNode): MindMapNode {
  return {
    ...node,
    position: { ...node.position },
    initialPosition: { ...node.initialPosition },
    children: node.children.map(cloneNode),
  };
}

export function calculateRadialLayout(
  root: MindMapNode | null,
  center: Position
): LayoutResult {
  if (!root) {
    return { root: null };
  }

  const layoutRoot = cloneNode(root);

  layoutRoot.position = { ...center };
  layoutRoot.initialPosition = { ...center };

  const level1Children = layoutRoot.children;
  const level1Count = level1Children.length;

  if (level1Count === 0) {
    return { root: layoutRoot };
  }

  const angleStep = (2 * Math.PI) / level1Count;

  level1Children.forEach((level1Node, index) => {
    const baseAngle = index * angleStep;
    const angle = baseAngle + randomOffset();

    level1Node.position = polarToCartesian(center, LAYOUT_CONFIG.level1Radius, angle);
    level1Node.initialPosition = { ...level1Node.position };

    const level2Children = level1Node.children;
    const level2Count = level2Children.length;

    if (level2Count === 0) {
      return;
    }

    let subStep = (2 * LAYOUT_CONFIG.angleSpread) / Math.max(level2Count, 1);
    let startAngle = baseAngle - LAYOUT_CONFIG.angleSpread;

    if (level2Count === 1) {
      startAngle = baseAngle - subStep / 2;
    }

    level2Children.forEach((level2Node, childIndex) => {
      const childAngle = startAngle + childIndex * subStep + randomOffset() * 0.5;
      level2Node.position = polarToCartesian(
        level1Node.position,
        LAYOUT_CONFIG.level2Radius - LAYOUT_CONFIG.level1Radius,
        childAngle
      );
      level2Node.initialPosition = { ...level2Node.position };
    });
  });

  return { root: layoutRoot };
}

export function resetToInitialPositions(root: MindMapNode | null): MindMapNode | null {
  if (!root) return null;

  const resetNode = (node: MindMapNode): MindMapNode => {
    return {
      ...node,
      position: { ...node.initialPosition },
      children: node.children.map(resetNode),
    };
  };

  return resetNode(root);
}

export function getNodeBounds(node: MindMapNode): {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
} {
  const isRoot = node.level === 1;
  const width = isRoot ? LAYOUT_CONFIG.rootWidth : LAYOUT_CONFIG.nodeWidth;
  const height = isRoot ? LAYOUT_CONFIG.rootHeight : LAYOUT_CONFIG.nodeHeight;
  return {
    left: node.position.x - width / 2,
    right: node.position.x + width / 2,
    top: node.position.y - height / 2,
    bottom: node.position.y + height / 2,
    width,
    height,
  };
}

export function isPointInNode(point: Position, node: MindMapNode, scale = 1): boolean {
  const bounds = getNodeBounds(node);
  const center = node.position;
  const halfW = (bounds.width * scale) / 2;
  const halfH = (bounds.height * scale) / 2;
  return (
    point.x >= center.x - halfW &&
    point.x <= center.x + halfW &&
    point.y >= center.y - halfH &&
    point.y <= center.y + halfH
  );
}

export function isNodeInViewport(
  node: MindMapNode,
  viewport: { x: number; y: number; width: number; height: number },
  padding = 50
): boolean {
  const bounds = getNodeBounds(node);
  return (
    bounds.right >= viewport.x - padding &&
    bounds.left <= viewport.x + viewport.width + padding &&
    bounds.bottom >= viewport.y - padding &&
    bounds.top <= viewport.y + viewport.height + padding
  );
}

export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function interpolatePosition(
  start: Position,
  end: Position,
  t: number
): Position {
  const easedT = easeOut(t);
  return {
    x: start.x + (end.x - start.x) * easedT,
    y: start.y + (end.y - start.y) * easedT,
  };
}
