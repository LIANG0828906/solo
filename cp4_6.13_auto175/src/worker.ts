/* eslint-disable @typescript-eslint/no-explicit-any */
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

function computeSpectrum(data: Float32Array): Float32Array {
  const fft = new FFT(FFT_SIZE);
  const real = new Float32Array(FFT_SIZE);
  const imag = new Float32Array(FFT_SIZE);

  for (let i = 0; i < FFT_SIZE; i++) {
    real[i] = i < data.length ? data[i] : 0;
    imag[i] = 0;
  }

  fft.transform(real, imag);

  const spectrum = new Float32Array(FFT_SIZE / 2);
  for (let i = 0; i < FFT_SIZE / 2; i++) {
    spectrum[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]) / FFT_SIZE;
  }

  return spectrum;
}

function getWaveformData(data: Float32Array, samples: number): Float32Array {
  const result = new Float32Array(samples);
  const blockSize = Math.floor(data.length / samples);

  for (let i = 0; i < samples; i++) {
    let sum = 0;
    const start = i * blockSize;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(data[start + j] || 0);
    }
    result[i] = blockSize > 0 ? sum / blockSize : 0;
  }

  return result;
}

self.onmessage = (e: MessageEvent) => {
  const { type, data, samples } = e.data;

  if (type === 'analyze') {
    const spectrum = computeSpectrum(data);
    const waveform = getWaveformData(data, samples || 256);

    (self as any).postMessage({
      type: 'result',
      spectrum,
      waveform
    });
  }
};

export {};
