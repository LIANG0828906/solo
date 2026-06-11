export enum Instrument {
  BIANZHONG = 'bianzhong',
  BIANQING = 'bianqing',
  GUQIN = 'guqin',
  XIAO = 'xiao'
}

export const BIANZHONG_MIDI: number[] = [
  48, 50, 52, 53, 55, 57, 59, 60,
  62, 64, 65, 67, 69, 71, 72, 74,
  76, 77, 79, 81, 83, 84, 86, 88,
  36, 38, 40, 43, 45, 49, 51, 54
];

export const BIANQING_MIDI: number[] = [
  60, 62, 64, 67, 69, 72, 74, 76,
  48, 50, 52, 55, 57, 67, 69, 72
];

export const GUQIN_MIDI: number[] = [
  55, 57, 59, 60, 62, 64, 67
];

export const XIAO_MIDI: number[] = [
  60, 62, 64, 67, 69, 72
];

export const BIANZHONG_KEY_MAP: Record<string, number> = {
  'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6, 'h': 7,
  'i': 8, 'j': 9, 'k': 10, 'l': 11, 'm': 12, 'n': 13, 'o': 14, 'p': 15,
  'q': 16, 'r': 17, 's': 18, 't': 19, 'u': 20, 'v': 21, 'w': 22, 'x': 23
};

export const BIANQING_KEY_MAP: Record<string, number> = {
  '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7,
  '!': 8, '@': 9, '#': 10, '$': 11, '%': 12, '^': 13, '&': 14, '*': 15
};

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

interface ActiveNote {
  oscillators: OscillatorNode[];
  gainNode: GainNode;
  startTime: number;
}

export class AudioController {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private instrumentGains: Map<Instrument, GainNode>;
  private instrumentAnalysers: Map<Instrument, AnalyserNode>;
  private totalAnalyser: AnalyserNode;
  private activeNotes: Map<string, ActiveNote>;
  private noiseBuffer: AudioBuffer;

  constructor() {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.6;
    this.masterGain.connect(this.ctx.destination);

    this.instrumentGains = new Map();
    this.instrumentAnalysers = new Map();
    this.activeNotes = new Map();

    const instruments = [Instrument.BIANZHONG, Instrument.BIANQING, Instrument.GUQIN, Instrument.XIAO];
    for (const inst of instruments) {
      const gain = this.ctx.createGain();
      gain.gain.value = 1.0;
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 2048;
      gain.connect(analyser);
      analyser.connect(this.masterGain);
      this.instrumentGains.set(inst, gain);
      this.instrumentAnalysers.set(inst, analyser);
    }

    this.totalAnalyser = this.ctx.createAnalyser();
    this.totalAnalyser.fftSize = 2048;
    this.masterGain.connect(this.totalAnalyser);

    this.noiseBuffer = this.createNoiseBuffer();
  }

