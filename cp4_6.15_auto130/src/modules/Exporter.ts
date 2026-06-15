import type { PlacedTile, CollisionRect, NPCData } from '../data/sampleMap';

export interface ExportedMapData {
  version: string;
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  exportedAt: string;
  tiles: PlacedTile[];
  collisions: CollisionRect[];
  npcs: NPCData[];
  tileMatrix: (string | null)[][];
}

export function exportToJSON(
  tiles: PlacedTile[],
  collisions: CollisionRect[],
  npcs: NPCData[],
  gridWidth: number,
  gridHeight: number,
  cellSize: number
): string {
  const tileMatrix: (string | null)[][] = [];
  for (let y = 0; y < gridHeight; y++) {
    tileMatrix.push(new Array(gridWidth).fill(null));
  }

  tiles.forEach((t) => {
    if (t.y >= 0 && t.y < gridHeight && t.x >= 0 && t.x < gridWidth) {
      tileMatrix[t.y][t.x] = t.tileId;
    }
  });

  const data: ExportedMapData = {
    version: '1.0.0',
    gridWidth,
    gridHeight,
    cellSize,
    exportedAt: new Date().toISOString(),
    tiles,
    collisions,
    npcs,
    tileMatrix,
  };

  return JSON.stringify(data, null, 2);
}

export function triggerDownload(json: string, filename: string = 'rpg-map.json'): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
