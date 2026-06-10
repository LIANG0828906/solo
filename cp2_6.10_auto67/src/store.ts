import { create } from 'zustand';
import type { WoodPiece, MarkedLine, MarkingDot, HistoryRecord } from './types';

interface StoreState {
  woodPieces: WoodPiece[];
  currentLine: MarkedLine | null;
  markers: MarkingDot[];
  history: HistoryRecord[];
  tool: 'ink' | 'marker' | 'cut';
  isDraggingLine: boolean;
  tempLineEnd: { x: number; y: number } | null;

  setLine: (line: MarkedLine) => void;
  addMarker: (marker: MarkingDot) => void;
  updateMarker: (id: string, x: number, y: number) => void;
  cutWood: () => void;
  reset: () => void;
  saveToHistory: (record: Omit<HistoryRecord, 'id' | 'timestamp'>) => void;
  replayHistory: (record: HistoryRecord) => void;
  setTool: (tool: 'ink' | 'marker' | 'cut') => void;
  setIsDraggingLine: (isDragging: boolean) => void;
  setTempLineEnd: (point: { x: number; y: number } | null) => void;
}

const initialWoodPieces: WoodPiece[] = [
  { id: '1', x: 20, y: 150, width: 600, height: 80, angle: 0, cut: false }
];

export const useStore = create<StoreState>((set) => ({
  woodPieces: initialWoodPieces,
  currentLine: null,
  markers: [],
  history: [],
  tool: 'ink',
  isDraggingLine: false,
  tempLineEnd: null,

  setLine: (line) => set({ currentLine: line }),

  addMarker: (marker) => set((state) => ({
    markers: [...state.markers, marker]
  })),

  updateMarker: (id, x, y) => set((state) => ({
    markers: state.markers.map((m) =>
      m.id === id ? { ...m, x, y } : m
    )
  })),

  cutWood: () => set((state) => ({
    woodPieces: state.woodPieces.map((piece) => ({
      ...piece,
      cut: true
    }))
  })),

  reset: () => set({
    woodPieces: initialWoodPieces,
    currentLine: null,
    markers: [],
    tool: 'ink',
    isDraggingLine: false,
    tempLineEnd: null
  }),

  saveToHistory: (record) => set((state) => ({
    history: [
      ...state.history,
      {
        ...record,
        id: Date.now().toString(),
        timestamp: Date.now()
      }
    ]
  })),

  replayHistory: (record) => set({
    currentLine: record.line,
    markers: record.markers
  }),

  setTool: (tool) => set({ tool }),

  setIsDraggingLine: (isDragging) => set({ isDraggingLine: isDragging }),

  setTempLineEnd: (point) => set({ tempLineEnd: point })
}));
