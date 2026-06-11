export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private frequencyData: Uint8Array<ArrayBuffer>;
  private timeDomainData: Uint8Array<ArrayBuffer>;
  private isPlaying = false;
  private startTime = 0;
  private pauseOffset = 0;

  constructor() {
    this.frequencyData = new Uint8Array(new ArrayBuffer(0));
    this.timeDomainData = new Uint8Array(new ArrayBuffer(0));
  }

  private ensureContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0.7;
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
      this.frequencyData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
      this.timeDomainData = new Uint8Array(new ArrayBuffer(this.analyser.fftSize));
    }
  }

  async loadFile(file: File): Promise<void> {
    this.ensureContext();
    this.stop();

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
  }

  play(): void {
    if (!this.audioBuffer || !this.audioContext || !this.analyser) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.stop();

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.analyser);
    this.source.onended = () => {
      this.isPlaying = false;
    };

    this.startTime = this.audioContext.currentTime;
    this.source.start(0, this.pauseOffset);
    this.isPlaying = true;
  }

  pause(): void {
    if (!this.source || !this.audioContext || !this.isPlaying) return;

    this.pauseOffset += this.audioContext.currentTime - this.startTime;
    this.source.stop();
    this.source.disconnect();
    this.source = null;
    this.isPlaying = false;
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.stop();
        this.source.disconnect();
      } catch (e) {
        // ignore
      }
      this.source = null;
    }
    if (!this.isPlaying) {
      this.pauseOffset = 0;
    }
    this.isPlaying = false;
  }

  togglePlayPause(): boolean {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  setVolume(value: number): void {
    this.ensureContext();
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  getFrequencyData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData);
    }
    return this.frequencyData;
  }

  getTimeDomainData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(this.timeDomainData);
    }
    return this.timeDomainData;
  }

  getBassEnergy(): number {
    const data = this.getFrequencyData();
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const binWidth = sampleRate / (this.analyser?.fftSize || 2048);
    const lowFreq = 20;
    const highFreq = 250;
    const startBin = Math.floor(lowFreq / binWidth);
    const endBin = Math.min(Math.floor(highFreq / binWidth), data.length - 1);
    let sum = 0;
    let count = 0;
    for (let i = startBin; i <= endBin; i++) {
      sum += data[i];
      count++;
    }
    return count > 0 ? sum / count / 255 : 0;
  }

  getMidEnergy(): number {
    const data = this.getFrequencyData();
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const binWidth = sampleRate / (this.analyser?.fftSize || 2048);
    const lowFreq = 250;
    const highFreq = 4000;
    const startBin = Math.floor(lowFreq / binWidth);
    const endBin = Math.min(Math.floor(highFreq / binWidth), data.length - 1);
    let sum = 0;
    let count = 0;
    for (let i = startBin; i <= endBin; i++) {
      sum += data[i];
      count++;
    }
    return count > 0 ? sum / count / 255 : 0;
  }

  getHighEnergy(): number {
    const data = this.getFrequencyData();
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const binWidth = sampleRate / (this.analyser?.fftSize || 2048);
    const lowFreq = 4000;
    const highFreq = 20000;
    const startBin = Math.floor(lowFreq / binWidth);
    const endBin = Math.min(Math.floor(highFreq / binWidth), data.length - 1);
    let sum = 0;
    let count = 0;
    for (let i = startBin; i <= endBin; i++) {
      sum += data[i];
      count++;
    }
    return count > 0 ? sum / count / 255 : 0;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getSpectrumBars(bars: number): number[] {
    const data = this.getFrequencyData();
    const result: number[] = new Array(bars);
    const binCount = Math.floor(data.length / bars);
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      const start = i * binCount;
      const end = start + binCount;
      for (let j = start; j < end; j++) {
        sum += data[j];
      }
      result[i] = sum / binCount / 255;
    }
    return result;
  }
}
