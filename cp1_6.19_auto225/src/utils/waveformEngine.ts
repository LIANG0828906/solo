import { WaveType, WaveParams, WavePoint, ChannelState } from '../types';

const PERM = new Uint8Array(512);
(function initPerm() {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
})();

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function grad(hash: number, x: number): number {
  return (hash & 1) === 0 ? x : -x;
}

function perlin1D(x: number): number {
  const X = Math.floor(x) & 255;
  x -= Math.floor(x);
  const u = fade(x);
  return lerp(grad(PERM[X], x), grad(PERM[X + 1], x - 1), u);
}

let noiseSeed = 0;
function perlinNoise(t: number, intensity: number): number {
  if (intensity <= 0) return 0;
  noiseSeed += 0.0001;
  const n =
    perlin1D(t * 4 + noiseSeed) * 0.5 +
    perlin1D(t * 8 + noiseSeed * 1.3) * 0.25 +
    perlin1D(t * 16 + noiseSeed * 1.7) * 0.125;
  return n * intensity;
}

function generateSingleWave(
  type: WaveType,
  t: number,
  freq: number,
  amp: number,
  phaseDeg: number,
  dutyCycle: number,
): number {
  const phase = (phaseDeg / 360) * Math.PI * 2;
  const x = 2 * Math.PI * freq * t + phase;

  switch (type) {
    case WaveType.SINE:
      return Math.sin(x) * amp;

    case WaveType.SQUARE: {
      const ratio = dutyCycle;
      const mod = ((x % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const v = mod < Math.PI * 2 * ratio ? 1 : -1;
      return v * amp;
    }

    case WaveType.TRIANGLE: {
      const period = (Math.PI * 2) / freq;
      const tp = (t + phaseDeg / 360 / freq) % period;
      const normalized = tp / period;
      const v = normalized < 0.5 ? 4 * normalized - 1 : 3 - 4 * normalized;
      return v * amp;
    }

    case WaveType.SAWTOOTH: {
      const period = (Math.PI * 2) / freq;
      const tp = (t + phaseDeg / 360 / freq) % period;
      const normalized = tp / period;
      const v = 2 * normalized - 1;
      return v * amp;
    }
  }
}

export const LOG_FREQ_MIN = Math.log(20);
export const LOG_FREQ_MAX = Math.log(2000);

export function sliderToFrequency(sliderVal: number): number {
  const t = Math.max(0, Math.min(1, sliderVal));
  return Math.exp(LOG_FREQ_MIN + t * (LOG_FREQ_MAX - LOG_FREQ_MIN));
}

export function frequencyToSlider(freq: number): number {
  const f = Math.max(20, Math.min(2000, freq));
  return (Math.log(f) - LOG_FREQ_MIN) / (LOG_FREQ_MAX - LOG_FREQ_MIN);
}

export const LOG_TIMEBASE_MIN = Math.log(1);
export const LOG_TIMEBASE_MAX = Math.log(100);

export function sliderToTimebase(sliderVal: number): number {
  const t = Math.max(0, Math.min(1, sliderVal));
  return Math.exp(LOG_TIMEBASE_MIN + t * (LOG_TIMEBASE_MAX - LOG_TIMEBASE_MIN));
}

export function timebaseToSlider(tb: number): number {
  const v = Math.max(1, Math.min(100, tb));
  return (Math.log(v) - LOG_TIMEBASE_MIN) / (LOG_TIMEBASE_MAX - LOG_TIMEBASE_MIN);
}

export interface GenerateResult {
  combined: WavePoint[];
  channels: {
    ch1: WavePoint[];
    ch2: WavePoint[];
    ch3: WavePoint[];
    ch4: WavePoint[];
  };
  sampleCount: number;
  windowDuration: number;
}

export function generateWaveforms(
  channels: ChannelState,
  timeBaseMsPerDiv: number,
  masterMix: number,
): GenerateResult {
  const minFreq = Math.min(
    channels.ch1.frequency,
    channels.ch2.frequency,
    channels.ch3.frequency,
    channels.ch4.frequency,
  );
  const sampleCount = minFreq < 200 ? 2048 : 1024;

  const divisions = 10;
  const windowDuration = (timeBaseMsPerDiv * divisions) / 1000;
  const dt = windowDuration / sampleCount;

  const ch1: WavePoint[] = new Array(sampleCount);
  const ch2: WavePoint[] = new Array(sampleCount);
  const ch3: WavePoint[] = new Array(sampleCount);
  const ch4: WavePoint[] = new Array(sampleCount);
  const combined: WavePoint[] = new Array(sampleCount);

  const arr: [WaveParams, WavePoint[]][] = [
    [channels.ch1, ch1],
    [channels.ch2, ch2],
    [channels.ch3, ch3],
    [channels.ch4, ch4],
  ];

  for (let i = 0; i < sampleCount; i++) {
    const t = i * dt;
    let total = 0;
    let totalMix = 0;

    for (let c = 0; c < 4; c++) {
      const [params, out] = arr[c];
      let v = 0;
      if (params.enabled && params.amplitude > 0) {
        v = generateSingleWave(
          params.type,
          t,
          params.frequency,
          params.amplitude,
          params.phase,
          params.dutyCycle,
        );
        v += perlinNoise(t, params.noiseLevel * params.amplitude);
      }
      out[i] = { time: t, voltage: v };

      if (params.enabled) {
        total += v * params.mix;
        totalMix += params.mix;
      }
    }

    const mixFactor = totalMix > 0 ? 1 / totalMix : 0;
    const finalV = total * mixFactor * masterMix;
    combined[i] = { time: t, voltage: Math.max(-1, Math.min(1, finalV)) };
  }

  return {
    combined,
    channels: { ch1, ch2, ch3, ch4 },
    sampleCount,
    windowDuration,
  };
}
