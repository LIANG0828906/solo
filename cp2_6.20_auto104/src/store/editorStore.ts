import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { generateMap, MapTheme, MapData, Room } from '@core/mapGenerator';
import { Monster, MonsterType, MonsterTemplate, monsters as monsterTemplates } from '@core/monsterData';

export type CellValue = 0 | 1 | 2 | 3;

export type ToolMode = 'select' | 'wall' | 'door' | 'decoration' | 'patrol';

export interface PatrolPathState {
  monsterId: string | null;
  points: { x: number; y: number }[];
  isDrawing: boolean;
}

export interface PreviewAnimationState {
  monsterId: string | null;
  isPlaying: boolean;
}

export interface EditorState {
  mapData: MapData | null;
  grid: CellValue[][];
  rooms: Room[];
  theme: MapTheme;
  rows: number;
  cols: number;
  cellSize: number;
  monsters: Monster[];
  selectedMonsterId: string | null;
  toolMode: ToolMode;
  patrolPath: PatrolPathState;
  previewAnim: PreviewAnimationState;
  animationSpeed: number;
  showSuccessToast: boolean;
  canvasOffset: { x: number; y: number };
  canvasZoom: number;
  fadeAnimation: boolean;

  setTheme: (theme: MapTheme) => void;
  setRows: (rows: number) => void;
  setCols: (cols: number) => void;
  setCellSize: (size: number) => void;
  setToolMode: (mode: ToolMode) => void;
  setSelectedMonsterId: (id: string | null) => void;
  setAnimationSpeed: (speed: number) => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  setCanvasZoom: (zoom: number) => void;

  generateNewMap: () => void;
  addMonsterToGrid: (template: MonsterTemplate, gridX: number, gridY: number) => void;
  removeMonster: (id: string) => void;
  moveMonster: (id: string, gridX: number, gridY: number) => void;
  setCellValue: (x: number, y: number, value: CellValue) => void;

  startPatrolPath: (monsterId: string) => void;
  addPatrolPoint: (point: { x: number; y: number }) => void;
  completePatrolPath: () => void;
  cancelPatrolPath: () => void;

  startPreviewAnimation: (monsterId: string) => void;
  stopPreviewAnimation: (monsterId: string) => void;

  exportJSON: () => string;
  setShowSuccessToast: (show: boolean) => void;
  setFadeAnimation: (fade: boolean) => void;
}

const defaultRows = 15;
const defaultCols = 15;
const defaultCellSize = 32;

