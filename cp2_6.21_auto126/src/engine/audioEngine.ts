export type InstrumentType = 'drums' | 'bass' | 'synth' | 'effects';

export interface TrackState {
  volume: number;
  beats: boolean[][];
}

export interface EngineState {
  tracks: Record<InstrumentType, TrackState>;
  bpm: number;
  masterVolume: number;
  currentBeat: number;
  currentBar: number;
  isPlaying: boolean;
}

const INSTRUMENT_COLORS: Record<InstrumentType, string> = {
  drums: '#ff6b6b',
  bass: '#4ecdc4',
  synth: '#45b7d1',
  effects: '#f9ca24',
};

const WAVEFORM_BUFFER_SIZE = 2048;

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private trackGains: Map<InstrumentType, GainNode> = new Map();
  private analyser: AnalyserNode | null = null;
  private waveformData: Float32Array<ArrayBuffer>;
  private currentBeat: number = 0;
  private currentBar: number = 0;
  private bpm: number = 120;
  private masterVolume: number = 0.8;
  private tracks: Record<InstrumentType, TrackState>;
  private isPlaying: boolean = false;
  private onBeatCallback: ((beat: number, bar: number) => void) | null = null;
  private waveformBuffer: number[] = [];
  private lastWaveformUpdate: number = 0;
  private oscillatorCache: Map<string, OscillatorNode> = new Map();

  constructor() {
    this.waveformData = new Float32Array(WAVEFORM_BUFFER_SIZE) as Float32Array<ArrayBuffer>;
    this.tracks = {
      drums: { volume: 0.7, beats: this.createEmptyBeats() },
      bass: { volume: 0.6, beats: this.createEmptyBeats() },
      synth: { volume: 0.5, beats: this.createEmptyBeats() },
      effects: { volume: 0.4, beats: this.createEmptyBeats() },
    };
    this.waveformBuffer = new Array(WAVEFORM_BUFFER_SIZE).fill(0);
  }

  private createEmptyBeats(): boolean[][] {
    return Array(8).fill(null).map(() => Array(8).fill(false));
  }

  public async init(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.masterVolume;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = WAVEFORM_BUFFER_SIZE * 2;

    (['drums', 'bass', 'synth', 'effects'] as InstrumentType[]).forEach(type => {
      const gain = this.audioContext!.createGain();
      gain.gain.value = this.tracks[type].volume;
      gain.connect(this.masterGain!);
      this.trackGains.set(type, gain);
    });

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  public setOnBeatCallback(callback: (beat: number, bar: number) => void): void {
    this.onBeatCallback = callback;
  }

  public setBPM(bpm: number): void {
    this.bpm = Math.max(60, Math.min(200, bpm));
  }

  public getBPM(): number {
    return this.bpm;
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.audioContext!.currentTime, 0.01);
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setTrackVolume(type: InstrumentType, volume: number): void {
    this.tracks[type].volume = Math.max(0, Math.min(1, volume));
    const gain = this.trackGains.get(type);
    if (gain && this.audioContext) {
      gain.gain.setTargetAtTime(this.tracks[type].volume, this.audioContext.currentTime, 0.01);
    }
  }

  public getTrackVolume(type: InstrumentType): number {
    return this.tracks[type].volume;
  }

  public setBeat(type: InstrumentType, bar: number, beat: number, active: boolean): void {
    if (bar >= 0 && bar < 8 && beat >= 0 && beat < 8) {
      this.tracks[type].beats[bar][beat] = active;
    }
  }

  public getBeat(type: InstrumentType, bar: number, beat: number): boolean {
    if (bar >= 0 && bar < 8 && beat >= 0 && beat < 8) {
      return this.tracks[type].beats[bar][beat];
    }
    return false;
  }

  public getBeats(type: InstrumentType): boolean[][] {
    return this.tracks[type].beats.map(row => [...row]);
  }

  public setBeats(type: InstrumentType, beats: boolean[][]): void {
    this.tracks[type].beats = beats.map(row => [...row]);
  }

  public triggerBeat(beat: number, bar: number): void {
    if (!this.audioContext || !this.isPlaying) return;

    this.currentBeat = beat;
    this.currentBar = bar;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    (['drums', 'bass', 'synth', 'effects'] as InstrumentType[]).forEach(type => {
      if (this.tracks[type].beats[bar][beat]) {
        this.playInstrument(type, now);
      }
    });

    if (this.onBeatCallback) {
      this.onBeatCallback(beat, bar);
    }
  }

  private playInstrument(type: InstrumentType, startTime: number): void {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const gain = this.trackGains.get(type);
    if (!gain) return;

    switch (type) {
      case 'drums':
        this.playDrum(gain, startTime);
        break;
      case 'bass':
        this.playBass(gain, startTime);
        break;
      case 'synth':
        this.playSynth(gain, startTime);
        break;
      case 'effects':
        this.playEffects(gain, startTime);
        break;
    }
  }

  private playDrum(gain: GainNode, startTime: number): void {
    const ctx = this.audioContext!;
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, startTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, startTime + 0.1);

    oscGain.gain.setValueAtTime(0, startTime);
    oscGain.gain.linearRampToValueAtTime(1, startTime + 0.001);
    oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

    osc.connect(oscGain);
    oscGain.connect(gain);

    osc.start(startTime);
    osc.stop(startTime + 0.2);

    const noise = ctx.createBufferSource();
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    noise.buffer = noiseBuffer;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gain);

    noise.start(startTime);
    noise.stop(startTime + 0.1);
  }

  private playBass(gain: GainNode, startTime: number): void {
    const ctx = this.audioContext!;
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, startTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, startTime);
    filter.frequency.exponentialRampToValueAtTime(200, startTime + 0.3);

    oscGain.gain.setValueAtTime(0, startTime);
    oscGain.gain.linearRampToValueAtTime(0.8, startTime + 0.005);
    oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(gain);

    osc.start(startTime);
    osc.stop(startTime + 0.5);
  }

  private playSynth(gain: GainNode, startTime: number): void {
    const ctx = this.audioContext!;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(440, startTime);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, startTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, startTime);
    filter.frequency.exponentialRampToValueAtTime(500, startTime + 0.5);

    oscGain.gain.setValueAtTime(0, startTime);
    oscGain.gain.linearRampToValueAtTime(0.6, startTime + 0.01);
    oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(gain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + 0.7);
    osc2.stop(startTime + 0.7);
  }

  private playEffects(gain: GainNode, startTime: number): void {
    const ctx = this.audioContext!;
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, startTime);
    osc.frequency.exponentialRampToValueAtTime(2000, startTime + 0.2);

    oscGain.gain.setValueAtTime(0, startTime);
    oscGain.gain.linearRampToValueAtTime(0.5, startTime + 0.005);
    oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

    osc.connect(oscGain);
    oscGain.connect(gain);

    osc.start(startTime);
    osc.stop(startTime + 0.4);
  }

  public startLoop(): void {
    if (!this.audioContext) {
      this.init().then(() => {
        this.isPlaying = true;
        if (this.audioContext?.state === 'suspended') {
          this.audioContext.resume();
        }
      });
    } else {
      this.isPlaying = true;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    }
  }

  public stopLoop(): void {
    this.isPlaying = false;
    this.currentBeat = 0;
    this.currentBar = 0;
    this.oscillatorCache.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.oscillatorCache.clear();
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentBeat(): number {
    return this.currentBeat;
  }

  public getCurrentBar(): number {
    return this.currentBar;
  }

  public getWaveform(): Float32Array {
    if (!this.analyser || !this.audioContext) {
      return new Float32Array(WAVEFORM_BUFFER_SIZE);
    }

    const now = performance.now();
    if (now - this.lastWaveformUpdate >= 1000 / 30) {
      this.analyser.getFloatTimeDomainData(this.waveformData);
      
      const sample = this.waveformData.reduce((sum, val) => sum + val, 0) / this.waveformData.length;
      this.waveformBuffer.shift();
      this.waveformBuffer.push(sample * 5);
      
      this.lastWaveformUpdate = now;
    }

    const result = new Float32Array(WAVEFORM_BUFFER_SIZE);
    for (let i = 0; i < WAVEFORM_BUFFER_SIZE; i++) {
      result[i] = this.waveformBuffer[i] || 0;
    }
    return result;
  }

  public getInstrumentColor(type: InstrumentType): string {
    return INSTRUMENT_COLORS[type];
  }

  public getState(): EngineState {
    return {
      tracks: JSON.parse(JSON.stringify(this.tracks)),
      bpm: this.bpm,
      masterVolume: this.masterVolume,
      currentBeat: this.currentBeat,
      currentBar: this.currentBar,
      isPlaying: this.isPlaying,
    };
  }

  public setState(state: Partial<EngineState>): void {
    if (state.tracks) {
      Object.keys(state.tracks).forEach(key => {
        const type = key as InstrumentType;
        if (state.tracks![type]) {
          this.tracks[type] = JSON.parse(JSON.stringify(state.tracks![type]));
          this.setTrackVolume(type, this.tracks[type].volume);
        }
      });
    }
    if (state.bpm !== undefined) this.setBPM(state.bpm);
    if (state.masterVolume !== undefined) this.setMasterVolume(state.masterVolume);
  }

  public async recordBars(numBars: number): Promise<Blob> {
    if (!this.audioContext) {
      await this.init();
    }

    const ctx = this.audioContext!;
    const destination = ctx.createMediaStreamDestination();
    const recorder = new MediaRecorder(destination.stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    this.masterGain?.connect(destination);
    recorder.start();

    return new Promise((resolve) => {
      setTimeout(() => {
        recorder.stop();
        this.masterGain?.disconnect(destination);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          resolve(blob);
        };
      }, (numBars * 8 * 60 / this.bpm) * 1000);
    });
  }

  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
}

export const audioEngine = new AudioEngine();
