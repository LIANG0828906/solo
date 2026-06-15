export interface AudioAnalysisData {
  frequencyData: Float32Array;
  timeDomainData: Float32Array;
  energy: number;
  lowFrequency: number;
  highFrequency: number;
  frequencyBands: number[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

const BAND_COUNT = 12;

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private frequencyData: Float32Array;
  private timeDomainData: Float32Array;
  private onUpdate: ((data: AudioAnalysisData) => void) | null = null;
  private animationId: number | null = null;

  constructor() {
    this.frequencyData = new Float32Array(256);
    this.timeDomainData = new Float32Array(256);
  }

  setOnUpdate(callback: (data: AudioAnalysisData) => void) {
    this.onUpdate = callback;
  }

  async loadAudio(url: string, isBlob = false): Promise<HTMLAudioElement> {
    await this.ensureAudioContext();
    
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }

    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    
    if (isBlob) {
      this.audioElement.src = url;
    } else {
      this.audioElement.src = url;
    }

    await this.audioElement.load();

    if (this.analyser && this.audioContext) {
      if (this.source) {
        this.source.disconnect();
      }
      this.source = this.audioContext.createMediaElementSource(this.audioElement);
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0.8;
      this.source.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    }

    return this.audioElement;
  }

  private async ensureAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async play() {
    if (!this.audioElement) return;
    await this.ensureAudioContext();
    try {
      await this.audioElement.play();
      this.startAnalysis();
    } catch (e) {
      console.error('Playback failed:', e);
    }
  }

  pause() {
    if (!this.audioElement) return;
    this.audioElement.pause();
    this.stopAnalysis();
  }

  togglePlay() {
    if (!this.audioElement) return;
    if (this.audioElement.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  setVolume(value: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, value / 100));
    }
  }

  seek(time: number) {
    if (!this.audioElement) return;
    this.audioElement.currentTime = Math.max(0, Math.min(time, this.audioElement.duration || 0));
  }

  getCurrentTime(): number {
    return this.audioElement?.currentTime || 0;
  }

  getDuration(): number {
    return this.audioElement?.duration || 0;
  }

  isPlaying(): boolean {
    return !this.audioElement?.paused || false;
  }

  private startAnalysis() {
    if (this.animationId !== null) return;
    this.analyze();
  }

  private stopAnalysis() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private analyze = () => {
    if (!this.analyser) return;

    this.analyser.getFloatFrequencyData(this.frequencyData);
    this.analyser.getFloatTimeDomainData(this.timeDomainData);

    const frequencyBands: number[] = [];
    const bandSize = Math.floor(this.frequencyData.length / BAND_COUNT);
    
    for (let i = 0; i < BAND_COUNT; i++) {
      let sum = 0;
      for (let j = 0; j < bandSize; j++) {
        const idx = i * bandSize + j;
        const value = (this.frequencyData[idx] + 140) / 140;
        sum += Math.max(0, value);
      }
      frequencyBands.push(sum / bandSize);
    }

    let energy = 0;
    let lowFreq = 0;
    let highFreq = 0;
    const lowBandCount = Math.floor(BAND_COUNT * 0.3);
    const highBandStart = Math.floor(BAND_COUNT * 0.6);

    for (let i = 0; i < BAND_COUNT; i++) {
      energy += frequencyBands[i];
      if (i < lowBandCount) {
        lowFreq += frequencyBands[i];
      } else if (i >= highBandStart) {
        highFreq += frequencyBands[i];
      }
    }

    const data: AudioAnalysisData = {
      frequencyData: this.frequencyData,
      timeDomainData: this.timeDomainData,
      energy: energy / BAND_COUNT,
      lowFrequency: lowFreq / lowBandCount,
      highFrequency: highFreq / (BAND_COUNT - highBandStart),
      frequencyBands,
      isPlaying: this.isPlaying(),
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
    };

    if (this.onUpdate) {
      this.onUpdate(data);
    }

    this.animationId = requestAnimationFrame(this.analyze);
  };

  dispose() {
    this.stopAnalysis();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    if (this.source) {
      this.source.disconnect();
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    if (this.analyser) {
      this.analyser.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.gainNode = null;
    this.audioElement = null;
    this.onUpdate = null;
  }
}
