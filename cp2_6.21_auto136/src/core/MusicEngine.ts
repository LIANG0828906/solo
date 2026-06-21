export interface Note {
  pitch: string;
  midi: number;
  startTime: number;
  duration: number;
}

export interface Score {
  id: string;
  name: string;
  notes: Note[];
  totalDuration: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToPitch(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return NOTE_NAMES[noteIndex] + octave;
}

export function pitchToMidi(pitch: string): number {
  const match = pitch.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 60;
  const [, note, octaveStr] = match;
  const noteIndex = NOTE_NAMES.indexOf(note);
  const octave = parseInt(octaveStr, 10);
  return (octave + 1) * 12 + noteIndex;
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const createTwinkleStar = (): Score => {
  const baseNotes: Array<[string, number, number]> = [
    ['C4', 0, 0.5], ['C4', 0.5, 0.5], ['G4', 1, 0.5], ['G4', 1.5, 0.5],
    ['A4', 2, 0.5], ['A4', 2.5, 0.5], ['G4', 3, 1],
    ['F4', 4, 0.5], ['F4', 4.5, 0.5], ['E4', 5, 0.5], ['E4', 5.5, 0.5],
    ['D4', 6, 0.5], ['D4', 6.5, 0.5], ['C4', 7, 1],
    ['G4', 8, 0.5], ['G4', 8.5, 0.5], ['F4', 9, 0.5], ['F4', 9.5, 0.5],
    ['E4', 10, 0.5], ['E4', 10.5, 0.5], ['D4', 11, 1],
    ['G4', 12, 0.5], ['G4', 12.5, 0.5], ['F4', 13, 0.5], ['F4', 13.5, 0.5],
    ['E4', 14, 0.5], ['E4', 14.5, 0.5], ['D4', 15, 1],
    ['C4', 16, 0.5], ['C4', 16.5, 0.5], ['G4', 17, 0.5], ['G4', 17.5, 0.5],
    ['A4', 18, 0.5], ['A4', 18.5, 0.5], ['G4', 19, 1],
    ['F4', 20, 0.5], ['F4', 20.5, 0.5], ['E4', 21, 0.5], ['E4', 21.5, 0.5],
    ['D4', 22, 0.5], ['D4', 22.5, 0.5], ['C4', 23, 1],
  ];
  const notes = baseNotes.map(([pitch, startTime, duration]) => ({
    pitch, midi: pitchToMidi(pitch), startTime, duration,
  }));
  return { id: 'twinkle', name: '小星星', notes, totalDuration: 24 };
};

const createOdeToJoy = (): Score => {
  const baseNotes: Array<[string, number, number]> = [
    ['E4', 0, 0.5], ['E4', 0.5, 0.5], ['F4', 1, 0.5], ['G4', 1.5, 0.5],
    ['G4', 2, 0.5], ['F4', 2.5, 0.5], ['E4', 3, 0.5], ['D4', 3.5, 0.5],
    ['C4', 4, 0.5], ['C4', 4.5, 0.5], ['D4', 5, 0.5], ['E4', 5.5, 0.5],
    ['E4', 6, 0.75], ['D4', 6.75, 0.25], ['D4', 7, 1],
    ['E4', 8, 0.5], ['E4', 8.5, 0.5], ['F4', 9, 0.5], ['G4', 9.5, 0.5],
    ['G4', 10, 0.5], ['F4', 10.5, 0.5], ['E4', 11, 0.5], ['D4', 11.5, 0.5],
    ['C4', 12, 0.5], ['C4', 12.5, 0.5], ['D4', 13, 0.5], ['E4', 13.5, 0.5],
    ['D4', 14, 0.75], ['C4', 14.75, 0.25], ['C4', 15, 1],
    ['D4', 16, 0.5], ['D4', 16.5, 0.5], ['E4', 17, 0.5], ['C4', 17.5, 0.5],
    ['D4', 18, 0.5], ['E4', 18.5, 0.25], ['F4', 18.75, 0.25], ['E4', 19, 0.5], ['C4', 19.5, 0.5],
    ['D4', 20, 0.5], ['E4', 20.5, 0.25], ['F4', 20.75, 0.25], ['E4', 21, 0.5], ['D4', 21.5, 0.5],
    ['C4', 22, 0.5], ['D4', 22.5, 0.5], ['G3', 23, 1],
    ['E4', 24, 0.5], ['E4', 24.5, 0.5], ['F4', 25, 0.5], ['G4', 25.5, 0.5],
    ['G4', 26, 0.5], ['F4', 26.5, 0.5], ['E4', 27, 0.5], ['D4', 27.5, 0.5],
    ['C4', 28, 0.5], ['C4', 28.5, 0.5], ['D4', 29, 0.5], ['E4', 29.5, 0.5],
    ['D4', 30, 0.75], ['C4', 30.75, 0.25], ['C4', 31, 1],
  ];
  const notes = baseNotes.map(([pitch, startTime, duration]) => ({
    pitch, midi: pitchToMidi(pitch), startTime, duration,
  }));
  return { id: 'ode', name: '欢乐颂', notes, totalDuration: 32 };
};

const createCanon = (): Score => {
  const baseNotes: Array<[string, number, number]> = [
    ['E5', 0, 0.5], ['D5', 0.5, 0.5], ['C#5', 1, 0.5], ['B4', 1.5, 0.5],
    ['A4', 2, 0.5], ['G4', 2.5, 0.5], ['A4', 3, 0.5], ['B4', 3.5, 0.5],
    ['C#5', 4, 0.5], ['B4', 4.5, 0.5], ['A4', 5, 0.5], ['G4', 5.5, 0.5],
    ['F#4', 6, 0.5], ['E4', 6.5, 0.5], ['F#4', 7, 0.5], ['G4', 7.5, 0.5],
    ['E4', 8, 0.5], ['C#4', 8.5, 0.5], ['D4', 9, 0.5], ['B3', 9.5, 0.5],
    ['G4', 10, 0.5], ['E4', 10.5, 0.5], ['F#4', 11, 0.5], ['G4', 11.5, 0.5],
    ['F#4', 12, 0.5], ['D4', 12.5, 0.5], ['E4', 13, 0.5], ['C#4', 13.5, 0.5],
    ['D4', 14, 0.5], ['E4', 14.5, 0.5], ['F#4', 15, 0.5], ['G4', 15.5, 0.5],
    ['F#4', 16, 0.5], ['E4', 16.5, 0.5], ['D4', 17, 0.5], ['C#4', 17.5, 0.5],
    ['D4', 18, 0.5], ['E4', 18.5, 0.5], ['F#4', 19, 0.5], ['G4', 19.5, 0.5],
    ['E4', 20, 0.5], ['D4', 20.5, 0.5], ['C#4', 21, 0.5], ['B3', 21.5, 0.5],
    ['A3', 22, 0.5], ['G3', 22.5, 0.5], ['A3', 23, 0.5], ['B3', 23.5, 0.5],
  ];
  const notes = baseNotes.map(([pitch, startTime, duration]) => ({
    pitch, midi: pitchToMidi(pitch), startTime, duration,
  }));
  return { id: 'canon', name: '卡农片段', notes, totalDuration: 24 };
};

export const BUILTIN_SCORES: Score[] = [
  createTwinkleStar(),
  createOdeToJoy(),
  createCanon(),
];

export class MusicEngine {
  private audioContext: AudioContext | null = null;
  private currentScore: Score | null = null;
  private playbackTimeouts: number[] = [];
  private playbackStartTime: number = 0;
  private isPlaying: boolean = false;
  private volume: number = 0.5;
  private activeOscillators: Map<number, { osc: OscillatorNode; gain: GainNode }> = new Map();
  private rafId: number | null = null;
  private onNoteStartCb: ((midi: number) => void) | null = null;
  private onCompleteCb: (() => void) | null = null;

  private ensureContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  playNote(midi: number, duration: number = 0.5): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const freq = midiToFreq(midi);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.01);
    gain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.05);

