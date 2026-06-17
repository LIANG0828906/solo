import type { BeatData } from '../types';

export class BeatAnalyzer {
  private audioContext: AudioContext | null = null;

  init(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  getContext(): AudioContext | null {
    return this.audioContext;
  }

  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  generateBeatData(bpm: number, durationMs: number): BeatData {
    const beatInterval = 60000 / bpm;
    const timestamps: number[] = [];
    for (let t = beatInterval; t <= durationMs; t += beatInterval) {
      timestamps.push(Math.round(t));
    }
    return { timestamps, bpm };
  }

  findNearestBeat(currentTime: number, beatTimestamps: number[]): { index: number; offset: number } {
    let nearestIndex = -1;
    let minOffset = Infinity;
    for (let i = 0; i < beatTimestamps.length; i++) {
      const offset = currentTime - beatTimestamps[i];
      const absOffset = Math.abs(offset);
      if (absOffset < minOffset) {
        minOffset = absOffset;
        nearestIndex = i;
      }
      if (beatTimestamps[i] > currentTime && absOffset > minOffset) {
        break;
      }
    }
    return { index: nearestIndex, offset: currentTime - beatTimestamps[nearestIndex] };
  }

  evaluateHit(offset: number): 'perfect' | 'good' | 'miss' {
    const absOffset = Math.abs(offset);
    if (absOffset <= 50) return 'perfect';
    if (absOffset <= 150) return 'good';
    return 'miss';
  }

  async analyzeAudioBuffer(buffer: AudioBuffer): Promise<BeatData> {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const bpm = this.estimateBPM(channelData, sampleRate);
    const durationMs = (buffer.length / sampleRate) * 1000;
    return this.generateBeatData(bpm, durationMs);
  }

  private estimateBPM(channelData: Float32Array, sampleRate: number): number {
    const windowSize = Math.floor(sampleRate * 0.05);
    const energies: number[] = [];
    for (let i = 0; i < channelData.length; i += windowSize) {
      let energy = 0;
      const end = Math.min(i + windowSize, channelData.length);
      for (let j = i; j < end; j++) {
        energy += channelData[j] * channelData[j];
      }
      energies.push(energy / (end - i));
    }
    const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
    const threshold = avgEnergy * 1.3;
    const beats: number[] = [];
    for (let i = 0; i < energies.length; i++) {
      if (energies[i] > threshold) {
        beats.push(i);
      }
    }
    if (beats.length < 2) return 128;
    let totalInterval = 0;
    for (let i = 1; i < beats.length; i++) {
      totalInterval += (beats[i] - beats[i - 1]) * windowSize;
    }
    const avgIntervalSamples = totalInterval / (beats.length - 1);
    const bpm = (60 * sampleRate) / avgIntervalSamples;
    return Math.max(100, Math.min(160, Math.round(bpm)));
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
