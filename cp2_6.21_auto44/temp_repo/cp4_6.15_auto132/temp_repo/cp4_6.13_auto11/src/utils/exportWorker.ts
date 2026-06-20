/// <reference lib="webworker" />

interface ExportMessage {
  type: 'export';
  width: number;
  height: number;
  pixelBuffer: Uint8ClampedArray;
  targetSize: number;
}

interface CompleteMessage {
  type: 'export-complete';
  blob: Blob | null;
  error?: string;
}

function imageDataToBlob(imageData: ImageData): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = new OffscreenCanvas(imageData.width, imageData.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.putImageData(imageData, 0, 0);
      canvas.convertToBlob({ type: 'image/png' }).then(resolve).catch(() => resolve(null));
    } catch {
      try {
        const canvas = new OffscreenCanvas(imageData.width, imageData.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        const img = new ImageData(
          new Uint8ClampedArray(imageData.data),
          imageData.width,
          imageData.height,
        );
        ctx.putImageData(img, 0, 0);
        canvas.convertToBlob({ type: 'image/png' }).then(resolve).catch(() => resolve(null));
      } catch (e) {
        reject(e);
      }
    }
  });
}

function scaleImageDataNearest(
  srcData: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(dstW * dstH * 4);
  const scaleX = srcW / dstW;
  const scaleY = srcH / dstH;

  for (let y = 0; y < dstH; y++) {
    const srcY = Math.floor(y * scaleY);
    for (let x = 0; x < dstW; x++) {
      const srcX = Math.floor(x * scaleX);
      const srcIdx = (srcY * srcW + srcX) * 4;
      const dstIdx = (y * dstW + x) * 4;
      dst[dstIdx] = srcData[srcIdx];
      dst[dstIdx + 1] = srcData[srcIdx + 1];
      dst[dstIdx + 2] = srcData[srcIdx + 2];
      dst[dstIdx + 3] = srcData[srcIdx + 3];
    }
  }
  return dst;
}

self.onmessage = async (e: MessageEvent<ExportMessage>) => {
  const { type, width, height, pixelBuffer, targetSize } = e.data;

  if (type !== 'export') return;

  try {
    const scaledBuffer = scaleImageDataNearest(
      pixelBuffer,
      width,
      height,
      targetSize,
      targetSize,
    );

    const imageData = new ImageData(
      new Uint8ClampedArray(scaledBuffer),
      targetSize,
      targetSize,
    );

    const blob = await imageDataToBlob(imageData);

    const response: CompleteMessage = {
      type: 'export-complete',
      blob: blob ?? undefined,
    };

    self.postMessage(response, blob ? [blob] : []);
  } catch (err) {
    const response: CompleteMessage = {
      type: 'export-complete',
      blob: null,
      error: err instanceof Error ? err.message : '未知错误',
    };
    self.postMessage(response);
  }
};

export {};
