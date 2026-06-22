const FFT_SIZE = 2048;

function bitReverse(n: number, bits: number): number {
  let reversed = 0;
  for (let i = 0; i < bits; i++) {
    reversed = (reversed << 1) | (n & 1);
    n >>= 1;
  }
  return reversed;
}

function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  const bits = Math.log2(n);

  for (let i = 0; i < n; i++) {
    const j = bitReverse(i, bits);
    if (j > i) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  for (let size = 2; size <= n; size *= 2) {
    const halfSize = size / 2;
    const angle = (-2 * Math.PI) / size;

    for (let i = 0; i < n; i += size) {
      for (let j = 0; j < halfSize; j++) {
        const theta = angle * j;
        const wr = Math.cos(theta);
        const wi = Math.sin(theta);

        const idx1 = i + j;
        const idx2 = i + j + halfSize;

        const tr = wr * re[idx2] - wi * im[idx2];
        const ti = wr * im[idx2] + wi * re[idx2];

        re[idx2] = re[idx1] - tr;
        im[idx2] = im[idx1] - ti;
        re[idx1] += tr;
        im[idx1] += ti;
      }
    }
  }
}

self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;

  if (type === 'computeFFT') {
    const { waveform, sampleRate } = data;
    const n = FFT_SIZE;
    const re = new Float64Array(n);
    const im = new Float64Array(n);

    for (let i = 0; i < n; i++) {
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
      re[i] = i < waveform.length ? waveform[i] * w : 0;
      im[i] = 0;
    }

    fft(re, im);

    const magnitudes = new Float32Array(n / 2);
    const frequencies = new Float32Array(n / 2);
    const freqStep = sampleRate / n;

    let maxMag = 0;
    for (let i = 0; i < n / 2; i++) {
      const mag = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
      magnitudes[i] = mag;
      frequencies[i] = i * freqStep;
      if (mag > maxMag) maxMag = mag;
    }

    const dbMagnitudes = new Float32Array(n / 2);
    for (let i = 0; i < n / 2; i++) {
      if (maxMag > 0) {
        const normalized = magnitudes[i] / maxMag;
        dbMagnitudes[i] = normalized > 0
          ? 20 * Math.log10(normalized)
          : -100;
      } else {
        dbMagnitudes[i] = -100;
      }
    }

    self.postMessage({
      type: 'fftResult',
      frequencies,
      magnitudes: dbMagnitudes,
      rawMagnitudes: magnitudes,
    });
  }
};
