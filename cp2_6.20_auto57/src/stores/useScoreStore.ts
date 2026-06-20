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

const LINE_SPACING = 12;
const SVG_HEIGHT = 200;
const STAFF_Y = (SVG_HEIGHT - 4 * LINE_SPACING) / 2;
const E4_REF = 30;
const LEFT_MARGIN = 60;
const NOTE_SPACING = 50;
const PITCH_INDEX: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

const DURATION_TO_TYPE: Record<number, NoteType> = {
  4: 'whole',
  2: 'half',
  1: 'quarter',
  0.5: 'eighth',
};

const TYPE_TO_DURATION: Record<NoteType, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
};

function computeX(order: number): number {
  return LEFT_MARGIN + order * NOTE_SPACING;
}

function computeY(pitch: string, octave: number): number {
  const pos = octave * 7 + (PITCH_INDEX[pitch] ?? 0) - E4_REF;
  return STAFF_Y + 4 * LINE_SPACING - pos * (LINE_SPACING / 2);
}

function resolveNoteTypeAndDuration(
  duration?: number,
  type?: NoteType
): { duration: number; type: NoteType } {
  if (duration !== undefined && type !== undefined) {
    return { duration, type };
  }
  if (duration !== undefined) {
    return {
      duration,
      type: DURATION_TO_TYPE[duration] ?? 'quarter',
    };
  }
  if (type !== undefined) {
    return {
      duration: TYPE_TO_DURATION[type],
      type,
    };
  }
  return { duration: 1, type: 'quarter' };
}

function generateShortId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface ScoreState {
  notes: NoteData[];
  tempo: number;
  isPlaying: boolean;
  currentPlayIndex: number;
  activeTool: ToolType;
  selectedNoteId: string | null;
  showPropertyPanel: boolean;

  addNote: (note: Partial<Omit<NoteData, 'id' | 'order' | 'flashState'>> & { pitch: string; octave: number }) => string;
  removeNote: (id: string) => void;
  updateNote: (id: string, updates: Partial<NoteData>) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentPlayIndex: (index: number) => void;
  reorderNotes: (fromIndex: number, toIndex: number) => void;
  setActiveTool: (tool: ToolType) => void;
  setSelectedNoteId: (id: string | null) => void;
  setShowPropertyPanel: (show: boolean) => void;
  clearAllNotes: () => void;
  setFlashState: (noteId: string, state: NoteData['flashState']) => void;
  generateShareId: () => string;
  addBatchNotes: (notes: Omit<NoteData, 'id' | 'order' | 'flashState'>[]) => void;
}

export const useScoreStore = create<ScoreState>((set, get) => ({
  notes: [],
  tempo: 120,
  isPlaying: false,
  currentPlayIndex: -1,
  activeTool: 'pencil',
  selectedNoteId: null,
  showPropertyPanel: false,

  addNote: (note) => {
    let newId: string;
    set((state) => {
      const { duration, type } = resolveNoteTypeAndDuration(note.duration, note.type);
      const order = state.notes.length;
      newId = uuidv4();
      const newNote: NoteData = {
        pitch: note.pitch,
        octave: note.octave,
        duration,
        type,
        velocity: note.velocity ?? 80,
        order,
        x: note.x ?? computeX(order),
        y: note.y ?? computeY(note.pitch, note.octave),
        isValid: note.isValid ?? true,
        id: newId,
        flashState: 'none',
      };
      return { notes: [...state.notes, newNote] };
    });
    return newId!;
  },

  removeNote: (id) =>
    set((state) => {
      const filtered = state.notes.filter((n) => n.id !== id);
      const reordered = filtered.map((n, i) => ({
        ...n,
        order: i,
        x: computeX(i),
      }));
      return {
        notes: reordered,
        selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
      };
    }),

  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  setPlaying: (playing) => set({ isPlaying: playing }),

  setCurrentPlayIndex: (index) => set({ currentPlayIndex: index }),

  reorderNotes: (fromIndex: number, toIndex: number) =>
    set((state) => {
      if (fromIndex === toIndex) return state;
      const notes = [...state.notes];
      const [removed] = notes.splice(fromIndex, 1);
      notes.splice(toIndex, 0, removed);
      const reordered = notes.map((n, i) => ({
        ...n,
        order: i,
        x: computeX(i),
      }));
      return { notes: reordered };
    }),

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

  generateShareId: () => {
    const state = get();
    const id = generateShortId();
    const data = {
      notes: state.notes.map(({ flashState, ...note }) => note),
      tempo: state.tempo,
    };
    localStorage.setItem(`share_${id}`, JSON.stringify(data));
    return id;
  },

  addBatchNotes: (notesInput) =>
    set((state) => {
      const startOrder = state.notes.length;
      const newNotes: NoteData[] = notesInput.map((note, index) => {
        const order = startOrder + index;
        const { duration, type } = resolveNoteTypeAndDuration(note.duration, note.type);
        return {
          ...note,
          duration,
          type,
          velocity: note.velocity ?? 80,
          order,
          x: note.x ?? computeX(order),
          y: note.y ?? computeY(note.pitch, note.octave),
          isValid: note.isValid ?? true,
          id: uuidv4(),
          flashState: 'none',
        };
      });
      return { notes: [...state.notes, ...newNotes] };
    }),
}));
