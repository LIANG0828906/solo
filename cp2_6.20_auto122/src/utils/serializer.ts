import type { GridCell, GameObject } from '../store/gameStore';

export interface LevelData {
  grid: GridCell[][];
  objects: GameObject[];
}

export const exportLevel = (grid: GridCell[][], objects: GameObject[]): string => {
  const data: LevelData = {
    grid,
    objects: objects.map((obj) => ({
      id: obj.id,
      type: obj.type,
      gridX: obj.gridX,
      gridY: obj.gridY,
      ...(obj.moveRange !== undefined ? { moveRange: obj.moveRange } : {}),
      ...(obj.moveSpeed !== undefined ? { moveSpeed: obj.moveSpeed } : {}),
    })),
  };
  return JSON.stringify(data, null, 2);
};

export const importLevel = (jsonString: string): LevelData | null => {
  try {
    const data = JSON.parse(jsonString) as LevelData;

    if (!data.grid || !Array.isArray(data.grid)) {
      throw new Error('Invalid grid data');
    }

    if (!data.objects || !Array.isArray(data.objects)) {
      throw new Error('Invalid objects data');
    }

    for (let y = 0; y < data.grid.length; y++) {
      const row = data.grid[y];
      if (!Array.isArray(row)) {
        throw new Error(`Invalid row at index ${y}`);
      }
      for (let x = 0; x < row.length; x++) {
        const cell = row[x];
        if (
          typeof cell.filled !== 'boolean' ||
          !['grass', 'stone', 'dirt'].includes(cell.theme)
        ) {
          throw new Error(`Invalid cell at (${x}, ${y})`);
        }
      }
    }

    const validTypes = ['spawn', 'spike', 'movingPlatform', 'coin'];
    for (const obj of data.objects) {
      if (
        typeof obj.id !== 'string' ||
        !validTypes.includes(obj.type) ||
        typeof obj.gridX !== 'number' ||
        typeof obj.gridY !== 'number'
      ) {
        throw new Error(`Invalid object: ${JSON.stringify(obj)}`);
      }
    }

    return data;
  } catch (e) {
    console.error('Failed to import level:', e);
    return null;
  }
};
