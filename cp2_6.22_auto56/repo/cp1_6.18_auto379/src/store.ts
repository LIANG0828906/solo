import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Point {
  x: number;
  y: number;
}

export interface StrokePath {
  id: string;
  points: Point[];
}

export interface HistoryRecord {
  id: string;
  thumbnail: string;
  recognizedText: string;
  savedAt: string;
}

export interface RecognitionResult {
  candidates: string[];
  selected: string | null;
}

interface AppState {
  paths: StrokePath[];
  currentPath: Point[];
  isDrawing: boolean;
  undoStack: StrokePath[][];
  history: HistoryRecord[];
  recognitionResult: RecognitionResult;

  startDrawing: (point: Point) => void;
  continueDrawing: (point: Point) => void;
  stopDrawing: () => void;
  undo: () => void;
  clearCanvas: () => void;
  recognize: (canvas: HTMLCanvasElement) => void;
  selectCandidate: (text: string) => void;
  saveToHistory: (thumbnail: string) => void;
  deleteHistoryItem: (id: string) => void;
  clearHistory: () => void;
  clearRecognition: () => void;
}

const MAX_UNDO = 20;

const CHARACTER_DB: { char: string; strokeCount: number; features: number[] }[] = [
  { char: '你', strokeCount: 7, features: [0.3, 0.1, 0.5, 0.8, 0.2, 0.6, 0.9] },
  { char: '好', strokeCount: 6, features: [0.5, 0.3, 0.7, 0.2, 0.8, 0.4] },
  { char: '我', strokeCount: 7, features: [0.2, 0.6, 0.4, 0.9, 0.1, 0.7, 0.3] },
  { char: '是', strokeCount: 9, features: [0.6, 0.2, 0.8, 0.3, 0.5, 0.7, 0.1, 0.9, 0.4] },
  { char: '中', strokeCount: 4, features: [0.5, 0.5, 0.5, 0.5] },
  { char: '国', strokeCount: 8, features: [0.4, 0.6, 0.2, 0.8, 0.3, 0.7, 0.5, 0.1] },
  { char: '人', strokeCount: 2, features: [0.3, 0.7] },
  { char: '大', strokeCount: 3, features: [0.5, 0.3, 0.7] },
  { char: '小', strokeCount: 3, features: [0.4, 0.6, 0.2] },
  { char: '天', strokeCount: 4, features: [0.5, 0.2, 0.8, 0.5] },
  { char: '地', strokeCount: 6, features: [0.3, 0.7, 0.5, 0.2, 0.8, 0.4] },
  { char: '学', strokeCount: 8, features: [0.6, 0.3, 0.7, 0.2, 0.8, 0.4, 0.5, 0.1] },
  { char: '生', strokeCount: 5, features: [0.4, 0.6, 0.3, 0.7, 0.5] },
  { char: '日', strokeCount: 4, features: [0.5, 0.5, 0.3, 0.7] },
  { char: '月', strokeCount: 4, features: [0.4, 0.6, 0.5, 0.3] },
  { char: '水', strokeCount: 4, features: [0.5, 0.3, 0.7, 0.4] },
  { char: '火', strokeCount: 4, features: [0.5, 0.3, 0.2, 0.8] },
  { char: '山', strokeCount: 3, features: [0.3, 0.5, 0.7] },
  { char: '木', strokeCount: 4, features: [0.5, 0.5, 0.2, 0.8] },
  { char: '一', strokeCount: 1, features: [0.5] },
  { char: '二', strokeCount: 2, features: [0.5, 0.5] },
  { char: '三', strokeCount: 3, features: [0.5, 0.5, 0.5] },
  { char: '十', strokeCount: 2, features: [0.5, 0.5] },
  { char: '八', strokeCount: 2, features: [0.3, 0.7] },
  { char: '六', strokeCount: 4, features: [0.5, 0.2, 0.8, 0.5] },
  { char: '七', strokeCount: 2, features: [0.4, 0.6] },
  { char: '五', strokeCount: 4, features: [0.5, 0.3, 0.7, 0.5] },
  { char: '四', strokeCount: 5, features: [0.4, 0.6, 0.3, 0.7, 0.5] },
  { char: '九', strokeCount: 2, features: [0.6, 0.4] },
  { char: '百', strokeCount: 6, features: [0.5, 0.3, 0.7, 0.2, 0.8, 0.5] },
  { char: '千', strokeCount: 3, features: [0.5, 0.3, 0.7] },
  { char: '万', strokeCount: 3, features: [0.4, 0.6, 0.5] },
  { char: '年', strokeCount: 6, features: [0.3, 0.7, 0.5, 0.2, 0.8, 0.4] },
  { char: '来', strokeCount: 7, features: [0.5, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6] },
  { char: '去', strokeCount: 5, features: [0.5, 0.3, 0.7, 0.4, 0.6] },
  { char: '有', strokeCount: 6, features: [0.4, 0.6, 0.3, 0.7, 0.5, 0.2] },
  { char: '没', strokeCount: 7, features: [0.5, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6] },
  { char: '不', strokeCount: 4, features: [0.5, 0.3, 0.7, 0.5] },
  { char: '了', strokeCount: 2, features: [0.4, 0.6] },
  { char: '的', strokeCount: 8, features: [0.5, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6, 0.1] },
  { char: '在', strokeCount: 6, features: [0.3, 0.7, 0.5, 0.2, 0.8, 0.4] },
  { char: '和', strokeCount: 8, features: [0.4, 0.6, 0.3, 0.7, 0.5, 0.2, 0.8, 0.1] },
  { char: '到', strokeCount: 8, features: [0.5, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6, 0.1] },
  { char: '说', strokeCount: 9, features: [0.4, 0.6, 0.3, 0.7, 0.5, 0.2, 0.8, 0.1, 0.9] },
  { char: '会', strokeCount: 6, features: [0.5, 0.3, 0.7, 0.2, 0.8, 0.4] },
  { char: '对', strokeCount: 5, features: [0.5, 0.3, 0.7, 0.4, 0.6] },
  { char: '出', strokeCount: 5, features: [0.5, 0.3, 0.7, 0.2, 0.8] },
  { char: '能', strokeCount: 10, features: [0.4, 0.6, 0.3, 0.7, 0.5, 0.2, 0.8, 0.1, 0.9, 0.4] },
  { char: '可', strokeCount: 5, features: [0.5, 0.3, 0.7, 0.4, 0.6] },
  { char: '这', strokeCount: 7, features: [0.4, 0.6, 0.3, 0.7, 0.5, 0.2, 0.8] },
  { char: 'A', strokeCount: 3, features: [0.3, 0.7, 0.5] },
  { char: 'B', strokeCount: 3, features: [0.4, 0.6, 0.5] },
  { char: 'C', strokeCount: 1, features: [0.5] },
  { char: 'D', strokeCount: 2, features: [0.5, 0.5] },
  { char: 'E', strokeCount: 4, features: [0.5, 0.3, 0.7, 0.5] },
  { char: 'F', strokeCount: 3, features: [0.5, 0.3, 0.5] },
  { char: 'G', strokeCount: 2, features: [0.5, 0.5] },
  { char: 'H', strokeCount: 3, features: [0.5, 0.5, 0.5] },
  { char: '1', strokeCount: 2, features: [0.5, 0.5] },
  { char: '2', strokeCount: 1, features: [0.5] },
  { char: '3', strokeCount: 1, features: [0.5] },
  { char: '4', strokeCount: 2, features: [0.5, 0.5] },
  { char: '5', strokeCount: 2, features: [0.5, 0.5] },
  { char: '6', strokeCount: 1, features: [0.5] },
  { char: '7', strokeCount: 2, features: [0.5, 0.5] },
  { char: '8', strokeCount: 1, features: [0.5] },
  { char: '9', strokeCount: 1, features: [0.5] },
  { char: '0', strokeCount: 1, features: [0.5] },
];

