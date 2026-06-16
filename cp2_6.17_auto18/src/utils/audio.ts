export type Tone = 'piano' | 'guitar' | 'synth';

export interface Note {
  id: string;
  pitch: string;
  midi: number;
  time: number;
  duration: number;
}

const NOTE_FREQUENCIES: Record<string, number> = {
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
  'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99,
  'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
};

const WHITE_KEYS = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'];
const BLACK_KEYS = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'C#5', 'D#5', 'F#5', 'G#5', 'A#5'];

const WHITE_KEY_MAP: Record<string, string> = {
  'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4',
  'g': 'G4', 'h': 'A4', 'j': 'B4',
  'k': 'C5', 'l': 'D5', ';': 'E5', "'": 'F5',
};

const BLACK_KEY_MAP: Record<string, string> = {
  'w': 'C#4', 'e': 'D#4', 't': 'F#4',
  'y': 'G#4', 'u': 'A#4', 'o': 'C#5', 'p': 'D#5',
};

export const getAllKeys = (): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < WHITE_KEYS.length; i++) {
    keys.push(WHITE_KEYS[i]);
    if (i < BLACK_KEYS.length && (i % 7 !== 2 && i % 7 !== 6)) {
    }
  }
  return [...WHITE_KEYS, ...BLACK_KEYS].sort((a, b) => {
    const octaveA = parseInt(a.slice(-1));
    const octaveB = parseInt(b.slice(-1));
    if (octaveA !== octaveB) return octaveA - octaveB;
    const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return noteOrder.indexOf(a.slice(0, -1)) - noteOrder.indexOf(b.slice(0, -1));
  });
};

export const getWhiteKeys = (): string[] => WHITE_KEYS;
export const getBlackKeys = (): string[] => BLACK_KEYS;

export const getKeyFromKeyboard = (key: string): string | null => {
  const lowerKey = key.toLowerCase();
  return WHITE_KEY_MAP[lowerKey] || BLACK_KEY_MAP[lowerKey] || null;
};

export const getNoteFrequency = (note: string): number => {
  return NOTE_FREQUENCIES[note] || 440;
};

export const noteToMidi = (note: string): number => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = parseInt(note.slice(-1));
  const noteName = note.slice(0, -1);
  return (octave + 1) * 12 + noteNames.indexOf(noteName);
};

export const midiToNote = (midi: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[midi % 12];
  return `${noteName}${octave}`;
};

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentTone: Tone = 'piano';
  private activeOscillators: Map<string, { osc: OscillatorNode; gain: GainNode }> = new Map();

  init() {
    if (this.audioContext) return;
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.audioContext.destination);
  }

  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setTone(tone: Tone) {
    this.currentTone = tone;
  }

  getTone(): Tone {
    return this.currentTone;
  }

  playNote(note: string, duration: number = 0.3): void {
    this.init();
    this.resume();
    if (!this.audioContext || !this.masterGain) return;

    const frequency = getNoteFrequency(note);
    const now = this.audioContext.currentTime;

    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.masterGain);

    const oscillators: OscillatorNode[] = [];

    if (this.currentTone === 'piano') {
      const osc1 = this.audioContext.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.value = frequency;
      osc1.connect(gainNode);
      oscillators.push(osc1);

      const osc2 = this.audioContext.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = frequency * 2;
      const osc2Gain = this.audioContext.createGain();
      osc2Gain.gain.value = 0.3;
      osc2.connect(osc2Gain);
      osc2Gain.connect(gainNode);
      oscillators.push(osc2);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.5, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } else if (this.currentTone === 'guitar') {
      const osc1 = this.audioContext.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.value = frequency;
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;
      osc1.connect(filter);
      filter.connect(gainNode);
      oscillators.push(osc1);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration * 1.2);
    } else if (this.currentTone === 'synth') {
      const osc1 = this.audioContext.createOscillator();
      osc1.type = 'square';
      osc1.frequency.value = frequency;
      osc1.connect(gainNode);
      oscillators.push(osc1);

      const osc2 = this.audioContext.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = frequency * 1.005;
      const osc2Gain = this.audioContext.createGain();
      osc2Gain.gain.value = 0.2;
      osc2.connect(osc2Gain);
      osc2Gain.connect(gainNode);
      oscillators.push(osc2);

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
      filter.frequency.exponentialRampToValueAtTime(500, now + duration);
      oscillators.forEach(osc => {
        osc.disconnect();
        osc.connect(filter);
      });
      filter.connect(gainNode);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.35, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }

    oscillators.forEach(osc => osc.start(now));
    oscillators.forEach(osc => osc.stop(now + duration + 0.1));
  }

  startNote(note: string): void {
    this.init();
    this.resume();
    if (!this.audioContext || !this.masterGain) return;
    if (this.activeOscillators.has(note)) return;

    const frequency = getNoteFrequency(note);
    const now = this.audioContext.currentTime;

    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.masterGain);

    const osc = this.audioContext.createOscillator();

    if (this.currentTone === 'piano') {
      osc.type = 'triangle';
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02);
    } else if (this.currentTone === 'guitar') {
      osc.type = 'sawtooth';
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.35, now + 0.01);
    } else {
      osc.type = 'square';
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    }

    osc.frequency.value = frequency;
    osc.connect(gainNode);
    osc.start(now);

    this.activeOscillators.set(note, { osc, gain: gainNode });
  }

  stopNote(note: string): void {
    const active = this.activeOscillators.get(note);
    if (!active || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    active.gain.gain.cancelScheduledValues(now);
    active.gain.gain.setValueAtTime(active.gain.gain.value, now);
    active.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    active.osc.stop(now + 0.2);
    this.activeOscillators.delete(note);
  }

  stopAllNotes(): void {
    for (const note of this.activeOscillators.keys()) {
      this.stopNote(note);
    }
  }
}

export const audioEngine = new AudioEngine();
