import { Track, Effects } from './types';

const SAMPLE_RATE = 44100;
const DURATION_SECONDS = 10;
const TOTAL_SAMPLES = SAMPLE_RATE * DURATION_SECONDS;
const BITS_PER_SAMPLE = 16;
const NUM_CHANNELS = 2;
const BYTE_RATE = (SAMPLE_RATE * NUM_CHANNELS * BITS_PER_SAMPLE) / 8;
const BLOCK_ALIGN = (NUM_CHANNELS * BITS_PER_SAMPLE) / 8;

function generateWaveData(type: 'drum' | 'bass' | 'guitar', duration: number): Float32Array {
  const samples = new Float32Array(SAMPLE_RATE * duration);

  switch (type) {
    case 'drum': {
      const bpm = 120;
      const beatSamples = Math.floor((60 / bpm) * SAMPLE_RATE);

      for (let i = 0; i < samples.length; i++) {
        const beatPos = i % beatSamples;
        const beatProgress = beatPos / beatSamples;

        let sample = 0;

        if (beatProgress < 0.08) {
          const env = Math.exp(-beatProgress * 40);
          sample = Math.sin(2 * Math.PI * 60 * (beatPos / SAMPLE_RATE)) * env * 0.8;
          sample += (Math.random() * 2 - 1) * env * 0.3;
        }

        if (beatPos >= beatSamples / 2 && beatPos < beatSamples / 2 + beatSamples * 0.05) {
          const snareProgress = (beatPos - beatSamples / 2) / SAMPLE_RATE;
          const env = Math.exp(-snareProgress * 80);
          sample = (Math.random() * 2 - 1) * env * 0.6;
          sample += Math.sin(2 * Math.PI * 200 * snareProgress) * env * 0.3;
        }

        const hhFreq = 8000 + Math.random() * 4000;
        const hhEnv = Math.exp(-(beatProgress * 8) % 1 * 15);
        sample += (Math.random() * 2 - 1) * 0.05 * hhEnv;

        samples[i] = Math.max(-1, Math.min(1, sample));
      }
      break;
    }

    case 'bass': {
      const notes = [55, 55, 73.42, 65.41, 55, 55, 82.41, 73.42];
      const noteDuration = SAMPLE_RATE * 0.5;

      for (let i = 0; i < samples.length; i++) {
        const noteIndex = Math.floor(i / noteDuration) % notes.length;
        const freq = notes[noteIndex];
        const noteProgress = (i % noteDuration) / noteDuration;
        const env = Math.exp(-noteProgress * 3) * (1 - noteProgress * 0.5);

        let sample = 0;
        const t = i / SAMPLE_RATE;
        sample += Math.sin(2 * Math.PI * freq * t) * env * 0.6;
        sample += Math.sin(2 * Math.PI * freq * 2 * t) * env * 0.2;
        sample += Math.sin(2 * Math.PI * freq * 3 * t) * env * 0.1;

        samples[i] = Math.max(-1, Math.min(1, sample * 0.9));
      }
      break;
    }

    case 'guitar': {
      const chordFreqs = [
        [196, 246.94, 293.66, 392],
        [174.61, 220, 261.63, 349.23],
        [196, 246.94, 329.63, 392],
        [164.81, 220, 277.18, 329.63],
      ];
      const chordDuration = SAMPLE_RATE * 2;

      for (let i = 0; i < samples.length; i++) {
        const chordIndex = Math.floor(i / chordDuration) % chordFreqs.length;
        const chord = chordFreqs[chordIndex];
        const chordProgress = (i % chordDuration) / chordDuration;

        const env =
          Math.min(chordProgress * 20, 1) *
          Math.exp(-Math.max(0, chordProgress - 0.05) * 1.2) *
          0.7;

        let sample = 0;
        const t = i / SAMPLE_RATE;
        for (let s = 0; s < 4; s++) {
          const stringDelay = s * 0.001;
          const freq = chord[s];
          sample += Math.sin(2 * Math.PI * freq * (t + stringDelay)) * 0.25;
          sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.08;
          sample += (Math.random() * 2 - 1) * 0.005;
        }

        samples[i] = Math.max(-1, Math.min(1, sample * env));
      }
      break;
    }
  }

  return samples;
}

