import type { NoiseParams } from '../types';

export class StaticSimulator {
  calculateNoiseParams(signalStrength: number, manualNoiseMix: number = 0.5): NoiseParams {
    const baseIntensity = 1 - signalStrength / 100;
    const intensity = baseIntensity * 0.7 + manualNoiseMix * 0.3;

    const noiseFrequency = 2000 + Math.random() * 3000;
    const filterQ = 0.5 + signalStrength / 200;

    return {
      intensity: Math.max(0, Math.min(1, intensity)),
      frequency: noiseFrequency,
      filterQ,
    };
  }

  generateNoiseBuffer(audioContext: AudioContext, duration: number = 2): AudioBuffer {
    const sampleRate = audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    return buffer;
  }

  applyTremolo(
    audioContext: AudioContext,
    inputNode: AudioNode,
    intensity: number
  ): { output: AudioNode; lfo: OscillatorNode; gain: GainNode } {
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();

    lfo.frequency.value = 4 + Math.random() * 2;
    lfoGain.gain.value = intensity * 0.3;

    lfo.connect(lfoGain);

    const outputGain = audioContext.createGain();
    inputNode.connect(outputGain);
    lfoGain.connect(outputGain.gain);

    lfo.start();

    return { output: outputGain, lfo, gain: lfoGain };
  }

  applyBandpassFilter(
    audioContext: AudioContext,
    inputNode: AudioNode,
    centerFreq: number,
    q: number
  ): BiquadFilterNode {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = centerFreq;
    filter.Q.value = q;
    inputNode.connect(filter);
    return filter;
  }
}

export const staticSimulator = new StaticSimulator();
