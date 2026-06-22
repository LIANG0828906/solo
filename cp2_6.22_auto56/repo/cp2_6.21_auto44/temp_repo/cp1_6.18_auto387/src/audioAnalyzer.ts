import type { AnalysisResult, DominantBand, WorkerMessage, WorkerResponse } from './types';

const WORKER_CODE = `
self.onmessage = function(e) {
  const msg = e.data;
  if (msg.type !== 'analyze') return;
  try {
    const { channelData: channelBuffers, sampleRate, length } = msg.payload;
    const channels = channelBuffers.map(buf => new Float32Array(buf));
    const mono = toMono(channels, length);
    
    const bpm = detectBPM(mono, sampleRate);
    const dominantBand = detectDominantBand(channels[0], sampleRate, length);
    
    self.postMessage({ type: 'done', result: { bpm, dominantBand } });
  } catch (err) {
    self.postMessage({ type: 'error', error: String(err) });
  }
};

function toMono(channels, length) {
  if (channels.length === 1) return channels[0];
  const out = new Float32Array(length);
  const n = channels.length;
  for (let i = 0; i < length; i++) {
    let s = 0;
    for (let c = 0; c < n; c++) s += channels[c][i];
    out[i] = s / n;
  }
  return out;
}

function detectBPM(mono, sampleRate) {
  const targetRate = 8000;
  const ratio = Math.floor(sampleRate / targetRate);
  const downLen = Math.floor(mono.length / ratio);
  const down = new Float32Array(downLen);
  for (let i = 0; i < downLen; i++) {
    let s = 0;
    for (let j = 0; j < ratio; j++) s += Math.abs(mono[i * ratio + j]);
    down[i] = s / ratio;
  }
  
  const winSize = Math.floor(targetRate * 0.02);
  const envLen = Math.floor(downLen / winSize);
  const env = new Float32Array(envLen);
  for (let i = 0; i < envLen; i++) {
    let s = 0;
    for (let j = 0; j < winSize && i * winSize + j < downLen; j++) {
      s += down[i * winSize + j];
    }
    env[i] = s / winSize;
  }
  
  const envRate = targetRate / winSize;
  let mean = 0;
  for (let i = 0; i < envLen; i++) mean += env[i];
  mean /= envLen;
  for (let i = 0; i < envLen; i++) env[i] = Math.max(0, env[i] - mean);
  
  const minBPM = 60;
  const maxBPM = 180;
  const minLag = Math.floor(envRate * 60 / maxBPM);
  const maxLag = Math.floor(envRate * 60 / minBPM);
  
  let bestLag = minLag;
  let bestScore = -Infinity;
  
  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0;
    for (let i = 0; i + lag < envLen; i++) {
      score += env[i] * env[i + lag];
    }
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }
  
  const bpm = 60 * envRate / bestLag;
  return Math.round(bpm);
}

function detectDominantBand(channel, sampleRate, length) {
  const frameMs = 50;
  const frameSize = Math.floor(sampleRate * frameMs / 1000);
  const numFrames = Math.floor(length / frameSize);
  
  let lowE = 0, midE = 0, highE = 0;
  let analyzedFrames = 0;
  
  const frame = new Float32Array(frameSize);
  const windowed = new Float32Array(frameSize);
  
  for (let f = 0; f < Math.min(numFrames, 200); f++) {
    const offset = f * frameSize;
    for (let i = 0; i < frameSize; i++) {
      frame[i] = channel[offset + i] || 0;
    }
    
    for (let i = 0; i < frameSize; i++) {
      const w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (frameSize - 1)));
      windowed[i] = frame[i] * w;
    }
    
    const re = new Float32Array(frameSize);
    const im = new Float32Array(frameSize);
    for (let i = 0; i < frameSize; i++) re[i] = windowed[i];
    simpleDFT(re, im);
    
    const binHz = sampleRate / frameSize;
    const lowMaxBin = Math.floor(250 / binHz);
    const midMaxBin = Math.floor(2000 / binHz);
    const nyqBin = Math.floor(frameSize / 2);
    
    let fLow = 0, fMid = 0, fHigh = 0;
    for (let k = 1; k < nyqBin; k++) {
      const mag = re[k] * re[k] + im[k] * im[k];
      if (k <= lowMaxBin) fLow += mag;
      else if (k <= midMaxBin) fMid += mag;
      else fHigh += mag;
    }
    
    lowE += fLow;
    midE += fMid;
    highE += fHigh;
    analyzedFrames++;
  }
  
  if (analyzedFrames === 0) return 'mid';
  
  lowE /= analyzedFrames;
  midE /= analyzedFrames;
  highE /= analyzedFrames;
  
  if (lowE >= midE && lowE >= highE) return 'low';
  if (midE >= lowE && midE >= highE) return 'mid';
  return 'high';
}

function simpleDFT(re, im) {
  const N = re.length;
  const cosTbl = new Float32Array(N);
  const sinTbl = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    cosTbl[i] = Math.cos(-2 * Math.PI * i / N);
    sinTbl[i] = Math.sin(-2 * Math.PI * i / N);
  }
  const outRe = new Float32Array(N);
  const outIm = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    let r = 0, im_v = 0;
    for (let n = 0; n < N; n++) {
      const idx = (k * n) % N;
      r += re[n] * cosTbl[idx] - im[n] * sinTbl[idx];
      im_v += re[n] * sinTbl[idx] + im[n] * cosTbl[idx];
    }
    outRe[k] = r;
    outIm[k] = im_v;
  }
  for (let i = 0; i < N; i++) {
    re[i] = outRe[i];
    im[i] = outIm[i];
  }
}
`;

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    worker = new Worker(url);
  }
  return worker;
}

export function analyzeAudio(
  channels: Float32Array[],
  sampleRate: number,
  length: number
): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const handler = (e: MessageEvent<WorkerResponse>) => {
      w.removeEventListener('message', handler);
      if (e.data.type === 'done' && e.data.result) {
        resolve(e.data.result);
      } else {
        reject(new Error(e.data.error || '分析失败'));
      }
    };
    w.addEventListener('message', handler);
    const payload: WorkerMessage = {
      type: 'analyze',
      payload: {
        channelData: channels.map(c => c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength)),
        sampleRate,
        length,
      },
    };
    w.postMessage(payload, payload.payload.channelData as unknown as Transferable[]);
  });
}
