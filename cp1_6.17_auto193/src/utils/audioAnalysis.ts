export interface StyleFeatures {
  low: number;
  mid: number;
  high: number;
}

export const analyzeAudioBuffer = async (
  audioBuffer: AudioBuffer
): Promise<StyleFeatures> => {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const fftSize = 2048;
  const numSamples = Math.floor(channelData.length / fftSize);

  let lowSum = 0;
  let midSum = 0;
  let highSum = 0;
  let count = 0;

  const tempCanvas = document.createElement('canvas');
  const ctx = tempCanvas.getContext('2d') as unknown as AudioContext;
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = fftSize;
  const bufferLength = analyser.frequencyBinCount;
  const freqData = new Uint8Array(bufferLength);

  const binHz = sampleRate / fftSize;
  const lowEnd = Math.floor(250 / binHz);
  const midEnd = Math.floor(2000 / binHz);
  const highEnd = bufferLength - 1;

  const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  const offlineAnalyser = offlineCtx.createAnalyser();
  offlineAnalyser.fftSize = fftSize;
  const offlineFreqData = new Uint8Array(offlineAnalyser.frequencyBinCount);
  source.connect(offlineAnalyser);
  offlineAnalyser.connect(offlineCtx.destination);
  source.start();

  for (let i = 0; i < numSamples; i++) {
    const startIdx = i * fftSize;
    const endIdx = startIdx + fftSize;
    if (endIdx > channelData.length) break;

    const slice = channelData.slice(startIdx, endIdx);
    const hann = new Float32Array(fftSize);
    for (let j = 0; j < fftSize; j++) {
      hann[j] = slice[j] * (0.5 - 0.5 * Math.cos((2 * Math.PI * j) / (fftSize - 1)));
    }

    const real = new Float64Array(fftSize);
    const imag = new Float64Array(fftSize);
    for (let j = 0; j < fftSize; j++) {
      real[j] = hann[j];
      imag[j] = 0;
    }

    for (let size = 2; size <= fftSize; size <<= 1) {
      const half = size >> 1;
      const angleStep = (-2 * Math.PI) / size;
      for (let j = 0; j < fftSize; j += size) {
        let angle = 0;
        for (let k = 0; k < half; k++) {
          const tReal = Math.cos(angle);
          const tImag = Math.sin(angle);
          const evenReal = real[j + k];
          const evenImag = imag[j + k];
          const oddReal = real[j + k + half];
          const oddImag = imag[j + k + half];
          real[j + k] = evenReal + tReal * oddReal - tImag * oddImag;
          imag[j + k] = evenImag + tReal * oddImag + tImag * oddReal;
          real[j + k + half] = evenReal - tReal * oddReal + tImag * oddImag;
          imag[j + k + half] = evenImag - tReal * oddImag - tImag * oddReal;
          angle += angleStep;
        }
      }
    }

    let low = 0;
    for (let j = 0; j < lowEnd && j < fftSize / 2; j++) {
      low += Math.sqrt(real[j] * real[j] + imag[j] * imag[j]);
    }
    low = lowEnd > 0 ? low / lowEnd : 0;

    let mid = 0;
    const midCount = Math.min(midEnd, fftSize / 2) - lowEnd;
    for (let j = lowEnd; j < Math.min(midEnd, fftSize / 2); j++) {
      mid += Math.sqrt(real[j] * real[j] + imag[j] * imag[j]);
    }
    mid = midCount > 0 ? mid / midCount : 0;

    let high = 0;
    const highCount = Math.min(highEnd, fftSize / 2) - midEnd;
    for (let j = midEnd; j < Math.min(highEnd, fftSize / 2); j++) {
      high += Math.sqrt(real[j] * real[j] + imag[j] * imag[j]);
    }
    high = highCount > 0 ? high / highCount : 0;

    lowSum += low;
    midSum += mid;
    highSum += high;
    count++;
  }

  audioCtx.close();

  const avgLow = count > 0 ? lowSum / count : 0;
  const avgMid = count > 0 ? midSum / count : 0;
  const avgHigh = count > 0 ? highSum / count : 0;

  const maxVal = Math.max(avgLow, avgMid, avgHigh, 1);
  const norm = (v: number) => Math.max(1, Math.min(10, Math.round((v / maxVal) * 10)));

  return {
    low: norm(avgLow),
    mid: norm(avgMid),
    high: norm(avgHigh),
  };
};
