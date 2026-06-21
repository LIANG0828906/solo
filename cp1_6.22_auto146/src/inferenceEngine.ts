export interface LayerOutput {
  layerIndex: number;
  layerType: 'conv' | 'pool';
  layerName: string;
  channels: number;
  height: number;
  width: number;
  activations: Float32Array[];
}

export interface ConvWeights {
  kernels: Float32Array[];
  bias: Float32Array;
  inCh: number;
  outCh: number;
  kSize: number;
}

export interface ModelWeights {
  conv1: ConvWeights;
  conv2: ConvWeights;
  fc: { weights: Float32Array; bias: Float32Array };
}

export interface InferenceResult {
  layers: LayerOutput[];
  logits: Float32Array;
  prediction: number;
  confidence: number;
}

class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed >>> 0;
  }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return (this.seed & 0xffffffff) / 0xffffffff;
  }
  gaussian(): number {
    const u1 = Math.max(this.next(), 1e-9);
    const u2 = this.next();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }
}

function heInit(outCh: number, kSize: number, inCh: number, rng: SeededRandom): Float32Array[] {
  const std = Math.sqrt(2.0 / (kSize * kSize * inCh));
  const kernels: Float32Array[] = [];
  for (let o = 0; o < outCh; o++) {
    const k = new Float32Array(kSize * kSize * inCh);
    for (let i = 0; i < k.length; i++) {
      k[i] = rng.gaussian() * std;
    }
    kernels.push(k);
  }
  return kernels;
}

function xavierInit(inDim: number, outDim: number, rng: SeededRandom): Float32Array {
  const range = Math.sqrt(6.0 / (inDim + outDim));
  const w = new Float32Array(inDim * outDim);
  for (let i = 0; i < w.length; i++) {
    w[i] = (rng.next() * 2 - 1) * range;
  }
  return w;
}

export function loadModel(): ModelWeights {
  const rng = new SeededRandom(42);
  const conv1Kernels = heInit(6, 5, 1, rng);
  const conv1Bias = new Float32Array(6);
  for (let i = 0; i < 6; i++) conv1Bias[i] = 0.01;
  const conv2Kernels = heInit(16, 5, 6, rng);
  const conv2Bias = new Float32Array(16);
  for (let i = 0; i < 16; i++) conv2Bias[i] = 0.01;
  const fcWeights = xavierInit(256, 10, new SeededRandom(99));
  const fcBias = new Float32Array(10);
  for (let i = 0; i < 10; i++) fcBias[i] = 0.01;
  return {
    conv1: { kernels: conv1Kernels, bias: conv1Bias, inCh: 1, outCh: 6, kSize: 5 },
    conv2: { kernels: conv2Kernels, bias: conv2Bias, inCh: 6, outCh: 16, kSize: 5 },
    fc: { weights: fcWeights, bias: fcBias }
  };
}

function conv2d(
  input: Float32Array[],
  inCh: number,
  inH: number,
  inW: number,
  weights: ConvWeights
): Float32Array[] {
  const { kernels, bias, outCh, kSize } = weights;
  const outH = inH - kSize + 1;
  const outW = inW - kSize + 1;
  const output: Float32Array[] = [];
  for (let o = 0; o < outCh; o++) {
    const out = new Float32Array(outH * outW);
    const k = kernels[o];
    const b = bias[o];
    for (let oh = 0; oh < outH; oh++) {
      for (let ow = 0; ow < outW; ow++) {
        let sum = b;
        for (let ic = 0; ic < inCh; ic++) {
          const inArr = input[ic];
          const kOff = ic * kSize * kSize;
          for (let kh = 0; kh < kSize; kh++) {
            const inRow = (oh + kh) * inW + ow;
            const kRow = kOff + kh * kSize;
            for (let kw = 0; kw < kSize; kw++) {
              sum += inArr[inRow + kw] * k[kRow + kw];
            }
          }
        }
        out[oh * outW + ow] = sum > 0 ? sum : 0;
      }
    }
    output.push(out);
  }
  return output;
}

