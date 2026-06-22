class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private startTime = 0;
  private pauseTime = 0;
  private isPlaying = false;
  private animationFrameId: number | null = null;
  private frequencyData: Uint8Array = new Uint8Array(128);
  private timeData: Uint8Array = new Uint8Array(128);

  onFrequencyUpdate?: (data: Uint8Array) => void;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  onLoaded?: (duration: number) => void;

  constructor() {
    this.initContext();
  }

  private initContext() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0.7;
      this.gainNode.connect(this.audioContext.destination);
      this.analyser.connect(this.gainNode);
    }
  }

  async loadFile(file: File): Promise<void> {
    this.initContext();
    if (!this.audioContext) throw new Error('AudioContext not available');

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    const maxDuration = 120;
    if (this.audioBuffer.duration > maxDuration) {
      console.warn(`Audio duration exceeds ${maxDuration}s limit, will be truncated`);
    }

    if (this.onLoaded) {
      this.onLoaded(this.audioBuffer.duration);
    }
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer || this.isPlaying) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    if (this.analyser) {
      this.source.connect(this.analyser);
    }
    this.source.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.pauseTime = 0;
        if (this.onEnded) this.onEnded();
      }
    };

    this.startTime = this.audioContext.currentTime - this.pauseTime;
    this.source.start(0, this.pauseTime);
    this.isPlaying = true;

    this.startAnalysisLoop();
  }

  pause(): void {
    if (!this.isPlaying || !this.source || !this.audioContext) return;

    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.source.stop();
    this.source.disconnect();
    this.source = null;
    this.isPlaying = false;

    this.stopAnalysisLoop();
  }

  stop(): void {
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
      this.source = null;
    }
    this.isPlaying = false;
    this.pauseTime = 0;
    this.startTime = 0;
    this.stopAnalysisLoop();
  }

  seek(time: number): void {
    if (!this.audioBuffer) return;

    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }

    this.pauseTime = Math.max(0, Math.min(time, this.audioBuffer.duration));

    if (wasPlaying) {
      this.play();
    }
  }

  getFrequencyData(): Uint8Array {
    if (this.analyser && this.isPlaying) {
      this.analyser.getByteFrequencyData(this.frequencyData);
    }
    return this.frequencyData;
  }

  getTimeData(): Uint8Array {
    if (this.analyser && this.isPlaying) {
      this.analyser.getByteTimeDomainData(this.timeData);
    }
    return this.timeData;
  }

  getCurrentTime(): number {
    if (!this.audioContext || !this.isPlaying) {
      return this.pauseTime;
    }
    return this.audioContext.currentTime - this.startTime;
  }

  getDuration(): number {
    return this.audioBuffer?.duration || 0;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private startAnalysisLoop() {
    const loop = () => {
      if (!this.isPlaying) return;

      const freqData = this.getFrequencyData();
      if (this.onFrequencyUpdate) {
        this.onFrequencyUpdate(freqData);
      }

      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.getCurrentTime());
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  private stopAnalysisLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  getAverageFrequency(): number {
    const data = this.getFrequencyData();
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / data.length;
  }

  getLowFrequencyAverage(): number {
    const data = this.getFrequencyData();
    const len = Math.floor(data.length * 0.2);
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += data[i];
    }
    return sum / len;
  }

  getMidHighFrequencyAverage(): number {
    const data = this.getFrequencyData();
    const start = Math.floor(data.length * 0.4);
    const end = Math.floor(data.length * 0.8);
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += data[i];
    }
    return sum / (end - start);
  }

  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const audioEngine = new AudioEngine();
export default audioEngine;
