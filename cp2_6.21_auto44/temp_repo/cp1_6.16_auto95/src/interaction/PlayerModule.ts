import { AudioEngine } from './AudioEngine';
import { useAppStore, getNoteInfo, KEYBOARD_MAP, NoteEvent, MelodyType } from '../store/AppState';

export interface MelodyNote {
  noteIndex: number;
  duration: number;
  delay: number;
}

export interface Melody {
  name: string;
  type: MelodyType;
  notes: MelodyNote[];
  bpm: number;
}

const MELODIES: Record<MelodyType, Melody> = {
  polka: {
    name: '波尔卡',
    type: 'polka',
    bpm: 120,
    notes: [
      { noteIndex: 0, duration: 0.3, delay: 0 },
      { noteIndex: 4, duration: 0.3, delay: 0.35 },
      { noteIndex: 7, duration: 0.3, delay: 0.7 },
      { noteIndex: 12, duration: 0.4, delay: 1.05 },
      { noteIndex: 11, duration: 0.3, delay: 1.5 },
      { noteIndex: 7, duration: 0.3, delay: 1.85 },
      { noteIndex: 4, duration: 0.3, delay: 2.2 },
      { noteIndex: 0, duration: 0.5, delay: 2.55 },
      { noteIndex: 2, duration: 0.3, delay: 3.15 },
      { noteIndex: 5, duration: 0.3, delay: 3.5 },
      { noteIndex: 9, duration: 0.3, delay: 3.85 },
      { noteIndex: 14, duration: 0.4, delay: 4.2 },
      { noteIndex: 12, duration: 0.3, delay: 4.7 },
      { noteIndex: 9, duration: 0.3, delay: 5.05 },
      { noteIndex: 5, duration: 0.3, delay: 5.4 },
      { noteIndex: 2, duration: 0.6, delay: 5.75 },
      { noteIndex: 4, duration: 0.25, delay: 6.5 },
      { noteIndex: 5, duration: 0.25, delay: 6.8 },
      { noteIndex: 7, duration: 0.25, delay: 7.1 },
      { noteIndex: 9, duration: 0.25, delay: 7.4 },
      { noteIndex: 11, duration: 0.5, delay: 7.7 },
      { noteIndex: 12, duration: 0.8, delay: 8.3 },
    ],
  },
  tango: {
    name: '探戈',
    type: 'tango',
    bpm: 92,
    notes: [
      { noteIndex: 9, duration: 0.5, delay: 0 },
      { noteIndex: 7, duration: 0.25, delay: 0.55 },
      { noteIndex: 5, duration: 0.25, delay: 0.85 },
      { noteIndex: 4, duration: 0.6, delay: 1.15 },
      { noteIndex: 0, duration: 0.4, delay: 1.85 },
      { noteIndex: 4, duration: 0.4, delay: 2.3 },
      { noteIndex: 7, duration: 0.8, delay: 2.75 },
      { noteIndex: 9, duration: 0.5, delay: 3.65 },
      { noteIndex: 11, duration: 0.25, delay: 4.2 },
      { noteIndex: 12, duration: 0.25, delay: 4.5 },
      { noteIndex: 14, duration: 0.6, delay: 4.8 },
      { noteIndex: 11, duration: 0.4, delay: 5.5 },
      { noteIndex: 9, duration: 0.4, delay: 5.95 },
      { noteIndex: 7, duration: 0.8, delay: 6.4 },
      { noteIndex: 5, duration: 0.5, delay: 7.35 },
      { noteIndex: 4, duration: 0.3, delay: 7.9 },
      { noteIndex: 2, duration: 0.3, delay: 8.25 },
      { noteIndex: 0, duration: 0.9, delay: 8.6 },
    ],
  },
  folk: {
    name: '民谣',
    type: 'folk',
    bpm: 72,
    notes: [
      { noteIndex: 0, duration: 0.6, delay: 0 },
      { noteIndex: 2, duration: 0.3, delay: 0.7 },
      { noteIndex: 4, duration: 0.3, delay: 1.05 },
      { noteIndex: 5, duration: 0.6, delay: 1.4 },
      { noteIndex: 4, duration: 0.3, delay: 2.1 },
      { noteIndex: 2, duration: 0.3, delay: 2.45 },
      { noteIndex: 0, duration: 0.9, delay: 2.8 },
      { noteIndex: 7, duration: 0.5, delay: 3.85 },
      { noteIndex: 9, duration: 0.3, delay: 4.4 },
      { noteIndex: 11, duration: 0.3, delay: 4.75 },
      { noteIndex: 12, duration: 0.8, delay: 5.1 },
      { noteIndex: 11, duration: 0.3, delay: 6.05 },
      { noteIndex: 9, duration: 0.3, delay: 6.4 },
      { noteIndex: 7, duration: 0.9, delay: 6.75 },
      { noteIndex: 5, duration: 0.5, delay: 7.8 },
      { noteIndex: 4, duration: 0.5, delay: 8.35 },
      { noteIndex: 2, duration: 0.5, delay: 8.9 },
      { noteIndex: 0, duration: 1.2, delay: 9.45 },
    ],
  },
};