export const useEditorStore = create<EditorState>((set, get) => ({
  mapData: null,
  grid: [],
  rooms: [],
  theme: 'catacomb',
  rows: defaultRows,
  cols: defaultCols,
  cellSize: defaultCellSize,
  monsters: [],
  selectedMonsterId: null,
  toolMode: 'select',
  patrolPath: { monsterId: null, points: [], isDrawing: false },
  previewAnim: { monsterId: null, isPlaying: false },
  animationSpeed: 1,
  showSuccessToast: false,
  canvasOffset: { x: 0, y: 0 },
  canvasZoom: 1,
  fadeAnimation: false,

  setTheme: (theme) => set({ theme }),
  setRows: (rows) => set({ rows: Math.max(5, Math.min(20, rows)) }),
  setCols: (cols) => set({ cols: Math.max(5, Math.min(20, cols)) }),
  setCellSize: (size) => set({ cellSize: size }),
  setToolMode: (mode) => set({ toolMode: mode }),
  setSelectedMonsterId: (id) => set({ selectedMonsterId: id }),
  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
  setCanvasOffset: (offset) => set({ canvasOffset: offset }),
  setCanvasZoom: (zoom) => set({ canvasZoom: Math.max(0.3, Math.min(3, zoom)) }),

  generateNewMap: () => {
    const { theme, rows, cols } = get();
    const mapData = generateMap(theme, rows, cols);
    const numRooms = mapData.rooms.length;
    const fadeDuration = Math.max(800, numRooms * 100 + 400);
    set({
      mapData,
      grid: mapData.grid as CellValue[][],
      rooms: mapData.rooms,
      monsters: [],
      selectedMonsterId: null,
      patrolPath: { monsterId: null, points: [], isDrawing: false },
      previewAnim: { monsterId: null, isPlaying: false },
      fadeAnimation: true,
    });
    setTimeout(() => set({ fadeAnimation: false }), fadeDuration);
  },

  addMonsterToGrid: (template, gridX, gridY) => {
    const { grid, monsters } = get();
    if (grid.length === 0) return;
    if (gridY < 0 || gridY >= grid.length || gridX < 0 || gridX >= grid[0].length) return;
    if (grid[gridY][gridX] !== 0) return;

    const newMonster: Monster = {
      id: uuidv4(),
      type: template.type,
      name: template.name,
      hp: template.hp,
      attack: template.attack,
      speed: template.speed,
      gridX,
      gridY,
      svgAvatar: template.svgAvatar,
      patrolPath: [],
      color: template.color,
    };

    const newGrid = grid.map((row) => [...row]);
    newGrid[gridY][gridX] = 2;

    set({
      monsters: [...monsters, newMonster],
      grid: newGrid,
    });
  },

  removeMonster: (id) => {
    const { monsters, grid } = get();
    const monster = monsters.find((m) => m.id === id);
    if (!monster) return;

    const newGrid = grid.map((row) => [...row]);
    if (newGrid[monster.gridY] && newGrid[monster.gridY][monster.gridX] === 2) {
      newGrid[monster.gridY][monster.gridX] = 0;
    }

    set({
      monsters: monsters.filter((m) => m.id !== id),
      grid: newGrid,
      selectedMonsterId: null,
      previewAnim: { monsterId: null, isPlaying: false },
    });
  },

  moveMonster: (id, gridX, gridY) => {
    const { monsters, grid } = get();
    const monster = monsters.find((m) => m.id === id);
    if (!monster) return;
    if (gridY < 0 || gridY >= grid.length || gridX < 0 || gridX >= grid[0].length) return;
    if (grid[gridY][gridX] !== 0) return;

    const newGrid = grid.map((row) => [...row]);
    newGrid[monster.gridY][monster.gridX] = 0;
    newGrid[gridY][gridX] = 2;

    set({
      monsters: monsters.map((m) => (m.id === id ? { ...m, gridX, gridY } : m)),
      grid: newGrid,
    });
  },

  setCellValue: (x, y, value) => {
    const { grid, monsters } = get();
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return;

    const monsterOnCell = monsters.find((m) => m.gridX === x && m.gridY === y);
    if (monsterOnCell && value !== 2) return;

    const newGrid = grid.map((row) => [...row]);
    newGrid[y][x] = value;
    set({ grid: newGrid });
  },

  startPatrolPath: (monsterId) => {
    const monster = get().monsters.find((m) => m.id === monsterId);
    const initialPoints = monster && monster.patrolPath.length > 0
      ? [...monster.patrolPath]
      : [];
    set({
      patrolPath: { monsterId, points: initialPoints, isDrawing: true },
      toolMode: 'patrol',
      previewAnim: { monsterId: null, isPlaying: false },
    });
  },

  addPatrolPoint: (point) => {
    const { patrolPath } = get();
    if (!patrolPath.isDrawing) return;
    const exists = patrolPath.points.some((p) => p.x === point.x && p.y === point.y);
    if (exists) return;
    set({
      patrolPath: {
        ...patrolPath,
        points: [...patrolPath.points, point],
      },
    });
  },

  completePatrolPath: () => {
    const { patrolPath, monsters } = get();
    if (!patrolPath.monsterId || patrolPath.points.length < 2) {
      set({
        patrolPath: { monsterId: null, points: [], isDrawing: false },
        toolMode: 'select',
      });
      return;
    }

    const finalPath = patrolPath.points;

    set({
      monsters: monsters.map((m) =>
        m.id === patrolPath.monsterId ? { ...m, patrolPath: [...finalPath] } : m
      ),
      patrolPath: { monsterId: null, points: [], isDrawing: false },
      toolMode: 'select',
    });
  },

  cancelPatrolPath: () => {
    set({
      patrolPath: { monsterId: null, points: [], isDrawing: false },
      toolMode: 'select',
    });
  },

  startPreviewAnimation: (monsterId) => {
    set({
      previewAnim: { monsterId, isPlaying: true },
    });
  },

  stopPreviewAnimation: () => {
    set({
      previewAnim: { monsterId: null, isPlaying: false },
    });
  },

  exportJSON: () => {
    const { grid, monsters, theme, rows, cols, cellSize } = get();
    const exportData = {
      metadata: {
        theme,
        rows,
        cols,
        cellSize,
      },
      grid: grid.map((row) => row.map((cell) => cell as number)),
      monsters: monsters.map((m) => ({
        id: m.id,
        type: m.type,
        name: m.name,
        hp: m.hp,
        attack: m.attack,
        speed: m.speed,
        gridX: m.gridX,
        gridY: m.gridY,
        patrolPath: m.patrolPath,
      })),
    };
    const json = JSON.stringify(exportData, null, 2);
    set({ showSuccessToast: true });
    setTimeout(() => set({ showSuccessToast: false }), 3000);
    return json;
  },

  setShowSuccessToast: (show) => set({ showSuccessToast: show }),
  setFadeAnimation: (fade) => set({ fadeAnimation: fade }),
}));
