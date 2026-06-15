/// <reference lib="webworker" />

const FFT_SIZE = 2048;

class FFT {
  private n: number;
  private inverse: boolean;
  private cosTable: Float32Array;
  private sinTable: Float32Array;

  constructor(size: number, inverse: boolean = false) {
    this.n = size;
    this.inverse = inverse;
    this.cosTable = new Float32Array(size / 2);
    this.sinTable = new Float32Array(size / 2);

    for (let i = 0; i < size / 2; i++) {
      const angle = (2 * Math.PI * i) / size;
      this.cosTable[i] = Math.cos(angle);
      this.sinTable[i] = inverse ? Math.sin(angle) : -Math.sin(angle);
    }
  }

  transform(real: Float32Array, imag: Float32Array): void {
    const n = this.n;
    const cosTable = this.cosTable;
    const sinTable = this.sinTable;

    let j = 0;
    for (let i = 1; i < n - 1; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) {
        j ^= bit;
      }
      j ^= bit;

      if (i < j) {
        let temp = real[i];
        real[i] = real[j];
        real[j] = temp;
        temp = imag[i];
        imag[i] = imag[j];
        imag[j] = temp;
      }
    }

    for (let size = 2; size <= n; size <<= 1) {
      const halfSize = size >> 1;
      const tableStep = n / size;

      for (let i = 0; i < n; i += size) {
        let k = 0;
        for (let l = i; l < i + halfSize; l++) {
          const pos = l + halfSize;
          const cos = cosTable[k];
          const sin = sinTable[k];
          const tempReal = real[pos] * cos - imag[pos] * sin;
          const tempImag = real[pos] * sin + imag[pos] * cos;
          real[pos] = real[l] - tempReal;
          imag[pos] = imag[l] - tempImag;
          real[l] += tempReal;
          imag[l] += tempImag;
          k += tableStep;
        }
      }
    }

    if (this.inverse) {
      const scale = 1 / n;
      for (let i = 0; i < n; i++) {
        real[i] *= scale;
        imag[i] *= scale;
      }
    }
  }
}

function applyHannWindow(data: Float32Array): Float32Array {
  const n = data.length;
  const windowed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    windowed[i] = data[i] * w;
  }
  return windowed;
}

function computeSpectrum(data: Float32Array, outputBins: number): Float32Array {
  const fftSize = FFT_SIZE;
  const fft = new FFT(fftSize);
  const real = new Float32Array(fftSize);
  const imag = new Float32Array(fftSize);

  const windowed = applyHannWindow(data);

  for (let i = 0; i < fftSize; i++) {
    real[i] = i < windowed.length ? windowed[i] : 0;
    imag[i] = 0;
  }

  fft.transform(real, imag);

  const numBins = Math.floor(fftSize / 2);
  const magnitudes = new Float32Array(numBins);
  let maxMag = 0;

  for (let i = 0; i < numBins; i++) {
    magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
    if (magnitudes[i] > maxMag) maxMag = magnitudes[i];
  }

  const result = new Float32Array(outputBins);
  const binSize = numBins / outputBins;

  for (let i = 0; i < outputBins; i++) {
    const startBin = Math.floor(i * binSize);
    const endBin = Math.floor((i + 1) * binSize);
    let sum = 0;
    let count = 0;
    for (let j = startBin; j < endBin && j < numBins; j++) {
      sum += magnitudes[j];
      count++;
    }
    const avg = count > 0 ? sum / count : 0;
    result[i] = maxMag > 0 ? Math.min(1, avg / (maxMag * 0.4)) : 0;
  }

  return result;
}

function getWaveformData(data: Float32Array, samples: number): Float32Array {
  const result = new Float32Array(samples);
  const blockSize = Math.max(1, Math.floor(data.length / samples));

  for (let i = 0; i < samples; i++) {
    let sum = 0;
    const start = i * blockSize;
    for (let j = 0; j < blockSize; j++) {
      const idx = start + j;
      if (idx < data.length) {
        sum += Math.abs(data[idx]);
      }
    }
    result[i] = blockSize > 0 ? sum / blockSize : 0;
  }

  return result;
}

const ctx: Worker = self as unknown as Worker;

ctx.onmessage = (e: MessageEvent) => {
  const { type, data, samples } = e.data;

  if (type === 'analyze') {
    const spectrum = computeSpectrum(data, 64);
    const waveform = getWaveformData(data, samples || 256);

    ctx.postMessage({
      type: 'result',
      spectrum,
      waveform
    });
  }
};

export {};
