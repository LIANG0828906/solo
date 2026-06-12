import type { MazeData, Cell } from './maze';
import { v4 as uuidv4 } from 'uuid';

export interface SavedMaze {
  id: string;
  name: string;
  size: number;
  data: MazeData;
  thumbnail: string;
  createdAt: number;
}

const STORAGE_KEY = 'maze_generator_saves';
const MAX_SAVES = 5;
const THUMBNAIL_SIZE = 100;

export function saveMaze(name: string, mazeData: MazeData): SavedMaze | null {
  const list = loadMazeList();

  if (list.length >= MAX_SAVES) {
    return null;
  }

  const saved: SavedMaze = {
    id: uuidv4(),
    name,
    size: mazeData.length,
    data: mazeData,
    thumbnail: generateThumbnail(mazeData),
    createdAt: Date.now()
  };

  list.push(saved);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return saved;
}

export function loadMazeList(): SavedMaze[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedMaze[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function deleteMaze(id: string): boolean {
  const list = loadMazeList();
  const index = list.findIndex(m => m.id === id);
  if (index === -1) return false;
  list.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return true;
}

export function generateThumbnail(mazeData: MazeData): string {
  const size = mazeData.length;
  const cellSize = Math.floor(THUMBNAIL_SIZE / size);
  const actualSize = cellSize * size;

  const canvas = document.createElement('canvas');
  canvas.width = actualSize;
  canvas.height = actualSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, actualSize, actualSize);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell: Cell = mazeData[y][x];
      const px = x * cellSize;
      const py = y * cellSize;

      if (cell.generated) {
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(px, py, cellSize, cellSize);
      }

      ctx.strokeStyle = '#16213e';
      ctx.lineWidth = Math.max(1, cellSize * 0.15);

      if (cell.walls.top) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + cellSize, py);
        ctx.stroke();
      }
      if (cell.walls.right) {
        ctx.beginPath();
        ctx.moveTo(px + cellSize, py);
        ctx.lineTo(px + cellSize, py + cellSize);
        ctx.stroke();
      }
      if (cell.walls.bottom) {
        ctx.beginPath();
        ctx.moveTo(px, py + cellSize);
        ctx.lineTo(px + cellSize, py + cellSize);
        ctx.stroke();
      }
      if (cell.walls.left) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + cellSize);
        ctx.stroke();
      }
    }
  }

  return canvas.toDataURL('image/png');
}