function maxPool2x2(
  input: Float32Array[],
  inH: number,
  inW: number
): { out: Float32Array[]; outH: number; outW: number } {
  const outH = Math.floor(inH / 2);
  const outW = Math.floor(inW / 2);
  const channels = input.length;
  const outArr: Float32Array[] = [];
  for (let c = 0; c < channels; c++) {
    const inArr = input[c];
    const o = new Float32Array(outH * outW);
    for (let oh = 0; oh < outH; oh++) {
      for (let ow = 0; ow < outW; ow++) {
        let max = -Infinity;
        for (let kh = 0; kh < 2; kh++) {
          const inRow = (oh * 2 + kh) * inW + ow * 2;
          for (let kw = 0; kw < 2; kw++) {
            const v = inArr[inRow + kw];
            if (v > max) max = v;
          }
        }
        o[oh * outW + ow] = max;
      }
    }
    outArr.push(o);
  }
  return { out: outArr, outH, outW };
}

function normalizeActivations(acts: Float32Array[]): Float32Array[] {
  let gmin = Infinity;
  let gmax = -Infinity;
  for (const arr of acts) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] < gmin) gmin = arr[i];
      if (arr[i] > gmax) gmax = arr[i];
    }
  }
  const range = gmax - gmin;
  const result: Float32Array[] = [];
  for (const arr of acts) {
    const n = new Float32Array(arr.length);
    if (range < 1e-8) {
      for (let i = 0; i < arr.length; i++) n[i] = 0;
    } else {
      for (let i = 0; i < arr.length; i++) {
        const v = (arr[i] - gmin) / range;
        n[i] = v < 0 ? 0 : v > 1 ? 1 : v;
      }
    }
    result.push(n);
  }
  return result;
}

function softmax(x: Float32Array): { probs: Float32Array; argmax: number; maxProb: number } {
  let max = x[0];
  for (let i = 1; i < x.length; i++) if (x[i] > max) max = x[i];
  let sum = 0;
  const e = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    e[i] = Math.exp(x[i] - max);
    sum += e[i];
  }
  let argmax = 0;
  let maxProb = 0;
  for (let i = 0; i < x.length; i++) {
    e[i] /= sum;
    if (e[i] > maxProb) {
      maxProb = e[i];
      argmax = i;
    }
  }
  return { probs: e, argmax, maxProb };
}

export function forwardPass(imageData: Float32Array, model: ModelWeights): InferenceResult {
  const input: Float32Array[] = [imageData];
  let inH = 28, inW = 28;

  const conv1Out = conv2d(input, 1, inH, inW, model.conv1);
  const conv1Norm = normalizeActivations(conv1Out);
  const c1h = 24, c1w = 24;
  const layer0: LayerOutput = {
    layerIndex: 0,
    layerType: 'conv',
    layerName: 'Conv1',
    channels: 6,
    height: c1h,
    width: c1w,
    activations: conv1Norm
  };

  const { out: p1, outH: p1h, outW: p1w } = maxPool2x2(conv1Out, c1h, c1w);
  const p1Norm = normalizeActivations(p1);
  const layer1: LayerOutput = {
    layerIndex: 1,
    layerType: 'pool',
    layerName: 'MaxPool1',
    channels: 6,
    height: p1h,
    width: p1w,
    activations: p1Norm
  };

  const conv2Out = conv2d(p1, 6, p1h, p1w, model.conv2);
  const conv2Norm = normalizeActivations(conv2Out);
  const c2h = 8, c2w = 8;
  const layer2: LayerOutput = {
    layerIndex: 2,
    layerType: 'conv',
    layerName: 'Conv2',
    channels: 16,
    height: c2h,
    width: c2w,
    activations: conv2Norm
  };

  const { out: p2, outH: p2h, outW: p2w } = maxPool2x2(conv2Out, c2h, c2w);
  const p2Norm = normalizeActivations(p2);
  const layer3: LayerOutput = {
    layerIndex: 3,
    layerType: 'pool',
    layerName: 'MaxPool2',
    channels: 16,
    height: p2h,
    width: p2w,
    activations: p2Norm
  };

  const flatLen = 16 * p2h * p2w;
  const flat = new Float32Array(flatLen);
  let idx = 0;
  for (let c = 0; c < 16; c++) {
    const arr = p2[c];
    for (let i = 0; i < arr.length; i++) flat[idx++] = arr[i];
  }

  const logits = new Float32Array(10);
  for (let o = 0; o < 10; o++) {
    let s = model.fc.bias[o];
    for (let i = 0; i < flatLen; i++) {
      s += flat[i] * model.fc.weights[i * 10 + o];
    }
    logits[o] = s;
  }

  const { probs, argmax, maxProb } = softmax(logits);

  return {
    layers: [layer0, layer1, layer2, layer3],
    logits: probs,
    prediction: argmax,
    confidence: maxProb
  };
}

