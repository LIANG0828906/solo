import type { Track } from '../store';

type WaveformType = Track['waveform'];

export interface ActiveNote {
  midiNumber: number;
  velocity: number;
  trackId: string;
}

interface TrackAudioNodes {
  oscillator: OscillatorNode;
  gain: GainNode;
  panner: StereoPannerNode;
  distorter?: WaveShaperNode;
  delay?: DelayNode;
  delayFeedback?: GainNode;
  effectsChain?: AudioNode;
}

class AudioService {
  private static instance: AudioService;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private trackNodes: Map<string, TrackAudioNodes> = new Map();
  private currentActiveNotes: Set<string> = new Set();

  private constructor() {}

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  init(): void {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.audioContext.destination);
  }

  private ensureContext(): AudioContext {
    if (!this.audioContext || !this.masterGain) {
      this.init();
    }
    return this.audioContext!;
  }

  private createDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  private panFlatToNormalized(pan: number): number {
    return Math.max(-1, Math.min(1, pan / 100));
  }

  private setupTrackNodes(track: Track): TrackAudioNodes {
    const ctx = this.ensureContext();

    const oscillator = ctx.createOscillator();
    oscillator.type = track.waveform as OscillatorType;
    oscillator.frequency.value = 440;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    const panner = ctx.createStereoPanner();
    panner.pan.value = this.panFlatToNormalized(track.pan);

    oscillator.connect(gain);

    let lastNode: AudioNode = gain;

    if (track.effectsEnabled) {
      const distorter = ctx.createWaveShaper();
      distorter.curve = this.createDistortionCurve(20);
      distorter.oversample = '4x';

      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.25;

      const delayFeedback = ctx.createGain();
      delayFeedback.gain.value = 0.3;

      lastNode.connect(distorter);
      distorter.connect(panner);
      distorter.connect(delay);
      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      delay.connect(panner);

      return { oscillator, gain, panner, distorter, delay, delayFeedback, effectsChain: distorter };
    } else {
      lastNode.connect(panner);
    }

    panner.connect(this.masterGain!);

    oscillator.start();

    return { oscillator, gain, panner };
  }

  private getOrCreateTrackNodes(track: Track): TrackAudioNodes {
    let nodes = this.trackNodes.get(track.id);
    if (!nodes) {
      nodes = this.setupTrackNodes(track);
      this.trackNodes.set(track.id, nodes);
    }
    return nodes;
  }

  private midiToFrequency(midiNumber: number): number {
    return 440 * Math.pow(2, (midiNumber - 69) / 12);
  }

  private noteKey(trackId: string, midiNumber: number): string {
    return `${trackId}_${midiNumber}`;
  }

  renderFrame(_frame: number, activeNotes: ActiveNote[], tracks: Track[]): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const targetActiveKeys = new Set<string>();
    activeNotes.forEach((note) => {
      targetActiveKeys.add(this.noteKey(note.trackId, note.midiNumber));
    });

    const tracksById = new Map(tracks.map((t) => [t.id, t]));

    for (const note of activeNotes) {
      const track = tracksById.get(note.trackId);
      if (!track) continue;

      const nodes = this.getOrCreateTrackNodes(track);
      const freq = this.midiToFrequency(note.midiNumber);

      const volumeGain = (track.volume / 100) * (note.velocity / 127);

      if (Math.abs(nodes.oscillator.frequency.value - freq) > 0.5) {
        nodes.oscillator.frequency.setTargetAtTime(freq, now, 0.005);
      }

      nodes.gain.gain.setTargetAtTime(volumeGain, now, 0.01);
    }

    for (const [, nodes] of this.trackNodes) {
      const hasActiveNote = activeNotes.some((n) => {
        const hasIt = this.trackNodes.has(n.trackId);
        void hasIt;
        return true;
      });
      if (!hasActiveNote) {
        nodes.gain.gain.setTargetAtTime(0, now, 0.03);
      }
    }

    this.currentActiveNotes = targetActiveKeys;
  }

  updateTrackFromFlat(trackId: string, track: Partial<Track>): void {
    const nodes = this.trackNodes.get(trackId);
    if (!nodes) return;

    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    if (track.waveform !== undefined) {
      nodes.oscillator.type = track.waveform as OscillatorType;
    }

    if (track.pan !== undefined) {
      nodes.panner.pan.setTargetAtTime(this.panFlatToNormalized(track.pan), now, 0.01);
    }

    if (track.effectsEnabled !== undefined) {
      this.rebuildTrackEffects(trackId, track.effectsEnabled);
    }
  }

  private rebuildTrackEffects(trackId: string, effectsEnabled: boolean): void {
    const nodes = this.trackNodes.get(trackId);
    if (!nodes || !this.masterGain) return;

    const ctx = this.ensureContext();

    try {
      nodes.oscillator.disconnect();
      nodes.gain.disconnect();
      nodes.panner.disconnect();
      if (nodes.distorter) nodes.distorter.disconnect();
      if (nodes.delay) nodes.delay.disconnect();
      if (nodes.delayFeedback) nodes.delayFeedback.disconnect();
    } catch {
      // ignore disconnect errors
    }

    nodes.oscillator.connect(nodes.gain);
    let lastNode: AudioNode = nodes.gain;

    if (effectsEnabled) {
      const distorter = ctx.createWaveShaper();
      distorter.curve = this.createDistortionCurve(20);
      distorter.oversample = '4x';

      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.25;

      const delayFeedback = ctx.createGain();
      delayFeedback.gain.value = 0.3;

      lastNode.connect(distorter);
      distorter.connect(nodes.panner);
      distorter.connect(delay);
      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      delay.connect(nodes.panner);

      nodes.distorter = distorter;
      nodes.delay = delay;
      nodes.delayFeedback = delayFeedback;
      nodes.effectsChain = distorter;
    } else {
      lastNode.connect(nodes.panner);
      nodes.distorter = undefined;
      nodes.delay = undefined;
      nodes.delayFeedback = undefined;
      nodes.effectsChain = undefined;
    }

    nodes.panner.connect(this.masterGain);
  }

  stopAll(): void {
    const ctx = this.audioContext;
    if (!ctx) return;

    const now = ctx.currentTime;
    for (const nodes of this.trackNodes.values()) {
      nodes.gain.gain.setTargetAtTime(0, now, 0.03);
    }
    this.currentActiveNotes.clear();
  }

  dispose(): void {
    for (const nodes of this.trackNodes.values()) {
      try {
        nodes.oscillator.stop();
        nodes.oscillator.disconnect();
        nodes.gain.disconnect();
        nodes.panner.disconnect();
        if (nodes.distorter) nodes.distorter.disconnect();
        if (nodes.delay) nodes.delay.disconnect();
        if (nodes.delayFeedback) nodes.delayFeedback.disconnect();
      } catch {
        // ignore
      }
    }
    this.trackNodes.clear();
    this.currentActiveNotes.clear();

    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  resume(): Promise<void> | undefined {
    return this.audioContext?.resume();
  }

  getWaveformType(type: WaveformType): OscillatorType {
    return type as OscillatorType;
  }
}

export const audioService = AudioService.getInstance();
