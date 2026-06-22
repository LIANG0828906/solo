export type InstrumentType = 'piano' | 'guitar' | 'drums';

export interface NoteEvent {
  instrument: InstrumentType;
  note: string | number;
  velocity: number;
  timestamp: number;
  userId?: string;
  color?: string;
  releaseDelay?: number;
}

export interface ActiveNote {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  startTime: number;
  instrument: InstrumentType;
  note: string | number;
  stopTimer?: number;
}

const PIANO_WHITE_KEYS = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'];
const PIANO_BLACK_KEYS = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'C#5', 'D#5', 'F#5', 'G#5', 'A#5'];

const PIANO_WHITE_KEY_MAP: Record<string, string> = {
  'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4', 'g': 'G4', 'h': 'A4', 'j': 'B4',
  'k': 'C5', 'l': 'D5', ';': 'E5', "'": 'F5'
};

const PIANO_BLACK_KEY_MAP: Record<string, string> = {
  'w': 'C#4', 'e': 'D#4', 't': 'F#4', 'y': 'G#4', 'u': 'A#4',
  'o': 'C#5', 'p': 'D#5'
};

const GUITAR_STRING_NOTES = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
const GUITAR_STRING_KEY_MAP: Record<string, number> = {
  '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5
};

const DRUM_PADS = [
  { id: 'kick', name: '底鼓', color: '#666666', freq: 60, type: 'sine' as OscillatorType },
  { id: 'snare', name: '军鼓', color: '#888888', freq: 200, type: 'triangle' as OscillatorType },
  { id: 'hihat', name: '镲片', color: '#AAAAAA', freq: 8000, type: 'square' as OscillatorType },
  { id: 'tom', name: '桶鼓', color: '#999999', freq: 150, type: 'sine' as OscillatorType }
];

const DRUM_KEY_MAP: Record<string, number> = {
  'q': 0, 'w': 1, 'e': 2, 'r': 3
};

const NOTE_FREQUENCIES: Record<string, number> = {
  'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83,
  'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
  'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65,
  'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
  'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
  'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
  'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
  'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91,
  'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53
};

