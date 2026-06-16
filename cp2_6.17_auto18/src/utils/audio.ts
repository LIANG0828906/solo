export type Tone = 'piano' | 'guitar' | 'synth';

export interface Note {
  id: string;
  pitch: string;
  midi: number;
  time: number;
  duration: number;
}

export const TONE_COLORS: Record<Tone, string> = {
  piano: '#F4D03F',
  guitar: '#E67E22',
  synth: '#8E44AD',
};

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

export const createPianoBuffer = (
  audioContext: AudioContext,
  frequency: number,
  duration: number
): AudioBuffer => {
  const sampleRate = audioContext.sampleRate;
  const totalSamples = Math.floor(sampleRate * (duration + 0.1));
  const buffer = audioContext.createBuffer(2, totalSamples, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;

      const amplitudeEnvelope = Math.exp(-t * 3) * (1 - Math.exp(-t * 50));

      let sample = 0;
      const harmonics = [
        { freq: 1, gain: 0.6 },
        { freq: 2, gain: 0.25 },
        { freq: 3, gain: 0.12 },
        { freq: 4, gain: 0.03 },
      ];

      harmonics.forEach(h => {
        sample += h.gain * Math.sin(2 * Math.PI * frequency * h.freq * t);
      });

      const detune = Math.sin(2 * Math.PI * frequency * 1.002 * t) * 0.02;
      sample += detune;

      sample *= amplitudeEnvelope * 0.5;
      channelData[i] = sample;
    }
  }

  return buffer;
};

export const createGuitarBuffer = (
  audioContext: AudioContext,
  frequency: number,
  duration: number
): AudioBuffer => {
  const sampleRate = audioContext.sampleRate;
  const totalDuration = duration * 1.5 + 0.05;
  const totalSamples = Math.floor(sampleRate * totalDuration);
  const buffer = audioContext.createBuffer(2, totalSamples, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = buffer.getChannelData(channel);

    const delaySamples = Math.floor(sampleRate * 0.005);
    const feedback = 0.75;

    let y1 = 0, y2 = 0, y3 = 0, y4 = 0;
    const combDelay1 = new Array(Math.floor(sampleRate * 0.0297)).fill(0);
    const combDelay2 = new Array(Math.floor(sampleRate * 0.0371)).fill(0);
    const combDelay3 = new Array(Math.floor(sampleRate * 0.0411)).fill(0);
    const combDelay4 = new Array(Math.floor(sampleRate * 0.0437)).fill(0);
    let ptr1 = 0, ptr2 = 0, ptr3 = 0, ptr4 = 0;

    const allpassDelay1 = new Array(Math.floor(sampleRate * 0.005)).fill(0);
    const allpassDelay2 = new Array(Math.floor(sampleRate * 0.0017)).fill(0);
    let aptr1 = 0, aptr2 = 0;

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;

      const amplitudeEnvelope = Math.exp(-t * 2) * (1 - Math.exp(-t * 800));

      const harmonicWeights = [1, 0.7, 0.45, 0.25, 0.1, 0.05];
      let excitation = 0;
      harmonicWeights.forEach((weight, n) => {
        excitation += weight * Math.sin(2 * Math.PI * frequency * (n + 1) * t);
      });
      excitation *= (Math.random() * 2 - 1) * 0.15;
      excitation *= amplitudeEnvelope * 0.8;

      let combOutput = 0;
      combOutput += combDelay1[ptr1];
      combDelay1[ptr1] = excitation + feedback * combDelay1[ptr1];
      ptr1 = (ptr1 + 1) % combDelay1.length;

      combOutput += combDelay2[ptr2];
      combDelay2[ptr2] = excitation + feedback * combDelay2[ptr2];
      ptr2 = (ptr2 + 1) % combDelay2.length;

      combOutput += combDelay3[ptr3];
      combDelay3[ptr3] = excitation + feedback * combDelay3[ptr3];
      ptr3 = (ptr3 + 1) % combDelay3.length;

      combOutput += combDelay4[ptr4];
      combDelay4[ptr4] = excitation + feedback * combDelay4[ptr4];
      ptr4 = (ptr4 + 1) % combDelay4.length;

      combOutput *= 0.25;

      let allpassOutput = allpassDelay1[aptr1];
      allpassDelay1[aptr1] = combOutput + 0.5 * allpassOutput;
      aptr1 = (aptr1 + 1) % allpassDelay1.length;
      allpassOutput = allpassDelay2[aptr2];
      allpassDelay2[aptr2] = allpassDelay1[aptr1 === 0 ? allpassDelay1.length - 1 : aptr1 - 1] + 0.5 * allpassOutput;
      aptr2 = (aptr2 + 1) % allpassDelay2.length;

      let finalSample = allpassDelay2[aptr2 === 0 ? allpassDelay2.length - 1 : aptr2 - 1];
      finalSample *= 0.35 * amplitudeEnvelope;

      if (i < delaySamples) {
        finalSample *= i / delaySamples;
      }

      if (t > duration) {
        finalSample *= Math.exp(-(t - duration) * 15);
      }

      channelData[i] = finalSample;
    }
  }

  return buffer;
};

