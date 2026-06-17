import type { TimelineNode, Branch, FilterState, NodeLayout, BranchPath, LayoutResult } from '@/shared/types';
import { NODE_COLORS, BRANCH_COLOR } from '@/shared/types';

const NODE_RADIUS = 12;
const DAY_WIDTH = 80;
const BRANCH_HEIGHT = 100;
const AXIS_Y_OFFSET = 200;

function isNodeFiltered(node: TimelineNode, filter: FilterState): boolean {
  if (filter.typeFilter && node.type !== filter.typeFilter) return true;
  if (filter.statusFilter && node.status !== filter.statusFilter) return true;
  if (filter.keyword && !node.description.toLowerCase().includes(filter.keyword.toLowerCase())) return true;
  return false;
}

export function getLayout(
  nodes: TimelineNode[],
  branches: Branch[],
  filter: FilterState,
  startDate: number,
  zoomLevel: number,
  canvasWidth: number,
  offsetX: number
): LayoutResult {
  const axisY = AXIS_Y_OFFSET;
  const scaledDayWidth = DAY_WIDTH * zoomLevel;

  const rootNodes = nodes.filter((n) => n.parentId === null);
  const axisStartX = offsetX;
  const axisEndX = offsetX + canvasWidth * 2;

  const nodeLayouts: NodeLayout[] = [];
  const branchPaths: BranchPath[] = [];

  rootNodes.forEach((node) => {
    const x = offsetX + node.dayOffset * scaledDayWidth;
    const filtered = isNodeFiltered(node, filter);
    nodeLayouts.push({
      id: node.id,
      x,
      y: axisY,
      radius: NODE_RADIUS * zoomLevel,
      color: NODE_COLORS[node.type],
      node,
      filtered,
    });
  });

  const branchGroups = new Map<string, TimelineNode[]>();
  nodes
    .filter((n) => n.parentId !== null)
    .forEach((n) => {
      const group = branchGroups.get(n.branchId) || [];
      group.push(n);
      branchGroups.set(n.branchId, group);
    });

  const branchIndexMap = new Map<string, number>();
  let branchCounter = 0;
  branches.forEach((b) => {
    branchIndexMap.set(b.id, branchCounter++);
  });

  branchGroups.forEach((branchNodes, branchId) => {
    const parentNode = nodes.find((n) => n.id === branchNodes[0]?.parentId);
    if (!parentNode) return;

    const parentLayout = nodeLayouts.find((nl) => nl.id === parentNode.id);
    if (!parentLayout) return;

    const branchIdx = branchIndexMap.get(branchId) ?? 0;
    const branchDirection = branchIdx % 2 === 0 ? 1 : 1;
    const branchBaseY = parentLayout.y + BRANCH_HEIGHT * zoomLevel * (Math.floor(branchIdx / 2) + 1) * branchDirection;

    const points: { x: number; y: number }[] = [];
    const startX = parentLayout.x;
    const startY = parentLayout.y + parentLayout.radius;
    points.push({ x: startX, y: startY });

    const cornerRadius = 10 * zoomLevel;
    const midY = startY + (branchBaseY - startY) / 2;
    points.push({ x: startX, y: midY });
    points.push({ x: startX + cornerRadius, y: branchBaseY - cornerRadius });
    points.push({ x: startX, y: branchBaseY });

    branchPaths.push({
      branchId,
      points,
      color: BRANCH_COLOR,
    });

    branchNodes
      .sort((a, b) => a.dayOffset - b.dayOffset)
      .forEach((node, idx) => {
        const childX = startX + (idx + 1) * 60 * zoomLevel;
        const childY = branchBaseY;
        const filtered = isNodeFiltered(node, filter);
        nodeLayouts.push({
          id: node.id,
          x: childX,
          y: childY,
          radius: NODE_RADIUS * zoomLevel,
          color: NODE_COLORS[node.type],
          node,
          filtered,
        });
      });
  });

  let endDate: Date | null = null;
  if (nodes.length > 0) {
    const maxEndDay = nodes.reduce((max, n) => {
      return Math.max(max, n.dayOffset + n.estimatedDays);
    }, 0);
    endDate = new Date(startDate + maxEndDay * 86400000);
  }

  return {
    nodes: nodeLayouts,
    branches: branchPaths,
    axisY,
    axisStartX,
    axisEndX,
    endDate,
  };
}

export function hitTest(
  layout: LayoutResult,
  px: number,
  py: number
): NodeLayout | null {
  for (let i = layout.nodes.length - 1; i >= 0; i--) {
    const nl = layout.nodes[i];
    if (nl.filtered) continue;
    const dx = px - nl.x;
    const dy = py - nl.y;
    if (dx * dx + dy * dy <= (nl.radius + 4) * (nl.radius + 4)) {
      return nl;
    }
  }
  return null;
}

export function dayOffsetFromX(x: number, offsetX: number, zoomLevel: number): number {
  const scaledDayWidth = DAY_WIDTH * zoomLevel;
  return Math.round((x - offsetX) / scaledDayWidth);
}
