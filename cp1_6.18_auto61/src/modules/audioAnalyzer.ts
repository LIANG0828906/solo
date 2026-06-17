import type { EmotionResult, EmotionType } from '@/types';

export async function analyzeAudio(arrayBuffer: ArrayBuffer): Promise<EmotionResult> {
  return new Promise((resolve) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    audioContext.decodeAudioData(arrayBuffer.slice(0), (audioBuffer) => {
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const duration = audioBuffer.duration;

      const { avgEnergy, energyVariance, zeroCrossingRate, centroid } =
        extractFeatures(channelData, sampleRate);

      const { emotion, intensity } = mapFeaturesToEmotion(
        avgEnergy,
        energyVariance,
        zeroCrossingRate,
        centroid,
        duration
      );

      audioContext.close();
      resolve({ emotion, intensity });
    });
  });
}

function extractFeatures(
  channelData: Float32Array,
  sampleRate: number
): {
  avgEnergy: number;
  energyVariance: number;
  zeroCrossingRate: number;
  centroid: number;
} {
  const blockSize = Math.floor(sampleRate * 0.05);
  const numBlocks = Math.floor(channelData.length / blockSize);
  const energies: number[] = [];
  let totalZeroCrossings = 0;
  let totalEnergy = 0;

  for (let i = 0; i < numBlocks; i++) {
    const start = i * blockSize;
    let blockEnergy = 0;
    let prevSample = 0;

    for (let j = 0; j < blockSize; j++) {
      const sample = channelData[start + j] || 0;
      blockEnergy += sample * sample;

      if (j > 0 && (sample >= 0 && prevSample < 0) || (sample < 0 && prevSample >= 0)) {
        totalZeroCrossings++;
      }
      prevSample = sample;
    }

    const rms = Math.sqrt(blockEnergy / blockSize);
    energies.push(rms);
    totalEnergy += rms;
  }

  const avgEnergy = totalEnergy / numBlocks;
  const zeroCrossingRate = totalZeroCrossings / channelData.length;

  let varianceSum = 0;
  for (const e of energies) {
    varianceSum += (e - avgEnergy) ** 2;
  }
  const energyVariance = varianceSum / numBlocks;

  const fftSize = 2048;
  let centroidSum = 0;
  let weightSum = 0;
  const numFFTBlocks = Math.min(10, numBlocks);

  for (let b = 0; b < numFFTBlocks; b++) {
    const start = Math.floor((b / numFFTBlocks) * numBlocks) * blockSize;
    const magnitudes = computeFFTMagnitudes(channelData, start, fftSize);

    for (let i = 0; i < magnitudes.length; i++) {
      const freq = (i * sampleRate) / fftSize;
      centroidSum += freq * magnitudes[i];
      weightSum += magnitudes[i];
    }
  }

  const centroid = weightSum > 0 ? centroidSum / weightSum : 0;

  return { avgEnergy, energyVariance, zeroCrossingRate, centroid };
}

function computeFFTMagnitudes(data: Float32Array, start: number, size: number): Float32Array {
  const n = size;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    real[i] = data[start + i] || 0;
    imag[i] = 0;
  }

  for (let size_ = 2; size_ <= n; size_ <<= 1) {
    const half = size_ >> 1;
    const wReal = Math.cos((2 * Math.PI) / size_);
    const wImag = Math.sin((2 * Math.PI) / size_);

    for (let i = 0; i < n; i += size_) {
      let wr = 1;
      let wi = 0;

      for (let j = 0; j < half; j++) {
        const tReal = wr * real[i + j + half] - wi * imag[i + j + half];
        const tImag = wr * imag[i + j + half] + wi * real[i + j + half];

        real[i + j + half] = real[i + j] - tReal;
        imag[i + j + half] = imag[i + j] - tImag;
        real[i + j] = real[i + j] + tReal;
        imag[i + j] = imag[i + j] + tImag;

        const newWr = wr * wReal - wi * wImag;
        const newWi = wr * wImag + wi * wReal;
        wr = newWr;
        wi = newWi;
      }
    }
  }

  const magnitudes = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    magnitudes[i] = Math.sqrt(real[i] ** 2 + imag[i] ** 2);
  }

  return magnitudes;
}

function mapFeaturesToEmotion(
  avgEnergy: number,
  energyVariance: number,
  zeroCrossingRate: number,
  centroid: number,
  duration: number
): { emotion: EmotionType; intensity: number } {
  const normalizedEnergy = Math.min(avgEnergy / 0.5, 1);
  const normalizedVariance = Math.min(energyVariance / 0.1, 1);
  const normalizedZCR = Math.min(zeroCrossingRate * 100, 1);
  const normalizedCentroid = Math.min(centroid / 2000, 1);

  const scores: Record<EmotionType, number> = {
    happy:
      normalizedEnergy * 0.3 +
      normalizedVariance * 0.2 +
      normalizedZCR * 0.3 +
      normalizedCentroid * 0.2,
    sad:
      (1 - normalizedEnergy) * 0.4 +
      (1 - normalizedVariance) * 0.3 +
      (1 - normalizedZCR) * 0.3,
    angry:
      normalizedEnergy * 0.4 +
      normalizedVariance * 0.4 +
      normalizedCentroid * 0.2,
    calm:
      (1 - normalizedEnergy) * 0.3 +
      (1 - normalizedVariance) * 0.3 +
      (1 - normalizedZCR) * 0.2 +
      (1 - normalizedCentroid) * 0.2,
  };

  let maxEmotion: EmotionType = 'calm';
  let maxScore = 0;

  for (const [emotion, score] of Object.entries(scores) as [EmotionType, number][]) {
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion;
    }
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const intensity = totalScore > 0 ? Math.min(maxScore / (totalScore / 4), 1) : 0.5;

  const seed = Math.sin(avgEnergy * 1000 + duration) * 0.5 + 0.5;
  if (intensity < 0.35) {
    const emotions: EmotionType[] = ['happy', 'sad', 'angry', 'calm'];
    maxEmotion = emotions[Math.floor(seed * 4) % 4];
  }

  return {
    emotion: maxEmotion,
    intensity: Math.max(0.3, Math.min(1, intensity + seed * 0.2)),
  };
}

export function createAudioAnalyzer(audioElement: HTMLAudioElement): {
  getSpectrumData: () => Float32Array;
  getAverageEnergy: () => number;
  connect: () => void;
  disconnect: () => void;
} {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  const source = audioContext.createMediaElementSource(audioElement);
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const floatData = new Float32Array(bufferLength);

  return {
    connect: () => {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    },
    disconnect: () => {
      audioContext.close();
    },
    getSpectrumData: (): Float32Array => {
      analyser.getByteFrequencyData(dataArray);
      for (let i = 0; i < bufferLength; i++) {
        floatData[i] = dataArray[i] / 255;
      }
      return floatData;
    },
    getAverageEnergy: (): number => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      return sum / bufferLength / 255;
    },
  };
}
