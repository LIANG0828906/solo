import { CHORD_COLORS, NOTE_NAMES, STRING_FREQUENCIES } from './constants';

export interface Note {
  string: number;
  fret: number;
}

export interface Chord {
  id: string;
  notes: Note[];
  type: 'major' | 'minor' | 'dominant7';
  rootNote: string;
  duration: number;
  color: string;
}

export function getNoteFrequency(note: Note): number {
  const baseFreq = STRING_FREQUENCIES[note.string];
  return baseFreq * Math.pow(2, note.fret / 12);
}

export function getNoteName(note: Note): string {
  const baseNoteIndex = [4, 11, 7, 2, 9, 4][note.string];
  const noteIndex = (baseNoteIndex + note.fret) % 12;
  return NOTE_NAMES[noteIndex];
}

export function calculateRootNote(notes: Note[]): string {
  if (notes.length === 0) return 'C';
  const sortedNotes = [...notes].sort((a, b) => getNoteFrequency(a) - getNoteFrequency(b));
  return getNoteName(sortedNotes[0]);
}

export function identifyChord(notes: Note[]): Chord['type'] {
  if (notes.length < 3) return 'major';

  const noteNames = new Set(notes.map(getNoteName));
  const root = calculateRootNote(notes);
  const rootIndex = NOTE_NAMES.indexOf(root);
  
  const majorThird = NOTE_NAMES[(rootIndex + 4) % 12];
  const minorThird = NOTE_NAMES[(rootIndex + 3) % 12];
  const fifth = NOTE_NAMES[(rootIndex + 7) % 12];
  const minorSeventh = NOTE_NAMES[(rootIndex + 10) % 12];

  if (noteNames.has(minorSeventh) && noteNames.has(fifth)) {
    return 'dominant7';
  }
  if (noteNames.has(minorThird) && noteNames.has(fifth)) {
    return 'minor';
  }
  if (noteNames.has(majorThird) && noteNames.has(fifth)) {
    return 'major';
  }

  return 'major';
}

export function createChord(notes: Note[], duration: number = 4): Chord {
  const type = identifyChord(notes);
  const rootNote = calculateRootNote(notes);
  return {
    id: `chord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    notes: [...notes],
    type,
    rootNote,
    duration,
    color: CHORD_COLORS[type],
  };
}

export function getDiatonicChords(key: string): string[] {
  const keyIndex = NOTE_NAMES.indexOf(key);
  const majorScale = [0, 2, 4, 5, 7, 9, 11];
  return majorScale.map(interval => NOTE_NAMES[(keyIndex + interval) % 12]);
}
