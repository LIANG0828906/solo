import { create } from 'zustand';
import { audioEngine, ToneType } from '../utils/audioEngine';

export interface NoteEvent {
  note: string;
  frequency: number;
  keyCode: string;
  velocity: number;
  startTime: number;
  duration: number;
}

export interface KeyMapping {
  keyCode: string;
  display: string;
  note: string;
  frequency: number;
}

export const SCALE: KeyMapping[] = [
  { keyCode: 'KeyA', display: 'A', note: 'C4', frequency: 261.63 },
  { keyCode: 'KeyW', display: 'W', note: 'C#4', frequency: 277.18 },
  { keyCode: 'KeyS', display: 'S', note: 'D4', frequency: 293.66 },
  { keyCode: 'KeyE', display: 'E', note: 'D#4', frequency: 311.13 },
  { keyCode: 'KeyD', display: 'D', note: 'E4', frequency: 329.63 },
  { keyCode: 'KeyF', display: 'F', note: 'F4', frequency: 349.23 },
  { keyCode: 'KeyT', display: 'T', note: 'F#4', frequency: 369.99 },
  { keyCode: 'KeyG', display: 'G', note: 'G4', frequency: 392.0 },
  { keyCode: 'KeyY', display: 'Y', note: 'G#4', frequency: 415.3 },
  { keyCode: 'KeyH', display: 'H', note: 'A4', frequency: 440.0 },
  { keyCode: 'KeyU', display: 'U', note: 'A#4', frequency: 466.16 },
  { keyCode: 'KeyJ', display: 'J', note: 'B4', frequency: 493.88 },
];

export const KEYBOARD_ROWS: string[][] = [
  ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP'],
  ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL'],
  ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM'],
];

export const NOTE_COLOR_LOW = '#64B5F6';
export const NOTE_COLOR_HIGH = '#E57373';

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [100, 181, 246];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