export class PlayerModule {
  private audioEngine: AudioEngine;
  private isPlayingMelody = false;
  private melodyTimeouts: number[] = [];
  private melodyStartTime = 0;
  private melodyDuration = 0;
  private progressInterval: number | null = null;
  private hoveredKey: number | null = null;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
  }

  async init() {
    await this.audioEngine.init();
    this.bindKeyboardEvents();
  }

  private bindKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      const noteIndex = KEYBOARD_MAP[key];
      if (noteIndex !== undefined) {
        this.playNoteByIndex(noteIndex);
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      const noteIndex = KEYBOARD_MAP[key];
      if (noteIndex !== undefined) {
        this.releaseNoteByIndex(noteIndex);
      }
    });
  }

  playNoteByIndex(noteIndex: number, velocity: number = 0.75) {
    if (useAppStore.getState().playMode === 'auto' && this.isPlayingMelody) return;
    void this.audioEngine.resume();

    const info = getNoteInfo(noteIndex);
    const noteEvent: NoteEvent = {
      noteIndex,
      frequency: info.frequency,
      noteName: info.noteName,
      velocity,
      timestamp: performance.now(),
      row: info.row,
    };

    useAppStore.getState().pressNote(noteEvent);
    this.audioEngine.playNote(noteIndex, info.frequency, velocity, noteIndex < 12 ? 'sawtooth' : 'triangle');
  }

  releaseNoteByIndex(noteIndex: number) {
    useAppStore.getState().releaseNote(noteIndex);
    this.audioEngine.stopNote(noteIndex);
  }

  handleKeyPressStart(noteIndex: number) {
    this.playNoteByIndex(noteIndex);
  }

  handleKeyPressEnd(noteIndex: number) {
    this.releaseNoteByIndex(noteIndex);
  }

  handleKeyHover(noteIndex: number | null) {
    this.hoveredKey = noteIndex;
  }

  getHoveredKey(): number | null {
    return this.hoveredKey;
  }

  getMelody(type: MelodyType): Melody {
    return MELODIES[type];
  }

  startMelody(type: MelodyType = useAppStore.getState().currentMelody) {
    this.stopMelody();
    void this.audioEngine.resume();

    const melody = MELODIES[type];
    const beatDuration = 60 / melody.bpm;
    const speedMult = 0.8;

    const lastNote = melody.notes[melody.notes.length - 1];
    this.melodyDuration = (lastNote.delay + lastNote.duration) * beatDuration * speedMult;

    useAppStore.getState().setCurrentMelody(type);
    this.isPlayingMelody = true;
    this.melodyStartTime = performance.now();

    this.progressInterval = window.setInterval(() => {
      const elapsed = (performance.now() - this.melodyStartTime) / 1000;
      useAppStore.getState().setMelodyProgress(elapsed, this.melodyDuration);
    }, 50);

    melody.notes.forEach((n) => {
      const startDelay = n.delay * beatDuration * speedMult * 1000;
      const dur = n.duration * beatDuration * speedMult;

      const startTO = window.setTimeout(() => {
        const info = getNoteInfo(n.noteIndex);
        const noteEvent: NoteEvent = {
          noteIndex: n.noteIndex,
          frequency: info.frequency,
          noteName: info.noteName,
          velocity: 0.8,
          timestamp: performance.now(),
          row: info.row,
        };
        useAppStore.getState().pressNote(noteEvent);
        this.audioEngine.playNote(n.noteIndex, info.frequency, 0.8, n.noteIndex < 12 ? 'sawtooth' : 'triangle');
      }, startDelay);
      this.melodyTimeouts.push(startTO);

      const endTO = window.setTimeout(() => {
        useAppStore.getState().releaseNote(n.noteIndex);
        this.audioEngine.stopNote(n.noteIndex);
      }, startDelay + dur * 1000 - 50);
      this.melodyTimeouts.push(endTO);
    });

    const loopTO = window.setTimeout(() => {
      if (useAppStore.getState().playMode === 'auto') {
        this.startMelody(type);
      }
    }, this.melodyDuration * 1000 + 300);
    this.melodyTimeouts.push(loopTO);
  }

  stopMelody() {
    this.melodyTimeouts.forEach((t) => clearTimeout(t));
    this.melodyTimeouts = [];
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.isPlayingMelody = false;
    this.audioEngine.stopAll();
    useAppStore.getState().clearAllNotes();
    useAppStore.getState().setMelodyProgress(0, 0);
    useAppStore.getState().setCurrentNoteName('—');
  }

  setMode(mode: 'free' | 'auto') {
    if (mode === 'free') {
      this.stopMelody();
    } else {
      this.startMelody();
    }
    useAppStore.getState().setPlayMode(mode);
  }

  isAutoPlaying(): boolean {
    return this.isPlayingMelody;
  }

  getMelodyPathPoints(type: MelodyType): { x: number; y: number; z: number }[] {
    const melody = MELODIES[type];
    const beatDuration = 60 / melody.bpm;
    const speedMult = 0.8;
    const totalTime = this.melodyDuration || (melody.notes[melody.notes.length - 1].delay + melody.notes[melody.notes.length - 1].duration) * beatDuration * speedMult;

    const points: { x: number; y: number; z: number }[] = [];
    melody.notes.forEach((n, i) => {
      const t = (n.delay * beatDuration * speedMult) / totalTime;
      const y = (n.noteIndex / 24) * 3 + 2.5;
      const x = (t - 0.5) * 6;
      const z = -1 + Math.sin(i * 0.8) * 0.5;
      points.push({ x, y, z });
    });
    return points;
  }

  getCurrentMelodyProgress(): number {
    if (this.melodyDuration === 0) return 0;
    const elapsed = (performance.now() - this.melodyStartTime) / 1000;
    return Math.min(1, elapsed / this.melodyDuration);
  }
}
