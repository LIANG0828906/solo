type WorkerMessage =
  | { type: 'decode'; data: ArrayBuffer; sampleRate: number }
  | { type: 'process'; frequencyData: Uint8Array; timeData: Uint8Array }
  | { type: 'reset' };

type MainMessage =
  | { type: 'decoded'; buffer: AudioBuffer; transferList: Transferable[] }
  | { type: 'decoded-error'; error: string }
  | { type: 'processed'; spectrumData: Float32Array; waveformData: Float32Array };

const BAND_COUNT = 32;
const SMOOTHING = 0.75;

let smoothedSpectrum = new Float32Array(BAND_COUNT);
let lastTime = 0;
const MIN_INTERVAL = 33;

function computeBarkBands(frequencyData: Uint8Array, sampleRate: number, fftSize: number): Float32Array {
  const bands = new Float32Array(BAND_COUNT);
  const nyquist = sampleRate / 2;
  const binWidth = nyquist / fftSize;

  const barkEdges = [
    20, 100, 200, 300, 400, 510, 630, 770, 920, 1080, 1270, 1480,
    1720, 2000, 2320, 2700, 3150, 3700, 4400, 5300, 6400, 7700,
    9500, 12000, 15500
  ];

  for (let i = 0; i < BAND_COUNT; i++) {
    const lowFreq = barkEdges[Math.min(i, barkEdges.length - 1)];
    const highFreq = barkEdges[Math.min(i + 1, barkEdges.length - 1)] || nyquist;
    const lowBin = Math.floor(lowFreq / binWidth);
    const highBin = Math.min(Math.ceil(highFreq / binWidth), fftSize);

    let sum = 0;
    let count = 0;
    for (let j = lowBin; j < highBin; j++) {
      sum += frequencyData[j];
      count++;
    }
    bands[i] = count > 0 ? sum / count / 255 : 0;
  }

  return bands;
}

function smoothSpectrum(newBands: Float32Array): Float32Array {
  const result = new Float32Array(BAND_COUNT);
  for (let i = 0; i < BAND_COUNT; i++) {
    result[i] = smoothedSpectrum[i] * SMOOTHING + newBands[i] * (1 - SMOOTHING);
    smoothedSpectrum[i] = result[i];
  }
  return result;
}

function processWaveform(timeData: Uint8Array): Float32Array {
  const targetLen = 512;
  const output = new Float32Array(targetLen);
  const step = timeData.length / targetLen;

  for (let i = 0; i < targetLen; i++) {
    const idx = Math.floor(i * step);
    output[i] = (timeData[idx] - 128) / 128;
  }

  return output;
}

const ctx: Worker = self as unknown as Worker;

ctx.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'decode': {
      try {
        const OfflineCtx = (self as unknown as { OfflineAudioContext: typeof OfflineAudioContext }).OfflineAudioContext;
        const offlineCtx = new OfflineCtx(1, 1, msg.sampleRate);
        const audioBuffer = await offlineCtx.decodeAudioData(msg.data.slice(0));
        const channels: Float32Array[] = [];
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
          channels.push(audioBuffer.getChannelData(i));
        }
        const plainBuffer = {
          sampleRate: audioBuffer.sampleRate,
          length: audioBuffer.length,
          duration: audioBuffer.duration,
          numberOfChannels: audioBuffer.numberOfChannels,
          channels
        };
        const transferList: Transferable[] = channels.map(c => c.buffer);
        ctx.postMessage({ type: 'decoded', buffer: plainBuffer, transferList } as unknown as MainMessage, transferList);
      } catch (err) {
        ctx.postMessage({ type: 'decoded-error', error: (err as Error).message } satisfies MainMessage);
      }
      break;
    }

    case 'process': {
      const now = performance.now();
      if (now - lastTime < MIN_INTERVAL) return;
      lastTime = now;

      const bands = computeBarkBands(msg.frequencyData, 44100, msg.frequencyData.length * 2);
      const smoothed = smoothSpectrum(bands);
      const waveform = processWaveform(msg.timeData);

      ctx.postMessage(
        { type: 'processed', spectrumData: smoothed, waveformData: waveform } satisfies MainMessage,
        [smoothed.buffer, waveform.buffer]
      );
      break;
    }

    case 'reset': {
      smoothedSpectrum = new Float32Array(BAND_COUNT);
      lastTime = 0;
      break;
    }
  }
});

export {};
