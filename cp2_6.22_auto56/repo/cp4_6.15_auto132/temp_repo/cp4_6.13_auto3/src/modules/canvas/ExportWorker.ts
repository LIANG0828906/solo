const workerCode = `
self.onmessage = function(e) {
  try {
    const { imageData, width, height, scale } = e.data;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    const offscreen = new OffscreenCanvas(scaledWidth, scaledHeight);
    const offCtx = offscreen.getContext('2d');

    if (!offCtx) {
      self.postMessage({ type: 'error', message: 'Failed to get OffscreenCanvas 2d context' });
      return;
    }

    const tempCanvas = new OffscreenCanvas(width, height);
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      self.postMessage({ type: 'error', message: 'Failed to get temp canvas 2d context' });
      return;
    }

    tempCtx.putImageData(imageData, 0, 0);
    offCtx.drawImage(tempCanvas, 0, 0, scaledWidth, scaledHeight);

    offscreen.convertToBlob({ type: 'image/png' }).then(function(blob) {
      self.postMessage({ type: 'complete', blob: blob });
    }).catch(function(err) {
      self.postMessage({ type: 'error', message: err.message || 'Blob conversion failed' });
    });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || 'Unknown export error' });
  }
};
`;

export function createExportWorker(): Worker {
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  URL.revokeObjectURL(url);
  return worker;
}

export function terminateExportWorker(worker: Worker): void {
  worker.terminate();
}
