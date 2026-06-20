import type { InstrumentType, IAudioEngine } from '@/types';

interface ActiveNote {
  oscillators: OscillatorNode[];
  extraSources: AudioScheduledSourceNode[];
  gainNode: GainNode;
  filterNode?: BiquadFilterNode;
  trackId: string;
  note: number;
  startTime: number;
}

interface Track {
  id: string;
  type: InstrumentType;
  gainNode: GainNode;
  pannerNode: StereoPannerNode;
}

const MAX_VOICES = 32;
const ANALYSER_FFT_SIZE = 2048;
const NOTE_FREQUENCIES: number[] = [];

for (let i = 0; i < 128; i++) {
  NOTE_FREQUENCIES[i] = 440 * Math.pow(2, (i - 69) / 12);
}

export class AudioEngine implements IAudioEngine {
  private static instance: AudioEngine | null = null;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private tracks: Map<string, Track> = new Map();
  private activeNotes: Map<string, ActiveNote> = new Map();
  private voiceCount: number = 0;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      latencyHint: 'interactive',
    });

    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = ANALYSER_FFT_SIZE;

    this.destination = this.audioContext.createMediaStreamDestination();

    const trackConfigs: Array<{ id: string; type: InstrumentType }> = [
      { id: 'piano', type: 'piano' },
      { id: 'epiano', type: 'epiano' },
      { id: 'strings', type: 'strings' },
      { id: 'drums', type: 'drums' },
      { id: 'synth-lead', type: 'synth-lead' },
      { id: 'synth-pad', type: 'synth-pad' },
    ];

    for (const config of trackConfigs) {
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.7;

      const pannerNode = this.audioContext.createStereoPanner();
      pannerNode.pan.value = 0;

      gainNode.connect(pannerNode);
      pannerNode.connect(this.masterGain);

      this.tracks.set(config.id, {
        id: config.id,
        type: config.type,
        gainNode,
        pannerNode,
      });
    }

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    this.masterGain.connect(this.destination);

    this.initialized = true;
  }

  public playNote(trackId: string, note: number, velocity: number = 0.8): void {
    if (!this.initialized || !this.audioContext || !this.masterGain) return;

    if (this.voiceCount >= MAX_VOICES) {
      this.stopOldestNote();
    }

    const track = this.tracks.get(trackId);
    if (!track) return;

    const noteKey = `${trackId}-${note}`;
    if (this.activeNotes.has(noteKey)) {
      this.stopNote(trackId, note);
    }

    const frequency = NOTE_FREQUENCIES[note] || 440;
    const now = this.audioContext.currentTime;

    const { oscillators, extraSources, gainNode, filterNode } = this.createInstrument(
      track.type,
      frequency,
      velocity,
      now
    );

    for (const osc of oscillators) {
      osc.start(now);
    }

    if (filterNode) {
      gainNode.connect(filterNode);
      filterNode.connect(track.gainNode);
    } else {
      gainNode.connect(track.gainNode);
    }

    this.activeNotes.set(noteKey, {
      oscillators,
      extraSources,
      gainNode,
      filterNode,
      trackId,
      note,
      startTime: now,
    });

    this.voiceCount++;
  }

  public stopNote(trackId: string, note: number): void {
    if (!this.initialized || !this.audioContext) return;

    const noteKey = `${trackId}-${note}`;
    const activeNote = this.activeNotes.get(noteKey);
    if (!activeNote) return;

    const now = this.audioContext.currentTime;
    const track = this.tracks.get(trackId);

    let releaseTime = 0.1;
    if (track?.type === 'strings') releaseTime = 1.5;
    if (track?.type === 'synth-pad') releaseTime = 2.0;
    if (track?.type === 'piano') releaseTime = 0.3;
    if (track?.type === 'epiano') releaseTime = 0.15;
    if (track?.type === 'synth-lead') releaseTime = 0.2;
    if (track?.type === 'drums') releaseTime = 0.05;

    activeNote.gainNode.gain.cancelScheduledValues(now);
    activeNote.gainNode.gain.setValueAtTime(activeNote.gainNode.gain.value, now);
    activeNote.gainNode.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);

    const stopTime = now + releaseTime + 0.05;
    for (const osc of activeNote.oscillators) {
      osc.stop(stopTime);
    }
    for (const source of activeNote.extraSources) {
      source.stop(stopTime);
    }

    setTimeout(() => {
      for (const osc of activeNote.oscillators) {
        osc.disconnect();
      }
      for (const source of activeNote.extraSources) {
        source.disconnect();
      }
      activeNote.gainNode.disconnect();
      if (activeNote.filterNode) {
        activeNote.filterNode.disconnect();
      }
    }, (releaseTime + 0.1) * 1000);

    this.activeNotes.delete(noteKey);
    this.voiceCount = Math.max(0, this.voiceCount - 1);
  }

  public setVolume(trackId: string, value: number): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.gainNode.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  public setPan(trackId: string, value: number): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.pannerNode.pan.value = Math.max(-1, Math.min(1, value));
    }
  }

  public setMasterVolume(value: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  public getTimeDomainData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(ANALYSER_FFT_SIZE);
    const buffer = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(buffer);
    return buffer;
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(ANALYSER_FFT_SIZE / 2);
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(buffer);
    return buffer;
  }

  public getDestination(): MediaStreamAudioDestinationNode {
    if (!this.destination || !this.initialized) {
      throw new Error('AudioEngine not initialized');
    }
    return this.destination;
  }

  public destroy(): void {
    if (!this.initialized || !this.audioContext) return;

    for (const noteKey of this.activeNotes.keys()) {
      const [trackId, noteStr] = noteKey.split('-');
      this.stopNote(trackId, parseInt(noteStr, 10));
    }

    for (const track of this.tracks.values()) {
      track.gainNode.disconnect();
      track.pannerNode.disconnect();
    }

    if (this.masterGain) this.masterGain.disconnect();
    if (this.analyser) this.analyser.disconnect();
    if (this.destination) this.destination.disconnect();

    this.audioContext.close();
    this.audioContext = null;
    this.masterGain = null;
    this.analyser = null;
    this.destination = null;
    this.tracks.clear();
    this.activeNotes.clear();
    this.voiceCount = 0;
    this.initialized = false;
  }

  private createInstrument(
    type: InstrumentType,
    frequency: number,
    velocity: number,
    now: number
  ): {
    oscillators: OscillatorNode[];
    extraSources: AudioScheduledSourceNode[];
    gainNode: GainNode;
    filterNode?: BiquadFilterNode;
  } {
    if (!this.audioContext) {
      return { oscillators: [], extraSources: [], gainNode: {} as GainNode };
    }

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;

    let oscillators: OscillatorNode[] = [];
    let extraSources: AudioScheduledSourceNode[] = [];
    let filterNode: BiquadFilterNode | undefined;

    switch (type) {
      case 'piano': {
        const osc1 = this.audioContext.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = frequency;

        const osc2 = this.audioContext.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = frequency * 2;

        const osc3 = this.audioContext.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.value = frequency * 3;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(velocity * 0.8, now + 0.005);
        gainNode.gain.linearRampToValueAtTime(velocity * 0.6, now + 0.08);
        gainNode.gain.linearRampToValueAtTime(velocity * 0.4, now + 0.3);

        const osc2Gain = this.audioContext.createGain();
        osc2Gain.gain.value = 0.2;
        osc2.connect(osc2Gain);
        osc2Gain.connect(gainNode);

        const osc3Gain = this.audioContext.createGain();
        osc3Gain.gain.value = 0.1;
        osc3.connect(osc3Gain);
        osc3Gain.connect(gainNode);

        osc1.connect(gainNode);

        oscillators = [osc1, osc2, osc3];
        break;
      }

      case 'epiano': {
        const osc1 = this.audioContext.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.value = frequency;

        const osc2 = this.audioContext.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = frequency * 4;

        filterNode = this.audioContext.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.value = 3000;
        filterNode.Q.value = 0.5;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(velocity * 0.9, now + 0.003);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        const osc2Gain = this.audioContext.createGain();
        osc2Gain.gain.value = 0.15;
        osc2.connect(osc2Gain);
        osc2Gain.connect(gainNode);

        osc1.connect(gainNode);

        oscillators = [osc1, osc2];
        break;
      }

      case 'strings': {
        const detunes = [-5, -3, 0, 2, 4];
        for (const detune of detunes) {
          const osc = this.audioContext.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.value = frequency;
          osc.detune.value = detune;
          osc.connect(gainNode);
          oscillators.push(osc);
        }

        filterNode = this.audioContext.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.value = 2000;
        filterNode.Q.value = 0.8;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(velocity * 0.7, now + 0.3);
        gainNode.gain.linearRampToValueAtTime(velocity * 0.6, now + 0.6);
        break;
      }

      case 'drums': {
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;

        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency * 2, now);
        osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, now + 0.1);

        filterNode = this.audioContext.createBiquadFilter();
        filterNode.type = 'bandpass';
        filterNode.frequency.value = frequency * 3;
        filterNode.Q.value = 2;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(velocity, now + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.value = 0.3;
        noise.connect(filterNode);
        filterNode.connect(noiseGain);
        noiseGain.connect(gainNode);

        osc.connect(gainNode);

        noise.start(now);
        noise.stop(now + 0.3);

        oscillators = [osc];
        extraSources = [noise];
        break;
      }

      case 'synth-lead': {
        const osc1 = this.audioContext.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.value = frequency;

        const osc2 = this.audioContext.createOscillator();
        osc2.type = 'square';
        osc2.frequency.value = frequency * 2;

        filterNode = this.audioContext.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.value = 4000;
        filterNode.Q.value = 1.5;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(velocity * 0.85, now + 0.008);
        gainNode.gain.linearRampToValueAtTime(velocity * 0.7, now + 0.1);

        const osc2Gain = this.audioContext.createGain();
        osc2Gain.gain.value = 0.25;
        osc2.connect(osc2Gain);
        osc2Gain.connect(gainNode);

        osc1.connect(gainNode);

        oscillators = [osc1, osc2];
        break;
      }

      case 'synth-pad': {
        const freqs = [frequency * 0.5, frequency, frequency * 1.5, frequency * 2];
        for (let i = 0; i < freqs.length; i++) {
          const osc = this.audioContext.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freqs[i];
          osc.detune.value = (i - 1.5) * 3;
          osc.connect(gainNode);
          oscillators.push(osc);
        }

        const lfo = this.audioContext.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.5;

        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 0.1;
        lfo.connect(lfoGain);

        filterNode = this.audioContext.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.value = 2500;
        filterNode.Q.value = 0.5;
        lfoGain.connect(filterNode.frequency);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(velocity * 0.6, now + 0.8);
        gainNode.gain.linearRampToValueAtTime(velocity * 0.5, now + 1.5);

        lfo.start(now);

        extraSources = [lfo];
        break;
      }
    }

    return { oscillators, extraSources, gainNode, filterNode };
  }

  private stopOldestNote(): void {
    if (this.activeNotes.size === 0) return;

    let oldestKey: string | null = null;
    let oldestTime: number = Infinity;

    for (const [key, note] of this.activeNotes.entries()) {
      if (note.startTime < oldestTime) {
        oldestTime = note.startTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const [trackId, noteStr] = oldestKey.split('-');
      this.stopNote(trackId, parseInt(noteStr, 10));
    }
  }
}
