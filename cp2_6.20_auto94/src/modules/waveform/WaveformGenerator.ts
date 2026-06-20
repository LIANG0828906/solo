export type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle';

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
        case 'sawtooth':
          sample = 2 * ((frequency * t + phase / 360) % 1) - 1;
          break;
        case 'triangle': {
          const p = ((frequency * t + phase / 360) % 1);
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
    sampleRate: number = WaveformGenerator.SAMPLE_RATE
  ): Float32Array {
    const result = new Float32Array(buffer.length);
    const totalSamples = buffer.length;

    const attackEnd = Math.floor(adsr.attack * totalSamples * 0.25);
    const decayEnd = attackEnd + Math.floor(adsr.decay * totalSamples * 0.25);
    const releaseStart = totalSamples - Math.floor(adsr.release * totalSamples * 0.25);

    for (let i = 0; i < totalSamples; i++) {
      let envelope = 1.0;

      if (i < attackEnd && attackEnd > 0) {
        envelope = i / attackEnd;
      } else if (i < decayEnd && decayEnd > attackEnd) {
        const decayProgress = (i - attackEnd) / (decayEnd - attackEnd);
        envelope = 1.0 - (1.0 - adsr.sustain) * decayProgress;
      } else if (i >= releaseStart && releaseStart < totalSamples) {
        const releaseProgress = (i - releaseStart) / (totalSamples - releaseStart);
        envelope = adsr.sustain * (1.0 - releaseProgress);
      } else if (i >= decayEnd && i < releaseStart) {
        envelope = adsr.sustain;
      }

      result[i] = buffer[i] * envelope;
    }

    return result;
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