function applyEffects(buffer: Float32Array, effects: Effects, sampleRate: number): Float32Array {
  const { reverb, compression, delay } = effects;
  let result = new Float32Array(buffer);

  if (compression > 0) {
    const threshold = 1 - (compression / 100) * 0.5;
    const ratio = 1 + (compression / 100) * 3;
    const makeup = 1 + (compression / 100) * 0.3;

    for (let i = 0; i < result.length; i++) {
      const abs = Math.abs(result[i]);
      if (abs > threshold) {
        const over = abs - threshold;
        const reduced = over / ratio;
        const sign = result[i] >= 0 ? 1 : -1;
        result[i] = sign * (threshold + reduced) * makeup;
      } else {
        result[i] = result[i] * makeup;
      }
    }
  }

  if (delay > 0) {
    const delayTime = 0.25 + (delay / 100) * 0.35;
    const feedback = 0.3 + (delay / 100) * 0.3;
    const wetLevel = (delay / 100) * 0.5;
    const delaySamples = Math.floor(sampleRate * delayTime);
    const delayed = new Float32Array(result);

    for (let i = delaySamples; i < result.length; i++) {
      delayed[i] = result[i] + delayed[i - delaySamples] * feedback;
    }

    for (let i = 0; i < result.length; i++) {
      result[i] = result[i] * (1 - wetLevel) + delayed[i] * wetLevel;
    }
  }

  if (reverb > 0) {
    const wetLevel = (reverb / 100) * 0.4;
    const numTaps = 8;
    const reverbed = new Float32Array(result);

    for (let tap = 1; tap <= numTaps; tap++) {
      const tapDelay = (tap * 0.03 + (reverb / 100) * 0.1) * sampleRate;
      const tapGain = Math.exp(-tap * 0.4) * 0.6;
      const delayInt = Math.floor(tapDelay);

      for (let i = delayInt; i < result.length; i++) {
        const frac = tapDelay - delayInt;
        const s1 = result[i - delayInt];
        const s2 = i - delayInt + 1 < result.length ? result[i - delayInt + 1] : 0;
        reverbed[i] += (s1 * (1 - frac) + s2 * frac) * tapGain;
      }
    }

    for (let i = 0; i < result.length; i++) {
      result[i] = result[i] * (1 - wetLevel) + reverbed[i] * wetLevel;
    }
  }

  return result;
}

function floatToInt16(sample: number): number {
  const clamped = Math.max(-1, Math.min(1, sample));
  return Math.round(clamped * (clamped < 0 ? 0x8000 : 0x7fff));
}

function writeString(view: DataView, offset: number, str: string): number {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
  return offset + str.length;
}

export function generateInitialWaveData(type: 'drum' | 'bass' | 'guitar'): number[] {
  const previewLength = 441;
  const fullWave = generateWaveData(type, 1);
  const result: number[] = [];
  const step = Math.floor(fullWave.length / previewLength);

  for (let i = 0; i < previewLength; i++) {
    let sum = 0;
    const start = i * step;
    const end = Math.min(start + step, fullWave.length);
    for (let j = start; j < end; j++) {
      sum += fullWave[j];
    }
    result.push(sum / (end - start));
  }

  return result;
}

export async function mixAndExport(
  tracks: Track[],
  effects: Effects,
  masterVolume: number
): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const numChannels = NUM_CHANNELS;
      const activeTracks = tracks.filter((t) => !t.muted);

      if (activeTracks.length === 0) {
        const silence = new Float32Array(TOTAL_SAMPLES * numChannels);
        const wavBuffer = encodeWAV(silence, numChannels);
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        resolve(URL.createObjectURL(blob));
        return;
      }

      const mixed = new Float32Array(TOTAL_SAMPLES);
      const masterGain = (masterVolume / 100) * 0.8;

      for (const track of activeTracks) {
        const trackWave = generateWaveData(track.type, DURATION_SECONDS);
        const trackGain = (track.volume / 100) * masterGain;

        for (let i = 0; i < TOTAL_SAMPLES; i++) {
          mixed[i] += trackWave[i] * trackGain;
        }
      }

      const masterPeak = findPeak(mixed);
      if (masterPeak > 0.95) {
        const normalize = 0.95 / masterPeak;
        for (let i = 0; i < mixed.length; i++) {
          mixed[i] *= normalize;
        }
      }

      const processed = applyEffects(mixed, effects, SAMPLE_RATE);

      for (let i = 0; i < processed.length; i++) {
        processed[i] = Math.max(-1, Math.min(1, processed[i]));
      }

      const interleaved = new Float32Array(TOTAL_SAMPLES * numChannels);
      for (let i = 0; i < TOTAL_SAMPLES; i++) {
        interleaved[i * 2] = processed[i];
        interleaved[i * 2 + 1] = processed[i];
      }

      const wavBuffer = encodeWAV(interleaved, numChannels);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      resolve(URL.createObjectURL(blob));
    }, 2000);
  });
}

function findPeak(buffer: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < buffer.length; i++) {
    const abs = Math.abs(buffer[i]);
    if (abs > peak) peak = abs;
  }
  return peak;
}

function encodeWAV(samples: Float32Array, numChannels: number): ArrayBuffer {
  const dataSize = samples.length * 2;
  const bufferSize = 44 + dataSize;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  let offset = 0;

  offset = writeString(view, offset, 'RIFF');
  view.setUint32(offset, 36 + dataSize, true);
  offset += 4;

  offset = writeString(view, offset, 'WAVE');
  offset = writeString(view, offset, 'fmt ');
  view.setUint32(offset, 16, true);
  offset += 4;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, numChannels, true);
  offset += 2;
  view.setUint32(offset, SAMPLE_RATE, true);
  offset += 4;
  view.setUint32(offset, BYTE_RATE, true);
  offset += 4;
  view.setUint16(offset, BLOCK_ALIGN, true);
  offset += 2;
  view.setUint16(offset, BITS_PER_SAMPLE, true);
  offset += 2;

  offset = writeString(view, offset, 'data');
  view.setUint32(offset, dataSize, true);
  offset += 4;

  for (let i = 0; i < samples.length; i++) {
    view.setInt16(offset, floatToInt16(samples[i]), true);
    offset += 2;
  }

  return buffer;
}
