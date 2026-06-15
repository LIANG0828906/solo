export type TrackType = 'kick' | 'snare' | 'hihat' | 'clap' | 'bass' | 'synth' | 'pad' | 'lead';

export type OscillatorType = 'sine' | 'sawtooth' | 'square' | 'triangle';

export type NoiseType = 'white' | 'pink';

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  pattern: boolean[];
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  soundParams: Record<string, number | string>;
  color: string;
}

interface TrackNode {
  gainNode: GainNode;
  pannerNode: StereoPannerNode;
}

interface ActiveVoice {
  oscillator?: OscillatorNode;
  gainNode?: GainNode;
  filterNode?: BiquadFilterNode;
  noiseSource?: AudioBufferSourceNode;
  noiseGain?: GainNode;
}

const STEPS_PER_BAR = 16;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.1;

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tracks: Map<string, Track> = new Map();
  private trackNodes: Map<string, TrackNode> = new Map();
  private activeVoices: Map<string, ActiveVoice[]> = new Map();
  private bpm: number = 120;
  private currentStep: number = 0;
  private isPlaying: boolean = false;
  private nextStepTime: number = 0;
  private currentStepCallback: ((step: number) => void) | null = null;
  private timerId: number | null = null;
  private masterVolumeDb: number = 0;

  constructor() {}

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.dbToLinear(this.masterVolumeDb);
      this.masterGain.connect(this.audioContext.destination);
    }
    return this.audioContext;
  }

  private dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }

  private getStepDuration(): number {
    return 60.0 / this.bpm / 4;
  }

  setTracks(tracks: Track[]): void {
    const ctx = this.getContext();
    const newTrackNodes: Map<string, TrackNode> = new Map();

    for (const track of tracks) {
      let nodes = this.trackNodes.get(track.id);
      if (!nodes) {
        const gainNode = ctx.createGain();
        const pannerNode = ctx.createStereoPanner();
        gainNode.connect(pannerNode);
        pannerNode.connect(this.masterGain!);
        nodes = { gainNode, pannerNode };
      }

      nodes.gainNode.gain.value = track.muted ? 0 : this.dbToLinear(track.volume);
      nodes.pannerNode.pan.value = track.pan;

      newTrackNodes.set(track.id, nodes);
      this.tracks.set(track.id, track);

      if (!this.activeVoices.has(track.id)) {
        this.activeVoices.set(track.id, []);
      }
    }

    for (const [id, nodes] of this.trackNodes) {
      if (!newTrackNodes.has(id)) {
        this.stopTrackVoices(id);
        nodes.gainNode.disconnect();
        nodes.pannerNode.disconnect();
      }
    }

    this.trackNodes = newTrackNodes;
  }

  setBpm(bpm: number): void {
    this.bpm = Math.max(20, Math.min(300, bpm));
  }

  setMasterVolume(db: number): void {
    this.masterVolumeDb = Math.max(-60, Math.min(6, db));
    if (this.masterGain) {
      this.masterGain.gain.value = this.dbToLinear(this.masterVolumeDb);
    }
  }

  getMasterVolume(): number {
    return this.masterVolumeDb;
  }

  setCurrentStepCallback(callback: (step: number) => void): void {
    this.currentStepCallback = callback;
  }

  updateTrackParam(trackId: string, param: string, value: number | string): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    if (param === 'volume') {
      track.volume = value as number;
      const nodes = this.trackNodes.get(trackId);
      if (nodes && !track.muted) {
        nodes.gainNode.gain.value = this.dbToLinear(value as number);
      }
    } else if (param === 'pan') {
      track.pan = value as number;
      const nodes = this.trackNodes.get(trackId);
      if (nodes) {
        nodes.pannerNode.pan.value = value as number;
      }
    } else if (param === 'muted') {
      track.muted = value as boolean;
      const nodes = this.trackNodes.get(trackId);
      if (nodes) {
        nodes.gainNode.gain.value = track.muted ? 0 : this.dbToLinear(track.volume);
      }
    } else if (param === 'solo') {
      track.solo = value as boolean;
      this.updateSoloMix();
    } else if (param === 'pattern') {
      track.pattern = value as boolean[];
    } else {
      track.soundParams[param] = value;
    }
  }

  private updateSoloMix(): void {
    const hasSolo = Array.from(this.tracks.values()).some(t => t.solo);

    for (const [id, track] of this.tracks) {
      const nodes = this.trackNodes.get(id);
      if (!nodes) continue;

      if (track.muted) {
        nodes.gainNode.gain.value = 0;
      } else if (hasSolo && !track.solo) {
        nodes.gainNode.gain.value = 0;
      } else {
        nodes.gainNode.gain.value = this.dbToLinear(track.volume);
      }
    }
  }

  start(): void {
    if (this.isPlaying) return;

    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    this.isPlaying = true;
    this.nextStepTime = ctx.currentTime + 0.1;
    this.scheduler();
  }

  stop(): void {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.currentStep = 0;
    this.stopAllVoices();
  }

  private scheduler(): void {
    if (!this.isPlaying || !this.audioContext) return;

    while (this.nextStepTime < this.audioContext.currentTime + SCHEDULE_AHEAD_SECONDS) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += this.getStepDuration();
      this.currentStep = (this.currentStep + 1) % STEPS_PER_BAR;
    }

    this.timerId = window.setTimeout(() => this.scheduler(), LOOKAHEAD_MS);
  }

  playStep(step: number): void {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    this.scheduleStep(step, ctx.currentTime + 0.05);
  }

  private scheduleStep(step: number, time: number): void {
    if (this.currentStepCallback) {
      const scheduleDelay = time - this.audioContext!.currentTime;
      const stepIndex = step;
      setTimeout(() => {
        if (this.currentStepCallback) {
          this.currentStepCallback(stepIndex);
        }
      }, Math.max(0, scheduleDelay * 1000));
    }

    for (const [trackId, track] of this.tracks) {
      if (track.pattern[step]) {
        this.triggerTrack(trackId, time);
      }
    }
  }

  private triggerTrack(trackId: string, time: number): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    switch (track.type) {
      case 'kick':
        this.triggerKick(trackId, track, time);
        break;
      case 'snare':
        this.triggerSnare(trackId, track, time);
        break;
      case 'hihat':
        this.triggerHiHat(trackId, track, time);
        break;
      case 'clap':
        this.triggerClap(trackId, track, time);
        break;
      case 'bass':
        this.triggerBass(trackId, track, time);
        break;
      case 'synth':
        this.triggerSynth(trackId, track, time);
        break;
      case 'pad':
        this.triggerPad(trackId, track, time);
        break;
      case 'lead':
        this.triggerLead(trackId, track, time);
        break;
    }
  }

  private createNoiseBuffer(type: NoiseType): AudioBuffer {
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }

    return buffer;
  }

  private triggerKick(trackId: string, track: Track, time: number): void {
    const ctx = this.getContext();
    const trackNode = this.trackNodes.get(trackId);
    if (!trackNode) return;

    const baseFreq = (track.soundParams.baseFreq as number) || 60;
    const decay = (track.soundParams.decay as number) || 0.5;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 2, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.01);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, time + decay);

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(1, time + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + decay);

    osc.connect(gainNode);
    gainNode.connect(trackNode.gainNode);

    osc.start(time);
    osc.stop(time + decay + 0.05);

    this.addVoice(trackId, { oscillator: osc, gainNode });

    osc.onended = () => {
      gainNode.disconnect();
      this.removeVoice(trackId, osc);
    };
  }

  private triggerSnare(trackId: string, track: Track, time: number): void {
    const ctx = this.getContext();
    const trackNode = this.trackNodes.get(trackId);
    if (!trackNode) return;

    const toneFreq = (track.soundParams.toneFreq as number) || 200;
    const noiseGain = (track.soundParams.noiseGain as number) || 0.5;
    const decay = (track.soundParams.decay as number) || 0.2;

    const noiseBuffer = this.createNoiseBuffer('white');
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseGainNode = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    noiseGainNode.gain.setValueAtTime(0, time);
    noiseGainNode.gain.linearRampToValueAtTime(noiseGain, time + 0.001);
    noiseGainNode.gain.exponentialRampToValueAtTime(0.001, time + decay);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGainNode);
    noiseGainNode.connect(trackNode.gainNode);

    const toneOsc = ctx.createOscillator();
    const toneGain = ctx.createGain();
    toneOsc.type = 'triangle';
    toneOsc.frequency.value = toneFreq;

    toneGain.gain.setValueAtTime(0, time);
    toneGain.gain.linearRampToValueAtTime(0.8, time + 0.001);
    toneGain.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.5);

    toneOsc.connect(toneGain);
    toneGain.connect(trackNode.gainNode);

    noiseSource.start(time);
    noiseSource.stop(time + decay + 0.05);
    toneOsc.start(time);
    toneOsc.stop(time + decay * 0.5 + 0.05);

    this.addVoice(trackId, { oscillator: toneOsc, gainNode: toneGain, noiseSource, noiseGain: noiseGainNode });

    noiseSource.onended = () => {
      noiseFilter.disconnect();
      noiseGainNode.disconnect();
    };
    toneOsc.onended = () => {
      toneGain.disconnect();
      this.removeVoice(trackId, toneOsc);
    };
  }

  private triggerHiHat(trackId: string, track: Track, time: number): void {
    const ctx = this.getContext();
    const trackNode = this.trackNodes.get(trackId);
    if (!trackNode) return;

    const noiseType = (track.soundParams.noiseType as NoiseType) || 'white';
    const decay = (track.soundParams.decay as number) || 0.05;
    const filterFreq = (track.soundParams.filterFreq as number) || 7000;

    const noiseBuffer = this.createNoiseBuffer(noiseType);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = filterFreq;
    bandpass.Q.value = 1;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = filterFreq * 0.5;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.5, time + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + decay);

    noiseSource.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(gainNode);
    gainNode.connect(trackNode.gainNode);

    noiseSource.start(time);
    noiseSource.stop(time + decay + 0.05);

    this.addVoice(trackId, { noiseSource, noiseGain: gainNode, filterNode: bandpass });

    noiseSource.onended = () => {
      bandpass.disconnect();
      highpass.disconnect();
      gainNode.disconnect();
    };
  }

  private triggerClap(trackId: string, track: Track, time: number): void {
    const ctx = this.getContext();
    const trackNode = this.trackNodes.get(trackId);
    if (!trackNode) return;

    const decay = (track.soundParams.decay as number) || 0.3;
    const noiseGainVal = (track.soundParams.noiseGain as number) || 0.6;

    const noiseBuffer = this.createNoiseBuffer('white');
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 0.5;

    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0, time);

    const clapTimes = [0, 0.01, 0.02, 0.04];
    const clapDecays = [0.05, 0.05, 0.06, decay];

    for (let i = 0; i < clapTimes.length; i++) {
      const clapTime = time + clapTimes[i];
      const clapDecay = clapDecays[i];
      const clapGain = ctx.createGain();

      clapGain.gain.setValueAtTime(0, clapTime);
      clapGain.gain.linearRampToValueAtTime(noiseGainVal * (1 - i * 0.15), clapTime + 0.001);
      clapGain.gain.exponentialRampToValueAtTime(0.001, clapTime + clapDecay);

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.connect(filter);
      filter.connect(clapGain);
      clapGain.connect(mainGain);

      noiseSource.start(clapTime);
      noiseSource.stop(clapTime + clapDecay + 0.05);

      this.addVoice(trackId, { noiseSource, noiseGain: clapGain });
    }

    mainGain.connect(trackNode.gainNode);
  }

  private triggerBass(trackId: string, track: Track, time: number): void {
    const ctx = this.getContext();
    const trackNode = this.trackNodes.get(trackId);
    if (!trackNode) return;

    const oscType = (track.soundParams.oscillatorType as OscillatorType) || 'sawtooth';
    const cutoff = (track.soundParams.cutoff as number) || 500;
    const resonance = (track.soundParams.resonance as number) || 1;
    const attack = (track.soundParams.attack as number) || 0.01;
    const release = (track.soundParams.release as number) || 0.1;

    const stepDuration = this.getStepDuration();
    const noteDuration = stepDuration * 0.9;

    const freq = 55;

    const osc = ctx.createOscillator();
    osc.type = oscType;
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    filter.Q.value = resonance;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.5, time + attack);
    gainNode.gain.setValueAtTime(0.5, time + noteDuration - release);
    gainNode.gain.linearRampToValueAtTime(0.001, time + noteDuration);

    filter.frequency.setValueAtTime(cutoff * 1.5, time);
    filter.frequency.exponentialRampToValueAtTime(cutoff, time + attack * 2);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(trackNode.gainNode);

    osc.start(time);
    osc.stop(time + noteDuration + 0.05);

    this.addVoice(trackId, { oscillator: osc, gainNode, filterNode: filter });

    osc.onended = () => {
      filter.disconnect();
      gainNode.disconnect();
      this.removeVoice(trackId, osc);
    };
  }

  private triggerSynth(trackId: string, track: Track, time: number): void {
    const ctx = this.getContext();
    const trackNode = this.trackNodes.get(trackId);
    if (!trackNode) return;

    const oscType = (track.soundParams.oscillatorType as OscillatorType) || 'square';
    const cutoff = (track.soundParams.cutoff as number) || 2000;
    const resonance = (track.soundParams.resonance as number) || 2;
    const attack = (track.soundParams.attack as number) || 0.02;
    const release = (track.soundParams.release as number) || 0.2;

    const stepDuration = this.getStepDuration();
    const noteDuration = stepDuration * 0.85;

    const freq = 440;

    const osc1 = ctx.createOscillator();
    osc1.type = oscType;
    osc1.frequency.value = freq;

    const osc2 = ctx.createOscillator();
    osc2.type = oscType;
    osc2.frequency.value = freq * 1.01;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    filter.Q.value = resonance;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.3, time + attack);
    gainNode.gain.setValueAtTime(0.3, time + noteDuration - release);
    gainNode.gain.linearRampToValueAtTime(0.001, time + noteDuration);

    filter.frequency.setValueAtTime(cutoff * 2, time);
    filter.frequency.exponentialRampToValueAtTime(cutoff, time + attack * 3);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(trackNode.gainNode);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + noteDuration + 0.05);
    osc2.stop(time + noteDuration + 0.05);

    this.addVoice(trackId, { oscillator: osc1, gainNode, filterNode: filter });

    const cleanup = () => {
      filter.disconnect();
      gainNode.disconnect();
      this.removeVoice(trackId, osc1);
    };
    osc1.onended = cleanup;
  }

  private triggerPad(trackId: string, track: Track, time: number): void {
    const ctx = this.getContext();
    const trackNode = this.trackNodes.get(trackId);
    if (!trackNode) return;

    const oscType = (track.soundParams.oscillatorType as OscillatorType) || 'sine';
    const detune = (track.soundParams.detune as number) || 5;
    const attack = (track.soundParams.attack as number) || 0.5;
    const release = (track.soundParams.release as number) || 0.8;
    const spread = (track.soundParams.spread as number) || 0.3;

    const stepDuration = this.getStepDuration();
    const noteDuration = stepDuration * 4;

    const baseFreq = 220;
    const intervals = [0, 4, 7, 12];

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.15, time + attack);
    gainNode.gain.setValueAtTime(0.15, time + noteDuration - release);
    gainNode.gain.linearRampToValueAtTime(0.001, time + noteDuration);

    gainNode.connect(trackNode.gainNode);

    for (let i = 0; i < intervals.length; i++) {
      const freq = baseFreq * Math.pow(2, intervals[i] / 12);

      for (let j = 0; j < 2; j++) {
        const osc = ctx.createOscillator();
        osc.type = oscType;
        osc.frequency.value = freq;
        osc.detune.value = (j === 0 ? -1 : 1) * detune + (Math.random() - 0.5) * 2;

        const oscGain = ctx.createGain();
        const pan = (Math.random() - 0.5) * spread;
        oscGain.gain.value = 0.5;

        osc.connect(oscGain);
        oscGain.connect(gainNode);

        osc.start(time);
        osc.stop(time + noteDuration + 0.1);
      }
    }

    this.addVoice(trackId, { gainNode });
  }

  private triggerLead(trackId: string, track: Track, time: number): void {
    const ctx = this.getContext();
    const trackNode = this.trackNodes.get(trackId);
    if (!trackNode) return;

    const oscType = (track.soundParams.oscillatorType as OscillatorType) || 'sawtooth';
    const portamento = (track.soundParams.portamento as number) || 0.05;
    const attack = (track.soundParams.attack as number) || 0.005;
    const release = (track.soundParams.release as number) || 0.15;

    const stepDuration = this.getStepDuration();
    const noteDuration = stepDuration * 0.9;

    const freq = 880;

    const osc = ctx.createOscillator();
    osc.type = oscType;
    osc.frequency.value = freq;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.4, time + attack);
    gainNode.gain.setValueAtTime(0.4, time + noteDuration - release);
    gainNode.gain.linearRampToValueAtTime(0.001, time + noteDuration);

    osc.connect(gainNode);
    gainNode.connect(trackNode.gainNode);

    osc.start(time);
    osc.stop(time + noteDuration + 0.05);

    this.addVoice(trackId, { oscillator: osc, gainNode });

    osc.onended = () => {
      gainNode.disconnect();
      this.removeVoice(trackId, osc);
    };
  }

  private addVoice(trackId: string, voice: ActiveVoice): void {
    const voices = this.activeVoices.get(trackId);
    if (voices) {
      voices.push(voice);
    }
  }

  private removeVoice(trackId: string, osc: OscillatorNode): void {
    const voices = this.activeVoices.get(trackId);
    if (!voices) return;

    const index = voices.findIndex(v => v.oscillator === osc);
    if (index !== -1) {
      voices.splice(index, 1);
    }
  }

  private stopTrackVoices(trackId: string): void {
    const voices = this.activeVoices.get(trackId);
    if (!voices) return;

    for (const voice of voices) {
      if (voice.oscillator) {
        try {
          voice.oscillator.stop();
        } catch (e) {}
      }
      if (voice.noiseSource) {
        try {
          voice.noiseSource.stop();
        } catch (e) {}
      }
    }

    voices.length = 0;
  }

  private stopAllVoices(): void {
    for (const trackId of this.activeVoices.keys()) {
      this.stopTrackVoices(trackId);
    }
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getBpm(): number {
    return this.bpm;
  }

  getTracks(): Track[] {
    return Array.from(this.tracks.values());
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  destroy(): void {
    this.stop();
    this.stopAllVoices();

    for (const [, nodes] of this.trackNodes) {
      nodes.gainNode.disconnect();
      nodes.pannerNode.disconnect();
    }

    this.trackNodes.clear();
    this.tracks.clear();
    this.activeVoices.clear();

    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
