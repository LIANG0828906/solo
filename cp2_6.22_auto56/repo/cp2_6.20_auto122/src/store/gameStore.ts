import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type TerrainTheme = 'grass' | 'stone' | 'dirt';
export type ObjectType = 'spawn' | 'spike' | 'movingPlatform' | 'coin';

export interface GridCell {
  filled: boolean;
  theme: TerrainTheme;
}

export interface GameObject {
  id: string;
  type: ObjectType;
  gridX: number;
  gridY: number;
  moveRange?: number;
  moveSpeed?: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
}

export const GRID_COLS = 8;
export const GRID_ROWS = 12;
export const CELL_SIZE = 48;
export const PLAYER_SIZE = 16;

const createEmptyGrid = (): GridCell[][] => {
  return Array(GRID_ROWS)
    .fill(null)
    .map(() =>
      Array(GRID_COLS)
        .fill(null)
        .map(() => ({ filled: false, theme: 'grass' as TerrainTheme }))
    );
};

interface GameState {
  grid: GridCell[][];
  objects: GameObject[];
  selectedTool: TerrainTheme | ObjectType | null;
  selectedObjectId: string | null;
  isPlaying: boolean;
  player: PlayerState;
  exportedJson: string;
  hoveredCell: { x: number; y: number } | null;

  toggleCell: (x: number, y: number, theme: TerrainTheme) => void;
  fillRow: (y: number, theme: TerrainTheme) => void;
  clearColumn: (x: number) => void;
  setSelectedTool: (tool: TerrainTheme | ObjectType | null) => void;
  placeObject: (type: ObjectType, gridX: number, gridY: number) => void;
  selectObject: (id: string | null) => void;
  moveObject: (id: string, gridX: number, gridY: number) => void;
  deleteObject: (id: string) => void;
  setPlaying: (playing: boolean) => void;
  updatePlayer: (player: Partial<PlayerState>) => void;
  resetPlayer: () => void;
  setExportedJson: (json: string) => void;
  setHoveredCell: (cell: { x: number; y: number } | null) => void;
  setGrid: (grid: GridCell[][]) => void;
  setObjects: (objects: GameObject[]) => void;
  clearAll: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  grid: createEmptyGrid(),
  objects: [],
  selectedTool: 'grass',
  selectedObjectId: null,
  isPlaying: false,
  player: {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    onGround: false,
  },
  exportedJson: '',
  hoveredCell: null,

  toggleCell: (x: number, y: number, theme: TerrainTheme) => {
    set((state) => {
      const newGrid = state.grid.map((row) => [...row]);
      if (newGrid[y] && newGrid[y][x]) {
        newGrid[y][x] = {
          filled: !newGrid[y][x].filled,
          theme,
        };
      }
      return { grid: newGrid };
    });
  },

  fillRow: (y: number, theme: TerrainTheme) => {
    set((state) => {
      const newGrid = state.grid.map((row) => [...row]);
      if (newGrid[y]) {
        for (let x = 0; x < GRID_COLS; x++) {
          newGrid[y][x] = { filled: true, theme };
        }
      }
      return { grid: newGrid };
    });
  },

  clearColumn: (x: number) => {
    set((state) => {
      const newGrid = state.grid.map((row) => [...row]);
      for (let y = 0; y < GRID_ROWS; y++) {
        if (newGrid[y] && newGrid[y][x]) {
          newGrid[y][x] = { ...newGrid[y][x], filled: false };
        }
      }
      return { grid: newGrid };
    });
  },

  setSelectedTool: (tool) => set({ selectedTool: tool, selectedObjectId: null }),

  placeObject: (type: ObjectType, gridX: number, gridY: number) => {
    const existing = get().objects.find(
      (obj) => obj.gridX === gridX && obj.gridY === gridY
    );
    if (existing) return;

    if (type === 'spawn') {
      set((state) => ({
        objects: [
          ...state.objects.filter((o) => o.type !== 'spawn'),
          {
            id: uuidv4(),
            type,
            gridX,
            gridY,
          },
        ],
      }));
    } else {
      const newObj: GameObject = {
        id: uuidv4(),
        type,
        gridX,
        gridY,
      };
      if (type === 'movingPlatform') {
        newObj.moveRange = 2;
        newObj.moveSpeed = 1;
      }
      set((state) => ({
        objects: [...state.objects, newObj],
      }));
    }
  },

  selectObject: (id) => set({ selectedObjectId: id }),

  moveObject: (id: string, gridX: number, gridY: number) => {
    if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) return;
    const existing = get().objects.find(
      (obj) => obj.gridX === gridX && obj.gridY === gridY && obj.id !== id
    );
    if (existing) return;

    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, gridX, gridY } : obj
      ),
    }));
  },

  deleteObject: (id: string) => {
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
    }));
  },

  setPlaying: (playing: boolean) => {
    if (playing) {
      const spawn = get().objects.find((o) => o.type === 'spawn');
      if (spawn) {
        const px = spawn.gridX * CELL_SIZE + (CELL_SIZE - PLAYER_SIZE) / 2;
        const py = spawn.gridY * CELL_SIZE + (CELL_SIZE - PLAYER_SIZE);
        set({
          isPlaying: true,
          player: {
            x: px,
            y: py,
            vx: 0,
            vy: 0,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
            onGround: false,
          },
        });
      } else {
        set({ isPlaying: true });
      }
    } else {
      set({ isPlaying: false });
    }
  },

  updatePlayer: (player: Partial<PlayerState>) => {
    set((state) => ({
      player: { ...state.player, ...player },
    }));
  },

  resetPlayer: () => {
    const spawn = get().objects.find((o) => o.type === 'spawn');
    if (spawn) {
      const px = spawn.gridX * CELL_SIZE + (CELL_SIZE - PLAYER_SIZE) / 2;
      const py = spawn.gridY * CELL_SIZE + (CELL_SIZE - PLAYER_SIZE);
      set({
        player: {
          x: px,
          y: py,
          vx: 0,
          vy: 0,
          width: PLAYER_SIZE,
          height: PLAYER_SIZE,
          onGround: false,
        },
      });
    }
  },

  setExportedJson: (json: string) => set({ exportedJson: json }),

  setHoveredCell: (cell) => set({ hoveredCell: cell }),

  setGrid: (grid: GridCell[][]) => set({ grid }),

  setObjects: (objects: GameObject[]) => set({ objects }),

  clearAll: () => {
    set({
      grid: createEmptyGrid(),
      objects: [],
      selectedObjectId: null,
      exportedJson: '',
    });
  },
}));
