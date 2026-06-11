import type { FrameData, WalkParams } from './spiritProcessor';
import GIF from 'gif.js';

const FRAME_GAP = 5;

function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] ?? 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export async function exportSpriteSheet(
  frames: FrameData[],
  filenamePrefix: string = 'pixel-walk',
): Promise<void> {
  if (frames.length === 0) {
    throw new Error('没有可导出的帧');
  }
  const { width: fw, height: fh } = frames[0];
  const totalW = fw * frames.length + FRAME_GAP * (frames.length - 1);
  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = fh;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const tmp = document.createElement('canvas');
  tmp.width = fw;
  tmp.height = fh;
  const tmpCtx = tmp.getContext('2d')!;

  for (let i = 0; i < frames.length; i++) {
    tmpCtx.putImageData(frames[i].imageData, 0, 0);
    const x = i * (fw + FRAME_GAP);
    ctx.drawImage(tmp, x, 0);
  }

  const dataUrl = canvas.toDataURL('image/png');
  const blob = dataURLtoBlob(dataUrl);
  triggerDownload(blob, `${filenamePrefix}-spritesheet.png`);
}

export async function exportGif(
  frames: FrameData[],
  params: WalkParams,
  filenamePrefix: string = 'pixel-walk',
  onProgress?: (p: number) => void,
): Promise<void> {
  if (frames.length === 0) {
    throw new Error('没有可导出的帧');
  }
  const { width: fw, height: fh } = frames[0];
  const delay = Math.max(20, Math.round(1000 / params.frameRate));

  const gif = new GIF({
    workers: Math.min(navigator.hardwareConcurrency || 2, 4),
    quality: 1,
    width: fw,
    height: fh,
    workerScript: getGifWorkerUrl(),
    repeat: 0,
  });

  const tmp = document.createElement('canvas');
  tmp.width = fw;
  tmp.height = fh;
  const tmpCtx = tmp.getContext('2d')!;

  for (let i = 0; i < frames.length; i++) {
    tmpCtx.clearRect(0, 0, fw, fh);
    tmpCtx.putImageData(frames[i].imageData, 0, 0);
    gif.addFrame(tmpCtx, { copy: true, delay });
  }

  return new Promise<void>((resolve, reject) => {
    gif.on('progress', (p: number) => {
      onProgress?.(p);
    });
    gif.on('finished', (blob: Blob) => {
      triggerDownload(blob, `${filenamePrefix}.gif`);
      resolve();
    });
    (gif as unknown as { on: (ev: string, cb: (e: Error) => void) => void }).on('error', (err: Error) => {
      reject(err);
    });
    try {
      gif.render();
    } catch (e) {
      reject(e);
    }
  });
}

function getGifWorkerUrl(): string {
  try {
    const workerCode = `
      importScripts('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js');
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  } catch {
    return 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js';
  }
}
