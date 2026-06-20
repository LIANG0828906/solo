export const GRID_SIZE = {
  iconWidth: 100,
  iconHeight: 110,
  gapX: 20,
  gapY: 20,
};

export function snapToGrid(
  x: number,
  y: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  const col = Math.round(x / (GRID_SIZE.iconWidth + GRID_SIZE.gapX));
  const row = Math.round(y / (GRID_SIZE.iconHeight + GRID_SIZE.gapY));
  
  const maxCols = Math.floor((containerWidth - GRID_SIZE.gapX) / (GRID_SIZE.iconWidth + GRID_SIZE.gapX));
  const maxRows = Math.floor((containerHeight - GRID_SIZE.gapY) / (GRID_SIZE.iconHeight + GRID_SIZE.gapY));
  
  const clampedCol = Math.max(0, Math.min(col, maxCols - 1));
  const clampedRow = Math.max(0, Math.min(row, maxRows - 1));
  
  return {
    x: clampedCol * (GRID_SIZE.iconWidth + GRID_SIZE.gapX) + GRID_SIZE.gapX,
    y: clampedRow * (GRID_SIZE.iconHeight + GRID_SIZE.gapY) + GRID_SIZE.gapY + 80,
  };
}

export function checkCollision(
  x: number,
  y: number,
  existingPositions: Array<{ id: string; x: number; y: number }>,
  excludeId?: string
): boolean {
  return existingPositions.some(pos => {
    if (excludeId && pos.id === excludeId) return false;
    return Math.abs(pos.x - x) < GRID_SIZE.iconWidth / 2 &&
           Math.abs(pos.y - y) < GRID_SIZE.iconHeight / 2;
  });
}

export function findEmptySlot(
  containerWidth: number,
  containerHeight: number,
  existingPositions: Array<{ id: string; x: number; y: number }>
): { x: number; y: number } {
  const maxCols = Math.floor((containerWidth - GRID_SIZE.gapX) / (GRID_SIZE.iconWidth + GRID_SIZE.gapX));
  const maxRows = Math.floor((containerHeight - GRID_SIZE.gapY) / (GRID_SIZE.iconHeight + GRID_SIZE.gapY));
  
  for (let row = 0; row < maxRows; row++) {
    for (let col = 0; col < maxCols; col++) {
      const x = col * (GRID_SIZE.iconWidth + GRID_SIZE.gapX) + GRID_SIZE.gapX;
      const y = row * (GRID_SIZE.iconHeight + GRID_SIZE.gapY) + GRID_SIZE.gapY + 80;
      
      if (!checkCollision(x, y, existingPositions)) {
        return { x, y };
      }
    }
  }
  
  return {
    x: GRID_SIZE.gapX,
    y: maxRows * (GRID_SIZE.iconHeight + GRID_SIZE.gapY) + GRID_SIZE.gapY + 80,
  };
}
