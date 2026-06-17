import type { WaveformPoint } from '../store';

export class WaveformAnalyzer {
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  public analyze(waveformPoints: WaveformPoint[], duration: number = 1): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const numSamples = Math.floor(sampleRate * duration);
    const audioBuffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    if (waveformPoints.length < 2) {
      for (let i = 0; i < numSamples; i++) {
        channelData[i] = 0;
      }
      return audioBuffer;
    }

    const sortedPoints = [...waveformPoints].sort((a, b) => a.x - b.x);

    const minX = sortedPoints[0].x;
    const maxX = sortedPoints[sortedPoints.length - 1].x;
    const xRange = maxX - minX || 1;

    for (let i = 0; i < numSamples; i++) {
      const t = i / numSamples;
      const x = minX + t * xRange;

      let sampleValue = this.linearInterpolate(sortedPoints, x);

      sampleValue = Math.max(-1, Math.min(1, sampleValue));

      channelData[i] = sampleValue;
    }

    this.applyEnvelope(channelData, sampleRate);

    return audioBuffer;
  }

  private linearInterpolate(points: WaveformPoint[], x: number): number {
    if (points.length === 0) return 0;
    if (x <= points[0].x) return this.normalizeY(points[0].y);
    if (x >= points[points.length - 1].x) return this.normalizeY(points[points.length - 1].y);

    for (let i = 0; i < points.length - 1; i++) {
      if (x >= points[i].x && x <= points[i + 1].x) {
        const t = (x - points[i].x) / (points[i + 1].x - points[i].x);
        const y1 = this.normalizeY(points[i].y);
        const y2 = this.normalizeY(points[i + 1].y);
        return y1 + t * (y2 - y1);
      }
    }

    return 0;
  }

  private normalizeY(y: number): number {
    return y * 2 - 1;
  }

  private applyEnvelope(channelData: Float32Array, sampleRate: number): void {
    const attackTime = 0.01;
    const releaseTime = 0.01;
    const attackSamples = Math.floor(attackTime * sampleRate);
    const releaseSamples = Math.floor(releaseTime * sampleRate);
    const totalSamples = channelData.length;

    for (let i = 0; i < attackSamples && i < totalSamples; i++) {
      channelData[i] *= i / attackSamples;
    }

    for (let i = 0; i < releaseSamples && i < totalSamples; i++) {
      const index = totalSamples - 1 - i;
      channelData[index] *= i / releaseSamples;
    }
  }
}
