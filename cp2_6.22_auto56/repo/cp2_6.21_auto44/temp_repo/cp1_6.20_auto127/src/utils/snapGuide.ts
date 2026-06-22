import type { CanvasElement, GuideLines } from '../types';

const SNAP_THRESHOLD = 5;

export function calculateSnapGuidelines(
  draggedElement: CanvasElement,
  allElements: CanvasElement[],
  canvasWidth: number,
  canvasHeight: number
): { guidelines: GuideLines; snappedX: number; snappedY: number } {
  const guidelines: GuideLines = {
    vertical: [],
    horizontal: [],
  };

  let snappedX = draggedElement.x;
  let snappedY = draggedElement.y;

  const otherElements = allElements.filter((el) => el.id !== draggedElement.id);

  const draggedLeft = draggedElement.x;
  const draggedRight = draggedElement.x + draggedElement.width;
  const draggedCenterX = draggedElement.x + draggedElement.width / 2;
  const draggedTop = draggedElement.y;
  const draggedBottom = draggedElement.y + draggedElement.height;
  const draggedCenterY = draggedElement.y + draggedElement.height / 2;

  if (Math.abs(draggedLeft) < SNAP_THRESHOLD) {
    guidelines.vertical.push(0);
    snappedX = 0;
  }
  if (Math.abs(draggedRight - canvasWidth) < SNAP_THRESHOLD) {
    guidelines.vertical.push(canvasWidth);
    snappedX = canvasWidth - draggedElement.width;
  }
  if (Math.abs(draggedCenterX - canvasWidth / 2) < SNAP_THRESHOLD) {
    guidelines.vertical.push(canvasWidth / 2);
    snappedX = canvasWidth / 2 - draggedElement.width / 2;
  }

  if (Math.abs(draggedTop) < SNAP_THRESHOLD) {
    guidelines.horizontal.push(0);
    snappedY = 0;
  }
  if (Math.abs(draggedBottom - canvasHeight) < SNAP_THRESHOLD) {
    guidelines.horizontal.push(canvasHeight);
    snappedY = canvasHeight - draggedElement.height;
  }
  if (Math.abs(draggedCenterY - canvasHeight / 2) < SNAP_THRESHOLD) {
    guidelines.horizontal.push(canvasHeight / 2);
    snappedY = canvasHeight / 2 - draggedElement.height / 2;
  }

  for (const el of otherElements) {
    const elLeft = el.x;
    const elRight = el.x + el.width;
    const elCenterX = el.x + el.width / 2;
    const elTop = el.y;
    const elBottom = el.y + el.height;
    const elCenterY = el.y + el.height / 2;

    if (Math.abs(draggedLeft - elLeft) < SNAP_THRESHOLD) {
      guidelines.vertical.push(elLeft);
      snappedX = elLeft;
    }
    if (Math.abs(draggedRight - elRight) < SNAP_THRESHOLD) {
      guidelines.vertical.push(elRight);
      snappedX = elRight - draggedElement.width;
    }
    if (Math.abs(draggedLeft - elRight) < SNAP_THRESHOLD) {
      guidelines.vertical.push(elRight);
      snappedX = elRight;
    }
    if (Math.abs(draggedRight - elLeft) < SNAP_THRESHOLD) {
      guidelines.vertical.push(elLeft);
      snappedX = elLeft - draggedElement.width;
    }
    if (Math.abs(draggedCenterX - elCenterX) < SNAP_THRESHOLD) {
      guidelines.vertical.push(elCenterX);
      snappedX = elCenterX - draggedElement.width / 2;
    }

    if (Math.abs(draggedTop - elTop) < SNAP_THRESHOLD) {
      guidelines.horizontal.push(elTop);
      snappedY = elTop;
    }
    if (Math.abs(draggedBottom - elBottom) < SNAP_THRESHOLD) {
      guidelines.horizontal.push(elBottom);
      snappedY = elBottom - draggedElement.height;
    }
    if (Math.abs(draggedTop - elBottom) < SNAP_THRESHOLD) {
      guidelines.horizontal.push(elBottom);
      snappedY = elBottom;
    }
    if (Math.abs(draggedBottom - elTop) < SNAP_THRESHOLD) {
      guidelines.horizontal.push(elTop);
      snappedY = elTop - draggedElement.height;
    }
    if (Math.abs(draggedCenterY - elCenterY) < SNAP_THRESHOLD) {
      guidelines.horizontal.push(elCenterY);
      snappedY = elCenterY - draggedElement.height / 2;
    }
  }

  guidelines.vertical = [...new Set(guidelines.vertical)];
  guidelines.horizontal = [...new Set(guidelines.horizontal)];

  return { guidelines, snappedX, snappedY };
}
