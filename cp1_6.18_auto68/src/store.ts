import { create } from 'zustand';
import { GRID } from '@/shared/styles';
import { getCellKey } from '@/shared/coord';

export type CellType = 'empty' | 'wall' | 'platform';
export type ToolMode = 'brush' | 'eraser' | 'select';
export type BrushType = 'wall' | 'platform';
export type ViewMode = 'edit' | 'roam';

export interface WallInfo {
  id: string;
  col: number;
  row: number;
  orientation: 'horizontal' | 'vertical';
}

export interface PlatformInfo {
  id: string;
  col: number;
  row: number;
}

export interface CommentData {
  id: string;
  workId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface WorkInfo {
  id: string;
  wallId: string;
  imageUrl: string;
  title: string;
  description: string;
  likes: number;
  liked: boolean;
  comments: CommentData[];
}

export interface PlayerPosition {
  x: number;
  y: number;
  angle: number;
}

export interface ContextMenuData {
  x: number;
  y: number;
  col: number;
  row: number;
}

interface GalleryState {
  grid: CellType[][];
  walls: WallInfo[];
  platforms: PlatformInfo[];
  works: WorkInfo[];
  visitorCount: number;
  toolMode: ToolMode;
  brushType: BrushType;
  viewMode: ViewMode;
  playerPos: PlayerPosition;
  selectedCell: { col: number; row: number } | null;
  hoveredCell: { col: number; row: number } | null;
  collisionFlash: boolean;
  showWorkUpload: string | null;
  showWorkPreview: string | null;
  showContextMenu: ContextMenuData | null;
  isDragging: boolean;
  dragStart: { col: number; row: number } | null;
}

interface GalleryActions {
  setToolMode: (mode: ToolMode) => void;
  setBrushType: (type: BrushType) => void;
  setViewMode: (mode: ViewMode) => void;
  setHoveredCell: (cell: { col: number; row: number } | null) => void;
  placeCell: (col: number, row: number) => void;
  removeCell: (col: number, row: number) => void;
  selectCell: (cell: { col: number; row: number } | null) => void;
  rotateWall: (col: number, row: number) => void;
  addWork: (wallId: string, imageUrl: string, title: string, description: string) => void;
  toggleLike: (workId: string) => void;
  addComment: (workId: string, content: string) => void;
  movePlayer: (dx: number, dy: number) => void;
  setPlayerAngle: (angle: number) => void;
  setCollisionFlash: (flash: boolean) => void;
  setShowWorkUpload: (wallId: string | null) => void;
  setShowWorkPreview: (workId: string | null) => void;
  setShowContextMenu: (data: ContextMenuData | null) => void;
  setIsDragging: (dragging: boolean) => void;
  setDragStart: (cell: { col: number; row: number } | null) => void;
  moveCell: (fromCol: number, fromRow: number, toCol: number, toRow: number) => void;
  initGallery: () => void;
  loadDemoData: () => void;
}

function createEmptyGrid(): CellType[][] {
  const grid: CellType[][] = [];
  for (let r = 0; r < GRID.defaultRows; r++) {
    const row: CellType[] = [];
    for (let c = 0; c < GRID.defaultCols; c++) {
      row.push('empty');
    }
    grid.push(row);
  }
  return grid;
}

let idCounter = 0;
function nextId(): string {
  return `id_${++idCounter}_${Date.now()}`;
}

export const useGalleryStore = create<GalleryState & GalleryActions>((set, get) => ({
  grid: createEmptyGrid(),
  walls: [],
  platforms: [],
  works: [],
  visitorCount: 1,
  toolMode: 'brush',
  brushType: 'wall',
  viewMode: 'edit',
  playerPos: { x: 1.5, y: 1.5, angle: 0 },
  selectedCell: null,
  hoveredCell: null,
  collisionFlash: false,
  showWorkUpload: null,
  showWorkPreview: null,
  showContextMenu: null,
  isDragging: false,
  dragStart: null,

  setToolMode: (mode) => set({ toolMode: mode, selectedCell: null }),
  setBrushType: (type) => set({ brushType: type }),
  setViewMode: (mode) => set({ viewMode: mode, showContextMenu: null }),

  setHoveredCell: (cell) => set({ hoveredCell: cell }),

  placeCell: (col, row) => {
    const state = get();
    if (row < 0 || row >= GRID.defaultRows || col < 0 || col >= GRID.defaultCols) return;
    if (state.grid[row][col] !== 'empty') return;

    const newGrid = state.grid.map((r) => [...r]);
    const newWalls = [...state.walls];
    const newPlatforms = [...state.platforms];

    if (state.brushType === 'wall') {
      newGrid[row][col] = 'wall';
      newWalls.push({
        id: nextId(),
        col,
        row,
        orientation: 'horizontal',
      });
    } else {
      newGrid[row][col] = 'platform';
      newPlatforms.push({
        id: nextId(),
        col,
        row,
      });
    }

    set({ grid: newGrid, walls: newWalls, platforms: newPlatforms });
  },

  removeCell: (col, row) => {
    const state = get();
    if (row < 0 || row >= GRID.defaultRows || col < 0 || col >= GRID.defaultCols) return;
    if (state.grid[row][col] === 'empty') return;

    const newGrid = state.grid.map((r) => [...r]);
    const cellType = newGrid[row][col];
    newGrid[row][col] = 'empty';

    let newWalls = state.walls;
    let newPlatforms = state.platforms;
    let newWorks = state.works;

    if (cellType === 'wall') {
      newWalls = state.walls.filter(
        (w) => !(w.col === col && w.row === row)
      );
      const wallKey = getCellKey(col, row);
      newWorks = state.works.filter((w) => w.wallId !== wallKey);
    } else {
      newPlatforms = state.platforms.filter(
        (p) => !(p.col === col && p.row === row)
      );
    }

    set({ grid: newGrid, walls: newWalls, platforms: newPlatforms, works: newWorks });
  },

  selectCell: (cell) => set({ selectedCell: cell }),

  rotateWall: (col, row) => {
    const state = get();
    const newWalls = state.walls.map((w) => {
      if (w.col === col && w.row === row) {
        return {
          ...w,
          orientation: w.orientation === 'horizontal' ? 'vertical' : 'horizontal',
        };
      }
      return w;
    });
    set({ walls: newWalls });
  },

  addWork: (wallId, imageUrl, title, description) => {
    const state = get();
    const newWork: WorkInfo = {
      id: nextId(),
      wallId,
      imageUrl,
      title,
      description,
      likes: 0,
      liked: false,
      comments: [],
    };
    set({ works: [...state.works, newWork], showWorkUpload: null });
  },

  toggleLike: (workId) => {
    const state = get();
    const newWorks = state.works.map((w) => {
      if (w.id === workId) {
        return {
          ...w,
          liked: !w.liked,
          likes: w.liked ? w.likes - 1 : w.likes + 1,
        };
      }
      return w;
    });
    set({ works: newWorks });
  },

  addComment: (workId, content) => {
    const state = get();
    const newComment: CommentData = {
      id: nextId(),
      workId,
      username: '访客' + Math.floor(Math.random() * 1000),
      content,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    const newWorks = state.works.map((w) => {
      if (w.id === workId) {
        return { ...w, comments: [...w.comments, newComment] };
      }
      return w;
    });
    set({ works: newWorks });
  },

  movePlayer: (dx, dy) => {
    const state = get();
    const newX = state.playerPos.x + dx;
    const newY = state.playerPos.y + dy;
    set({
      playerPos: { ...state.playerPos, x: newX, y: newY },
    });
  },

  setPlayerAngle: (angle) => {
    const state = get();
    set({ playerPos: { ...state.playerPos, angle } });
  },

  setCollisionFlash: (flash) => {
    set({ collisionFlash: flash });
    if (flash) {
      setTimeout(() => {
        set({ collisionFlash: false });
      }, 300);
    }
  },

  setShowWorkUpload: (wallId) => set({ showWorkUpload: wallId }),
  setShowWorkPreview: (workId) => set({ showWorkPreview: workId }),
  setShowContextMenu: (data) => set({ showContextMenu: data }),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  setDragStart: (cell) => set({ dragStart: cell }),

  moveCell: (fromCol, fromRow, toCol, toRow) => {
    const state = get();
    if (fromCol === toCol && fromRow === toRow) return;
    if (toRow < 0 || toRow >= GRID.defaultRows || toCol < 0 || toCol >= GRID.defaultCols) return;
    if (state.grid[toRow][toCol] !== 'empty') return;

    const newGrid = state.grid.map((r) => [...r]);
    const cellType = newGrid[fromRow][fromCol];
    newGrid[fromRow][fromCol] = 'empty';
    newGrid[toRow][toCol] = cellType;

    let newWalls = state.walls;
    let newPlatforms = state.platforms;
    let newWorks = state.works;

    if (cellType === 'wall') {
      newWalls = state.walls.map((w) => {
        if (w.col === fromCol && w.row === fromRow) {
          return { ...w, col: toCol, row: toRow };
        }
        return w;
      });
      const oldKey = getCellKey(fromCol, fromRow);
      const newKey = getCellKey(toCol, toRow);
      newWorks = state.works.map((w) => {
        if (w.wallId === oldKey) {
          return { ...w, wallId: newKey };
        }
        return w;
      });
    } else if (cellType === 'platform') {
      newPlatforms = state.platforms.map((p) => {
        if (p.col === fromCol && p.row === fromRow) {
          return { ...p, col: toCol, row: toRow };
        }
        return p;
      });
    }

    set({
      grid: newGrid,
      walls: newWalls,
      platforms: newPlatforms,
      works: newWorks,
      selectedCell: { col: toCol, row: toRow },
    });
  },

  initGallery: () => {
    set({
      grid: createEmptyGrid(),
      walls: [],
      platforms: [],
      works: [],
      visitorCount: 1,
      playerPos: { x: 1.5, y: 1.5, angle: 0 },
      selectedCell: null,
      showWorkUpload: null,
      showWorkPreview: null,
      showContextMenu: null,
    });
  },

  loadDemoData: () => {
    const grid = createEmptyGrid();

    const wallPositions = [
      [1, 1], [2, 1], [3, 1], [5, 1], [6, 1], [7, 1], [9, 1],
      [1, 3], [3, 3], [5, 3], [7, 3], [9, 3],
      [1, 5], [3, 5], [5, 5], [7, 5], [9, 5],
      [1, 6], [2, 6], [3, 6], [5, 6], [6, 6], [7, 6], [9, 6],
    ];

    const platformPositions = [
      [4, 2], [8, 2], [4, 4], [8, 4],
    ];

    const walls: WallInfo[] = [];
    const platforms: PlatformInfo[] = [];

    for (const [c, r] of wallPositions) {
      grid[r][c] = 'wall';
      walls.push({ id: nextId(), col: c, row: r, orientation: 'horizontal' });
    }

    for (const [c, r] of platformPositions) {
      grid[r][c] = 'platform';
      platforms.push({ id: nextId(), col: c, row: r });
    }

    const works: WorkInfo[] = [
      {
        id: 'w1',
        wallId: '3,1',
        imageUrl: 'https://picsum.photos/seed/art1/400/300',
        title: '星际漫步',
        description: '在宇宙的边际，光与影交织成画',
        likes: 15,
        liked: false,
        comments: [
          {
            id: 'c1',
            workId: 'w1',
            username: '星尘旅人',
            content: '令人震撼的作品！',
            createdAt: '2025-03-10 14:30',
          },
        ],
      },
      {
        id: 'w2',
        wallId: '5,1',
        imageUrl: 'https://picsum.photos/seed/art2/400/300',
        title: '量子花园',
        description: '微观世界的秩序与混沌',
        likes: 8,
        liked: false,
        comments: [],
      },
      {
        id: 'w3',
        wallId: '7,1',
        imageUrl: 'https://picsum.photos/seed/art3/400/300',
        title: '深海回响',
        description: '来自深渊的低语',
        likes: 23,
        liked: true,
        comments: [
          {
            id: 'c2',
            workId: 'w3',
            username: '潜行者',
            content: '深蓝色的调子太美了',
            createdAt: '2025-03-12 09:15',
          },
        ],
      },
    ];

    set({
      grid,
      walls,
      platforms,
      works,
      visitorCount: 42,
    });
  },
}));
