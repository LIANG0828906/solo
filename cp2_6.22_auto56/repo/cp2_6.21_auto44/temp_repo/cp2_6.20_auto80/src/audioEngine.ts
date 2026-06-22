export type InstrumentType = 'drums' | 'bass' | 'guitar' | 'keys';

export interface TrackAudioState {
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private trackGains: Map<InstrumentType, GainNode> = new Map();
  private trackPanners: Map<InstrumentType, StereoPannerNode> = new Map();
  private trackStates: Map<InstrumentType, TrackAudioState> = new Map();
  private isSoloActive: boolean = false;
  private intervalId: number | null = null;
  private bpm: number = 120;
  private currentStep: number = 0;
  private isPlaying: boolean = false;
  private onStepChange: ((step: number) => void) | null = null;
  private grid: boolean[][] = [[], [], [], []];
  private lastStepTime: number = 0;

  private instrumentConfig: Record<InstrumentType, { waveform: OscillatorType; frequency: number; }> = {
    drums: { waveform: 'square', frequency: 200 },
    bass: { waveform: 'square', frequency: 65.41 },
    guitar: { waveform: 'triangle', frequency: 261.63 },
    keys: { waveform: 'triangle', frequency: 523.25 },
  };

  private instrumentOrder: InstrumentType[] = ['drums', 'bass', 'guitar', 'keys'];

  constructor() {
    const defaultState: TrackAudioState = {
      volume: -12,
      pan: 0,
      muted: false,
      solo: false,
    };
    this.instrumentOrder.forEach(inst => {
      this.trackStates.set(inst, { ...defaultState });
    });
    for (let i = 0; i < 4; i++) {
      this.grid[i] = new Array(16).fill(false);
    }
  }

  private initContext(): void {
    if (this.ctx) return;

    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);

    this.instrumentOrder.forEach(inst => {
      const gainNode = this.ctx!.createGain();
      const pannerNode = this.ctx!.createStereoPanner();
      gainNode.connect(pannerNode);
      pannerNode.connect(this.masterGain!);
      this.trackGains.set(inst, gainNode);
      this.trackPanners.set(inst, pannerNode);
      this.applyTrackState(inst);
    });
  }

  public resume(): void {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private applyTrackState(inst: InstrumentType): void {
    const state = this.trackStates.get(inst);
    const gainNode = this.trackGains.get(inst);
    const pannerNode = this.trackPanners.get(inst);
    if (!state || !gainNode || !pannerNode) return;

    const linearVolume = this.dbToLinear(state.volume);
    let finalGain = linearVolume;

    if (state.muted) {
      finalGain = 0;
    } else if (this.isSoloActive && !state.solo) {
      finalGain = 0;
    }

    gainNode.gain.setTargetAtTime(finalGain, this.ctx?.currentTime || 0, 0.005);
    pannerNode.pan.setTargetAtTime(state.pan / 100, this.ctx?.currentTime || 0, 0.005);
  }

  private dbToLinear(db: number): number {
    if (db <= -60) return 0;
    return Math.pow(10, db / 20);
  }

  public setVolume(inst: InstrumentType, db: number): void {
    const state = this.trackStates.get(inst);
    if (!state) return;
    state.volume = db;
    this.applyTrackState(inst);
  }

  public setPan(inst: InstrumentType, pan: number): void {
    const state = this.trackStates.get(inst);
    if (!state) return;
    state.pan = Math.max(-100, Math.min(100, pan));
    this.applyTrackState(inst);
  }

  public setMuted(inst: InstrumentType, muted: boolean): void {
    const state = this.trackStates.get(inst);
    if (!state) return;
    state.muted = muted;
    this.applyTrackState(inst);
  }

  public setSolo(inst: InstrumentType, solo: boolean): void {
    const state = this.trackStates.get(inst);
    if (!state) return;
    state.solo = solo;
    this.updateSoloState();
  }

  private updateSoloState(): void {
    let hasSolo = false;
    this.instrumentOrder.forEach(inst => {
      const state = this.trackStates.get(inst);
      if (state?.solo) hasSolo = true;
    });
    this.isSoloActive = hasSolo;
    this.instrumentOrder.forEach(inst => this.applyTrackState(inst));
  }

  public setBPM(bpm: number): void {
    this.bpm = Math.max(60, Math.min(200, bpm));
  }

  public setGrid(grid: boolean[][]): void {
    this.grid = grid.map(row => [...row]);
  }

  public setOnStepChange(callback: (step: number) => void): void {
    this.onStepChange = callback;
  }

  public play(): void {
    if (this.isPlaying) return;
    this.initContext();
    this.resume();
    this.isPlaying = true;
    this.lastStepTime = performance.now();
    this.scheduleStep();
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  public reset(): void {
    this.stop();
    this.currentStep = 0;
    if (this.onStepChange) {
      this.onStepChange(0);
    }
  }

  public getCurrentStep(): number {
    return this.currentStep;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private scheduleStep(): void {
    if (!this.isPlaying) return;

    const stepDuration = 60000 / (this.bpm * 4);
    const now = performance.now();
    const elapsed = now - this.lastStepTime;

    if (elapsed >= stepDuration) {
      this.triggerStep();
      this.lastStepTime = now - (elapsed % stepDuration);
      this.currentStep = (this.currentStep + 1) % 16;
      if (this.onStepChange) {
        this.onStepChange(this.currentStep);
      }
    }

    const nextDelay = Math.max(1, stepDuration - (performance.now() - this.lastStepTime));
    this.intervalId = window.setTimeout(() => this.scheduleStep(), Math.min(nextDelay, stepDuration / 2));
  }

  private triggerStep(): void {
    if (!this.ctx) return;

    for (let i = 0; i < 4; i++) {
      if (this.grid[i] && this.grid[i][this.currentStep]) {
        const inst = this.instrumentOrder[i];
        const state = this.trackStates.get(inst);
        if (!state) continue;
        if (state.muted) continue;
        if (this.isSoloActive && !state.solo) continue;
        this.playNote(inst);
      }
    }
  }

  private playNote(inst: InstrumentType): void {
    if (!this.ctx) return;

    const config = this.instrumentConfig[inst];
    const trackGain = this.trackGains.get(inst);
    if (!trackGain) return;

    const now = this.ctx.currentTime;

    if (inst === 'drums') {
      this.playDrumSound(now);
    } else {
      const osc = this.ctx.createOscillator();
      osc.type = config.waveform;
      osc.frequency.value = config.frequency;

      const envGain = this.ctx.createGain();
      envGain.gain.setValueAtTime(0, now);
      envGain.gain.linearRampToValueAtTime(0.5, now + 0.01);

      let releaseTime: number;
      if (inst === 'bass') {
        releaseTime = now + 0.25;
      } else if (inst === 'guitar') {
        releaseTime = now + 0.35;
      } else {
        releaseTime = now + 0.3;
      }

      envGain.gain.exponentialRampToValueAtTime(0.001, releaseTime);

      osc.connect(envGain);
      envGain.connect(trackGain);

      osc.start(now);
      osc.stop(releaseTime + 0.05);
    }
  }

  private playDrumSound(now: number): void {
    if (!this.ctx) return;

    const trackGain = this.trackGains.get('drums');
    if (!trackGain) return;

    const bufferSize = this.ctx.sampleRate * 0.15;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(trackGain);

    osc.connect(oscGain);
    oscGain.connect(trackGain);

    noise.start(now);
    noise.stop(now + 0.15);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public destroy(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const audioEngine = new AudioEngine();
export default audioEngine;
