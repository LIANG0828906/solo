import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { AudioEngine } from './components/AudioEngine';

export interface Note {
  id: string;
  pitch: number;
  startTime: number;
  duration: number;
}

export type Waveform = 'sine' | 'square' | 'sawtooth';

export interface Template {
  name: string;
  notes: Omit<Note, 'id'>[];
}

interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  bpm: number;
  volume: number;
  reverb: number;
  waveform: Waveform;
  selectedNoteIds: string[];
}

interface MusicStore {
  notes: Note[];
  playback: PlaybackState;
  addNote: (note: Omit<Note, 'id'>) => void;
  deleteNote: (id: string) => void;
  deleteSelectedNotes: () => void;
  moveNote: (id: string, pitchDelta: number, timeDelta: number) => void;
  resizeNote: (id: string, durationDelta: number) => void;
  selectNote: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  clearNotes: () => void;
  loadTemplate: (template: Template) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setBpm: (bpm: number) => void;
  setVolume: (volume: number) => void;
  setReverb: (reverb: number) => void;
  setWaveform: (waveform: Waveform) => void;
  setCurrentTime: (time: number) => void;
  exportMidi: (filename: string) => void;
}

export const PITCH_MIN = 36;
export const PITCH_MAX = 79;
export const TOTAL_DURATION = 8;
export const TIME_STEP = 0.2;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const quantize = (v: number, step: number) => Math.round(v / step) * step;

export const makeTemplateNotes = (): Record<string, Template> => {
  const chordProgression: Omit<Note, 'id'>[] = [];
  const chords = [
    [48, 52, 55],
    [55, 59, 62],
    [57, 60, 64],
    [53, 57, 60],
  ];
  chords.forEach((chord, i) => {
    chord.forEach((pitch) => {
      chordProgression.push({ pitch, startTime: i * 2, duration: 2 });
    });
  });

  const bluesScale = [45, 48, 50, 51, 52, 55];
  const blues: Omit<Note, 'id'>[] = [];
  const bluesPattern = [0, 2, 3, 4, 2, 0, 3, 2, 5, 4, 3, 2, 0, 2, 3, 0];
  bluesPattern.forEach((idx, i) => {
    blues.push({ pitch: bluesScale[idx] + 12, startTime: i * 0.5, duration: 0.4 });
  });

  const electronic: Omit<Note, 'id'>[] = [];
  const bassPattern = [36, 36, 43, 36, 38, 36, 43, 36];
  bassPattern.forEach((p, i) => electronic.push({ pitch: p, startTime: i, duration: 0.3 }));
  const arpPattern = [60, 64, 67, 72, 67, 64, 60, 64, 67, 72, 76, 72, 67, 64, 60, 64];
  arpPattern.forEach((p, i) => electronic.push({ pitch: p, startTime: i * 0.5, duration: 0.2 }));

  const pentatonic = [48, 50, 52, 55, 57];
  const oriental: Omit<Note, 'id'>[] = [];
  const orientPattern = [0, 2, 4, 2, 0, 4, 2, 0, 3, 4, 2, 0, 2, 4, 3, 0];
  orientPattern.forEach((idx, i) => {
    oriental.push({ pitch: pentatonic[idx] + 12, startTime: i * 0.5, duration: 0.45 });
  });

  return {
    chord: { name: '和弦进行', notes: chordProgression },
    blues: { name: '即兴蓝调', notes: blues },
    electronic: { name: '电子脉冲', notes: electronic },
    oriental: { name: '东方五声', notes: oriental },
  };
};