    this.activeOscillators.set(midi, { osc, gain });
    osc.onended = () => {
      this.activeOscillators.delete(midi);
    };
  }

  stopNote(midi: number): void {
    const entry = this.activeOscillators.get(midi);
    if (entry) {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      entry.gain.gain.cancelScheduledValues(now);
      entry.gain.gain.setValueAtTime(entry.gain.gain.value, now);
      entry.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      entry.osc.stop(now + 0.06);
      this.activeOscillators.delete(midi);
    }
  }

  loadScore(score: Score): void {
    this.currentScore = score;
  }

  getScore(): Score | null {
    return this.currentScore;
  }

  playScore(
    onNoteStart?: (midi: number) => void,
    onComplete?: () => void
  ): void {
    if (!this.currentScore) return;
    this.stopPlayback();
    this.isPlaying = true;
    this.onNoteStartCb = onNoteStart || null;
    this.onCompleteCb = onComplete || null;
    this.playbackStartTime = performance.now();
    const ctx = this.ensureContext();

    this.currentScore.notes.forEach((note) => {
      const startDelay = note.startTime * 1000;
      const timeoutId = window.setTimeout(() => {
        if (!this.isPlaying) return;
        this.playNote(note.midi, note.duration);
        if (this.onNoteStartCb) {
          this.onNoteStartCb(note.midi);
        }
      }, startDelay);
      this.playbackTimeouts.push(timeoutId);
    });

    const totalMs = this.currentScore.totalDuration * 1000;
    const endTimeout = window.setTimeout(() => {
      if (this.isPlaying) {
        this.isPlaying = false;
        if (this.onCompleteCb) {
          this.onCompleteCb();
        }
      }
    }, totalMs + 500);
    this.playbackTimeouts.push(endTimeout);

    void ctx;
  }

  stopPlayback(): void {
    this.isPlaying = false;
    this.playbackTimeouts.forEach((id) => window.clearTimeout(id));
    this.playbackTimeouts = [];
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.activeOscillators.forEach((_, midi) => this.stopNote(midi));
    this.activeOscillators.clear();
  }

  getCurrentTime(): number {
    if (!this.isPlaying) return 0;
    return (performance.now() - this.playbackStartTime) / 1000;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getPlaybackStartTime(): number {
    return this.playbackStartTime;
  }

  destroy(): void {
    this.stopPlayback();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
