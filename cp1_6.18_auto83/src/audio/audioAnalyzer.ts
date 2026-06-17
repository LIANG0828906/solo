export interface AudioAnalyzerConfig {
  fftSize?: number;
  smoothingTimeConstant?: number;
}

export interface AudioTrack {
  name: string;
  src: string;
  isDemo?: boolean;
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private frequencyData: Uint8Array;
  private timeData: Uint8Array;
  private onFrequencyDataCallback: ((data: Uint8Array) => void) | null = null;
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private rafId: number | null = null;

  constructor(config: AudioAnalyzerConfig = {}) {
    const { fftSize = 512, smoothingTimeConstant = 0.8 } = config;
    this.frequencyData = new Uint8Array(fftSize / 2);
    this.timeData = new Uint8Array(fftSize / 2);
  }

  private initContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;
    }
  }

  public async loadTrack(track: AudioTrack): Promise<void> {
    this.initContext();
    this.cleanup();

    this.audioElement = new Audio(track.src);
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'auto';

    await new Promise<void>((resolve, reject) => {
      if (!this.audioElement) return reject(new Error('Audio element not created'));
      this.audioElement.addEventListener('loadedmetadata', () => resolve(), { once: true });
      this.audioElement.addEventListener('error', (e) => reject(e), { once: true });
    });

    if (this.audioContext && this.analyser) {
      this.source = this.audioContext.createMediaElementSource(this.audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    }

    this.audioElement.addEventListener('timeupdate', () => {
      if (this.audioElement && this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.audioElement.currentTime, this.audioElement.duration);
      }
    });

    this.audioElement.addEventListener('ended', () => {
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    });
  }

  public async loadFromFile(file: File): Promise<void> {
    const url = URL.createObjectURL(file);
    await this.loadTrack({ name: file.name, src: url });
  }

  public async play(): Promise<void> {
    if (!this.audioElement) return;
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    await this.audioElement.play();
    this.startAnalysisLoop();
  }

  public pause(): void {
    this.audioElement?.pause();
    this.stopAnalysisLoop();
  }

  public togglePlay(): Promise<void> | void {
    if (this.audioElement?.paused) {
      return this.play();
    } else {
      this.pause();
    }
  }

  public seek(time: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = time;
    }
  }

  public setVolume(volume: number): void {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  public getFrequencyData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData);
    }
    return this.frequencyData;
  }

  public getTimeDomainData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(this.timeData);
    }
    return this.timeData;
  }

  public getFrequencyBandEnergy(startBin: number, endBin: number): number {
    const data = this.getFrequencyData();
    let sum = 0;
    const start = Math.max(0, startBin);
    const end = Math.min(data.length, endBin);
    for (let i = start; i < end; i++) {
      sum += data[i];
    }
    return sum / (end - start);
  }

  private startAnalysisLoop(): void {
    this.stopAnalysisLoop();
    const loop = () => {
      if (this.onFrequencyDataCallback) {
        this.onFrequencyDataCallback(this.getFrequencyData());
      }
      this.rafId = requestAnimationFrame(loop);
    };
    loop();
  }

  private stopAnalysisLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public onFrequencyData(callback: (data: Uint8Array) => void): void {
    this.onFrequencyDataCallback = callback;
  }

  public onTimeUpdate(callback: (time: number, duration: number) => void): void {
    this.onTimeUpdateCallback = callback;
  }

  public onEnded(callback: () => void): void {
    this.onEndedCallback = callback;
  }

  public getCurrentTime(): number {
    return this.audioElement?.currentTime ?? 0;
  }

  public getDuration(): number {
    return this.audioElement?.duration ?? 0;
  }

  public isPlaying(): boolean {
    return this.audioElement ? !this.audioElement.paused : false;
  }

  private cleanup(): void {
    this.stopAnalysisLoop();
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
  }

  public dispose(): void {
    this.cleanup();
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }
}
