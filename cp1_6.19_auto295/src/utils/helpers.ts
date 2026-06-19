export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const getCurrentTimeString = (): string => {
  const now = new Date();
  return now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const GALLERY_DIMENSIONS = {
  width: 12,
  depth: 8,
  height: 5,
};

export const WALL_GRID_SIZE = 1;
export const FLOOR_GRID_SIZE = 0.5;

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};
