const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
  'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
  'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
};

const CHORD_INTERVALS: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  seventh: [0, 4, 7, 10],
  minor7: [0, 3, 7, 10],
  major7: [0, 4, 7, 11]
};

const SCALE_INTERVALS: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  blues: [0, 3, 5, 6, 7, 10],
  pentatonic: [0, 2, 4, 7, 9]
};

function getNoteFrequency(rootNote: string, octave: number, semitoneOffset: number = 0): number {
  const baseFreq = NOTE_FREQUENCIES[rootNote] || 440;
  const semitones = octave * 12 + semitoneOffset;
  return baseFreq * Math.pow(2, semitones / 12);
}

function getChordFrequencies(rootNote: string, chordType: string, octave: number): number[] {
  const intervals = CHORD_INTERVALS[chordType] || CHORD_INTERVALS.major;
  return intervals.map(interval => getNoteFrequency(rootNote, octave, interval));
}

export class DrumSynthesizer {
  private ctx: AudioContext;
  private noiseBuffer: AudioBuffer | null = null;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.initNoiseBuffer();
  }

  private initNoiseBuffer() {
    const bufferSize = 2 * this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  playKick(time: number, gainNode: GainNode, intensity: number = 1) {
    const osc = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
    kickGain.gain.setValueAtTime(0, time);
    kickGain.gain.linearRampToValueAtTime(intensity, time + 0.01);
    kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(kickGain);
    kickGain.connect(gainNode);
    osc.start(time);
    osc.stop(time + 0.35);
  }

  playSnare(time: number, gainNode: GainNode, intensity: number = 1) {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(intensity * 0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);
    noise.start(time);
    noise.stop(time + 0.25);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, time);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(intensity * 0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(oscGain);
    oscGain.connect(gainNode);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  playHiHat(time: number, gainNode: GainNode, intensity: number = 1, open: boolean = false) {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 7000;
    const hihatGain = this.ctx.createGain();
    const duration = open ? 0.3 : 0.08;
    hihatGain.gain.setValueAtTime(intensity * 0.35, time);
    hihatGain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    noise.connect(highpass);
    highpass.connect(hihatGain);
    hihatGain.connect(gainNode);
    noise.start(time);
    noise.stop(time + duration + 0.05);
  }

  playTom(time: number, gainNode: GainNode, pitch: number = 1, intensity: number = 1) {
    const osc = this.ctx.createOscillator();
    const tomGain = this.ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 200 * pitch;
    osc.frequency.setValueAtTime(baseFreq, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, time + 0.25);
    tomGain.gain.setValueAtTime(0, time);
    tomGain.gain.linearRampToValueAtTime(intensity * 0.7, time + 0.01);
    tomGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(tomGain);
    tomGain.connect(gainNode);
    osc.start(time);
    osc.stop(time + 0.35);
  }
}

export class BassSynthesizer {
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  playNote(frequency: number, time: number, duration: number, gainNode: GainNode, intensity: number = 1) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const bassGain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.value = frequency;
    osc2.type = 'square';
    osc2.frequency.value = frequency * 2;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(400, time + duration * 0.5);
    filter.Q.value = 2;

    bassGain.gain.setValueAtTime(0, time);
    bassGain.gain.linearRampToValueAtTime(intensity * 0.5, time + 0.02);
    bassGain.gain.setValueAtTime(intensity * 0.5, time + duration * 0.7);
    bassGain.gain.linearRampToValueAtTime(0, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(gainNode);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.05);
    osc2.stop(time + duration + 0.05);
  }

  playSlide(fromFreq: number, toFreq: number, time: number, duration: number, gainNode: GainNode, intensity: number = 1) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const bassGain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(fromFreq, time);
    osc.frequency.linearRampToValueAtTime(toFreq, time + duration);

    filter.type = 'lowpass';
    filter.frequency.value = 600;

    bassGain.gain.setValueAtTime(0, time);
    bassGain.gain.linearRampToValueAtTime(intensity * 0.4, time + 0.03);
    bassGain.gain.linearRampToValueAtTime(0, time + duration);

    osc.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(gainNode);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }
}

export class GuitarSynthesizer {
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  playNote(frequency: number, time: number, duration: number, gainNode: GainNode, intensity: number = 1) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const guitarGain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = frequency;

    filter.type = 'bandpass';
    filter.frequency.value = frequency * 2;
    filter.Q.value = 1.5;

    const attack = 0.005;
    const decay = 0.1;
    const sustain = 0.4;
    const release = 0.3;

    guitarGain.gain.setValueAtTime(0, time);
    guitarGain.gain.linearRampToValueAtTime(intensity * 0.6, time + attack);
    guitarGain.gain.linearRampToValueAtTime(intensity * sustain * 0.6, time + attack + decay);
    guitarGain.gain.setValueAtTime(intensity * sustain * 0.6, time + duration - release);
    guitarGain.gain.linearRampToValueAtTime(0, time + duration);

    osc.connect(filter);
    filter.connect(guitarGain);
    guitarGain.connect(gainNode);

    osc.start(time);
    osc.stop(time + duration + 0.1);
  }

  playChord(frequencies: number[], time: number, duration: number, gainNode: GainNode, intensity: number = 1) {
    const strumDelay = 0.025;
    frequencies.forEach((freq, i) => {
      this.playNote(freq, time + i * strumDelay, duration - i * strumDelay, gainNode, intensity * 0.6);
    });
  }
}

export class KeyboardSynthesizer {
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  playNote(frequency: number, time: number, duration: number, gainNode: GainNode, intensity: number = 1) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const keyGain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.value = frequency;
    osc2.type = 'triangle';
    osc2.frequency.value = frequency * 1.005;

    lfo.type = 'sine';
    lfo.frequency.value = 5;
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    filter.type = 'lowpass';
    filter.frequency.value = frequency * 3;
    filter.Q.value = 1;

    const attack = 0.02;
    const decay = 0.1;
    const sustain = 0.7;
    const release = 0.2;

    keyGain.gain.setValueAtTime(0, time);
    keyGain.gain.linearRampToValueAtTime(intensity * 0.4, time + attack);
    keyGain.gain.linearRampToValueAtTime(intensity * sustain * 0.4, time + attack + decay);
    keyGain.gain.setValueAtTime(intensity * sustain * 0.4, time + duration - release);
    keyGain.gain.linearRampToValueAtTime(0, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(keyGain);
    keyGain.connect(gainNode);

    osc1.start(time);
    osc2.start(time);
    lfo.start(time);
    osc1.stop(time + duration + 0.1);
    osc2.stop(time + duration + 0.1);
    lfo.stop(time + duration + 0.1);
  }

  playChord(frequencies: number[], time: number, duration: number, gainNode: GainNode, intensity: number = 1) {
    frequencies.forEach(freq => {
      this.playNote(freq, time, duration, gainNode, intensity / frequencies.length);
    });
  }
}

export function getScaleNotes(rootNote: string, scaleType: string, octave: number): number[] {
  const intervals = SCALE_INTERVALS[scaleType] || SCALE_INTERVALS.major;
  return intervals.map(interval => getNoteFrequency(rootNote, octave, interval));
}

export function getChordNotes(rootNote: string, chordType: string, octave: number): number[] {
  return getChordFrequencies(rootNote, chordType, octave);
}

export { getNoteFrequency, getChordFrequencies };
