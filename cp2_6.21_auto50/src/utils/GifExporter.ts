import GIF from 'gif.js';

export interface GifExportOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  duration: number;
  fps: number;
  onProgress: (progress: number) => void;
}

export function exportGif(options: GifExportOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const { canvas, width, height, duration, fps, onProgress } = options;

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width,
      height,
      workerScript: new URL('gif.js/dist/gif.worker.js', import.meta.url).href,
    });

    const totalFrames = Math.floor((duration / 1000) * fps);
    const frameDelay = Math.floor(1000 / fps);

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d')!;

    let frameIndex = 0;

    const captureFrame = () => {
      if (frameIndex >= totalFrames) {
        gif.render();
        return;
      }

      ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, width, height);
      gif.addFrame(ctx, { copy: true, delay: frameDelay });
      frameIndex++;
      onProgress(frameIndex / totalFrames);

      requestAnimationFrame(captureFrame);
    };

    gif.on('finished', (blob: Blob) => {
      onProgress(1);
      resolve(blob);
    });

    gif.on('error', (err: Error) => {
      reject(err);
    });

    captureFrame();
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
