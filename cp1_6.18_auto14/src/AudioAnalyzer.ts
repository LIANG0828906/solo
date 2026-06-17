export type ScaleType = 'major' | 'minor' | 'pentatonic' | 'wholeTone' | 'chromatic';

const SCALE_FREQUENCIES: Record<ScaleType, number[]> = {
  major: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
  minor: [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25],
  pentatonic: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25],
  wholeTone: [261.63, 293.66, 329.63, 369.99, 415.30, 466.16, 523.25],
  chromatic: [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, 523.25]
};

export interface AudioData {
  frequencies: Float32Array;
  waveform: Float32Array;
  volume: number;
  beat: boolean;
  currentFrequency: number;
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private frequencies: Float32Array;
  private waveform: Float32Array;
  private beatListeners: Array<() => void> = [];
  private prevSpectrum: Float32Array = new Float32Array(256);
  private beatCooldown: number = 0;
  private scaleMode: ScaleType | null = null;
  private scaleIntervalId: number | null = null;
  private currentScaleFrequency: number = 440;
  private userVolume: number = 0.8;
  private playbackSpeed: number = 1.0;
  private audioBuffer: AudioBuffer | null = null;
  private isPlaying: boolean = false;
  private mediaElement: HTMLAudioElement | null = null;

  constructor() {
    this.frequencies = new Float32Array(256);
    this.waveform = new Float32Array(256);
  }

  private initContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.userVolume;
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setVolume(volume: number): void {
    this.userVolume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.userVolume;
    }
  }

  setSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.25, Math.min(2, speed));
    if (this.source && this.audioBuffer) {
      const src = this.source as AudioBufferSourceNode;
      src.playbackRate.value = this.playbackSpeed;
    }
  }

  getSpeed(): number {
    return this.playbackSpeed;
  }

  async loadAudioFile(file: File): Promise<void> {
    this.stopAll();
    this.initContext();

    if (!this.audioContext || !this.analyser) {
      throw new Error('AudioContext not initialized');
    }

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.mediaElement = new Audio();
    this.mediaElement.src = URL.createObjectURL(file);
    this.mediaElement.loop = true;
    this.mediaElement.playbackRate = this.playbackSpeed;

    this.source = this.audioContext.createMediaElementSource(this.mediaElement);
    this.source.connect(this.analyser);

    this.scaleMode = null;
    this.isPlaying = true;
    this.mediaElement.play().catch(() => {});
  }

  setScaleMode(scale: ScaleType | null): void {
    this.stopAll();
    this.scaleMode = scale;

    if (scale) {
      this.initContext();
      this.isPlaying = true;
      const freqs = SCALE_FREQUENCIES[scale];
      let noteIndex = 0;

      this.scaleIntervalId = window.setInterval(() => {
        this.currentScaleFrequency = freqs[noteIndex % freqs.length];
        noteIndex++;
        this.triggerBeat();
      }, 1000 / this.playbackSpeed);
    }
  }

  private stopAll(): void {
    if (this.scaleIntervalId !== null) {
      clearInterval(this.scaleIntervalId);
      this.scaleIntervalId = null;
    }
    if (this.mediaElement) {
      this.mediaElement.pause();
      this.mediaElement.currentTime = 0;
      this.mediaElement = null;
    }
    this.source = null;
    this.audioBuffer = null;
    this.isPlaying = false;
  }

  onBeat(listener: () => void): void {
    this.beatListeners.push(listener);
  }

  private triggerBeat(): void {
    this.beatListeners.forEach(l => l());
  }

  private detectBeat(): boolean {
    if (this.beatCooldown > 0) {
      this.beatCooldown--;
      return false;
    }

    let flux = 0;
    for (let i = 0; i < 256; i++) {
      const diff = this.frequencies[i] - this.prevSpectrum[i];
      if (diff > 0) flux += diff;
    }
    flux /= 256;

    this.prevSpectrum.set(this.frequencies);

    if (flux > 0.5) {
      this.beatCooldown = 5;
      return true;
    }
    return false;
  }

  getData(): AudioData {
    let volume = 0;
    let beat = false;
    let currentFreq = 0;

    if (this.analyser && this.isPlaying && !this.scaleMode) {
      this.analyser.getFloatFrequencyData(this.frequencies as Float32Array<ArrayBuffer>);
      this.analyser.getFloatTimeDomainData(this.waveform as Float32Array<ArrayBuffer>);

      for (let i = 0; i < 256; i++) {
        const normalized = (this.frequencies[i] + 100) / 100;
        this.frequencies[i] = Math.max(0, Math.min(1, normalized));
        volume += this.waveform[i] * this.waveform[i];
      }
      volume = Math.sqrt(volume / 256);
      volume = Math.min(1, volume * 3);

      beat = this.detectBeat();

      let maxIdx = 0;
      let maxVal = -Infinity;
      for (let i = 1; i < 128; i++) {
        if (this.frequencies[i] > maxVal) {
          maxVal = this.frequencies[i];
          maxIdx = i;
        }
      }
      if (this.audioContext) {
        currentFreq = (maxIdx / 128) * (this.audioContext.sampleRate / 4);
      }
    } else if (this.scaleMode && this.isPlaying) {
      this.generateScaleFrequencies();
      volume = 0.6 * this.userVolume;
      beat = false;
      currentFreq = this.currentScaleFrequency;
    } else {
      this.frequencies.fill(0);
      this.waveform.fill(0);
      volume = 0;
      beat = false;
      currentFreq = 0;
    }

    return {
      frequencies: this.frequencies,
      waveform: this.waveform,
      volume,
      beat,
      currentFrequency: currentFreq
    };
  }

  private generateScaleFrequencies(): void {
    this.frequencies.fill(0);
    const baseIdx = Math.floor((this.currentScaleFrequency / 2000) * 256);
    for (let i = -5; i <= 5; i++) {
      const idx = baseIdx + i;
      if (idx >= 0 && idx < 256) {
        const dist = Math.abs(i);
        this.frequencies[idx] = 0.8 * (1 - dist / 6);
      }
    }
  }

  getScaleMode(): ScaleType | null {
    return this.scaleMode;
  }

  isAudioPlaying(): boolean {
    return this.isPlaying;
  }

  destroy(): void {
    this.stopAll();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
