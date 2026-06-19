export interface FrequencyBands {
  low: number;
  mid: number;
  high: number;
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private frequencyData: Uint8Array | null = null;
  private sampleRate: number = 44100;

  private readonly LOW_MIN = 20;
  private readonly LOW_MAX = 250;
  private readonly MID_MIN = 250;
  private readonly MID_MAX = 2000;
  private readonly HIGH_MIN = 2000;
  private readonly HIGH_MAX = 20000;

  constructor() {}

  async loadAudioFile(file: File): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }

    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';

    const url = URL.createObjectURL(file);
    this.audioElement.src = url;

    if (!this.source) {
      this.source = this.audioContext.createMediaElementSource(this.audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    } else {
      this.source = this.audioContext.createMediaElementSource(this.audioElement);
      this.source.connect(this.analyser);
    }

    this.sampleRate = this.audioContext.sampleRate;

    return new Promise((resolve, reject) => {
      if (!this.audioElement) {
        reject(new Error('Audio element not created'));
        return;
      }

      this.audioElement.addEventListener('canplaythrough', () => {
        this.audioElement!.play().then(resolve).catch(reject);
      }, { once: true });

      this.audioElement.addEventListener('error', (_e) => {
        reject(new Error('Audio load error'));
      }, { once: true });

      this.audioElement.load();
    });
  }

  getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.frequencyData) return null;
    this.analyser.getByteFrequencyData(this.frequencyData as Uint8Array<ArrayBuffer>);
    return this.frequencyData;
  }

  getFrequencyBands(sensitivity: number = 1.0): FrequencyBands {
    const data = this.getFrequencyData();
    if (!data || !this.analyser) {
      return { low: 0, mid: 0, high: 0 };
    }

    const nyquist = this.sampleRate / 2;
    const binCount = this.analyser.frequencyBinCount;
    const binWidth = nyquist / binCount;

    const lowStart = Math.floor(this.LOW_MIN / binWidth);
    const lowEnd = Math.min(Math.floor(this.LOW_MAX / binWidth), binCount - 1);
    const midStart = Math.max(lowEnd + 1, Math.floor(this.MID_MIN / binWidth));
    const midEnd = Math.min(Math.floor(this.MID_MAX / binWidth), binCount - 1);
    const highStart = Math.max(midEnd + 1, Math.floor(this.HIGH_MIN / binWidth));
    const highEnd = Math.min(Math.floor(this.HIGH_MAX / binWidth), binCount - 1);

    const averageBand = (start: number, end: number): number => {
      if (start >= end) return 0;
      let sum = 0;
      let weightedSum = 0;
      let weightTotal = 0;
      for (let i = start; i <= end; i++) {
        const freq = (i + 0.5) * binWidth;
        const weight = this.frequencyWeight(freq);
        const val = data[i] * weight;
        weightedSum += val;
        weightTotal += weight;
        sum += data[i];
      }
      const avg = weightTotal > 0 ? weightedSum / weightTotal : sum / (end - start + 1);
      return Math.min(avg / 255 * sensitivity, 1.0);
    };

    return {
      low: averageBand(lowStart, lowEnd),
      mid: averageBand(midStart, midEnd),
      high: averageBand(highStart, highEnd)
    };
  }

  private frequencyWeight(freq: number): number {
    if (freq < 100) return 0.8 + (freq / 100) * 0.2;
    if (freq < 1000) return 1.0;
    if (freq < 5000) return 1.0 + (freq - 1000) / 4000 * 0.3;
    return 1.3 - (freq - 5000) / 15000 * 0.3;
  }

  getIsPlaying(): boolean {
    return !!(this.audioElement && !this.audioElement.paused && !this.audioElement.ended);
  }

  getCurrentFileName(): string {
    return this.audioElement?.getAttribute('src')?.split('/').pop() || '';
  }

  dispose(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      const src = this.audioElement.src;
      if (src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
      this.audioElement = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.frequencyData = null;
  }
}