export const useMusicStore = create<MusicStore>((set, get) => ({
  notes: [],
  playback: {
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    bpm: 120,
    volume: 70,
    reverb: 20,
    waveform: 'sine',
    selectedNoteIds: [],
  },

  addNote: (note) => {
    const id = uuidv4();
    const newNote: Note = {
      id,
      pitch: clamp(note.pitch, PITCH_MIN, PITCH_MAX),
      startTime: quantize(clamp(note.startTime, 0, TOTAL_DURATION - TIME_STEP), TIME_STEP),
      duration: Math.max(TIME_STEP, quantize(note.duration, TIME_STEP)),
    };
    if (newNote.startTime + newNote.duration > TOTAL_DURATION) {
      newNote.duration = TOTAL_DURATION - newNote.startTime;
    }
    set((state) => ({
      notes: [...state.notes, newNote],
      playback: { ...state.playback, selectedNoteIds: [id] },
    }));
  },

  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      playback: {
        ...state.playback,
        selectedNoteIds: state.playback.selectedNoteIds.filter((sid) => sid !== id),
      },
    })),

  deleteSelectedNotes: () =>
    set((state) => ({
      notes: state.notes.filter((n) => !state.playback.selectedNoteIds.includes(n.id)),
      playback: { ...state.playback, selectedNoteIds: [] },
    })),

  moveNote: (id, pitchDelta, timeDelta) =>
    set((state) => {
      const idsToMove = state.playback.selectedNoteIds.includes(id)
        ? state.playback.selectedNoteIds
        : [id];
      return {
        notes: state.notes.map((n) => {
          if (!idsToMove.includes(n.id)) return n;
          const newPitch = clamp(n.pitch + pitchDelta, PITCH_MIN, PITCH_MAX);
          let newStart = quantize(clamp(n.startTime + timeDelta, 0, TOTAL_DURATION - TIME_STEP), TIME_STEP);
          if (newStart + n.duration > TOTAL_DURATION) newStart = TOTAL_DURATION - n.duration;
          return { ...n, pitch: newPitch, startTime: newStart };
        }),
      };
    }),

  resizeNote: (id, durationDelta) =>
    set((state) => ({
      notes: state.notes.map((n) => {
        if (n.id !== id) return n;
        let newDuration = quantize(clamp(n.duration + durationDelta, TIME_STEP, TOTAL_DURATION - n.startTime), TIME_STEP);
        return { ...n, duration: newDuration };
      }),
    })),

  selectNote: (id, multi = false) =>
    set((state) => {
      if (multi) {
        const has = state.playback.selectedNoteIds.includes(id);
        return {
          playback: {
            ...state.playback,
            selectedNoteIds: has
              ? state.playback.selectedNoteIds.filter((sid) => sid !== id)
              : [...state.playback.selectedNoteIds, id],
          },
        };
      }
      return { playback: { ...state.playback, selectedNoteIds: [id] } };
    }),

  clearSelection: () => set((state) => ({ playback: { ...state.playback, selectedNoteIds: [] } })),

  clearNotes: () => set({ notes: [], playback: { ...get().playback, selectedNoteIds: [] } }),

  loadTemplate: (template) => {
    const withIds: Note[] = template.notes.map((n) => ({ ...n, id: uuidv4() }));
    set({ notes: withIds, playback: { ...get().playback, selectedNoteIds: [], currentTime: 0 } });
    AudioEngine.getInstance().stop();
  },

  play: () => {
    const { notes, playback } = get();
    if (notes.length === 0) return;
    set({ playback: { ...playback, isPlaying: true, isPaused: false } });
    AudioEngine.getInstance().play(notes, playback);
  },

  pause: () => {
    set((state) => ({ playback: { ...state.playback, isPlaying: false, isPaused: true } }));
    AudioEngine.getInstance().pause();
  },

  stop: () => {
    set((state) => ({
      playback: { ...state.playback, isPlaying: false, isPaused: false, currentTime: 0 },
    }));
    AudioEngine.getInstance().stop();
  },

  setBpm: (bpm) => {
    const clamped = clamp(bpm, 60, 200);
    set((state) => ({ playback: { ...state.playback, bpm: clamped } }));
  },

  setVolume: (volume) => {
    const clamped = clamp(volume, 0, 100);
    set((state) => ({ playback: { ...state.playback, volume: clamped } }));
    AudioEngine.getInstance().updateVolume(clamped);
  },

  setReverb: (reverb) => {
    const clamped = clamp(reverb, 0, 100);
    set((state) => ({ playback: { ...state.playback, reverb: clamped } }));
    AudioEngine.getInstance().updateReverb(clamped);
  },

  setWaveform: (waveform) => {
    set((state) => ({ playback: { ...state.playback, waveform } }));
  },

  setCurrentTime: (time) =>
    set((state) => ({ playback: { ...state.playback, currentTime: clamp(time, 0, TOTAL_DURATION) } })),

  exportMidi: (filename) => {
    const { notes, playback } = get();
    AudioEngine.getInstance().exportMidi(notes, playback.bpm, filename);
  },
}));

export { TOTAL_DURATION as TOTAL_SECONDS, PITCH_MIN as MIN_PITCH, PITCH_MAX as MAX_PITCH, TIME_STEP as GRID_TIME_STEP };
