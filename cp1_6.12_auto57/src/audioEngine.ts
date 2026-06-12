export type InstrumentType = 'piano' | 'drum' | 'guitar';
export type DrumType = 'kick' | 'snare' | 'tom1' | 'tom2' | 'hihat' | 'crash';

export interface NoteEvent {
  instrument: InstrumentType;
  note: string | DrumType;
  velocity?: number;
  stringIndex?: number;
  fretIndex?: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function noteToFrequency(note: string): number {
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return 440;
  const [, name, octaveStr] = match;
  const octave = parseInt(octaveStr);
  const semitone = NOTE_NAMES.indexOf(name);
  if (semitone === -1) return 440;
  const midiNote = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeOscillators: Map<string, { osc: OscillatorNode; gain: GainNode }> = new Map();
  private activeDrumNodes: Set<AudioNode> = new Set();

  init() {
    if (this.audioContext) return;
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.audioContext.destination);
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  getContext(): AudioContext | null {
    return this.audioContext;
  }

  private ensureContext(): AudioContext {
    if (!this.audioContext || !this.masterGain) {
      throw new Error('Audio engine not initialized');
    }
    return this.audioContext;
  }

  playNote(instrument: InstrumentType, note: string | DrumType, options?: { velocity?: number; stringIndex?: number; fretIndex?: number }): void {
    this.init();
    this.resume();
    const ctx = this.ensureContext();

    if (instrument === 'piano') {
      this.playPianoNote(note as string, options?.velocity);
    } else if (instrument === 'drum') {
      this.playDrumSound(note as DrumType, options?.velocity);
    } else if (instrument === 'guitar') {
      this.playGuitarNote(note as string, options?.stringIndex, options?.fretIndex, options?.velocity);
    }
  }

  stopNote(note?: string): void {
    if (note) {
      const key = `piano_${note}`;
      const entry = this.activeOscillators.get(key);
      if (entry) {
        const { osc, gain } = entry;
        const now = this.audioContext!.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.stop(now + 0.3);
        this.activeOscillators.delete(key);
      }
    }
  }

  stopAllNotes(): void {
    this.activeOscillators.forEach(({ osc, gain }) => {
      const now = this.audioContext!.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.stop(now + 0.2);
    });
    this.activeOscillators.clear();
  }

  private playPianoNote(note: string, velocity: number = 0.7): void {
    const ctx = this.ensureContext()!;
    const freq = noteToFrequency(note);
    const key = `piano_${note}`;

    if (this.activeOscillators.has(key)) {
      this.stopNote(note);
    }

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.value = freq;
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;

    filter.type = 'lowpass';
    filter.frequency.value = 3000;
    filter.Q.value = 1;

    const masterOscGain = ctx.createGain();
    masterOscGain.gain.value = velocity * 0.5;

    osc1.connect(masterOscGain);
    osc2.connect(masterOscGain);
    masterOscGain.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain!);

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.5);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2);
    osc2.stop(now + 2);

    this.activeOscillators.set(key, { osc: osc1, gain: gainNode });

    setTimeout(() => {
      if (this.activeOscillators.get(key)?.osc === osc1) {
        this.activeOscillators.delete(key);
      }
    }, 2000);
  }

  private playDrumSound(drumType: DrumType, velocity: number = 0.8): void {
    const ctx = this.ensureContext()!;
    const now = ctx.currentTime;

    switch (drumType) {
      case 'kick':
        this.createKick(ctx, now, velocity);
        break;
      case 'snare':
        this.createSnare(ctx, now, velocity);
        break;
      case 'tom1':
        this.createTom(ctx, now, velocity, 200, 0.3);
        break;
      case 'tom2':
        this.createTom(ctx, now, velocity, 150, 0.4);
        break;
      case 'hihat':
        this.createHiHat(ctx, now, velocity);
        break;
      case 'crash':
        this.createCrash(ctx, now, velocity);
        break;
    }
  }

  private createKick(ctx: AudioContext, now: number, velocity: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(velocity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.3);

    this.activeDrumNodes.add(osc);
    setTimeout(() => this.activeDrumNodes.delete(osc), 300);
  }

  private createSnare(ctx: AudioContext, now: number, velocity: number): void {
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(velocity * 0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 0.2);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    oscGain.gain.setValueAtTime(velocity * 0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.1);

    this.activeDrumNodes.add(noise);
    setTimeout(() => this.activeDrumNodes.delete(noise), 200);
  }

  private createTom(ctx: AudioContext, now: number, velocity: number, baseFreq: number, duration: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, now + duration * 0.5);

    gain.gain.setValueAtTime(velocity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + duration);

    this.activeDrumNodes.add(osc);
    setTimeout(() => this.activeDrumNodes.delete(osc), duration * 1000);
  }

  private createHiHat(ctx: AudioContext, now: number, velocity: number): void {
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 0.08);

    this.activeDrumNodes.add(noise);
    setTimeout(() => this.activeDrumNodes.delete(noise), 80);
  }

  private createCrash(ctx: AudioContext, now: number, velocity: number): void {
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.5));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 8000;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 1.5);

    this.activeDrumNodes.add(noise);
    setTimeout(() => this.activeDrumNodes.delete(noise), 1500);
  }

  private playGuitarNote(note: string, stringIndex?: number, fretIndex?: number, velocity: number = 0.6): void {
    const ctx = this.ensureContext()!;
    const freq = noteToFrequency(note);
    const now = ctx.currentTime;

    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.05;

    const feedback = ctx.createGain();
    feedback.gain.value = 0.4;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(velocity, now + 0.005);
    mainGain.gain.exponentialRampToValueAtTime(velocity * 0.5, now + 0.3);
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + 3);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = freq;

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.3;

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);

    filter.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(mainGain);
    filter.connect(mainGain);

    mainGain.connect(this.masterGain!);

    const harmonicOsc = ctx.createOscillator();
    const harmonicGain = ctx.createGain();
    harmonicOsc.type = 'sine';
    harmonicOsc.frequency.value = freq * 3;
    harmonicGain.gain.setValueAtTime(velocity * 0.1, now);
    harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + 1);
    harmonicOsc.connect(harmonicGain);
    harmonicGain.connect(this.masterGain!);
    harmonicOsc.start(now);
    harmonicOsc.stop(now + 1);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 3);
    osc2.stop(now + 3);

    const key = `guitar_${stringIndex}_${fretIndex}`;
    this.activeOscillators.set(key, { osc: osc1, gain: mainGain });
    setTimeout(() => {
      this.activeOscillators.delete(key);
    }, 3000);
  }

  setMasterVolume(value: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = value;
    }
  }
}

export const audioEngine = new AudioEngine();
export { noteToFrequency };
