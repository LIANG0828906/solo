import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type NoteDuration = 'w' | 'h' | 'q' | '8' | '16';
export type Accidental = '#' | 'b' | 'n' | null;
export type ClefType = 'treble' | 'bass';
export type VoiceName = 'Soprano' | 'Alto' | 'Tenor' | 'Bass';
export type TimeSignature = '2/4' | '3/4' | '4/4' | '6/8';
export type KeySignature = 'C' | 'G' | 'D' | 'A' | 'E' | 'B' | 'F#' | 'F' | 'Bb' | 'Eb' | 'Ab' | 'Db';
export type PlayState = 'stopped' | 'playing' | 'paused';

export interface Note {
  id: string;
  pitch: string;
  duration: NoteDuration;
  accidental: Accidental;
  voice: VoiceName;
  measure: number;
  position: number;
  highlighted: boolean;
}

export interface VoiceData {
  name: VoiceName;
  clef: ClefType;
  notes: Note[];
}

export interface ScoreProject {
  id: string;
  name: string;
  voices: VoiceData[];
  timeSignature: TimeSignature;
  keySignature: KeySignature;
  tempo: number;
  totalMeasures: number;
  createdAt: number;
  updatedAt: number;
}

interface ScoreState {
  project: ScoreProject;
  activeVoice: VoiceName;
  selectedDuration: NoteDuration;
  selectedAccidental: Accidental;
  playState: PlayState;
  currentTime: number;
  volume: number;
  metronomeEnabled: boolean;
  metronomeVolume: number;
  metronomeBeat: number;
  setActiveVoice: (voice: VoiceName) => void;
  setSelectedDuration: (d: NoteDuration) => void;
  setSelectedAccidental: (a: Accidental) => void;
  addNote: (pitch: string, measure: number, position: number) => void;
  removeNote: (noteId: string) => void;
  setTimeSignature: (ts: TimeSignature) => void;
  setKeySignature: (ks: KeySignature) => void;
  setTempo: (t: number) => void;
  setPlayState: (s: PlayState) => void;
  setCurrentTime: (t: number) => void;
  setVolume: (v: number) => void;
  setMetronomeEnabled: (e: boolean) => void;
  setMetronomeVolume: (v: number) => void;
  setMetronomeBeat: (b: number) => void;
  highlightNote: (noteId: string, on: boolean) => void;
  loadProject: (p: ScoreProject) => void;
  resetProject: () => void;
  getTotalDuration: () => number;
}

const VOICES: VoiceName[] = ['Soprano', 'Alto', 'Tenor', 'Bass'];

function createEmptyProject(): ScoreProject {
  return {
    id: uuidv4(),
    name: 'Untitled Score',
    voices: VOICES.map((v, i) => ({
      name: v,
      clef: i < 2 ? 'treble' : 'bass',
      notes: []
    })),
    timeSignature: '4/4',
    keySignature: 'C',
    tempo: 120,
    totalMeasures: 4,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function durationToBeats(d: NoteDuration): number {
  switch (d) {
    case 'w': return 4;
    case 'h': return 2;
    case 'q': return 1;
    case '8': return 0.5;
    case '16': return 0.25;
  }
}

export const useScoreStore = create<ScoreState>((set, get) => ({
  project: createEmptyProject(),
  activeVoice: 'Soprano',
  selectedDuration: 'q',
  selectedAccidental: null,
  playState: 'stopped',
  currentTime: 0,
  volume: -6,
  metronomeEnabled: false,
  metronomeVolume: -10,
  metronomeBeat: 0,

  setActiveVoice: (voice) => set({ activeVoice: voice }),
  setSelectedDuration: (d) => set({ selectedDuration: d }),
  setSelectedAccidental: (a) => set({ selectedAccidental: a }),

  addNote: (pitch, measure, position) => {
    const state = get();
    const voice = state.activeVoice;
    const note: Note = {
      id: uuidv4(),
      pitch,
      duration: state.selectedDuration,
      accidental: state.selectedAccidental,
      voice,
      measure,
      position,
      highlighted: false
    };
    set({
      project: {
        ...state.project,
        updatedAt: Date.now(),
        voices: state.project.voices.map(v =>
          v.name === voice
            ? { ...v, notes: [...v.notes, note] }
            : v
        )
      }
    });
  },

  removeNote: (noteId) => {
    const state = get();
    set({
      project: {
        ...state.project,
        updatedAt: Date.now(),
        voices: state.project.voices.map(v => ({
          ...v,
          notes: v.notes.filter(n => n.id !== noteId)
        }))
      }
    });
  },

  setTimeSignature: (ts) => {
    const state = get();
    set({ project: { ...state.project, timeSignature: ts, updatedAt: Date.now() } });
  },

  setKeySignature: (ks) => {
    const state = get();
    set({ project: { ...state.project, keySignature: ks, updatedAt: Date.now() } });
  },

  setTempo: (t) => {
    const state = get();
    set({ project: { ...state.project, tempo: t, updatedAt: Date.now() } });
  },

  setPlayState: (s) => set({ playState: s }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setVolume: (v) => set({ volume: v }),
  setMetronomeEnabled: (e) => set({ metronomeEnabled: e }),
  setMetronomeVolume: (v) => set({ metronomeVolume: v }),
  setMetronomeBeat: (b) => set({ metronomeBeat: b }),

  highlightNote: (noteId, on) => {
    const state = get();
    set({
      project: {
        ...state.project,
        voices: state.project.voices.map(v => ({
          ...v,
          notes: v.notes.map(n =>
            n.id === noteId ? { ...n, highlighted: on } : n
          )
        }))
      }
    });
  },

  loadProject: (p) => set({ project: p, currentTime: 0, playState: 'stopped' }),
  resetProject: () => set({ project: createEmptyProject(), currentTime: 0, playState: 'stopped' }),

  getTotalDuration: () => {
    const state = get();
    const { tempo, totalMeasures, timeSignature } = state.project;
    const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
    const totalBeats = beatsPerMeasure * totalMeasures;
    return (totalBeats * 60) / tempo;
  }
}));

export { durationToBeats };