export const createSynthBuffer = (
  audioContext: AudioContext,
  frequency: number,
  duration: number
): AudioBuffer => {
  const sampleRate = audioContext.sampleRate;
  const totalSamples = Math.floor(sampleRate * (duration + 0.2));
  const buffer = audioContext.createBuffer(2, totalSamples, sampleRate);

  const vibratoDepth = 0.015;
  const vibratoRate = 5;

  for (let channel = 0; channel < 2; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;

      const amplitudeEnvelope =
        Math.min(t / 0.03, 1) *
        (t < 0.1
          ? 1
          : Math.max(0.3, 1 - (t - 0.1) * 0.5)) *
        Math.exp(-Math.max(0, t - duration) * 8);

      const vibrato = 1 + vibratoDepth * Math.sin(2 * Math.PI * vibratoRate * t);
      const freqWithVibrato = frequency * vibrato;

      let sample = 0;

      const squarePhase = (freqWithVibrato * t) % 1;
      sample += squarePhase < 0.5 ? 0.5 : -0.5;

      const subOscPhase = (freqWithVibrato * 0.5 * t) % 1;
      sample += (subOscPhase < 0.5 ? 1 : -1) * 0.15;

      const detune = Math.sin(2 * Math.PI * freqWithVibrato * 1.008 * t) * 0.08;
      sample += detune;

      const filterCutoff = 800 + 1200 * Math.exp(-t * 2);
      const filter = Math.min(1, filterCutoff / (freqWithVibrato * 2));
      sample *= filter;

      const lfo = Math.sin(2 * Math.PI * 0.3 * t) * 0.05 + 1;
      sample *= lfo;

      sample *= amplitudeEnvelope * 0.4;

      const panOffset = channel === 0 ? -0.03 : 0.03;
      sample += panOffset * Math.sin(2 * Math.PI * freqWithVibrato * 0.25 * t);

      channelData[i] = Math.max(-1, Math.min(1, sample));
    }
  }

  return buffer;
};

export const TONE_BUFFER_CREATORS: Record<Tone, typeof createPianoBuffer> = {
  piano: createPianoBuffer,
  guitar: createGuitarBuffer,
  synth: createSynthBuffer,
};

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentTone: Tone = 'piano';
  private activeOscillators: Map<string, { osc: OscillatorNode; gain: GainNode }> = new Map();
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private fadeGain: GainNode | null = null;
  private crossFading: boolean = false;

  init() {
    if (this.audioContext) return;
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3;

    this.fadeGain = this.audioContext.createGain();
    this.fadeGain.gain.value = 1;

    this.fadeGain.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);
  }

  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  async setTone(tone: Tone): Promise<void> {
    if (this.currentTone === tone) return;

    this.init();
    if (!this.audioContext || !this.fadeGain || this.crossFading) return;

    this.crossFading = true;
    const now = this.audioContext.currentTime;
    const fadeDuration = 0.3;

    this.fadeGain.gain.cancelScheduledValues(now);
    this.fadeGain.gain.setValueAtTime(this.fadeGain.gain.value, now);
    this.fadeGain.gain.linearRampToValueAtTime(0.001, now + fadeDuration / 2);

    await new Promise(resolve => setTimeout(resolve, (fadeDuration / 2) * 1000));

    this.currentTone = tone;
    this.bufferCache.clear();

    if (this.audioContext && this.fadeGain) {
      const newNow = this.audioContext.currentTime;
      this.fadeGain.gain.cancelScheduledValues(newNow);
      this.fadeGain.gain.setValueAtTime(0.001, newNow);
      this.fadeGain.gain.linearRampToValueAtTime(1, newNow + fadeDuration / 2);
    }

    this.crossFading = false;
  }

  getTone(): Tone {
    return this.currentTone;
  }

  private getBufferKey(tone: Tone, frequency: number, duration: number): string {
    return `${tone}_${frequency.toFixed(2)}_${duration.toFixed(2)}`;
  }

  playNoteWithTone(note: string, duration: number = 0.3, tone?: Tone): void {
    this.init();
    this.resume();
    if (!this.audioContext || !this.fadeGain) return;

    const frequency = getNoteFrequency(note);
    const effectiveTone = tone || this.currentTone;
    const cacheKey = this.getBufferKey(effectiveTone, frequency, duration);

    let buffer = this.bufferCache.get(cacheKey);
    if (!buffer) {
      const bufferCreator = TONE_BUFFER_CREATORS[effectiveTone];
      buffer = bufferCreator(this.audioContext, frequency, duration);
      this.bufferCache.set(cacheKey, buffer);
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;

    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + 0.01);
    gainNode.gain.setValueAtTime(1, now + duration - 0.01);
    gainNode.gain.linearRampToValueAtTime(0.001, now + duration);

    source.connect(gainNode);
    gainNode.connect(this.fadeGain);

    source.start(now);
    source.stop(now + duration + 0.05);

    this.activeSources.add(source);

    source.onended = () => {
      this.activeSources.delete(source);
      source.disconnect();
      gainNode.disconnect();
    };
  }

  playNote(note: string, duration: number = 0.3): void {
    this.playNoteWithTone(note, duration, this.currentTone);
  }

  startNote(note: string): void {
    this.init();
    this.resume();
    if (!this.audioContext || !this.fadeGain) return;
    if (this.activeOscillators.has(note)) return;

    const frequency = getNoteFrequency(note);
    const now = this.audioContext.currentTime;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;
    gainNode.connect(this.fadeGain);

    const osc = this.audioContext.createOscillator();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    if (this.currentTone === 'piano') {
      osc.type = 'triangle';
      lfoGain.gain.value = 0;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02);
    } else if (this.currentTone === 'guitar') {
      osc.type = 'sawtooth';
      lfoGain.gain.value = 0;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.35, now + 0.01);
    } else {
      osc.type = 'square';
      lfo.type = 'sine';
      lfo.frequency.value = 5;
      lfoGain.gain.value = frequency * 0.015;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);

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

    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch (e) {}
    }
    this.activeSources.clear();
  }
}

export const audioEngine = new AudioEngine();
