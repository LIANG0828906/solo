import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type NoteType = 'whole' | 'half' | 'quarter' | 'eighth';
export type ToolType = 'pencil' | 'eraser' | 'select';

export interface NoteData {
  id: string;
  pitch: string;
  octave: number;
  duration: number;
  type: NoteType;
  velocity: number;
  order: number;
  x: number;
  y: number;
  isValid: boolean;
  flashState: 'none' | 'green' | 'red';
}

interface ScoreState {
  notes: NoteData[];
  tempo: number;
  isPlaying: boolean;
  currentPlayIndex: number;
  activeTool: ToolType;
  selectedNoteId: string | null;
  showPropertyPanel: boolean;

  addNote: (note: Omit<NoteData, 'id' | 'order' | 'flashState'>) => void;
  removeNote: (id: string) => void;
  updateNote: (id: string, updates: Partial<NoteData>) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentPlayIndex: (index: number) => void;
  reorderNotes: () => void;
  setActiveTool: (tool: ToolType) => void;
  setSelectedNoteId: (id: string | null) => void;
  setShowPropertyPanel: (show: boolean) => void;
  clearAllNotes: () => void;
  setFlashState: (noteId: string, state: NoteData['flashState']) => void;
}

export const useScoreStore = create<ScoreState>((set) => ({
  notes: [],
  tempo: 120,
  isPlaying: false,
  currentPlayIndex: -1,
  activeTool: 'pencil',
  selectedNoteId: null,
  showPropertyPanel: false,

  addNote: (note) =>
    set((state) => {
      const newNote: NoteData = {
        ...note,
        id: uuidv4(),
        order: state.notes.length,
        flashState: 'none',
      };
      return { notes: [...state.notes, newNote] };
    }),

  removeNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
    })),

  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  setPlaying: (playing) => set({ isPlaying: playing }),

  setCurrentPlayIndex: (index) => set({ currentPlayIndex: index }),

  reorderNotes: () =>
    set((state) => ({
      notes: [...state.notes]
        .sort((a, b) => a.x - b.x)
        .map((n, i) => ({ ...n, order: i })),
    })),

  setActiveTool: (tool) => set({ activeTool: tool }),

  setSelectedNoteId: (id) => set({ selectedNoteId: id }),

  setShowPropertyPanel: (show) => set({ showPropertyPanel: show }),

  clearAllNotes: () =>
    set({
      notes: [],
      currentPlayIndex: -1,
      isPlaying: false,
      selectedNoteId: null,
    }),

  setFlashState: (noteId, state) =>
    set((s) => ({
      notes: s.notes.map((n) => (n.id === noteId ? { ...n, flashState: state } : n)),
    })),
}));
