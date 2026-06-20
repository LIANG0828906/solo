export interface SpectrumBin {
  frequency: number;
  magnitude: number;
}

export class SpectrumAnalyzer {
  static FFT_SIZE = 2048;

  private static bitReverse(n: number, bits: number): number {
    let reversed = 0;
    for (let i = 0; i < bits; i++) {
      reversed = (reversed << 1) | (n & 1);
      n >>= 1;
    }
    return reversed;
  }

  private static fft(real: Float32Array, imag: Float32Array): void {
    const n = real.length;
    const bits = Math.round(Math.log2(n));

    for (let i = 0; i < n; i++) {
      const j = SpectrumAnalyzer.bitReverse(i, bits);
      if (j > i) {
        let temp = real[i];
        real[i] = real[j];
        real[j] = temp;
        temp = imag[i];
        imag[i] = imag[j];
        imag[j] = temp;
      }
    }

    for (let size = 2; size <= n; size *= 2) {
      const halfSize = size / 2;
      const angle = (-2 * Math.PI) / size;
      const wReal = Math.cos(angle);
      const wImag = Math.sin(angle);

      for (let i = 0; i < n; i += size) {
        let curReal = 1;
        let curImag = 0;

        for (let j = 0; j < halfSize; j++) {
          const evenIdx = i + j;
          const oddIdx = i + j + halfSize;

          const tReal = curReal * real[oddIdx] - curImag * imag[oddIdx];
          const tImag = curReal * imag[oddIdx] + curImag * real[oddIdx];

          real[oddIdx] = real[evenIdx] - tReal;
          imag[oddIdx] = imag[evenIdx] - tImag;
          real[evenIdx] += tReal;
          imag[evenIdx] += tImag;

          const newCurReal = curReal * wReal - curImag * wImag;
          curImag = curReal * wImag + curImag * wReal;
          curReal = newCurReal;
        }
      }
    }
  }

  private static nextPowerOf2(n: number): number {
    let p = 1;
    while (p < n) p *= 2;
    return p;
  }

  static analyze(
    buffer: Float32Array,
    sampleRate: number = 44100,
    fftSize: number = SpectrumAnalyzer.FFT_SIZE
  ): SpectrumBin[] {
    const n = SpectrumAnalyzer.nextPowerOf2(Math.min(buffer.length, fftSize));
    const real = new Float32Array(n);
    const imag = new Float32Array(n);

    const start = Math.max(0, buffer.length - n);
    for (let i = 0; i < n; i++) {
      const srcIdx = start + i;
      if (srcIdx < buffer.length) {
        real[i] = buffer[srcIdx] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)));
      }
    }

    SpectrumAnalyzer.fft(real, imag);

    const numBins = n / 2;
    const result: SpectrumBin[] = [];

    for (let i = 0; i < numBins; i++) {
      const magnitude = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]) / n;
      const frequency = (i * sampleRate) / n;
      result.push({ frequency, magnitude });
    }

    return result;
  }

  static toDB(magnitude: number): number {
    const minDb = -100;
    const db = 20 * Math.log10(Math.max(magnitude, 1e-10));
    return Math.max(db, minDb);
  }

  static frequencyToX(
    frequency: number,
    minFreq: number,
    maxFreq: number,
    width: number
  ): number {
    const logMin = Math.log10(Math.max(minFreq, 1));
    const logMax = Math.log10(maxFreq);
    const logFreq = Math.log10(Math.max(frequency, 1));
    return ((logFreq - logMin) / (logMax - logMin)) * width;
  }

  static xToFrequency(
    x: number,
    minFreq: number,
    maxFreq: number,
    width: number
  ): number {
    const logMin = Math.log10(Math.max(minFreq, 1));
    const logMax = Math.log10(maxFreq);
    const logFreq = logMin + (x / width) * (logMax - logMin);
    return Math.pow(10, logFreq);
  }
}