  private createNoiseBuffer(): AudioBuffer {
    const size = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  async resume(): Promise<void> {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  playBianzhong(noteIndex: number): void {
    if (noteIndex < 0 || noteIndex >= BIANZHONG_MIDI.length) return;
    const freq = midiToFreq(BIANZHONG_MIDI[noteIndex]);
    const now = this.ctx.currentTime;
    const key = `bz_${noteIndex}`;
    this.stopNoteKey(key);

    const gainNode = this.ctx.createGain();
    gainNode.connect(this.instrumentGains.get(Instrument.BIANZHONG)!);

    const oscillators: OscillatorNode[] = [];
    const partials = [1, 2.4, 3, 4.5, 6.7];
    const amplitudes = [1, 0.5, 0.35, 0.2, 0.1];

    for (let i = 0; i < partials.length; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * partials[i];
      const partialGain = this.ctx.createGain();
      partialGain.gain.value = amplitudes[i] * 0.25;
      osc.connect(partialGain);
      partialGain.connect(gainNode);
      osc.start(now);
      osc.stop(now + 2.0);
      oscillators.push(osc);
    }

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.8, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.3 * 0.8, now + 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    this.activeNotes.set(key, { oscillators, gainNode, startTime: now });
  }

  playBianqing(noteIndex: number): void {
    if (noteIndex < 0 || noteIndex >= BIANQING_MIDI.length) return;
    const freq = midiToFreq(BIANQING_MIDI[noteIndex]);
    const now = this.ctx.currentTime;
    const key = `bq_${noteIndex}`;
    this.stopNoteKey(key);

    const gainNode = this.ctx.createGain();
    gainNode.connect(this.instrumentGains.get(Instrument.BIANQING)!);

    const oscillators: OscillatorNode[] = [];
    const partials = [1, 3, 5, 7];
    const amplitudes = [1, 0.4, 0.2, 0.1];

    for (let i = 0; i < partials.length; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * partials[i];
      const partialGain = this.ctx.createGain();
      partialGain.gain.value = amplitudes[i] * 0.2;
      osc.connect(partialGain);
      partialGain.connect(gainNode);
      osc.start(now);
      osc.stop(now + 1.0);
      oscillators.push(osc);
    }

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.7, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.1 * 0.7, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    this.activeNotes.set(key, { oscillators, gainNode, startTime: now });
  }

  playGuqin(stringIndex: number): void {
    if (stringIndex < 0 || stringIndex >= GUQIN_MIDI.length) return;
    const freq = midiToFreq(GUQIN_MIDI[stringIndex]);
    const now = this.ctx.currentTime;
    const key = `gq_${stringIndex}`;
    this.stopNoteKey(key);

    const gainNode = this.ctx.createGain();
    gainNode.connect(this.instrumentGains.get(Instrument.GUQIN)!);

    const oscillators: OscillatorNode[] = [];

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq;
    const g1 = this.ctx.createGain();
    g1.gain.value = 0.3;
    osc1.connect(g1);
    g1.connect(gainNode);
    osc1.start(now);
    osc1.stop(now + 2.5);
    oscillators.push(osc1);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.08;
    osc2.connect(g2);
    g2.connect(gainNode);
    osc2.start(now);
    osc2.stop(now + 2.5);
    oscillators.push(osc2);

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    noiseSource.connect(noiseGain);
    noiseGain.connect(gainNode);
    noiseSource.start(now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.6, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    this.activeNotes.set(key, { oscillators, gainNode, startTime: now });
  }

  playXiao(holeIndex: number): void {
    if (holeIndex < 0 || holeIndex >= XIAO_MIDI.length) return;
    const freq = midiToFreq(XIAO_MIDI[holeIndex]);
    const now = this.ctx.currentTime;
    const key = `xo_${holeIndex}`;
    this.stopNoteKey(key);

    const gainNode = this.ctx.createGain();
    gainNode.connect(this.instrumentGains.get(Instrument.XIAO)!);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800;
    filter.Q.value = 1.5;
    filter.connect(gainNode);

    const oscillators: OscillatorNode[] = [];

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const oscGain = this.ctx.createGain();
    oscGain.gain.value = 0.12;
    osc.connect(oscGain);
    oscGain.connect(filter);
    osc.start(now);
    osc.stop(now + 2.0);
    oscillators.push(osc);

    const vibrato = this.ctx.createOscillator();
    vibrato.type = 'sine';
    vibrato.frequency.value = 5;
    const vibratoGain = this.ctx.createGain();
    vibratoGain.gain.value = 2;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    vibrato.start(now);
    vibrato.stop(now + 2.0);
    oscillators.push(vibrato);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.25, now + 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    this.activeNotes.set(key, { oscillators, gainNode, startTime: now });
  }

  playNoise(): void {
    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start(now);
  }

  private stopNoteKey(key: string): void {
    const note = this.activeNotes.get(key);
    if (note) {
      try {
        const now = this.ctx.currentTime;
        note.gainNode.gain.cancelScheduledValues(now);
        note.gainNode.gain.setValueAtTime(note.gainNode.gain.value, now);
        note.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        for (const osc of note.oscillators) {
          try { osc.stop(now + 0.06); } catch (_) { /* */ }
        }
      } catch (_) { /* */ }
      this.activeNotes.delete(key);
    }
  }

  setVolume(instrument: Instrument, value: number): void {
    const gain = this.instrumentGains.get(instrument);
    if (gain) {
      gain.gain.setValueAtTime(Math.max(0, Math.min(2.0, value)), this.ctx.currentTime);
    }
  }

  getWaveform(instrument: Instrument): Float32Array {
    const analyser = this.instrumentAnalysers.get(instrument);
    const data = new Float32Array(analyser ? analyser.fftSize : 2048);
    if (analyser) analyser.getFloatTimeDomainData(data);
    return data;
  }

  getTotalWaveform(): Float32Array {
    const data = new Float32Array(this.totalAnalyser.fftSize);
    this.totalAnalyser.getFloatTimeDomainData(data);
    return data;
  }

  getCurrentTime(): number {
    return this.ctx.currentTime;
  }

  getInstrumentLevel(instrument: Instrument): number {
    const analyser = this.instrumentAnalysers.get(instrument);
    if (!analyser) return 0;
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }
}