export class InstrumentEngine {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private analyser: AnalyserNode;
  private activeNotes: Map<string, ActiveNote> = new Map();
  private pressedKeys: Set<string> = new Set();
  private guitarFret: number = 0;
  private bpm: number = 120;
  private onNoteCallback?: (event: NoteEvent) => void;

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: 44100 });
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  getAudioContext(): AudioContext {
    return this.audioContext;
  }

  setVolume(volume: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  setBPM(bpm: number): void {
    this.bpm = bpm;
  }

  getBPM(): number {
    return this.bpm;
  }

  setOnNoteCallback(callback: (event: NoteEvent) => void): void {
    this.onNoteCallback = callback;
  }

  resume(): Promise<void> {
    return this.audioContext.resume();
  }

  getPressedKeys(): Set<string> {
    return this.pressedKeys;
  }

  getGuitarFret(): number {
    return this.guitarFret;
  }

  setGuitarFret(fret: number): void {
    this.guitarFret = Math.max(0, Math.min(12, fret));
  }

  static getPianoWhiteKeys(): string[] {
    return PIANO_WHITE_KEYS;
  }

  static getPianoBlackKeys(): string[] {
    return PIANO_BLACK_KEYS;
  }

  static getGuitarStringNotes(): string[] {
    return GUITAR_STRING_NOTES;
  }

  static getDrumPads(): typeof DRUM_PADS {
    return DRUM_PADS;
  }

  mapKeyboardToNote(key: string, instrument: InstrumentType): NoteEvent | null {
    const lowerKey = key.toLowerCase();
    const velocity = 0.8;

    if (instrument === 'piano') {
      let note = PIANO_WHITE_KEY_MAP[lowerKey] || PIANO_BLACK_KEY_MAP[lowerKey];
      if (note) {
        return {
          instrument: 'piano',
          note,
          velocity,
          timestamp: performance.now()
        };
      }
    } else if (instrument === 'guitar') {
      const stringIdx = GUITAR_STRING_KEY_MAP[lowerKey];
      if (stringIdx !== undefined) {
        return {
          instrument: 'guitar',
          note: `${stringIdx}-${this.guitarFret}`,
          velocity,
          timestamp: performance.now(),
          releaseDelay: 300
        };
      }
      if (key === 'ArrowUp') {
        this.setGuitarFret(this.guitarFret + 1);
        return null;
      }
      if (key === 'ArrowDown') {
        this.setGuitarFret(this.guitarFret - 1);
        return null;
      }
    } else if (instrument === 'drums') {
      const padIdx = DRUM_KEY_MAP[lowerKey];
      if (padIdx !== undefined) {
        return {
          instrument: 'drums',
          note: padIdx,
          velocity,
          timestamp: performance.now()
        };
      }
    }

    return null;
  }

  triggerNote(event: NoteEvent): void {
    const key = `${event.instrument}-${event.note}`;

    if (event.instrument !== 'guitar' && event.instrument !== 'drums') {
      if (this.pressedKeys.has(key)) return;
    }
    this.pressedKeys.add(key);

    this.synthesizeSound(event);

    if (this.onNoteCallback) {
      this.onNoteCallback(event);
    }
  }

  releaseNote(event: NoteEvent): void {
    const key = `${event.instrument}-${event.note}`;
    this.pressedKeys.delete(key);
    const active = this.activeNotes.get(key);

    if (active) {
      const releaseDelay = event.releaseDelay || 100;
      const ctx = this.audioContext;
      const now = ctx.currentTime;

      active.gainNode.gain.cancelScheduledValues(now);
      active.gainNode.gain.setValueAtTime(active.gainNode.gain.value, now);
      active.gainNode.gain.exponentialRampToValueAtTime(0.001, now + releaseDelay / 1000);

      active.stopTimer = window.setTimeout(() => {
        try {
          active.oscillator.stop();
          active.oscillator.disconnect();
          active.gainNode.disconnect();
        } catch (e) { /* ignore */ }
        this.activeNotes.delete(key);
      }, releaseDelay + 50);
    }
  }

  private synthesizeSound(event: NoteEvent): void {
    const ctx = this.audioContext;
    const key = `${event.instrument}-${event.note}`;
    const existing = this.activeNotes.get(key);

    if (existing) {
      try {
        existing.oscillator.stop();
        existing.oscillator.disconnect();
        existing.gainNode.disconnect();
      } catch (e) { /* ignore */ }
      if (existing.stopTimer) clearTimeout(existing.stopTimer);
      this.activeNotes.delete(key);
    }

    const now = ctx.currentTime;

    if (event.instrument === 'piano') {
      this.createPianoSound(event, key, now);
    } else if (event.instrument === 'guitar') {
      this.createGuitarSound(event, key, now);
    } else if (event.instrument === 'drums') {
      this.createDrumSound(event, key, now);
    }
  }

  private createPianoSound(event: NoteEvent, key: string, now: number): void {
    const ctx = this.audioContext;
    const noteName = event.note as string;
    const freq = NOTE_FREQUENCIES[noteName] || 440;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.value = freq;
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;

    const mixGain = ctx.createGain();
    osc1.connect(mixGain);
    osc2.connect(mixGain);
    mixGain.gain.value = 0.5;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 4000;
    filter.Q.value = 1;

    mixGain.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(event.velocity * 0.4, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(event.velocity * 0.2, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    osc1.start(now);
    osc2.start(now);

    this.activeNotes.set(key, {
      oscillator: osc1,
      gainNode: gain,
      startTime: now,
      instrument: 'piano',
      note: event.note
    });
  }

  private createGuitarSound(event: NoteEvent, key: string, now: number): void {
    const ctx = this.audioContext;
    const [stringIdxStr, fretStr] = (event.note as string).split('-');
    const stringIdx = parseInt(stringIdxStr);
    const fret = parseInt(fretStr);
    const baseNote = GUITAR_STRING_NOTES[stringIdx] || 'E2';
    const baseFreq = NOTE_FREQUENCIES[baseNote] || 82.41;
    const freq = baseFreq * Math.pow(2, fret / 12);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    filter.type = 'bandpass';
    filter.frequency.value = freq * 2;
    filter.Q.value = 2;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(event.velocity * 0.35, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(event.velocity * 0.2, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2);

    osc.start(now);

    this.activeNotes.set(key, {
      oscillator: osc,
      gainNode: gain,
      startTime: now,
      instrument: 'guitar',
      note: event.note
    });
  }

  private createDrumSound(event: NoteEvent, key: string, now: number): void {
    const ctx = this.audioContext;
    const padIdx = event.note as number;
    const pad = DRUM_PADS[padIdx];
    if (!pad) return;

    if (pad.id === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
      gain.gain.setValueAtTime(event.velocity, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.3);
      this.activeNotes.set(key, {
        oscillator: osc, gainNode: gain, startTime: now,
        instrument: 'drums', note: event.note
      });
    } else if (pad.id === 'snare') {
      const noise = this.createNoiseBuffer();
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noise;
      const noiseGain = ctx.createGain();
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;
      noiseGain.gain.setValueAtTime(event.velocity * 0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noiseSource.start(now);
      noiseSource.stop(now + 0.2);

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 180;
      oscGain.gain.setValueAtTime(event.velocity * 0.4, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.12);

      this.activeNotes.set(key, {
        oscillator: osc, gainNode: oscGain, startTime: now,
        instrument: 'drums', note: event.note
      });
    } else if (pad.id === 'hihat') {
      const noise = this.createNoiseBuffer();
      const source = ctx.createBufferSource();
      source.buffer = noise;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 5000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(event.velocity * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      source.start(now);
      source.stop(now + 0.08);

      const fakeOsc = ctx.createOscillator();
      fakeOsc.frequency.value = 8000;
      this.activeNotes.set(key, {
        oscillator: fakeOsc, gainNode: gain, startTime: now,
        instrument: 'drums', note: event.note
      });
    } else if (pad.id === 'tom') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(event.velocity * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
      this.activeNotes.set(key, {
        oscillator: osc, gainNode: gain, startTime: now,
        instrument: 'drums', note: event.note
      });
    }
  }

  private createNoiseBuffer(): AudioBuffer {
    const ctx = this.audioContext;
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  static noteToFrequency(note: string): number {
    return NOTE_FREQUENCIES[note] || 440;
  }

  static getAllFrequencies(): Record<string, number> {
    return { ...NOTE_FREQUENCIES };
  }
}
