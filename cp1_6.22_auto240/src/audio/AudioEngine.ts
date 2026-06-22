import {
  TrackType,
  TrackConfig,
  TRACK_COLORS,
  TRACK_WAVEFORMS,
  TRACK_FREQUENCIES,
} from '../types';

export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tracks: Map<TrackType, TrackConfig & { gain: GainNode }> = new Map();
  private bpm: number = 120;
  private beatInterval: number = 500;
  private beatTimer: number | null = null;
  private beatIndex: number = 0;
  private startTime: number = 0;
  private oscillatorPool: OscillatorNode[] = [];
  private isRunning: boolean = false;

  public onBeat: ((beatIndex: number, time: number) => void) | null = null;
  public onTrackBeat: ((track: TrackType, time: number) => void) | null = null;

  constructor() {
    const types: TrackType[] = ['drum', 'bass', 'melody', 'effect'];
    types.forEach((type) => {
      this.tracks.set(type, {
        type,
        color: TRACK_COLORS[type],
        enabled: true,
        volume: 0.7,
        waveform: TRACK_WAVEFORMS[type],
        frequency: TRACK_FREQUENCIES[type],
        gain: null as unknown as GainNode,
      });
    });
  }

  public async init(): Promise<void> {
    if (this.context) return;
    this.context = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.context.destination);

    this.tracks.forEach((config) => {
      const gain = this.context!.createGain();
      gain.gain.value = config.enabled ? config.volume : 0;
      gain.connect(this.masterGain!);
      config.gain = gain;
    });

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  public getContext(): AudioContext | null {
    return this.context;
  }

  public setBPM(bpm: number): void {
    this.bpm = Math.max(80, Math.min(180, bpm));
    this.beatInterval = 60000 / this.bpm;
  }

  public getBPM(): number {
    return this.bpm;
  }

  public getBeatInterval(): number {
    return this.beatInterval;
  }

  public getTracks(): Map<TrackType, TrackConfig & { gain: GainNode }> {
    return this.tracks;
  }

  public getTrackConfig(type: TrackType): (TrackConfig & { gain: GainNode }) | undefined {
    return this.tracks.get(type);
  }

  public toggleTrack(type: TrackType): boolean {
    const config = this.tracks.get(type);
    if (!config) return false;
    config.enabled = !config.enabled;
    if (config.gain) {
      config.gain.gain.setTargetAtTime(
        config.enabled ? config.volume : 0,
        this.context?.currentTime ?? 0,
        0.01
      );
    }
    return config.enabled;
  }

  public isTrackEnabled(type: TrackType): boolean {
    return this.tracks.get(type)?.enabled ?? false;
  }

  public setVolume(type: TrackType, volume: number): void {
    const config = this.tracks.get(type);
    if (!config) return;
    config.volume = Math.max(0, Math.min(1, volume));
    if (config.gain && config.enabled) {
      config.gain.gain.setTargetAtTime(
        config.volume,
        this.context?.currentTime ?? 0,
        0.01
      );
    }
  }

  public getVolume(type: TrackType): number {
    return this.tracks.get(type)?.volume ?? 0;
  }

  private getOscillator(): OscillatorNode | null {
    if (!this.context) return null;
    if (this.oscillatorPool.length > 0) {
      return this.oscillatorPool.pop()!;
    }
    return this.context.createOscillator();
  }

  private releaseOscillator(osc: OscillatorNode): void {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // ignore
    }
    if (this.oscillatorPool.length < 32) {
      this.oscillatorPool.push(osc);
    }
  }

  public playBeat(type: TrackType, when?: number): void {
    if (!this.context || !this.masterGain) return;
    const config = this.tracks.get(type);
    if (!config || !config.enabled) return;

    const context = this.context;
    const audioTime = when ?? context.currentTime;
    const duration = type === 'drum' ? 0.08 : type === 'bass' ? 0.18 : 0.22;

    try {
      const osc = this.getOscillator();
      if (!osc) return;

      osc.type = config.waveform as OscillatorType;
      osc.frequency.setValueAtTime(config.frequency, audioTime);

      if (type === 'drum') {
        osc.frequency.exponentialRampToValueAtTime(
          config.frequency * 0.4,
          audioTime + duration
        );
      } else if (type === 'bass') {
        osc.frequency.exponentialRampToValueAtTime(
          config.frequency * 0.7,
          audioTime + duration
        );
      } else if (type === 'melody') {
        osc.frequency.linearRampToValueAtTime(
          config.frequency * 1.5,
          audioTime + duration * 0.5
        );
      } else {
        osc.frequency.linearRampToValueAtTime(
          config.frequency * 2,
          audioTime + duration * 0.8
        );
      }

      const envelopeGain = context.createGain();
      envelopeGain.gain.setValueAtTime(0, audioTime);
      envelopeGain.gain.linearRampToValueAtTime(1.0, audioTime + 0.005);
      envelopeGain.gain.exponentialRampToValueAtTime(0.001, audioTime + duration);

      osc.connect(envelopeGain);
      envelopeGain.connect(config.gain);

      osc.start(audioTime);
      osc.stop(audioTime + duration + 0.05);

      osc.onended = () => {
        envelopeGain.disconnect();
        this.releaseOscillator(osc);
      };
    } catch (e) {
      console.error('Audio play error:', e);
    }

    this.onTrackBeat?.(type, audioTime);
  }

  public startLoop(): void {
    if (this.isRunning || !this.context) return;
    this.isRunning = true;
    this.beatIndex = 0;
    this.startTime = performance.now();

    const loop = () => {
      if (!this.isRunning) return;
      const now = performance.now();
      const elapsed = now - this.startTime;
      const expectedBeats = Math.floor(elapsed / this.beatInterval);

      while (this.beatIndex <= expectedBeats + 2) {
        const beatTime = this.startTime + this.beatIndex * this.beatInterval;
        const audioDelay = (beatTime - now) / 1000;
        const audioTime = (this.context?.currentTime ?? 0) + Math.max(0, audioDelay);

        this.onBeat?.(this.beatIndex, beatTime);
        this.beatIndex++;
      }

      this.beatTimer = window.setTimeout(loop, 25);
    };

    loop();
  }

  public stopLoop(): void {
    this.isRunning = false;
    if (this.beatTimer !== null) {
      clearTimeout(this.beatTimer);
      this.beatTimer = null;
    }
  }

  public getElapsedTime(): number {
    if (!this.isRunning) return 0;
    return performance.now() - this.startTime;
  }

  public dispose(): void {
    this.stopLoop();
    this.oscillatorPool.forEach((osc) => {
      try {
        osc.disconnect();
      } catch {
        // ignore
      }
    });
    this.oscillatorPool = [];
    this.tracks.forEach((config) => {
      try {
        config.gain?.disconnect();
      } catch {
        // ignore
      }
    });
    this.masterGain?.disconnect();
    if (this.context) {
      try {
        this.context.close();
      } catch {
        // ignore
      }
    }
    this.context = null;
  }
}