function extractFeatures(paths: StrokePath[]): { strokeCount: number; features: number[] } {
  const strokeCount = paths.length;

  if (strokeCount === 0) {
    return { strokeCount: 0, features: [] };
  }

  const allPoints = paths.flatMap((p) => p.points);
  if (allPoints.length === 0) {
    return { strokeCount, features: [] };
  }

  const minX = Math.min(...allPoints.map((p) => p.x));
  const maxX = Math.max(...allPoints.map((p) => p.x));
  const minY = Math.min(...allPoints.map((p) => p.y));
  const maxY = Math.max(...allPoints.map((p) => p.y));
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;

  const features: number[] = [];

  for (const path of paths) {
    if (path.points.length === 0) continue;

    const start = path.points[0];
    const end = path.points[path.points.length - 1];
    const midIdx = Math.floor(path.points.length / 2);
    const mid = path.points[midIdx];

    features.push((start.x - minX) / w);
    features.push((start.y - minY) / h);
    features.push((mid.x - minX) / w);
    features.push((mid.y - minY) / h);
    features.push((end.x - minX) / w);
    features.push((end.y - minY) / h);

    const sum = path.points.reduce((a, p) => a + (p.x - minX) / w + (p.y - minY) / h, 0);
    features.push(sum / (path.points.length * 2));
  }

  return { strokeCount, features };
}

