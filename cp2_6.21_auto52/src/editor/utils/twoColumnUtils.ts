import type { Component } from '../types';

export interface ColumnPair {
  left: Component;
  right: Component;
  gap: number;
  totalWidth: number;
}

export function findTwoColumnPair(components: Component[], currentId: string): ColumnPair | null {
  const current = components.find(c => c.id === currentId);
  if (!current || current.type !== 'text' || !current.columnRole) {
    return null;
  }

  const leftComp = components.find(c => c.columnRole === 'left' && c.type === 'text');
  const rightComp = components.find(c => c.columnRole === 'right' && c.type === 'text');

  if (!leftComp || !rightComp) {
    return null;
  }

  const gap = rightComp.x - (leftComp.x + leftComp.width);
  const totalWidth = leftComp.width + gap + rightComp.width;

  return {
    left: leftComp,
    right: rightComp,
    gap,
    totalWidth,
  };
}

export function isTwoColumnTemplate(components: Component[]): boolean {
  const hasLeft = components.some(c => c.columnRole === 'left');
  const hasRight = components.some(c => c.columnRole === 'right');
  return hasLeft && hasRight;
}

export function calculateColumnRatio(pair: ColumnPair): number {
  const availableWidth = pair.totalWidth - pair.gap;
  const leftRatio = (pair.left.width / availableWidth) * 100;
  return Math.round(leftRatio);
}

export function applyColumnRatio(
  components: Component[],
  pair: ColumnPair,
  leftRatio: number
): Component[] {
  const clampedRatio = Math.max(30, Math.min(70, leftRatio));
  const availableWidth = pair.totalWidth - pair.gap;
  const newLeftWidth = (availableWidth * clampedRatio) / 100;
  const newRightWidth = availableWidth - newLeftWidth;
  const newRightX = pair.left.x + newLeftWidth + pair.gap;

  return components.map(comp => {
    if (comp.id === pair.left.id) {
      return { ...comp, width: newLeftWidth };
    }
    if (comp.id === pair.right.id) {
      return { ...comp, x: newRightX, width: newRightWidth };
    }
    return comp;
  });
}

export function syncColumnWidthOnResize(
  components: Component[],
  resizedId: string,
  newWidth: number,
  shiftPressed: boolean
): Component[] {
  if (!shiftPressed) {
    return components;
  }

  const pair = findTwoColumnPair(components, resizedId);
  if (!pair) {
    return components;
  }

  const resizedComp = components.find(c => c.id === resizedId);
  if (!resizedComp) {
    return components;
  }

  const isLeft = resizedComp.columnRole === 'left';
  const availableWidth = pair.totalWidth - pair.gap;
  let finalLeftWidth: number;
  let finalRightWidth: number;
  let finalRightX: number;

  if (isLeft) {
    finalLeftWidth = Math.max(availableWidth * 0.3, Math.min(availableWidth * 0.7, newWidth));
    finalRightWidth = availableWidth - finalLeftWidth;
    finalRightX = pair.left.x + finalLeftWidth + pair.gap;
  } else {
    finalRightWidth = Math.max(availableWidth * 0.3, Math.min(availableWidth * 0.7, newWidth));
    finalLeftWidth = availableWidth - finalRightWidth;
    finalRightX = pair.left.x + finalLeftWidth + pair.gap;
  }

  return components.map(comp => {
    if (comp.id === pair.left.id) {
      return { ...comp, width: finalLeftWidth };
    }
    if (comp.id === pair.right.id) {
      return { ...comp, x: finalRightX, width: finalRightWidth };
    }
    return comp;
  });
}
