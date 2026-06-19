import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  PixelColor,
  Tile,
  ToolType,
  Selection,
  GRID_SIZE,
  GRID_BG_COLOR,
  PRESET_COLORS,
} from './types';
import { createEmptyGrid, cloneGrid, clamp } from './utils';

interface MapState {
  mapData: PixelColor[][];
  currentTool: ToolType;
  brushColor: PixelColor;
  selectedTileId: string | null;
  tiles: Tile[];
  zoom: number;
  offsetX: number;
  offsetY: number;
  selection: Selection | null;
  isSelecting: boolean;
  history: PixelColor[][][];
  historyIndex: number;

  setTool: (tool: ToolType) => void;
  setBrushColor: (color: PixelColor) => void;
  setSelectedTile: (tileId: string | null) => void;
  setZoom: (zoom: number) => void;
  setOffset: (x: number, y: number) => void;

  drawPixel: (x: number, y: number, color: PixelColor) => void;
  erasePixel: (x: number, y: number) => void;
  clearCanvas: () => void;

  startSelection: (x: number, y: number) => void;
  updateSelection: (x: number, y: number) => void;
  endSelection: () => void;
  saveSelectionAsTile: (name: string) => void;
  deleteTile: (tileId: string) => void;

  drawTile: (x: number, y: number, tile: Tile) => void;

  undo: () => void;
  pushHistory: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  mapData: createEmptyGrid(GRID_SIZE, GRID_SIZE, GRID_BG_COLOR),
  currentTool: 'brush',
  brushColor: PRESET_COLORS[0],
  selectedTileId: null,
  tiles: [],
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  selection: null,
  isSelecting: false,
  history: [createEmptyGrid(GRID_SIZE, GRID_SIZE, GRID_BG_COLOR)],
  historyIndex: 0,

  setTool: (tool) => set({ currentTool: tool }),

  setBrushColor: (color) => set({ brushColor: color }),

  setSelectedTile: (tileId) =>
    set({ selectedTileId: tileId, currentTool: tileId ? 'tile' : 'brush' }),

  setZoom: (zoom) => set({ zoom: clamp(zoom, 0.5, 3) }),

  setOffset: (x, y) => set({ offsetX: x, offsetY: y }),

  drawPixel: (x, y, color) => {
    const { mapData } = get();
    if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return;
    const newData = cloneGrid(mapData);
    newData[y][x] = color;
    set({ mapData: newData });
  },

  erasePixel: (x, y) => {
    const { mapData } = get();
    if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return;
    const newData = cloneGrid(mapData);
    newData[y][x] = GRID_BG_COLOR;
    set({ mapData: newData });
  },

  clearCanvas: () => {
    const emptyGrid = createEmptyGrid(GRID_SIZE, GRID_SIZE, GRID_BG_COLOR);
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(cloneGrid(emptyGrid));
    set({
      mapData: emptyGrid,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  startSelection: (x, y) => {
    set({
      isSelecting: true,
      selection: { startX: x, startY: y, endX: x, endY: y },
    });
  },

  updateSelection: (x, y) => {
    const { selection, isSelecting } = get();
    if (!isSelecting || !selection) return;
    set({
      selection: {
        ...selection,
        endX: clamp(x, 0, GRID_SIZE - 1),
        endY: clamp(y, 0, GRID_SIZE - 1),
      },
    });
  },

  endSelection: () => {
    set({ isSelecting: false });
  },

  saveSelectionAsTile: (name) => {
    const { mapData, selection, tiles } = get();
    if (!selection) return;
    if (tiles.length >= 8) return;

    const minX = Math.min(selection.startX, selection.endX);
    const maxX = Math.max(selection.startX, selection.endX);
    const minY = Math.min(selection.startY, selection.endY);
    const maxY = Math.max(selection.startY, selection.endY);

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    const tileData: PixelColor[][] = [];
    for (let y = minY; y <= maxY; y++) {
      const row: PixelColor[] = [];
      for (let x = minX; x <= maxX; x++) {
        row.push(mapData[y][x]);
      }
      tileData.push(row);
    }

    const newTile: Tile = {
      id: uuidv4(),
      name,
      data: tileData,
      width,
      height,
    };

    set({
      tiles: [...tiles, newTile],
      selection: null,
    });
  },

  deleteTile: (tileId) => {
    const { tiles, selectedTileId } = get();
    set({
      tiles: tiles.filter((t) => t.id !== tileId),
      selectedTileId: selectedTileId === tileId ? null : selectedTileId,
    });
  },

  drawTile: (x, y, tile) => {
    const { mapData } = get();
    const newData = cloneGrid(mapData);

    for (let ty = 0; ty < tile.height; ty++) {
      for (let tx = 0; tx < tile.width; tx++) {
        const mapX = x + tx;
        const mapY = y + ty;
        if (mapX >= 0 && mapY >= 0 && mapX < GRID_SIZE && mapY < GRID_SIZE) {
          newData[mapY][mapX] = tile.data[ty][tx];
        }
      }
    }

    set({ mapData: newData });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    set({
      mapData: cloneGrid(history[newIndex]),
      historyIndex: newIndex,
    });
  },

  pushHistory: () => {
    const { mapData, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(cloneGrid(mapData));
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      set({ historyIndex: historyIndex + 1 });
    }
    set({ history: newHistory });
  },
}));
