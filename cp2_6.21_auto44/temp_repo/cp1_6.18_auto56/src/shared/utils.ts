import type { IdeaNode } from './types';

export const calculateNodeHeight = (content: string, width: number): number => {
  const basePadding = 48;
  const titleHeight = 24;
  const contentLineHeight = 20;
  const charsPerLine = Math.floor(width / 12);
  const contentLines = Math.ceil(content.length / charsPerLine) || 1;
  return basePadding + titleHeight + contentLines * contentLineHeight + 40;
};

export const getConnectionPoints = (node: IdeaNode) => {
  return {
    right: { x: node.x + node.width, y: node.y + node.height / 2 },
    bottom: { x: node.x + node.width / 2, y: node.y + node.height },
    left: { x: node.x, y: node.y + node.height / 2 },
    top: { x: node.x + node.width / 2, y: node.y },
  };
};

export const getBezierPath = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string => {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const controlOffset = Math.max(dx, dy) * 0.5;

  let cx1 = x1;
  let cy1 = y1;
  let cx2 = x2;
  let cy2 = y2;

  if (x2 >= x1) {
    cx1 = x1 + controlOffset;
    cx2 = x2 - controlOffset;
  } else {
    cx1 = x1 - controlOffset;
    cx2 = x2 + controlOffset;
  }

  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const generateId = (): string => {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const screenToWorld = (
  screenX: number,
  screenY: number,
  pan: { x: number; y: number },
  zoom: number
): { x: number; y: number } => {
  return {
    x: (screenX - pan.x) / zoom,
    y: (screenY - pan.y) / zoom,
  };
};

export const getResponsiveNodeWidth = (): number => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return 180;
  }
  return 240;
};
