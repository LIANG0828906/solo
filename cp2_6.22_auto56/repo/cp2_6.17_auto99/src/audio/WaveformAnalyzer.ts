import type { WaveformPoint, OscillatorType } from '../store';

const MIN_FREQ = 130.81;
const MAX_FREQ = 1046.50;

export class WaveformAnalyzer {
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  public analyze(
    waveformPoints: WaveformPoint[],
    duration: number = 1,
    timbre: OscillatorType = 'sine'
  ): AudioBuffer {
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

    let phase = 0;

    for (let i = 0; i < numSamples; i++) {
      const t = i / numSamples;
      const x = minX + t * xRange;
      const normalizedY = this.linearInterpolate(sortedPoints, x);
      const freq = MIN_FREQ + (normalizedY * 0.5 + 0.5) * (MAX_FREQ - MIN_FREQ);

      const deltaPhase = (2 * Math.PI * freq) / sampleRate;
      phase += deltaPhase;
      if (phase > 2 * Math.PI) {
        phase -= 2 * Math.PI;
      }

      let sampleValue = 0;
      switch (timbre) {
        case 'sine':
          sampleValue = Math.sin(phase);
          break;
        case 'square':
          sampleValue = Math.sin(phase) >= 0 ? 0.8 : -0.8;
          break;
        case 'sawtooth':
          sampleValue = 0.8 * (2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5)));
          break;
      }

      channelData[i] = sampleValue;
    }

    this.applyEnvelope(channelData);

    const peak = this.findPeak(channelData);
    if (peak > 0) {
      const scale = 0.8 / peak;
      for (let i = 0; i < numSamples; i++) {
        channelData[i] *= scale;
      }
    }

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

  private applyEnvelope(channelData: Float32Array): void {
    const totalSamples = channelData.length;
    const fadeSamples = Math.min(Math.floor(totalSamples * 0.02), 512);

    for (let i = 0; i < fadeSamples; i++) {
      const gain = i / fadeSamples;
      channelData[i] *= gain;
      channelData[totalSamples - 1 - i] *= gain;
    }
  }

  private findPeak(channelData: Float32Array): number {
    let peak = 0;
    for (let i = 0; i < channelData.length; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > peak) peak = abs;
    }
    return peak;
  }
}
