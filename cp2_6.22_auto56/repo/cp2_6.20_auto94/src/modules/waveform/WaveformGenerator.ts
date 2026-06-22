export type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface ADSRControlPoints {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  attackCurve: number;
  decayCurve: number;
  releaseCurve: number;
}

export interface ADSREnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface TrackParams {
  waveType: WaveType;
  frequency: number;
  amplitude: number;
  phase: number;
  adsr: ADSREnvelope;
  volume: number;
  pan: number;
  muted: boolean;
}

export class WaveformGenerator {
  static SAMPLE_RATE = 44100;
  static DURATION = 4;

  private static cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return uuu * p0 + 3 * uu * t * p1 + 3 * u * tt * p2 + ttt * p3;
  }

  private static bezierEase(t: number, curve: number): number {
    const cp1x = Math.max(0, Math.min(1, 0.5 + curve * 0.5));
    const cp1y = Math.max(0, Math.min(1, 0.5 + curve * 0.5));
    const cp2x = 1 - cp1x;
    const cp2y = 1 - cp1y;
    return WaveformGenerator.cubicBezier(t, 0, cp1y, cp2y, 1);
  }

  static generate(
    type: WaveType,
    frequency: number,
    amplitude: number,
    phase: number,
    sampleRate: number = WaveformGenerator.SAMPLE_RATE,
    duration: number = WaveformGenerator.DURATION
  ): Float32Array {
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);
    const phaseRad = (phase * Math.PI) / 180;

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const angle = 2 * Math.PI * frequency * t + phaseRad;
      let sample = 0;

      switch (type) {
        case 'sine':
          sample = Math.sin(angle);
          break;
        case 'square':
          sample = Math.sin(angle) >= 0 ? 1 : -1;
          break;
        case 'sawtooth': {
          const sawPhase = (frequency * t + phase / 360) % 1;
          sample = 2 * sawPhase - 1;
          break;
        }
        case 'triangle': {
          const p = (frequency * t + phase / 360) % 1;
          sample = 4 * Math.abs(p - 0.5) - 1;
          break;
        }
      }

      buffer[i] = sample * amplitude;
    }

    return buffer;
  }

  static applyADSR(
    buffer: Float32Array,
    adsr: ADSREnvelope,
    sampleRate: number = WaveformGenerator.SAMPLE_RATE,
    controlPoints?: Partial<ADSRControlPoints>
  ): Float32Array {
    const result = new Float32Array(buffer.length);
    const totalSamples = buffer.length;

    const attackCurve = controlPoints?.attackCurve ?? 0;
    const decayCurve = controlPoints?.decayCurve ?? 0;
    const releaseCurve = controlPoints?.releaseCurve ?? 0;

    const attackEnd = Math.floor(adsr.attack * totalSamples * 0.25);
    const decayEnd = attackEnd + Math.floor(adsr.decay * totalSamples * 0.25);
    const releaseStart = totalSamples - Math.floor(adsr.release * totalSamples * 0.25);

    for (let i = 0; i < totalSamples; i++) {
      let envelope = 1.0;

      if (i < attackEnd && attackEnd > 0) {
        const progress = i / attackEnd;
        envelope = WaveformGenerator.bezierEase(progress, attackCurve);
      } else if (i < decayEnd && decayEnd > attackEnd) {
        const progress = (i - attackEnd) / (decayEnd - attackEnd);
        const eased = WaveformGenerator.bezierEase(progress, decayCurve);
        envelope = 1.0 - (1.0 - adsr.sustain) * eased;
      } else if (i >= releaseStart && releaseStart < totalSamples) {
        const progress = (i - releaseStart) / (totalSamples - releaseStart);
        const eased = WaveformGenerator.bezierEase(progress, releaseCurve);
        envelope = adsr.sustain * (1.0 - eased);
      } else if (i >= decayEnd && i < releaseStart) {
        envelope = adsr.sustain;
      }

      result[i] = buffer[i] * envelope;
    }

    return result;
  }

  static getADSRSampleValue(
    sampleIndex: number,
    totalSamples: number,
    adsr: ADSREnvelope,
    controlPoints?: Partial<ADSRControlPoints>
  ): number {
    const attackCurve = controlPoints?.attackCurve ?? 0;
    const decayCurve = controlPoints?.decayCurve ?? 0;
    const releaseCurve = controlPoints?.releaseCurve ?? 0;

    const attackEnd = Math.floor(adsr.attack * totalSamples * 0.25);
    const decayEnd = attackEnd + Math.floor(adsr.decay * totalSamples * 0.25);
    const releaseStart = totalSamples - Math.floor(adsr.release * totalSamples * 0.25);

    if (sampleIndex < attackEnd && attackEnd > 0) {
      const progress = sampleIndex / attackEnd;
      return WaveformGenerator.bezierEase(progress, attackCurve);
    } else if (sampleIndex < decayEnd && decayEnd > attackEnd) {
      const progress = (sampleIndex - attackEnd) / (decayEnd - attackEnd);
      const eased = WaveformGenerator.bezierEase(progress, decayCurve);
      return 1.0 - (1.0 - adsr.sustain) * eased;
    } else if (sampleIndex >= releaseStart && releaseStart < totalSamples) {
      const progress = (sampleIndex - releaseStart) / (totalSamples - releaseStart);
      const eased = WaveformGenerator.bezierEase(progress, releaseCurve);
      return adsr.sustain * (1.0 - eased);
    }
    return adsr.sustain;
  }

  static dBToLinear(dB: number): number {
    if (dB <= -60) return 0;
    return Math.pow(10, dB / 20);
  }

  static mixTracks(
    tracks: TrackParams[],
    sampleRate: number = WaveformGenerator.SAMPLE_RATE,
    duration: number = WaveformGenerator.DURATION
  ): Float32Array {
    const numSamples = Math.floor(sampleRate * duration);
    const mixed = new Float32Array(numSamples);
    const activeTracks = tracks.filter(t => !t.muted);

    if (activeTracks.length === 0) return mixed;

    for (const track of activeTracks) {
      let wave = WaveformGenerator.generate(
        track.waveType,
        track.frequency,
        track.amplitude,
        track.phase,
        sampleRate,
        duration
      );

      wave = WaveformGenerator.applyADSR(wave, track.adsr, sampleRate);

      const gain = WaveformGenerator.dBToLinear(track.volume);
      const panLeft = Math.cos(((track.pan + 1) / 2) * Math.PI / 2);
      const panRight = Math.sin(((track.pan + 1) / 2) * Math.PI / 2);
      const panGain = (panLeft + panRight) / 2;

      for (let i = 0; i < numSamples; i++) {
        mixed[i] += wave[i] * gain * panGain;
      }
    }

    let maxAbs = 0;
    for (let i = 0; i < numSamples; i++) {
      maxAbs = Math.max(maxAbs, Math.abs(mixed[i]));
    }
    if (maxAbs > 1) {
      for (let i = 0; i < numSamples; i++) {
        mixed[i] /= maxAbs;
      }
    }

    return mixed;
  }

  static generateTrackBuffer(
    track: TrackParams,
    sampleRate: number = WaveformGenerator.SAMPLE_RATE,
    duration: number = WaveformGenerator.DURATION
  ): Float32Array {
    let wave = WaveformGenerator.generate(
      track.waveType,
      track.frequency,
      track.amplitude,
      track.phase,
      sampleRate,
      duration
    );
    wave = WaveformGenerator.applyADSR(wave, track.adsr, sampleRate);
    const gain = WaveformGenerator.dBToLinear(track.volume);
    for (let i = 0; i < wave.length; i++) {
      wave[i] *= gain;
    }
    return wave;
  }
}
