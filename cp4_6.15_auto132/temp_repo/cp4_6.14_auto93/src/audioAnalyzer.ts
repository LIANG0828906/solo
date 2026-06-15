export interface FrequencyBands {
  low: number;
  mid: number;
  high: number;
  spectrum: Uint8Array;
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private frequencyData: Uint8Array = new Uint8Array(0);
  private startTime: number = 0;
  private pauseTime: number = 0;
  private isPlayingState: boolean = false;
  private bpmValue: number = 120;
  private bpmHistory: number[] = [];
  private peakHistory: number[] = [];
  private lastPeakTime: number = 0;
  private onEndedCallback: (() => void) | null = null;

  async loadFile(file: File): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

    this.startTime = 0;
    this.pauseTime = 0;
    this.bpmHistory = [];
    this.peakHistory = [];
    this.lastPeakTime = 0;
    this.bpmValue = 120;
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer || !this.analyser) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.stopSource();

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    const offset = this.pauseTime;
    this.source.start(0, offset);
    this.startTime = this.audioContext.currentTime - offset;
    this.isPlayingState = true;

    this.source.onended = () => {
      if (this.isPlayingState && this.getCurrentTime() >= this.getDuration() - 0.05) {
        this.isPlayingState = false;
        this.pauseTime = 0;
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      }
    };
  }

  pause(): void {
    if (!this.isPlayingState) return;
    this.pauseTime = this.getCurrentTime();
    this.stopSource();
    this.isPlayingState = false;
  }

  togglePlay(): boolean {
    if (this.isPlayingState) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlayingState;
  }

  setOnEnded(callback: () => void): void {
    this.onEndedCallback = callback;
  }

  isPlaying(): boolean {
    return this.isPlayingState;
  }

  getDuration(): number {
    return this.audioBuffer?.duration ?? 0;
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0;
    if (this.isPlayingState) {
      return Math.min(this.audioContext.currentTime - this.startTime, this.getDuration());
    }
    return this.pauseTime;
  }

  getBPM(): number {
    return this.bpmValue;
  }

  getFrequencyBands(): FrequencyBands {
    if (!this.analyser || !this.audioContext) {
      return { low: 0, mid: 0, high: 0, spectrum: this.frequencyData };
    }

    this.analyser.getByteFrequencyData(this.frequencyData);

    const sampleRate = this.audioContext.sampleRate;
    const binCount = this.frequencyData.length;
    const binHz = sampleRate / (binCount * 2);

    const lowBinStart = Math.floor(20 / binHz);
    const lowBinEnd = Math.floor(250 / binHz);
    const midBinEnd = Math.floor(2000 / binHz);
    const highBinEnd = Math.min(binCount - 1, Math.floor(20000 / binHz));

    let lowSum = 0;
    let lowCount = 0;
    for (let i = lowBinStart; i <= lowBinEnd; i++) {
      lowSum += this.frequencyData[i];
      lowCount++;
    }
    const low = lowCount > 0 ? lowSum / lowCount / 255 : 0;

    let midSum = 0;
    let midCount = 0;
    for (let i = lowBinEnd + 1; i <= midBinEnd; i++) {
      midSum += this.frequencyData[i];
      midCount++;
    }
    const mid = midCount > 0 ? midSum / midCount / 255 : 0;

    let highSum = 0;
    let highCount = 0;
    for (let i = midBinEnd + 1; i <= highBinEnd; i++) {
      highSum += this.frequencyData[i];
      highCount++;
    }
    const high = highCount > 0 ? highSum / highCount / 255 : 0;

    this.estimateBPM(low);

    return { low, mid, high, spectrum: this.frequencyData };
  }

  private estimateBPM(lowEnergy: number): void {
    const now = this.getCurrentTime();
    const threshold = 0.65;

    if (lowEnergy > threshold) {
      if (now - this.lastPeakTime > 0.25) {
        if (this.lastPeakTime > 0) {
          const interval = now - this.lastPeakTime;
          const instantBPM = 60 / interval;
          if (instantBPM >= 60 && instantBPM <= 200) {
            this.peakHistory.push(instantBPM);
            if (this.peakHistory.length > 8) {
              this.peakHistory.shift();
            }
            if (this.peakHistory.length >= 3) {
              const avg = this.peakHistory.reduce((a, b) => a + b, 0) / this.peakHistory.length;
              this.bpmHistory.push(avg);
              if (this.bpmHistory.length > 20) {
                this.bpmHistory.shift();
              }
              this.bpmValue = Math.round(
                this.bpmHistory.reduce((a, b) => a + b, 0) / this.bpmHistory.length
              );
            }
          }
        }
        this.lastPeakTime = now;
      }
    }
  }

  private stopSource(): void {
    if (this.source) {
      try {
        this.source.onended = null;
        this.source.stop();
      } catch {
        // ignore
      }
      this.source.disconnect();
      this.source = null;
    }
  }

  dispose(): void {
    this.stopSource();
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioBuffer = null;
  }
}
