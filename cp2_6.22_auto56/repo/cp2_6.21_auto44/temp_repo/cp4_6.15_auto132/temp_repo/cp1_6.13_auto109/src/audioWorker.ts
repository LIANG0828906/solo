const FFT_SIZE = 256;
const HALF_FFT = FFT_SIZE / 2;
const SAMPLE_RATE = 44100;
const FREQ_RESOLUTION = SAMPLE_RATE / FFT_SIZE;

const LOW_BAND_MAX = Math.floor(250 / FREQ_RESOLUTION);
const MID_BAND_MAX = Math.floor(2000 / FREQ_RESOLUTION);
const HIGH_BAND_MAX = Math.min(Math.floor(20000 / FREQ_RESOLUTION), HALF_FFT - 1);

const LOG_COMPRESSION_GAMMA = 15;
const THRESHOLD_WINDOW = 60;
const THRESHOLD_DELTA = 1.8;
const PEAK_WINDOW_SIZE = 7;
const MIN_BEAT_INTERVAL_MS = 250;
const ONSET_BUFFER_SIZE = 512;
const FRAME_INTERVAL_MS = 16;
const BPM_MIN = 100;
const BPM_MAX = 200;

type FrequencyBand = {
  low: number;
  mid: number;
  high: number;
};

type BeatEvent = {
  time: number;
  strength: number;
  bpm: number;
};

type WorkerResult =
  | { type: 'bands'; bands: FrequencyBand }
  | { type: 'beat'; beat: BeatEvent };

type WorkerMessage =
  | { type: 'analyze'; spectrum: ArrayBuffer; timestamp: number }
  | { type: 'reset' };

let lastCompressedSpectrum: Float32Array | null = null;
let fluxHistory: number[] = [];
let beatTimes: number[] = [];
let lastBeatTime = 0;
let onsetStrengthBuffer: number[] = [];
let smoothedFlux = 0;
const SMOOTHING_ALPHA = 0.3;

function compress(value: number): number {
  return Math.log(1 + LOG_COMPRESSION_GAMMA * Math.max(0, value));
}

function calculateBands(spectrum: Uint8Array): FrequencyBand {
  let low = 0, mid = 0, high = 0;
  let lowCount = 0, midCount = 0, highCount = 0;

  for (let i = 0; i < spectrum.length; i++) {
    const val = spectrum[i] / 255;
    if (i <= LOW_BAND_MAX) {
      low += val;
      lowCount++;
    } else if (i <= MID_BAND_MAX) {
      mid += val;
      midCount++;
    } else if (i <= HIGH_BAND_MAX) {
      high += val;
      highCount++;
    }
  }

  return {
    low: lowCount > 0 ? low / lowCount : 0,
    mid: midCount > 0 ? mid / midCount : 0,
    high: highCount > 0 ? high / highCount : 0
  };
}

function computeSpectralFlux(spectrum: Uint8Array): number {
  const compressed = new Float32Array(HALF_FFT);
  for (let i = 0; i < HALF_FFT; i++) {
    compressed[i] = compress(spectrum[i] / 255);
  }

  if (!lastCompressedSpectrum) {
    lastCompressedSpectrum = compressed;
    return 0;
  }

  let flux = 0;
  for (let i = 0; i < HALF_FFT; i++) {
    const diff = compressed[i] - lastCompressedSpectrum[i];
    if (diff > 0) {
      const weight = 1 + (1 - i / HALF_FFT) * 0.5;
      flux += weight * diff * diff;
    }
  }

  lastCompressedSpectrum = compressed;

  smoothedFlux = SMOOTHING_ALPHA * flux + (1 - SMOOTHING_ALPHA) * smoothedFlux;
  return smoothedFlux;
}

function adaptiveThreshold(flux: number): boolean {
  fluxHistory.push(flux);
  if (fluxHistory.length > THRESHOLD_WINDOW) {
    fluxHistory.shift();
  }

  if (fluxHistory.length < 20) return false;

  let sum = 0;
  for (let i = 0; i < fluxHistory.length; i++) {
    sum += fluxHistory[i];
  }
  const mean = sum / fluxHistory.length;

  let variance = 0;
  for (let i = 0; i < fluxHistory.length; i++) {
    variance += Math.pow(fluxHistory[i] - mean, 2);
  }
  variance /= fluxHistory.length;
  const stdDev = Math.sqrt(variance);

  return flux > mean + THRESHOLD_DELTA * stdDev && flux > mean * 1.5;
}

function isLocalPeak(): boolean {
  const len = fluxHistory.length;
  if (len < PEAK_WINDOW_SIZE * 2 + 1) return false;

  const current = fluxHistory[len - 1];
  const start = Math.max(0, len - 1 - PEAK_WINDOW_SIZE);
  const end = len - 2;

  for (let i = start; i <= end; i++) {
    if (fluxHistory[i] >= current) return false;
  }

  return true;
}

function estimateBPM(): number {
  const len = onsetStrengthBuffer.length;
  if (len < 100) return 120;

  const minLagSamples = Math.floor(60000 / (BPM_MAX * FRAME_INTERVAL_MS));
  const maxLagSamples = Math.ceil(60000 / (BPM_MIN * FRAME_INTERVAL_MS));

  let bestLag = 0;
  let bestCorr = -Infinity;

  for (let lag = minLagSamples; lag <= Math.min(maxLagSamples, Math.floor(len / 2)); lag++) {
    let corr = 0;
    let count = 0;
    for (let i = 0; i < len - lag; i++) {
      corr += onsetStrengthBuffer[i] * onsetStrengthBuffer[i + lag];
      count++;
    }
    if (count > 0) corr /= count;

    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  if (bestLag === 0) return 120;

  const beatPeriodMs = bestLag * FRAME_INTERVAL_MS;
  let bpm = Math.round(60000 / beatPeriodMs);
  bpm = Math.max(BPM_MIN, Math.min(BPM_MAX, bpm));

  return bpm;
}

function detectBeat(spectrum: Uint8Array, timestamp: number): BeatEvent | null {
  const flux = computeSpectralFlux(spectrum);

  onsetStrengthBuffer.push(flux);
  if (onsetStrengthBuffer.length > ONSET_BUFFER_SIZE) {
    onsetStrengthBuffer.shift();
  }

  if (!adaptiveThreshold(flux)) return null;
  if (!isLocalPeak()) return null;
  if (timestamp - lastBeatTime < MIN_BEAT_INTERVAL_MS) return null;

  lastBeatTime = timestamp;
  beatTimes.push(timestamp);
  if (beatTimes.length > 30) beatTimes.shift();

  const bpm = estimateBPM();
  const strength = Math.min(1, flux / 30);

  return {
    time: timestamp,
    strength: strength,
    bpm: bpm
  };
}

const ctx = self as unknown as Worker;

ctx.onmessage = function(e: MessageEvent) {
  const data = e.data as WorkerMessage;
  if (data.type === 'analyze' && data.spectrum) {
    const spectrum = new Uint8Array(data.spectrum);
    const bands = calculateBands(spectrum);
    const timestamp = data.timestamp || 0;

    const result1: WorkerResult = { type: 'bands', bands };
    ctx.postMessage(result1);

    const beat = detectBeat(spectrum, timestamp);
    if (beat) {
      const result2: WorkerResult = { type: 'beat', beat };
      ctx.postMessage(result2);
    }
  } else if (data.type === 'reset') {
    beatTimes = [];
    lastBeatTime = 0;
    lastCompressedSpectrum = null;
    fluxHistory = [];
    onsetStrengthBuffer = [];
    smoothedFlux = 0;
  }
};

export {};
