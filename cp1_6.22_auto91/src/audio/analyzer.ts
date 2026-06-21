export interface FrequencyData {
  low: number;
  mid: number;
  high: number;
  overall: number;
  spectrum: Uint8Array;
}

export interface BeatEvent {
  type: 'low' | 'mid' | 'high';
  strength: number;
  timestamp: number;
}

type BeatCallback = (beat: BeatEvent) => void;
type FrequencyCallback = (data: FrequencyData) => void;

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private frequencyData: Float32Array | null = null;

  private beatCallbacks: BeatCallback[] = [];
  private frequencyCallbacks: FrequencyCallback[] = [];

  private lowHistory: number[] = [];
  private midHistory: number[] = [];
  private highHistory: number[] = [];

  private lastLowBeat = 0;
  private lastMidBeat = 0;
  private lastHighBeat = 0;

  private animationFrameId: number | null = null;
  private isRunning = false;

  connect(audioElement: HTMLAudioElement): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.source) {
      this.source.disconnect();
    }

    this.source = this.audioContext.createMediaElementSource(audioElement);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.7;

    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    this.frequencyData = new Float32Array(bufferLength);
  }

  onBeat(callback: BeatCallback): () => void {
    this.beatCallbacks.push(callback);
    return () => {
      this.beatCallbacks = this.beatCallbacks.filter((cb) => cb !== callback);
    };
  }

  onFrequencyData(callback: FrequencyCallback): () => void {
    this.frequencyCallbacks.push(callback);
    return () => {
      this.frequencyCallbacks = this.frequencyCallbacks.filter((cb) => cb !== callback);
    };
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  private loop = (): void => {
    if (!this.isRunning || !this.analyser || !this.dataArray || !this.frequencyData) {
      this.animationFrameId = requestAnimationFrame(this.loop);
      return;
    }

    this.analyser.getByteFrequencyData(this.dataArray as Uint8Array<ArrayBuffer>);
    this.analyser.getFloatFrequencyData(this.frequencyData as Float32Array<ArrayBuffer>);

    const lowRange = Math.floor(this.dataArray.length * 0.1);
    const midRange = Math.floor(this.dataArray.length * 0.5);

    let lowSum = 0;
    let midSum = 0;
    let highSum = 0;

    for (let i = 0; i < lowRange; i++) {
      lowSum += this.dataArray[i];
    }
    for (let i = lowRange; i < midRange; i++) {
      midSum += this.dataArray[i];
    }
    for (let i = midRange; i < this.dataArray.length; i++) {
      highSum += this.dataArray[i];
    }

    const low = lowSum / lowRange / 255;
    const mid = midSum / (midRange - lowRange) / 255;
    const high = highSum / (this.dataArray.length - midRange) / 255;
    const overall = (low + mid + high) / 3;

    const freqData: FrequencyData = {
      low,
      mid,
      high,
      overall,
      spectrum: this.dataArray.slice(),
    };

    this.frequencyCallbacks.forEach((cb) => cb(freqData));

    this.detectBeat('low', low, this.lowHistory, 60);
    this.detectBeat('mid', mid, this.midHistory, 40);
    this.detectBeat('high', high, this.highHistory, 30);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private detectBeat(type: 'low' | 'mid' | 'high', value: number, history: number[], cooldown: number): void {
    history.push(value);
    if (history.length > 43) {
      history.shift();
    }

    const avg = history.reduce((a, b) => a + b, 0) / history.length;
    const threshold = avg * 1.35;
    const now = performance.now();

    let lastBeat: number;
    switch (type) {
      case 'low':
        lastBeat = this.lastLowBeat;
        break;
      case 'mid':
        lastBeat = this.lastMidBeat;
        break;
      case 'high':
        lastBeat = this.lastHighBeat;
        break;
    }

    if (value > threshold && value > 0.25 && now - lastBeat > cooldown) {
      const strength = Math.min(1, (value - avg) * 3);
      const beat: BeatEvent = { type, strength, timestamp: now };

      switch (type) {
        case 'low':
          this.lastLowBeat = now;
          break;
        case 'mid':
          this.lastMidBeat = now;
          break;
        case 'high':
          this.lastHighBeat = now;
          break;
      }

      this.beatCallbacks.forEach((cb) => cb(beat));
    }
  }

  dispose(): void {
    this.stop();
    this.beatCallbacks = [];
    this.frequencyCallbacks = [];
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
  }
}

export const audioAnalyzer = new AudioAnalyzer();
