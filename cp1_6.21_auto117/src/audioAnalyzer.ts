export type SpectrumCallback = (spectrum: number[]) => void;

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private frequencyData: Uint8Array | null = null;
  private callback: SpectrumCallback | null = null;
  private intervalId: number | null = null;
  private bandEdges: number[] = [];
  private readonly BAND_COUNT = 16;
  private readonly MIN_FREQ = 20;
  private readonly MAX_FREQ = 20000;
  private readonly SAMPLE_INTERVAL = 50;

  constructor() {
    this.calculateLogBands();
  }

  private calculateLogBands(): void {
    const logMin = Math.log10(this.MIN_FREQ);
    const logMax = Math.log10(this.MAX_FREQ);
    this.bandEdges = [];
    for (let i = 0; i <= this.BAND_COUNT; i++) {
      const logFreq = logMin + (logMax - logMin) * (i / this.BAND_COUNT);
      this.bandEdges.push(Math.pow(10, logFreq));
    }
  }

  public async loadFile(file: File, callback: SpectrumCallback): Promise<void> {
    this.callback = callback;
    this.stop();

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.7;
    const buffer = new ArrayBuffer(this.analyser.frequencyBinCount);
    this.frequencyData = new Uint8Array(buffer);

    this.audioElement = new Audio();
    this.audioElement.src = URL.createObjectURL(file);
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.loop = true;
    this.audioElement.preload = 'auto';

    await new Promise<void>((resolve, reject) => {
      if (!this.audioElement) return reject(new Error('Audio element not created'));
      this.audioElement.onloadedmetadata = () => resolve();
      this.audioElement.onerror = () => reject(new Error('Failed to load audio'));
    });

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.startAnalysis();
    this.audioElement.play();
  }

  private startAnalysis(): void {
    const sample = () => {
      if (this.analyser && this.frequencyData && this.callback) {
        this.analyser.getByteFrequencyData(this.frequencyData as Uint8Array<ArrayBuffer>);
        const spectrum = this.extractBands();
        this.callback(spectrum);
      }
    };
    sample();
    this.intervalId = window.setInterval(sample, this.SAMPLE_INTERVAL);
  }

  private extractBands(): number[] {
    const result: number[] = new Array(this.BAND_COUNT).fill(0);
    if (!this.analyser || !this.frequencyData || !this.audioContext) {
      return result;
    }

    const sampleRate = this.audioContext.sampleRate;
    const binCount = this.analyser.frequencyBinCount;
    const freqPerBin = sampleRate / (this.analyser.fftSize);

    for (let band = 0; band < this.BAND_COUNT; band++) {
      const freqStart = this.bandEdges[band];
      const freqEnd = this.bandEdges[band + 1];

      const binStart = Math.min(binCount - 1, Math.max(0, Math.floor(freqStart / freqPerBin)));
      const binEnd = Math.min(binCount - 1, Math.max(0, Math.floor(freqEnd / freqPerBin)));

      if (binStart >= binEnd) {
        const bin = Math.min(binCount - 1, Math.floor((freqStart + freqEnd) / 2 / freqPerBin));
        result[band] = this.frequencyData[bin] / 255;
      } else {
        let sum = 0;
        for (let i = binStart; i <= binEnd; i++) {
          sum += this.frequencyData[i];
        }
        const count = binEnd - binStart + 1;
        result[band] = (sum / count) / 255;
      }
    }

    return result;
  }

  public togglePlayPause(): boolean {
    if (!this.audioElement) return false;
    if (this.audioElement.paused) {
      this.audioElement.play();
      if (this.audioContext?.state === 'suspended') {
        this.audioContext.resume();
      }
      return true;
    } else {
      this.audioElement.pause();
      return false;
    }
  }

  public isPlaying(): boolean {
    return this.audioElement ? !this.audioElement.paused : false;
  }

  public stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      if (this.audioElement.src.startsWith('blob:')) {
        URL.revokeObjectURL(this.audioElement.src);
      }
      this.audioElement = null;
    }
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch { /* ignore */ }
      this.sourceNode = null;
    }
    this.analyser = null;
    this.frequencyData = null;
  }

  public dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.callback = null;
  }
}
