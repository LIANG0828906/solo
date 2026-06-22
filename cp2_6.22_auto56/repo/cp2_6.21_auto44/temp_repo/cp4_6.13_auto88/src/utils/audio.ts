import { AUDIO_CONSTANTS } from './constants';

export const getFrequencyIndex = (
  frequency: number,
  sampleRate: number,
  fftSize: number
): number => {
  const nyquist = sampleRate / 2;
  return Math.round((frequency / nyquist) * (fftSize / 2));
};

export const getBandEnergy = (
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number,
  lowFreq: number,
  highFreq: number
): number => {
  const lowIndex = getFrequencyIndex(lowFreq, sampleRate, fftSize);
  const highIndex = getFrequencyIndex(highFreq, sampleRate, fftSize);
  const clampedLow = Math.max(0, lowIndex);
  const clampedHigh = Math.min(frequencyData.length - 1, highIndex);

  if (clampedHigh <= clampedLow) return 0;

  let sum = 0;
  for (let i = clampedLow; i <= clampedHigh; i++) {
    sum += frequencyData[i];
  }

  return sum / ((clampedHigh - clampedLow + 1) * 255);
};

export const normalizeAmplitude = (value: number): number => {
  return Math.min(Math.max(value / 255, 0), 1);
};

export const detectBeat = (
  currentEnergy: number,
  energyHistory: number[],
  threshold: number = AUDIO_CONSTANTS.BEAT_THRESHOLD
): { beatDetected: boolean; bpm: number } => {
  if (energyHistory.length < AUDIO_CONSTANTS.BEAT_HISTORY_SIZE) {
    return { beatDetected: false, bpm: 0 };
  }

  const average =
    energyHistory.reduce((sum, val) => sum + val, 0) / energyHistory.length;
  const variance =
    energyHistory.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
    energyHistory.length;
  const stdDev = Math.sqrt(variance);
  const beatThreshold = average + threshold * stdDev;

  const beatDetected = currentEnergy > beatThreshold;

  let bpm = 0;
  if (energyHistory.length >= 2) {
    const recentBeats: number[] = [];
    for (let i = 1; i < energyHistory.length; i++) {
      const prevAvg =
        energyHistory.slice(Math.max(0, i - 10), i).reduce((s, v) => s + v, 0) /
        Math.min(10, i);
      if (energyHistory[i] > prevAvg * 1.5) {
        recentBeats.push(i);
      }
    }
    if (recentBeats.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < recentBeats.length; i++) {
        intervals.push(recentBeats[i] - recentBeats[i - 1]);
      }
      const avgInterval =
        intervals.reduce((s, v) => s + v, 0) / intervals.length;
      bpm = Math.round(60 / (avgInterval / 60));
    }
  }

  return { beatDetected, bpm: Math.min(Math.max(bpm, 60), 200) };
};

export const applySmoothing = (
  currentValue: number,
  previousValue: number,
  smoothingFactor: number
): number => {
  return previousValue * smoothingFactor + currentValue * (1 - smoothingFactor);
};

export const getAudioDuration = async (
  file: File
): Promise<{ duration: number; valid: boolean }> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const duration = audio.duration;
      resolve({
        duration,
        valid: duration <= AUDIO_CONSTANTS.MAX_DURATION,
      });
    };

    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ duration: 0, valid: false });
    };

    audio.src = objectUrl;
  });
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const createAudioContext = (): AudioContext | null => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    return new AudioContextClass();
  } catch (e) {
    console.error('Web Audio API is not supported in this browser:', e);
    return null;
  }
};

export const getMicrophoneStream = async (): Promise<MediaStream | null> => {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    console.error('Failed to get microphone access:', e);
    return null;
  }
};

export const convertFloat32ToUint8 = (float32Array: Float32Array): Uint8Array => {
  const uint8Array = new Uint8Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const value = Math.max(-1, Math.min(1, float32Array[i]));
    uint8Array[i] = Math.round((value + 1) * 127.5);
  }
  return uint8Array;
};

export const calculateRMS = (data: Uint8Array): number => {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const normalized = (data[i] - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / data.length);
};
