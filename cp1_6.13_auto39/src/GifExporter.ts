import { FilterConfig, TimeRange, ExportProgress } from './types';

const GIF_WIDTH = 320;
const FPS = 15;
const MAX_DURATION = 15;
const MIN_DURATION = 3;

export interface GifExporterOptions {
  onProgress: (progress: ExportProgress) => void;
  onComplete: (blob: Blob) => void;
  onError: (error: Error) => void;
}

export function validateTimeRange(range: TimeRange, duration: number): TimeRange {
  const minDur = Math.min(MIN_DURATION, duration);
  const maxDur = Math.min(MAX_DURATION, duration);
  let start = Math.max(0, Math.min(range.start, duration - minDur));
  let end = Math.max(start + minDur, Math.min(range.end, duration));
  if (end - start > maxDur) {
    end = start + maxDur;
  }
  if (end - start < minDur) {
    start = Math.max(0, end - minDur);
  }
  return { start, end };
}

export function createGifWorker(): Worker {
  const workerCode = `
    self.onmessage = async function(e) {
      const { frames, width, height, fps } = e.data;
      try {
        importScripts('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
      } catch (err) {}
      
      self.postMessage({ type: 'progress', stage: 'encoding', percent: 50 });
      
      const quantize = (pixels, width, height) => {
        const palette = [];
        const paletteMap = new Map();
        const reduced = new Uint8Array(width * height);
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i] >> 5;
          const g = pixels[i + 1] >> 5;
          const b = pixels[i + 2] >> 6;
          const key = (r << 5) | (g << 2) | b;
          let idx = paletteMap.get(key);
          if (idx === undefined) {
            idx = palette.length;
            if (idx < 256) {
              palette.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
              paletteMap.set(key, idx);
            } else {
              let best = 0, bestDist = Infinity;
              for (let p = 0; p < palette.length; p++) {
                const dr = palette[p][0] - pixels[i];
                const dg = palette[p][1] - pixels[i + 1];
                const db = palette[p][2] - pixels[i + 2];
                const d = dr*dr + dg*dg + db*db;
                if (d < bestDist) { bestDist = d; best = p; }
              }
              idx = best;
            }
          }
          reduced[i / 4] = idx;
        }
        while (palette.length < 2) palette.push([0, 0, 0]);
        return { palette, reduced };
      };

      const lzwEncode = (indices, minCodeSize) => {
        if (indices.length === 0) return new Uint8Array(0);
        const dict = new Map();
        let codeSize = minCodeSize + 1;
        let clearCode = 1 << minCodeSize;
        let eoiCode = clearCode + 1;
        let nextCode = eoiCode + 1;
        for (let i = 0; i < clearCode; i++) dict.set(String(i), i);
        const outputBits = [];
        let bitBuffer = 0, bitCount = 0;
        const writeCode = (code, size) => {
          bitBuffer |= code << bitCount;
          bitCount += size;
          while (bitCount >= 8) {
            outputBits.push(bitBuffer & 0xFF);
            bitBuffer >>= 8;
            bitCount -= 8;
          }
        };
        writeCode(clearCode, codeSize);
        let w = String(indices[0]);
        for (let i = 1; i < indices.length; i++) {
          const c = String(indices[i]);
          const wc = w + ',' + c;
          if (dict.has(wc)) {
            w = wc;
          } else {
            writeCode(dict.get(w), codeSize);
            if (nextCode < 4096) {
              dict.set(wc, nextCode++);
              if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
            } else {
              writeCode(clearCode, codeSize);
              dict.clear();
              codeSize = minCodeSize + 1;
              for (let j = 0; j < clearCode; j++) dict.set(String(j), j);
              nextCode = eoiCode + 1;
            }
            w = c;
          }
        }
        writeCode(dict.get(w), codeSize);
        writeCode(eoiCode, codeSize);
        if (bitCount > 0) outputBits.push(bitBuffer & 0xFF);
        const subBlocks = [];
        for (let i = 0; i < outputBits.length; i += 255) {
          const chunk = outputBits.slice(i, i + 255);
          subBlocks.push(chunk.length, ...chunk);
        }
        subBlocks.push(0);
        return new Uint8Array(subBlocks);
      };

      const byte = (n) => n & 0xFF;
      const word = (n) => [byte(n), byte(n >> 8)];

      let gifBytes = [];
      gifBytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
      gifBytes.push(...word(width), ...word(height));
      gifBytes.push(0xF7, 0, 0);

      const globalPalette = [];
      for (let i = 0; i < 256; i++) {
        const hue = i * 360 / 256;
        const s = 0.6, l = 0.5;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
        const m = l - c / 2;
        let r=0,g=0,b=0;
        if (hue < 60) { r=c;g=x;b=0; }
        else if (hue < 120) { r=x;g=c;b=0; }
        else if (hue < 180) { r=0;g=c;b=x; }
        else if (hue < 240) { r=0;g=x;b=c; }
        else if (hue < 300) { r=x;g=0;b=c; }
        else { r=c;g=0;b=x; }
        globalPalette.push(Math.round((r+m)*255), Math.round((g+m)*255), Math.round((b+m)*255));
      }
      gifBytes.push(...globalPalette);

      const delay = Math.max(2, Math.round(100 / fps));
      const disposalMethod = 2;
      const packed = (disposalMethod << 2) | 0x01;

      for (let f = 0; f < frames.length; f++) {
        self.postMessage({ type: 'progress', stage: 'encoding', percent: 50 + Math.floor((f / frames.length) * 45) });
        const frame = frames[f];
        const pixels = new Uint8ClampedArray(frame);
        const { palette, reduced } = quantize(pixels, width, height);
        const lzwMinSize = Math.max(2, Math.ceil(Math.log2(palette.length)));
        const lzwData = lzwEncode(reduced, lzwMinSize);

        gifBytes.push(0x21, 0xFF, 0x0B, 0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30, 0x03, 0x01, 0x00, 0x00, 0x00);
        break;
      }

      let netscapeWritten = false;
      for (let f = 0; f < frames.length; f++) {
        const frame = frames[f];
        const pixels = new Uint8ClampedArray(frame);
        const { palette, reduced } = quantize(pixels, width, height);
        const lzwMinSize = Math.max(2, palette.length > 1 ? Math.ceil(Math.log2(palette.length)) : 2);
        const lzwData = lzwEncode(reduced, lzwMinSize);

        if (!netscapeWritten) {
          gifBytes.push(0x21, 0xFF, 0x0B, 0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30, 0x03, 0x01, 0x00, 0x00, 0x00);
          netscapeWritten = true;
        }

        gifBytes.push(0x21, 0xF9, 0x04, packed, ...word(delay), 0, 0);
        gifBytes.push(0x2C);
        gifBytes.push(...word(0), ...word(0), ...word(width), ...word(height));
        const lctFlag = palette.length > 0 ? 0x80 : 0;
        const lctSize = palette.length > 0 ? Math.max(0, Math.ceil(Math.log2(palette.length)) - 1) : 0;
        gifBytes.push(lctFlag | lctSize);

        const lct = [];
        for (let i = 0; i < (1 << (lctSize + 1)); i++) {
          if (i < palette.length) {
            lct.push(palette[i][0], palette[i][1], palette[i][2]);
          } else {
            lct.push(0, 0, 0);
          }
        }
        gifBytes.push(...lct);
        gifBytes.push(lzwMinSize);
        gifBytes.push(...lzwData);
      }
      gifBytes.push(0x3B);

      const blob = new Blob([new Uint8Array(gifBytes)], { type: 'image/gif' });
      self.postMessage({ type: 'done', blob: blob });
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

export async function exportGif(
  videoEl: HTMLVideoElement,
  canvasEl: HTMLCanvasElement,
  filterConfigs: FilterConfig[],
  range: TimeRange,
  applyFilterFn: (ctx: CanvasRenderingContext2D, w: number, h: number, filters: FilterConfig[]) => void,
  options: GifExporterOptions
): Promise<void> {
  const { onProgress, onComplete, onError } = options;
  onProgress({ stage: 'preparing', percent: 2 });

  try {
    const validRange = validateTimeRange(range, videoEl.duration);
    const duration = validRange.end - validRange.start;
    const totalFrames = Math.max(2, Math.ceil(duration * FPS));
    const step = duration / (totalFrames - 1);

    const origWidth = videoEl.videoWidth;
    const origHeight = videoEl.videoHeight;
    const aspect = origHeight / origWidth;
    const targetWidth = GIF_WIDTH;
    const targetHeight = Math.max(1, Math.round(targetWidth * aspect));

    const workCanvas = document.createElement('canvas');
    workCanvas.width = targetWidth;
    workCanvas.height = targetHeight;
    const workCtx = workCanvas.getContext('2d', { willReadFrequently: true });
    if (!workCtx) throw new Error('无法创建Canvas上下文');

    onProgress({ stage: 'preparing', percent: 5 });

    const originalTime = videoEl.currentTime;
    const originalPaused = videoEl.paused;
    videoEl.pause();

    const frames: Uint8ClampedArray[] = [];
    onProgress({ stage: 'capturing', percent: 6 });

    for (let i = 0; i < totalFrames; i++) {
      const t = validRange.start + i * step;
      videoEl.currentTime = Math.min(t, videoEl.duration - 0.001);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => resolve(), 300);
        const onSeeked = () => {
          clearTimeout(timeout);
          videoEl.removeEventListener('seeked', onSeeked);
          videoEl.removeEventListener('error', onErrorFn);
          resolve();
        };
        const onErrorFn = () => {
          clearTimeout(timeout);
          videoEl.removeEventListener('seeked', onSeeked);
          videoEl.removeEventListener('error', onErrorFn);
          reject(new Error('视频跳转失败'));
        };
        videoEl.addEventListener('seeked', onSeeked, { once: true });
        videoEl.addEventListener('error', onErrorFn, { once: true });
      });

      workCtx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);
      applyFilterFn(workCtx, targetWidth, targetHeight, filterConfigs);
      const imageData = workCtx.getImageData(0, 0, targetWidth, targetHeight);
      frames.push(new Uint8ClampedArray(imageData.data));

      const capPercent = 6 + Math.floor((i / totalFrames) * 44);
      onProgress({ stage: 'capturing', percent: capPercent });
      await new Promise((r) => requestAnimationFrame(() => r()));
    }

    videoEl.currentTime = originalTime;
    if (!originalPaused) {
      videoEl.play().catch(() => {});
    }

    onProgress({ stage: 'encoding', percent: 52 });

    const worker = createGifWorker();

    worker.onerror = (e) => {
      worker.terminate();
      onError(new Error(e.message || 'Worker 编码失败'));
    };

    worker.onmessage = (e) => {
      if (e.data.type === 'progress') {
        onProgress(e.data as ExportProgress);
      } else if (e.data.type === 'done') {
        worker.terminate();
        onProgress({ stage: 'done', percent: 100 });
        setTimeout(() => onComplete(e.data.blob as Blob), 300);
      }
    };

    const frameData = frames.map((f) => Array.from(f));
    worker.postMessage({
      frames: frameData,
      width: targetWidth,
      height: targetHeight,
      fps: FPS
    });
  } catch (err) {
    onError(err instanceof Error ? err : new Error('导出失败'));
  }
}