function computeSimilarity(
  input: { strokeCount: number; features: number[] },
  entry: { strokeCount: number; features: number[] }
): number {
  const strokeDiff = Math.abs(input.strokeCount - entry.strokeCount);
  const strokeScore = Math.max(0, 1 - strokeDiff * 0.2);

  if (input.features.length === 0 || entry.features.length === 0) {
    return strokeScore * 0.3;
  }

  const minLen = Math.min(input.features.length, entry.features.length);
  let featureDist = 0;
  for (let i = 0; i < minLen; i++) {
    featureDist += (input.features[i] - entry.features[i]) ** 2;
  }
  featureDist = Math.sqrt(featureDist / minLen);

  const featureScore = Math.max(0, 1 - featureDist);

  return strokeScore * 0.5 + featureScore * 0.5;
}

function simulateRecognition(paths: StrokePath[]): string[] {
  if (paths.length === 0 || paths.every((p) => p.points.length === 0)) {
    return [];
  }

  const inputFeatures = extractFeatures(paths);

  const scored = CHARACTER_DB.map((entry) => ({
    char: entry.char,
    score: computeSimilarity(inputFeatures, entry),
  }));

  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 5);
  const candidates = top.map((s) => s.char);

  return candidates;
}

export const useStore = create<AppState>((set, get) => ({
  paths: [],
  currentPath: [],
  isDrawing: false,
  undoStack: [],
  history: [],
  recognitionResult: { candidates: [], selected: null },

  startDrawing: (point: Point) => {
    set({ isDrawing: true, currentPath: [point] });
  },

  continueDrawing: (point: Point) => {
    const { isDrawing } = get();
    if (!isDrawing) return;
    set((state) => ({
      currentPath: [...state.currentPath, point],
    }));
  },

  stopDrawing: () => {
    const { currentPath, paths, undoStack } = get();
    if (currentPath.length === 0) {
      set({ isDrawing: false });
      return;
    }

    const newPath: StrokePath = {
      id: uuidv4(),
      points: [...currentPath],
    };

    const newUndoStack = [...undoStack, [...paths]].slice(-MAX_UNDO);

    set({
      paths: [...paths, newPath],
      currentPath: [],
      isDrawing: false,
      undoStack: newUndoStack,
    });
  },

  undo: () => {
    const { undoStack, paths } = get();
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    set({
      paths: previous,
      undoStack: undoStack.slice(0, -1),
      recognitionResult: { candidates: [], selected: null },
    });
  },

  clearCanvas: () => {
    set({
      paths: [],
      currentPath: [],
      isDrawing: false,
      undoStack: [],
      recognitionResult: { candidates: [], selected: null },
    });
  },

  recognize: (canvas: HTMLCanvasElement) => {
    const { paths } = get();
    const candidates = simulateRecognition(paths);
    set({
      recognitionResult: { candidates, selected: null },
    });
  },

  selectCandidate: (text: string) => {
    set((state) => ({
      recognitionResult: { ...state.recognitionResult, selected: text },
    }));
  },

  saveToHistory: (thumbnail: string) => {
    const { recognitionResult } = get();
    if (!recognitionResult.selected) return;

    const record: HistoryRecord = {
      id: uuidv4(),
      thumbnail,
      recognizedText: recognitionResult.selected,
      savedAt: new Date().toLocaleString('zh-CN'),
    };

    set((state) => ({
      history: [record, ...state.history],
      recognitionResult: { candidates: [], selected: null },
    }));
  },

  deleteHistoryItem: (id: string) => {
    set((state) => ({
      history: state.history.filter((h) => h.id !== id),
    }));
  },

  clearHistory: () => {
    set({ history: [] });
  },

  clearRecognition: () => {
    set({ recognitionResult: { candidates: [], selected: null } });
  },
}));
