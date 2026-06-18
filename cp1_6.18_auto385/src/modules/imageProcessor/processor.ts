import DepthWorker from './worker?worker';

type WorkerProgressMsg = { type: 'progress'; value: number };
type WorkerDoneMsg = { type: 'done'; depthMap: number[]; width: number; height: number };
type WorkerErrorMsg = { type: 'error'; message: string };
type WorkerMsg = WorkerProgressMsg | WorkerDoneMsg | WorkerErrorMsg;

export interface ProcessOptions {
  onProgress?: (progress: number) => void;
  maxWidth?: number;
  maxHeight?: number;
}

export function processImage(
  image: HTMLImageElement,
  options: ProcessOptions = {}
): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const { onProgress, maxWidth = 800, maxHeight = 600 } = options;

    const iw = image.naturalWidth || image.width;
    const ih = image.naturalHeight || image.height;
    const scale = Math.min(1, maxWidth / iw, maxHeight / ih);
    const dw = Math.max(50, Math.round(iw * scale));
    const dh = Math.max(50, Math.round(ih * scale));

    const canvas = document.createElement('canvas');
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      reject(new Error('无法创建 Canvas 上下文'));
      return;
    }
    ctx.drawImage(image, 0, 0, dw, dh);

    let imgData: ImageData;
    try {
      imgData = ctx.getImageData(0, 0, dw, dh);
    } catch (e: unknown) {
      reject(e);
      return;
    }

    let worker: Worker | null = null;
    try {
      worker = new DepthWorker();
    } catch (e: unknown) {
      reject(e instanceof Error ? e : new Error('Worker 创建失败'));
      return;
    }

    let settled = false;
    const cleanup = () => {
      clearTimeout(timeout);
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('图片处理超时，请重试'));
    }, 15000);

    worker.onmessage = (e: MessageEvent<WorkerMsg>) => {
      if (settled) return;
      const msg = e.data;
      if (msg.type === 'progress') {
        onProgress?.(msg.value);
      } else if (msg.type === 'done') {
        settled = true;
        cleanup();
        resolve(msg.depthMap);
      } else if (msg.type === 'error') {
        settled = true;
        cleanup();
        reject(new Error(msg.message));
      }
    };

    worker.onerror = (e: ErrorEvent) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(e.message || 'Worker 执行出错'));
    };

    worker.postMessage({
      type: 'process',
      pixelData: imgData.data,
      width: dw,
      height: dh,
    });
  });
}

export function getProcessedDimensions(image: HTMLImageElement): {
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
} {
  const maxWidth = 800;
  const maxHeight = 600;
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  const scale = Math.min(1, maxWidth / iw, maxHeight / ih);
  return {
    width: Math.max(50, Math.round(iw * scale)),
    height: Math.max(50, Math.round(ih * scale)),
    maxWidth,
    maxHeight,
  };
}
