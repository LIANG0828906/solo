import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { NoteName, NoteDuration, ScaleRule, SCALES, CHORDS, ChordRule } from '../data/noteData';
import { PlacedNote, validateScale, getRandomScale, getRandomChords, playNote, playArpeggio, playErrorSound, playSuccessSound, yToNoteName, snapToStaff, getChordNotes } from '../engine/theoryEngine';

interface ChordSlot {
  chordName: string;
  displayName: string;
  requiredNotes: NoteName[];
  placedNotes: NoteName[];
  completed: boolean;
  floatingNotes: NoteName[];
}

interface AppState {
  selectedDuration: NoteDuration;
  placedNotes: PlacedNote[];
  currentScale: ScaleRule;
  scaleUserNotes: NoteName[];
  scaleCompleted: boolean;
  chords: ChordSlot[];
  activeChordIndex: number;
  draggingNote: { name: NoteName; fromChordIndex: number } | null;

  setNoteAction: (name: NoteName, x: number, y: number) => void;
  setSelectedDuration: (d: NoteDuration) => void;
  removePlacedNote: (id: string) => void;
  clearPlacedNotes: () => void;

  selectScaleNote: (name: NoteName) => void;
  resetScale: () => void;

  selectChordNote: (chordIndex: number, noteName: NoteName) => void;
  removeChordSlotNote: (chordIndex: number, slotIndex: number) => void;
  resetChords: () => void;
  setActiveChordIndex: (idx: number) => void;
  setDraggingNote: (n: { name: NoteName; fromChordIndex: number } | null) => void;
}

function buildChordSlots(): ChordSlot[] {
  const selected = getRandomChords(4);
  return selected.map((chord) => {
    const shuffled = [...chord.notes].sort(() => Math.random() - 0.5);
    const extras: NoteName[] = [];
    const allNames: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    while (shuffled.length + extras.length < 5) {
      const rand = allNames[Math.floor(Math.random() * allNames.length)];
      if (!shuffled.includes(rand) && !extras.includes(rand)) {
        extras.push(rand);
      }
    }
    const floating = [...shuffled, ...extras].sort(() => Math.random() - 0.5);
    return {
      chordName: chord.name,
      displayName: chord.displayName,
      requiredNotes: [...chord.notes],
      placedNotes: [],
      completed: false,
      floatingNotes: floating,
    };
  });
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedDuration: 'quarter',
  placedNotes: [],
  currentScale: getRandomScale(),
  scaleUserNotes: [],
  scaleCompleted: false,
  chords: buildChordSlots(),
  activeChordIndex: 0,
  draggingNote: null,

  setNoteAction: (name: NoteName, x: number, y: number) => {
    const note: PlacedNote = {
      id: uuidv4(),
      name,
      octave: 4,
      duration: get().selectedDuration,
      x,
      y,
    };
    playNote(name, 4, 0.5);
    set((s) => ({ placedNotes: [...s.placedNotes, note] }));
  },

  setSelectedDuration: (d: NoteDuration) => set({ selectedDuration: d }),

  removePlacedNote: (id: string) =>
    set((s) => ({ placedNotes: s.placedNotes.filter((n) => n.id !== id) })),

  clearPlacedNotes: () => set({ placedNotes: [] }),

  selectScaleNote: (name: NoteName) => {
    const state = get();
    if (state.scaleCompleted) return;
    const newNotes = [...state.scaleUserNotes, name];
    const currentPos = newNotes.length - 1;
    const expected = state.currentScale.notes[currentPos];

    if (name === expected) {
      playNote(name, 4, 0.3);
      if (newNotes.length === state.currentScale.notes.length) {
        setTimeout(() => playArpeggio(state.currentScale.notes), 300);
        set({ scaleUserNotes: newNotes, scaleCompleted: true });
      } else {
        set({ scaleUserNotes: newNotes });
      }
    } else {
      playErrorSound();
    }
  },

  resetScale: () => {
    set({
      currentScale: getRandomScale(),
      scaleUserNotes: [],
      scaleCompleted: false,
    });
  },

  selectChordNote: (chordIndex: number, noteName: NoteName) => {
    const state = get();
    const chord = state.chords[chordIndex];
    if (!chord || chord.completed) return;

    const slotIndex = chord.placedNotes.length;
    const expected = chord.requiredNotes[slotIndex];

    if (noteName === expected) {
      const newPlaced = [...chord.placedNotes, noteName];
      const newFloating = chord.floatingNotes.filter((_, i) => {
        const fi = chord.floatingNotes.indexOf(noteName);
        return i !== fi;
      });

      const isComplete = newPlaced.length === chord.requiredNotes.length;
      if (isComplete) {
        playSuccessSound();
      } else {
        playNote(noteName, 4, 0.3);
      }

      const newChords = [...state.chords];
      newChords[chordIndex] = {
        ...chord,
        placedNotes: newPlaced,
        floatingNotes: newFloating,
        completed: isComplete,
      };
      set({ chords: newChords });
    } else {
      playErrorSound();
    }
  },

  removeChordSlotNote: (chordIndex: number, slotIndex: number) => {
    const state = get();
    const chord = state.chords[chordIndex];
    if (!chord || chord.completed) return;

    const removedNote = chord.placedNotes[slotIndex];
    const newPlaced = chord.placedNotes.filter((_, i) => i !== slotIndex);
    const newFloating = [...chord.floatingNotes, removedNote];

    const newChords = [...state.chords];
    newChords[chordIndex] = {
      ...chord,
      placedNotes: newPlaced,
      floatingNotes: newFloating,
    };
    set({ chords: newChords });
  },

  resetChords: () => set({ chords: buildChordSlots(), activeChordIndex: 0 }),

  setActiveChordIndex: (idx: number) => set({ activeChordIndex: idx }),

  setDraggingNote: (n) => set({ draggingNote: n }),
}));
