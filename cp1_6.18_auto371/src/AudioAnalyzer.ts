import { BeatAnalysisResult, BeatData } from './types';

const DEFAULT_BPM = 120;
const DEFAULT_DURATION = 180;

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | MediaElementAudioSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private beats: BeatData[] = [];
  private bpm: number = DEFAULT_BPM;
  private duration: number = DEFAULT_DURATION;

  async init(): Promise<void> {
    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }

  async loadFromFile(file: File): Promise<BeatAnalysisResult> {
    if (!this.audioContext) {
      await this.init();
    }

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    this.duration = this.audioBuffer.duration;

    this.analyzeBeats();
    this.setupAudioPlayback();

    return {
      beats: this.beats,
      bpm: this.bpm,
      duration: this.duration,
    };
  }

  loadDefault(): BeatAnalysisResult {
    this.bpm = DEFAULT_BPM;
    this.duration = DEFAULT_DURATION;
    this.generateDefaultBeats();
    return {
      beats: this.beats,
      bpm: this.bpm,
      duration: this.duration,
    };
  }

  private generateDefaultBeats(): void {
    this.beats = [];
    const beatInterval = 60 / this.bpm;
    const totalBeats = Math.floor(this.duration / beatInterval);

    for (let i = 0; i < totalBeats; i++) {
      const timestamp = i * beatInterval;
      const isStrong = i % 4 === 0;
      this.beats.push({
        timestamp,
        intensity: isStrong ? 0.9 : 0.5 + Math.random() * 0.3,
        isStrong,
      });
    }
  }

  private analyzeBeats(): void {
    if (!this.audioBuffer) return;

    this.beats = [];
    const channelData = this.audioBuffer.getChannelData(0);
    const sampleRate = this.audioBuffer.sampleRate;
    const windowSize = Math.floor(sampleRate * 0.05);
    const hopSize = Math.floor(windowSize / 2);

    const energies: number[] = [];
    const timestamps: number[] = [];

    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        energy += channelData[i + j] * channelData[i + j];
      }
      energies.push(energy / windowSize);
      timestamps.push((i + windowSize / 2) / sampleRate);
    }

    if (energies.length < 2) {
      this.generateDefaultBeats();
      return;
    }

    const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
    const variance = energies.reduce((sum, e) => sum + (e - avgEnergy) ** 2, 0) / energies.length;
    const threshold = avgEnergy + Math.sqrt(variance) * 1.3;

    for (let i = 1; i < energies.length - 1; i++) {
      if (energies[i] > threshold && energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
        const intensity = Math.min(1, (energies[i] - avgEnergy) / (Math.sqrt(variance) * 3 + 0.001));
        this.beats.push({
          timestamp: timestamps[i],
          intensity,
          isStrong: intensity > 0.7,
        });
      }
    }

    if (this.beats.length < 10) {
      this.estimateBPMFromBeats();
      this.generateDefaultBeats();
      return;
    }

    this.estimateBPMFromBeats();

    this.beats = this.beats.filter((beat, index, arr) => {
      if (index === 0) return true;
      const minInterval = 60 / (this.bpm * 2);
      return beat.timestamp - arr[index - 1].timestamp > minInterval;
    });

    for (let i = 0; i < this.beats.length; i++) {
      this.beats[i].isStrong = i % 4 === 0 || this.beats[i].intensity > 0.75;
    }
  }

  private estimateBPMFromBeats(): void {
    if (this.beats.length < 2) {
      this.bpm = DEFAULT_BPM;
      return;
    }

    const intervals: number[] = [];
    for (let i = 1; i < this.beats.length; i++) {
      intervals.push(this.beats[i].timestamp - this.beats[i - 1].timestamp);
    }

    intervals.sort((a, b) => a - b);
    const median = intervals[Math.floor(intervals.length / 2)];
    this.bpm = Math.round(60 / median);

    if (this.bpm < 60) this.bpm *= 2;
    if (this.bpm > 200) this.bpm = Math.round(this.bpm / 2);
    if (this.bpm < 80 || this.bpm > 180) this.bpm = DEFAULT_BPM;
  }

  private setupAudioPlayback(): void {
    if (!this.audioContext || !this.audioBuffer) return;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  play(): void {
    if (this.source && 'start' in this.source && this.audioBuffer) {
      try {
        this.source = this.audioContext!.createBufferSource();
        (this.source as AudioBufferSourceNode).buffer = this.audioBuffer;
        (this.source as AudioBufferSourceNode).connect(this.analyser!);
        (this.source as AudioBufferSourceNode).start(0);
      } catch {
        // ignore playback errors
      }
    }
  }

  stop(): void {
    if (this.source && 'stop' in this.source) {
      try {
        (this.source as AudioBufferSourceNode).stop(0);
      } catch {
        // ignore stop errors
      }
    }
  }

  getBeats(): BeatData[] {
    return this.beats;
  }

  getBPM(): number {
    return this.bpm;
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.audioBuffer = null;
    this.beats = [];
  }
}
