import { create } from 'zustand';
import type { Note, Beatmap, GameStateData, GameMode, PlaybackSpeed, TrackIndex, NoteType } from '../types';

interface EditorState {
  selectedNoteId: string | null;
  selectedNoteType: NoteType;
  zoom: number;
  scrollX: number;
  snapDivision: number;
  isDraggingNote: boolean;
}

interface AppState {
  beatmap: Beatmap;
  gameState: Partial<GameStateData>;
  editor: EditorState;
  waveData: number[];
  audioDuration: number;
  audioFileName: string | null;
  audioError: string | null;

  setBeatmap: (b: Beatmap) => void;
  updateBeatmap: (patch: Partial<Beatmap>) => void;
  setNotes: (notes: Note[]) => void;
  setGameState: (s: Partial<GameStateData>) => void;
  setSelectedNoteId: (id: string | null) => void;
  setSelectedNoteType: (t: NoteType) => void;
  setEditorZoom: (z: number) => void;
  setEditorScrollX: (x: number) => void;
  setSnapDivision: (d: number) => void;
  setIsDraggingNote: (v: boolean) => void;
  setWaveData: (d: number[]) => void;
  setAudioDuration: (d: number) => void;
  setAudioFileName: (n: string | null) => void;
  setAudioError: (e: string | null) => void;
}

const defaultBeatmap: Beatmap = {
  version: '1.0',
  title: '未命名谱面',
  bpm: 120,
  timeSignature: '4/4',
  offset: 0,
  notes: [],
};

export const useGameStore = create<AppState>((set) => ({
  beatmap: defaultBeatmap,
  gameState: {},
  editor: {
    selectedNoteId: null,
    selectedNoteType: 'tap',
    zoom: 1,
    scrollX: 0,
    snapDivision: 4,
    isDraggingNote: false,
  },
  waveData: [],
  audioDuration: 0,
  audioFileName: null,
  audioError: null,

  setBeatmap: (b) => set({ beatmap: b }),
  updateBeatmap: (patch) => set((s) => ({ beatmap: { ...s.beatmap, ...patch } })),
  setNotes: (notes) => set((s) => ({ beatmap: { ...s.beatmap, notes: [...notes] } })),
  setGameState: (gs) => set((s) => ({ gameState: { ...s.gameState, ...gs } })),
  setSelectedNoteId: (id) => set((s) => ({ editor: { ...s.editor, selectedNoteId: id } })),
  setSelectedNoteType: (t) => set((s) => ({ editor: { ...s.editor, selectedNoteType: t } })),
  setEditorZoom: (z) => set((s) => ({ editor: { ...s.editor, zoom: Math.max(0.5, Math.min(4, z)) } })),
  setEditorScrollX: (x) => set((s) => ({ editor: { ...s.editor, scrollX: x } })),
  setSnapDivision: (d) => set((s) => ({ editor: { ...s.editor, snapDivision: d } })),
  setIsDraggingNote: (v) => set((s) => ({ editor: { ...s.editor, isDraggingNote: v } })),
  setWaveData: (d) => set({ waveData: [...d] }),
  setAudioDuration: (d) => set({ audioDuration: d }),
  setAudioFileName: (n) => set({ audioFileName: n }),
  setAudioError: (e) => set({ audioError: e }),
}));
