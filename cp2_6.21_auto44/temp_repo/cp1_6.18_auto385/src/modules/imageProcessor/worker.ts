/// <reference lib="webworker" />

type WorkerMessage =
  | {
      type: 'process';
      pixelData: Uint8ClampedArray;
      width: number;
      height: number;
    }
  | { type: 'cancel' };

type WorkerResponse =
  | { type: 'progress'; value: number }
  | { type: 'done'; depthMap: number[]; width: number; height: number }
  | { type: 'error'; message: string };

const ctx: Worker = self as unknown as Worker;

const SOBEL_X = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
const SOBEL_Y = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

function getGray(data: Uint8ClampedArray, width: number, x: number, y: number): number {
  const idx = (y * width + x) * 4;
  return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
}

function sobelFilter(
  grayscale: Float32Array,
  width: number,
  height: number,
  onProgress: (p: number) => void
): Float32Array {
  const edge = new Float32Array(width * height);
  let maxEdge = 0;

  for (let y = 1; y < height - 1; y++) {
    if (y % Math.max(1, Math.floor((height - 2) / 10)) === 0) {
      onProgress(0.3 + (y / (height - 2)) * 0.4);
    }
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      let ki = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const g = grayscale[(y + dy) * width + (x + dx)];
          gx += g * SOBEL_X[ki];
          gy += g * SOBEL_Y[ki];
          ki++;
        }
      }
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edge[y * width + x] = magnitude;
      if (magnitude > maxEdge) maxEdge = magnitude;
    }
  }

  if (maxEdge > 0) {
    for (let i = 0; i < edge.length; i++) {
      edge[i] = edge[i] / maxEdge;
    }
  }

  return edge;
}

function computeDepth(
  grayscale: Float32Array,
  edge: Float32Array,
  width: number,
  height: number,
  onProgress: (p: number) => void
): number[] {
  const depth = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    if (y % Math.max(1, Math.floor(height / 10)) === 0) {
      onProgress(0.75 + (y / height) * 0.2);
    }
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const brightness = grayscale[idx];
      const e = edge[idx];
      const sum = brightness * 0.35 + e * 0.65;
      depth[idx] = sum;
    }
  }

  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < depth.length; i++) {
    if (depth[i] < min) min = depth[i];
    if (depth[i] > max) max = depth[i];
  }
  const range = max - min || 1;
  const result = new Array(depth.length);
  for (let i = 0; i < depth.length; i++) {
    result[i] = Math.round(((depth[i] - min) / range) * 255);
  }

  return result;
}

ctx.addEventListener('message', (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;
  if (msg.type !== 'process') return;

  try {
    const { pixelData, width, height } = msg;

    ctx.postMessage({ type: 'progress', value: 0.05 } as WorkerResponse);

    const grayscale = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const pi = i * 4;
      grayscale[i] =
        (0.299 * pixelData[pi] + 0.587 * pixelData[pi + 1] + 0.114 * pixelData[pi + 2]) / 255;
      if (i % Math.floor((width * height) / 20) === 0) {
        ctx.postMessage({
          type: 'progress',
          value: 0.05 + (i / (width * height)) * 0.25,
        } as WorkerResponse);
      }
    }

    ctx.postMessage({ type: 'progress', value: 0.3 } as WorkerResponse);

    const edge = sobelFilter(grayscale, width, height, (p) => {
      ctx.postMessage({ type: 'progress', value: p } as WorkerResponse);
    });

    ctx.postMessage({ type: 'progress', value: 0.75 } as WorkerResponse);

    const depthMap = computeDepth(grayscale, edge, width, height, (p) => {
      ctx.postMessage({ type: 'progress', value: p } as WorkerResponse);
    });

    ctx.postMessage({
      type: 'done',
      depthMap,
      width,
      height,
    } as WorkerResponse);
  } catch (err) {
    ctx.postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    } as WorkerResponse);
  }
});
