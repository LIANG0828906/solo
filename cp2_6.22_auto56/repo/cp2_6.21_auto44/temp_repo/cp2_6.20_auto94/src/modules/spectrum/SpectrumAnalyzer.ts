export interface SpectrumBin {
  frequency: number;
  magnitude: number;
}

export interface SpectrumBackendOptions {
  useBackend: boolean;
  backendUrl?: string;
}

export class SpectrumAnalyzer {
  static FFT_SIZE = 2048;
  static backendOptions: SpectrumBackendOptions = {
    useBackend: false,
    backendUrl: 'http://localhost:8000/fft',
  };

  private static cosCache: Float32Array | null = null;
  private static sinCache: Float32Array | null = null;
  private static cacheSize: number = 0;

  private static precomputeTrigTables(n: number): void {
    if (SpectrumAnalyzer.cacheSize >= n && SpectrumAnalyzer.cosCache && SpectrumAnalyzer.sinCache) {
      return;
    }
    SpectrumAnalyzer.cosCache = new Float32Array(n / 2);
    SpectrumAnalyzer.sinCache = new Float32Array(n / 2);
    for (let i = 0; i < n / 2; i++) {
      const angle = (-2 * Math.PI * i) / n;
      SpectrumAnalyzer.cosCache[i] = Math.cos(angle);
      SpectrumAnalyzer.sinCache[i] = Math.sin(angle);
    }
    SpectrumAnalyzer.cacheSize = n;
  }

  private static bitReverse(n: number, bits: number): number {
    let reversed = 0;
    for (let i = 0; i < bits; i++) {
      reversed = (reversed << 1) | (n & 1);
      n >>= 1;
    }
    return reversed;
  }

  private static nextPowerOf2(n: number): number {
    n--;
    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;
    n++;
    return n;
  }

  private static fft(real: Float32Array, imag: Float32Array): void {
    const n = real.length;
    const bits = Math.round(Math.log2(n));

    SpectrumAnalyzer.precomputeTrigTables(n);
    const cosCache = SpectrumAnalyzer.cosCache!;
    const sinCache = SpectrumAnalyzer.sinCache!;

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

    for (let size = 2, step = n / 2; size <= n; size *= 2, step /= 2) {
      const halfSize = size / 2;

      for (let i = 0; i < n; i += size) {
        for (let j = 0, k = 0; j < halfSize; j++, k += step) {
          const evenIdx = i + j;
          const oddIdx = i + j + halfSize;

          const wReal = cosCache[k];
          const wImag = sinCache[k];

          const tReal = wReal * real[oddIdx] - wImag * imag[oddIdx];
          const tImag = wReal * imag[oddIdx] + wImag * real[oddIdx];

          real[oddIdx] = real[evenIdx] - tReal;
          imag[oddIdx] = imag[evenIdx] - tImag;
          real[evenIdx] += tReal;
          imag[evenIdx] += tImag;
        }
      }
    }
  }

  private static async analyzeBackend(
    buffer: Float32Array,
    sampleRate: number,
    backendUrl: string
  ): Promise<SpectrumBin[]> {
    try {
      const arr = Array.from(buffer);
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples: arr, sample_rate: sampleRate }),
      });
      if (!response.ok) throw new Error('Backend request failed');
      const data = await response.json();
      return data.bins || [];
    } catch (e) {
      return SpectrumAnalyzer.analyzeLocal(buffer, sampleRate);
    }
  }

  private static analyzeLocal(
    buffer: Float32Array,
    sampleRate: number,
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
    const result: SpectrumBin[] = new Array(numBins);

    const invN = 1.0 / n;
    for (let i = 0; i < numBins; i++) {
      const magnitude = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]) * invN;
      const frequency = (i * sampleRate) / n;
      result[i] = { frequency, magnitude };
    }

    return result;
  }

  static async analyze(
    buffer: Float32Array,
    sampleRate: number = 44100,
    fftSize: number = SpectrumAnalyzer.FFT_SIZE,
    options?: SpectrumBackendOptions
  ): Promise<SpectrumBin[]> {
    const opts = options || SpectrumAnalyzer.backendOptions;
    if (opts.useBackend && opts.backendUrl) {
      return SpectrumAnalyzer.analyzeBackend(buffer, sampleRate, opts.backendUrl);
    }
    return SpectrumAnalyzer.analyzeLocal(buffer, sampleRate, fftSize);
  }

  static analyzeSync(
    buffer: Float32Array,
    sampleRate: number = 44100,
    fftSize: number = SpectrumAnalyzer.FFT_SIZE
  ): SpectrumBin[] {
    return SpectrumAnalyzer.analyzeLocal(buffer, sampleRate, fftSize);
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
