import type { Block } from '../stores/editorStore';

export const CANVAS_WIDTH = 794;
export const CANVAS_HEIGHT = 1123;
export const SNAP_THRESHOLD = 10;
export const GRID_SIZE = 20;

export interface GuideLines {
  vertical: number | null;
  horizontal: number | null;
}

export function calculateSnapPosition(
  block: Block,
  newX: number,
  newY: number,
  allBlocks: Block[]
): { x: number; y: number; guides: GuideLines } {
  let x = newX;
  let y = newY;
  const guides: GuideLines = { vertical: null, horizontal: null };

  const centerX = CANVAS_WIDTH / 2;
  const topEdge = 0;
  const bottomEdge = CANVAS_HEIGHT;

  const blockRight = newX + block.width;
  const blockBottom = newY + block.height;
  const blockCenterX = newX + block.width / 2;
  const blockCenterY = newY + block.height / 2;

  if (Math.abs(newX - centerX) <= SNAP_THRESHOLD) {
    x = centerX;
    guides.vertical = centerX;
  } else if (Math.abs(blockRight - centerX) <= SNAP_THRESHOLD) {
    x = centerX - block.width;
    guides.vertical = centerX;
  } else if (Math.abs(blockCenterX - centerX) <= SNAP_THRESHOLD) {
    x = centerX - block.width / 2;
    guides.vertical = centerX;
  }

  if (Math.abs(newY - topEdge) <= SNAP_THRESHOLD) {
    y = topEdge;
    guides.horizontal = topEdge;
  } else if (Math.abs(blockBottom - bottomEdge) <= SNAP_THRESHOLD) {
    y = bottomEdge - block.height;
    guides.horizontal = bottomEdge;
  } else if (Math.abs(newY - CANVAS_HEIGHT / 2) <= SNAP_THRESHOLD) {
    y = CANVAS_HEIGHT / 2;
    guides.horizontal = CANVAS_HEIGHT / 2;
  }

  const otherBlocks = allBlocks.filter((b) => b.id !== block.id);
  for (const other of otherBlocks) {
    const otherRight = other.x + other.width;
    const otherBottom = other.y + other.height;
    const otherCenterX = other.x + other.width / 2;
    const otherCenterY = other.y + other.height / 2;

    if (Math.abs(newX - other.x) <= SNAP_THRESHOLD) {
      x = other.x;
      guides.vertical = other.x;
    } else if (Math.abs(blockRight - otherRight) <= SNAP_THRESHOLD) {
      x = otherRight - block.width;
      guides.vertical = otherRight;
    } else if (Math.abs(blockRight - other.x) <= SNAP_THRESHOLD) {
      x = other.x - block.width;
      guides.vertical = other.x;
    } else if (Math.abs(newX - otherRight) <= SNAP_THRESHOLD) {
      x = otherRight;
      guides.vertical = otherRight;
    } else if (Math.abs(blockCenterX - otherCenterX) <= SNAP_THRESHOLD) {
      x = otherCenterX - block.width / 2;
      guides.vertical = otherCenterX;
    }

    if (Math.abs(newY - other.y) <= SNAP_THRESHOLD) {
      y = other.y;
      guides.horizontal = other.y;
    } else if (Math.abs(blockBottom - otherBottom) <= SNAP_THRESHOLD) {
      y = otherBottom - block.height;
      guides.horizontal = otherBottom;
    } else if (Math.abs(blockBottom - other.y) <= SNAP_THRESHOLD) {
      y = other.y - block.height;
      guides.horizontal = other.y;
    } else if (Math.abs(newY - otherBottom) <= SNAP_THRESHOLD) {
      y = otherBottom;
      guides.horizontal = otherBottom;
    } else if (Math.abs(blockCenterY - otherCenterY) <= SNAP_THRESHOLD) {
      y = otherCenterY - block.height / 2;
      guides.horizontal = otherCenterY;
    }
  }

  x = Math.max(0, Math.min(x, CANVAS_WIDTH - block.width));
  y = Math.max(0, Math.min(y, CANVAS_HEIGHT - block.height));

  return { x, y, guides };
}

export function getGridBackground(): string {
  return `repeating-linear-gradient(
      0deg,
      transparent,
      transparent ${GRID_SIZE - 1}px,
      #E5E7EB ${GRID_SIZE - 1}px,
      #E5E7EB ${GRID_SIZE}px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent ${GRID_SIZE - 1}px,
      #E5E7EB ${GRID_SIZE - 1}px,
      #E5E7EB ${GRID_SIZE}px
    )`;
}

export function clampResize(
  block: Block,
  handle: 'nw' | 'ne' | 'sw' | 'se',
  deltaX: number,
  deltaY: number
): { x: number; y: number; width: number; height: number } {
  let { x, y, width, height } = block;
  const minSize = 40;

  switch (handle) {
    case 'nw':
      width = Math.max(minSize, block.width - deltaX);
      height = Math.max(minSize, block.height - deltaY);
      x = block.width - width + block.x;
      y = block.height - height + block.y;
      break;
    case 'ne':
      width = Math.max(minSize, block.width + deltaX);
      height = Math.max(minSize, block.height - deltaY);
      y = block.height - height + block.y;
      break;
    case 'sw':
      width = Math.max(minSize, block.width - deltaX);
      height = Math.max(minSize, block.height + deltaY);
      x = block.width - width + block.x;
      break;
    case 'se':
      width = Math.max(minSize, block.width + deltaX);
      height = Math.max(minSize, block.height + deltaY);
      break;
  }

  x = Math.max(0, Math.min(x, CANVAS_WIDTH - width));
  y = Math.max(0, Math.min(y, CANVAS_HEIGHT - height));

  return { x, y, width, height };
}