export function getNoteColor(frequency: number): string {
  const minFreq = SCALE[0].frequency;
  const maxFreq = SCALE[SCALE.length - 1].frequency;
  const t = Math.max(0, Math.min(1, (frequency - minFreq) / (maxFreq - minFreq)));
  const [r1, g1, b1] = hexToRgb(NOTE_COLOR_LOW);
  const [r2, g2, b2] = hexToRgb(NOTE_COLOR_HIGH);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function getKeyMapping(keyCode: string): KeyMapping | undefined {
  return SCALE.find((k) => k.keyCode === keyCode);
}

interface AudioState {
  isRecording: boolean;
  isPlaying: boolean;
  playbackSpeed: number;
  currentTone: ToneType;
  recordedNotes: NoteEvent[];
  currentNote: { note: string; frequency: number } | null;
  activeKeys: Set<string>;
  playbackPosition: number;
  recordingStartTime: number;
  pendingNotes: Map<string, { note: string; frequency: number; startTime: number; velocity: number }>;

  playNote: (keyCode: string, velocity?: number) => void;
  stopNote: (keyCode: string) => void;
  startRecording: () => void;
  stopRecording: () => void;
  togglePlayback: () => void;
  stopPlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setTone: (tone: ToneType) => void;
  setPlaybackPosition: (pos: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isRecording: false,
  isPlaying: false,
  playbackSpeed: 1.0,
  currentTone: 'piano',
  recordedNotes: [],
  currentNote: null,
  activeKeys: new Set(),
  playbackPosition: 0,
  recordingStartTime: 0,
  pendingNotes: new Map(),

  playNote: (keyCode: string, velocity: number = 0.8) => {
    const state = get();
    if (state.activeKeys.has(keyCode)) return;

    const mapping = getKeyMapping(keyCode);
    if (!mapping) return;

    audioEngine.playTone(mapping.frequency, velocity, keyCode);

    const newActiveKeys = new Set(state.activeKeys);
    newActiveKeys.add(keyCode);

    if (state.isRecording) {
      const startTime = audioEngine.getCurrentTime() - state.recordingStartTime;
      const newPending = new Map(state.pendingNotes);
      newPending.set(keyCode, {
        note: mapping.note,
        frequency: mapping.frequency,
        startTime,
        velocity,
      });
      set({
        activeKeys: newActiveKeys,
        currentNote: { note: mapping.note, frequency: mapping.frequency },
        pendingNotes: newPending,
      });
    } else {
      set({
        activeKeys: newActiveKeys,
        currentNote: { note: mapping.note, frequency: mapping.frequency },
      });
    }
  },

  stopNote: (keyCode: string) => {
    const state = get();
    if (!state.activeKeys.has(keyCode)) return;

    audioEngine.stopTone(keyCode);

    const newActiveKeys = new Set(state.activeKeys);
    newActiveKeys.delete(keyCode);

    let newRecordedNotes = state.recordedNotes;
    let newPending = state.pendingNotes;

    if (state.isRecording && state.pendingNotes.has(keyCode)) {
      const pending = state.pendingNotes.get(keyCode)!;
      const endTime = audioEngine.getCurrentTime() - state.recordingStartTime;
      const duration = Math.max(30, endTime - pending.startTime);

      const newNote: NoteEvent = {
        note: pending.note,
        frequency: pending.frequency,
        keyCode,
        velocity: pending.velocity,
        startTime: pending.startTime,
        duration,
      };

      newRecordedNotes = [...state.recordedNotes, newNote];
      newPending = new Map(state.pendingNotes);
      newPending.delete(keyCode);
    }

    const remainingActive = Array.from(newActiveKeys);
    const lastMapping = remainingActive.length > 0 ? getKeyMapping(remainingActive[remainingActive.length - 1]) : null;

    set({
      activeKeys: newActiveKeys,
      currentNote: lastMapping ? { note: lastMapping.note, frequency: lastMapping.frequency } : null,
      recordedNotes: newRecordedNotes,
      pendingNotes: newPending,
    });
  },

  startRecording: () => {
    const state = get();
    if (state.isRecording) return;

    audioEngine.stopAll();

    set({
      isRecording: true,
      isPlaying: false,
      recordedNotes: [],
      pendingNotes: new Map(),
      recordingStartTime: audioEngine.getCurrentTime(),
      playbackPosition: 0,
    });
  },

  stopRecording: () => {
    const state = get();
    if (!state.isRecording) return;

    const endTime = audioEngine.getCurrentTime() - state.recordingStartTime;
    const finalPending = new Map(state.pendingNotes);
    const extraNotes: NoteEvent[] = [];

    for (const [keyCode, pending] of finalPending.entries()) {
      const duration = Math.max(30, endTime - pending.startTime);
      extraNotes.push({
        note: pending.note,
        frequency: pending.frequency,
        keyCode,
        velocity: pending.velocity,
        startTime: pending.startTime,
        duration,
      });
      audioEngine.stopTone(keyCode);
    }

    set({
      isRecording: false,
      pendingNotes: new Map(),
      recordedNotes: [...state.recordedNotes, ...extraNotes].sort((a, b) => a.startTime - b.startTime),
      activeKeys: new Set(),
      currentNote: null,
    });
  },

  togglePlayback: () => {
    const state = get();
    if (state.isPlaying) {
      get().stopPlayback();
      return;
    }

    if (state.recordedNotes.length === 0) return;

    const notes = state.recordedNotes;
    const totalDuration = notes.reduce(
      (max, n) => Math.max(max, n.startTime + n.duration),
      0
    );

    set({ isPlaying: true, playbackPosition: 0 });

    const startTime = performance.now();
    const startedKeys = new Set<string>();
    let animationFrameId: number;

    const tick = () => {
      const currentState = get();
      if (!currentState.isPlaying) {
        audioEngine.stopAll();
        return;
      }

      const elapsed = (performance.now() - startTime) * currentState.playbackSpeed;
      set({ playbackPosition: elapsed });

      for (const note of notes) {
        if (note.startTime <= elapsed && !startedKeys.has(`${note.startTime}-${note.keyCode}`)) {
          startedKeys.add(`${note.startTime}-${note.keyCode}`);
          audioEngine.playTone(note.frequency, note.velocity, `playback-${note.startTime}-${note.keyCode}`);

          const mapping = getKeyMapping(note.keyCode);
          if (mapping) {
            const newActive = new Set(currentState.activeKeys);
            newActive.add(note.keyCode);
            set({
              activeKeys: newActive,
              currentNote: { note: mapping.note, frequency: mapping.frequency },
            });

            setTimeout(() => {
              const s = get();
              const updatedActive = new Set(s.activeKeys);
              updatedActive.delete(note.keyCode);
              set({ activeKeys: updatedActive });
            }, Math.max(50, note.duration / currentState.playbackSpeed));
          }

          setTimeout(() => {
            audioEngine.stopTone(`playback-${note.startTime}-${note.keyCode}`);
          }, Math.max(50, note.duration / currentState.playbackSpeed));
        }
      }

      if (elapsed >= totalDuration + 500) {
        set({ isPlaying: false, playbackPosition: 0, activeKeys: new Set(), currentNote: null });
        audioEngine.stopAll();
        return;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    const originalStopPlayback = get().stopPlayback;
    set({
      stopPlayback: () => {
        cancelAnimationFrame(animationFrameId);
        audioEngine.stopAll();
        set({ isPlaying: false, playbackPosition: 0, activeKeys: new Set(), currentNote: null, stopPlayback: originalStopPlayback });
      },
    });
  },

  stopPlayback: () => {
    audioEngine.stopAll();
    set({ isPlaying: false, playbackPosition: 0, activeKeys: new Set(), currentNote: null });
  },

  setPlaybackSpeed: (speed: number) => {
    set({ playbackSpeed: Math.max(0.5, Math.min(2.0, speed)) });
  },

  setTone: (tone: ToneType) => {
    audioEngine.setTone(tone);
    set({ currentTone: tone });
  },

  setPlaybackPosition: (pos: number) => {
    set({ playbackPosition: pos });
  },
}));