function drawDigitShape(label: number, img: Float32Array, rng: SeededRandom): void {
  const S = 28;
  const center = (cx: number, cy: number, r: number) => {
    for (let y = Math.max(0, Math.floor(cy - r - 1)); y < Math.min(S, Math.ceil(cy + r + 1)); y++) {
      for (let x = Math.max(0, Math.floor(cx - r - 1)); x < Math.min(S, Math.ceil(cx + r + 1)); x++) {
        const dx = x - cx, dy = y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < r) {
          const v = Math.max(0, 1 - d / r);
          const idx = y * S + x;
          if (v > img[idx]) img[idx] = v;
        }
      }
    }
  };
  const line = (x1: number, y1: number, x2: number, y2: number, r: number) => {
    const steps = Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 3);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      center(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, r);
    }
  };

  const j = () => rng.next() * 0.6 - 0.3;

  switch (label) {
    case 0:
      for (let t = 0; t < 36; t++) {
        const a = (t / 36) * Math.PI * 2;
        center(14 + Math.cos(a) * 6 + j(), 14 + Math.sin(a) * 8 + j(), 2.4);
      }
      break;
    case 1:
      line(12 + j(), 6 + j(), 16 + j(), 22, 1.8);
      line(11 + j(), 7 + j(), 18 + j(), 8, 1.6);
      break;
    case 2:
      line(7, 8 + j(), 19, 9, 1.6);
      line(19, 9, 19, 14, 1.6);
      line(19, 14, 9, 15, 1.6);
      line(9, 15, 9, 21, 1.6);
      line(9, 21, 21, 22, 1.6);
      break;
    case 3:
      line(10, 8, 18, 9, 1.6);
      line(18, 9, 14, 14, 1.6);
      line(14, 14, 20, 15, 1.6);
      line(20, 15, 10, 21, 1.6);
      break;
    case 4:
      line(9, 8 + j(), 10, 16, 1.6);
      line(10, 16, 20, 16, 1.6);
      line(18, 6, 18, 22, 1.6);
      break;
    case 5:
      line(20, 8 + j(), 10, 9, 1.6);
      line(10, 9, 9, 14, 1.6);
      line(9, 14, 18, 15, 1.6);
      line(18, 15, 18, 20, 1.6);
      line(18, 20, 8, 22, 1.6);
      break;
    case 6:
      line(18, 8 + j(), 10, 9, 1.6);
      line(10, 9, 9, 21, 1.6);
      line(9, 21, 20, 20, 1.6);
      line(20, 20, 19, 15, 1.6);
      line(19, 15, 10, 14, 1.6);
      break;
    case 7:
      line(8, 8, 22, 8, 1.6);
      line(20, 8, 14, 22, 1.6);
      break;
    case 8:
      for (let t = 0; t < 24; t++) {
        const a = (t / 24) * Math.PI * 2;
        center(14 + Math.cos(a) * 5.5 + j(), 10 + Math.sin(a) * 4.5 + j(), 1.8);
      }
      for (let t = 0; t < 24; t++) {
        const a = (t / 24) * Math.PI * 2;
        center(14 + Math.cos(a) * 5.5 + j(), 19 + Math.sin(a) * 4 + j(), 1.8);
      }
      break;
    case 9:
      line(9, 7 + j(), 20, 8, 1.6);
      line(20, 8, 19, 20, 1.6);
      line(19, 20, 9, 19, 1.6);
      line(9, 19, 9, 13, 1.6);
      line(9, 13, 18, 12, 1.6);
      break;
  }
}

export function generateTestImages(): { images: Float32Array[]; labels: number[] } {
  const S = 28;
  const images: Float32Array[] = [];
  const labels: number[] = [];
  for (let label = 0; label < 10; label++) {
    const img = new Float32Array(S * S);
    const rng = new SeededRandom(label * 131 + 7);
    drawDigitShape(label, img, rng);
    for (let i = 0; i < img.length; i++) {
      const noise = (rng.next() - 0.5) * 0.08;
      let v = img[i] + noise;
      if (v < 0) v = 0;
      if (v > 1) v = 1;
      img[i] = v;
    }
    images.push(img);
    labels.push(label);
  }
  return { images, labels };
}
