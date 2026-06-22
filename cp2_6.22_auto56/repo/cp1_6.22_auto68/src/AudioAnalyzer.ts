export interface AudioData {
  lowFrequency: number;
  midFrequency: number;
  highFrequency: number;
  amplitude: number;
  spectrum: Uint8Array;
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private dataArray: Uint8Array | null = null;
  private isPlaying = false;
  private onPlaybackCompleteCallback: (() => void) | null = null;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      if (this.onPlaybackCompleteCallback) {
        this.onPlaybackCompleteCallback();
      }
    });
  }

  async init(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;
      
      this.source = this.audioContext.createMediaElementSource(this.audioElement!);
      this.source.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    }
  }

  async loadFile(file: File): Promise<void> {
    await this.init();
    
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    const url = URL.createObjectURL(file);
    this.audioElement!.src = url;
    this.audioElement!.load();
  }

  async play(): Promise<void> {
    if (!this.audioElement) return;
    
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    try {
      await this.audioElement.play();
      this.isPlaying = true;
    } catch (e) {
      console.error('Playback failed:', e);
    }
  }

  pause(): void {
    if (this.audioElement && this.isPlaying) {
      this.audioElement.pause();
      this.isPlaying = false;
    }
  }

  togglePlayPause(): Promise<void> {
    if (this.isPlaying) {
      this.pause();
      return Promise.resolve();
    } else {
      return this.play();
    }
  }

  getAudioData(): AudioData {
    if (!this.analyser || !this.dataArray) {
      return {
        lowFrequency: 0,
        midFrequency: 0,
        highFrequency: 0,
        amplitude: 0,
        spectrum: new Uint8Array()
      };
    }

    this.analyser.getByteFrequencyData(this.dataArray as unknown as Uint8Array<ArrayBuffer>);
    
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    const binSize = nyquist / this.dataArray.length;
    
    const lowStart = Math.floor(20 / binSize);
    const lowEnd = Math.floor(200 / binSize);
    const midStart = Math.floor(200 / binSize);
    const midEnd = Math.floor(2000 / binSize);
    const highStart = Math.floor(2000 / binSize);
    const highEnd = Math.floor(20000 / binSize);
    
    const lowAvg = this.averageFrequencyRange(lowStart, lowEnd);
    const midAvg = this.averageFrequencyRange(midStart, midEnd);
    const highAvg = this.averageFrequencyRange(highStart, highEnd);
    
    let amplitudeSum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      amplitudeSum += this.dataArray[i];
    }
    const amplitude = amplitudeSum / this.dataArray.length / 255;

    return {
      lowFrequency: lowAvg,
      midFrequency: midAvg,
      highFrequency: highAvg,
      amplitude,
      spectrum: new Uint8Array(this.dataArray)
    };
  }

  private averageFrequencyRange(start: number, end: number): number {
    if (!this.dataArray) return 0;
    
    start = Math.max(0, start);
    end = Math.min(this.dataArray.length - 1, end);
    
    if (start >= end) return 0;
    
    let sum = 0;
    for (let i = start; i <= end; i++) {
      sum += this.dataArray[i];
    }
    return sum / (end - start + 1) / 255;
  }

  getPlaybackProgress(): number {
    if (!this.audioElement || !this.audioElement.duration) return 0;
    return this.audioElement.currentTime / this.audioElement.duration;
  }

  getDuration(): number {
    return this.audioElement?.duration || 0;
  }

  getCurrentTime(): number {
    return this.audioElement?.currentTime || 0;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  setOnPlaybackComplete(callback: () => void): void {
    this.onPlaybackCompleteCallback = callback;
  }

  dispose(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
