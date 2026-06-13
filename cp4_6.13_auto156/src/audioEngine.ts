export interface FrequencyBands {
  low: number;
  mid: number;
  high: number;
  full: Uint8Array;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private isPlayingState: boolean = false;
  private startTime: number = 0;
  private pausedAt: number = 0;
  private frequencyData: Uint8Array | null = null;

  async initialize(): Promise<void> {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.8;
    
    this.gainNode.connect(this.audioContext.destination);
    this.analyser.connect(this.gainNode);
    
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
  }

  async loadAudio(file: File): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    if (this.isPlayingState) {
      this.stop();
    }

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    this.pausedAt = 0;
  }

  play(): void {
    if (!this.audioBuffer || !this.audioContext || !this.analyser) {
      return;
    }

    if (this.isPlayingState) {
      return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.analyser);
    
    this.source.onended = () => {
      if (this.isPlayingState) {
        this.isPlayingState = false;
        this.pausedAt = 0;
      }
    };

    const offset = this.pausedAt;
    this.source.start(0, offset);
    this.startTime = this.audioContext.currentTime - offset;
    this.isPlayingState = true;
  }

  pause(): void {
    if (!this.isPlayingState || !this.audioContext) {
      return;
    }

    this.pausedAt = this.audioContext.currentTime - this.startTime;
    this.source?.stop();
    this.source = null;
    this.isPlayingState = false;
  }

  stop(): void {
    if (this.source) {
      this.source.stop();
      this.source = null;
    }
    this.isPlayingState = false;
    this.pausedAt = 0;
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser || !this.frequencyData) {
      return new Uint8Array(128);
    }
    this.analyser.getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  getFrequencyBands(): FrequencyBands {
    const data = this.getFrequencyData();
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const binCount = data.length;
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / binCount;

    const lowStartBin = Math.floor(0 / binWidth);
    const lowEndBin = Math.floor(100 / binWidth);
    const midStartBin = Math.floor(500 / binWidth);
    const midEndBin = Math.floor(2000 / binWidth);
    const highStartBin = Math.floor(2000 / binWidth);
    const highEndBin = Math.floor(20000 / binWidth);

    let lowSum = 0;
    let lowCount = 0;
    for (let i = lowStartBin; i <= Math.min(lowEndBin, binCount - 1); i++) {
      lowSum += data[i];
      lowCount++;
    }

    let midSum = 0;
    let midCount = 0;
    for (let i = midStartBin; i <= Math.min(midEndBin, binCount - 1); i++) {
      midSum += data[i];
      midCount++;
    }

    let highSum = 0;
    let highCount = 0;
    for (let i = highStartBin; i <= Math.min(highEndBin, binCount - 1); i++) {
      highSum += data[i];
      highCount++;
    }

    return {
      low: lowCount > 0 ? lowSum / lowCount : 0,
      mid: midCount > 0 ? midSum / midCount : 0,
      high: highCount > 0 ? highSum / highCount : 0,
      full: data
    };
  }

  getCurrentTime(): number {
    if (!this.audioContext) {
      return 0;
    }
    if (this.isPlayingState) {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.pausedAt;
  }

  getDuration(): number {
    return this.audioBuffer?.duration || 0;
  }

  isPlaying(): boolean {
    return this.isPlayingState;
  }
}