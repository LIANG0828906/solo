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

function createEncoderWorker(): Worker {
  const workerCode = `
self.onmessage = function(e) {
  const { frames, width, height, fps } = e.data;

  const byte = (n) => n & 0xFF;
  const word = (n) => [byte(n), byte(n >> 8)];

  function quantize(pixels, w, h) {
    var palette = [];
    var paletteMap = {};
    var reduced = new Uint8Array(w * h);
    for (var i = 0; i < pixels.length; i += 4) {
      var r5 = pixels[i] >> 5;
      var g5 = pixels[i + 1] >> 5;
      var b6 = pixels[i + 2] >> 6;
      var key = (r5 << 5) | (g5 << 2) | b6;
      var idx = paletteMap[key];
      if (idx === undefined) {
        idx = palette.length;
        if (idx < 256) {
          palette.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
          paletteMap[key] = idx;
        } else {
          var best = 0, bestDist = 999999999;
          for (var p = 0; p < palette.length; p++) {
            var dr = palette[p][0] - pixels[i];
            var dg = palette[p][1] - pixels[i + 1];
            var db = palette[p][2] - pixels[i + 2];
            var d = dr*dr + dg*dg + db*db;
            if (d < bestDist) { bestDist = d; best = p; }
          }
          idx = best;
        }
      }
      reduced[i / 4] = idx;
    }
    while (palette.length < 2) palette.push([0, 0, 0]);
    return { palette: palette, reduced: reduced };
  }

  function lzwEncode(indices, minCodeSize) {
    if (indices.length === 0) return new Uint8Array(0);
    var dict = {};
    var codeSize = minCodeSize + 1;
    var clearCode = 1 << minCodeSize;
    var eoiCode = clearCode + 1;
    var nextCode = eoiCode + 1;
    for (var i = 0; i < clearCode; i++) dict[String(i)] = i;
    var outputBits = [];
    var bitBuffer = 0, bitCount = 0;
    function writeCode(code, size) {
      bitBuffer |= code << bitCount;
      bitCount += size;
      while (bitCount >= 8) {
        outputBits.push(bitBuffer & 0xFF);
        bitBuffer >>= 8;
        bitCount -= 8;
      }
    }
    writeCode(clearCode, codeSize);
    var w = String(indices[0]);
    for (var i = 1; i < indices.length; i++) {
      var c = String(indices[i]);
      var wc = w + ',' + c;
      if (dict[wc] !== undefined) {
        w = wc;
      } else {
        writeCode(dict[w], codeSize);
        if (nextCode < 4096) {
          dict[wc] = nextCode++;
          if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
        } else {
          writeCode(clearCode, codeSize);
          dict = {};
          codeSize = minCodeSize + 1;
          for (var j = 0; j < clearCode; j++) dict[String(j)] = j;
          nextCode = eoiCode + 1;
        }
        w = c;
      }
    }
    writeCode(dict[w], codeSize);
    writeCode(eoiCode, codeSize);
    if (bitCount > 0) outputBits.push(bitBuffer & 0xFF);
    var subBlocks = [];
    for (var i = 0; i < outputBits.length; i += 255) {
      var chunk = outputBits.slice(i, i + 255);
      subBlocks.push(chunk.length);
      for (var j = 0; j < chunk.length; j++) subBlocks.push(chunk[j]);
    }
    subBlocks.push(0);
    return new Uint8Array(subBlocks);
  }

  self.postMessage({ type: 'progress', stage: 'encoding', percent: 52 });

  var gifBytes = [];
  // Header
  gifBytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
  // Logical Screen Descriptor
  gifBytes.push.apply(gifBytes, word(width));
  gifBytes.push.apply(gifBytes, word(height));
  // GCT flag=0, color resolution=7, sort=0, GCT size=0
  gifBytes.push(0x70, 0, 0);

  // Netscape Application Extension (loop)
  gifBytes.push(
    0x21, 0xFF, 0x0B,
    0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45,
    0x32, 0x2E, 0x30,
    0x03, 0x01, 0x00, 0x00
  );

  var delay = Math.max(2, Math.round(100 / fps));

  for (var f = 0; f < frames.length; f++) {
    var pct = 52 + Math.floor((f / frames.length) * 45);
    self.postMessage({ type: 'progress', stage: 'encoding', percent: pct });

    var frame = frames[f];
    var pixels = new Uint8ClampedArray(frame);
    var result = quantize(pixels, width, height);
    var palette = result.palette;
    var reduced = result.reduced;
    var lzwMinSize = Math.max(2, Math.ceil(Math.log2(Math.max(2, palette.length))));
    var lzwData = lzwEncode(reduced, lzwMinSize);

    // Graphic Control Extension
    gifBytes.push(0x21, 0xF9, 0x04, 0x09); // disposal=1, transparent=1
    gifBytes.push.apply(gifBytes, word(delay));
    gifBytes.push(0, 0); // transparent color index, block terminator

    // Image Descriptor
    gifBytes.push(0x2C);
    gifBytes.push.apply(gifBytes, word(0));
    gifBytes.push.apply(gifBytes, word(0));
    gifBytes.push.apply(gifBytes, word(width));
    gifBytes.push.apply(gifBytes, word(height));
    // Local Color Table flag=1, interlace=0, sort=0, LCT size
    var lctSize = Math.max(0, Math.ceil(Math.log2(Math.max(2, palette.length))) - 1);
    gifBytes.push(0x80 | lctSize);

    // Local Color Table
    var lctCount = 1 << (lctSize + 1);
    for (var i = 0; i < lctCount; i++) {
      if (i < palette.length) {
        gifBytes.push(palette[i][0], palette[i][1], palette[i][2]);
      } else {
        gifBytes.push(0, 0, 0);
      }
    }

    // LZW Minimum Code Size
    gifBytes.push(lzwMinSize);
    // Image Data (sub-blocks)
    for (var i = 0; i < lzwData.length; i++) {
      gifBytes.push(lzwData[i]);
    }
  }

  // Trailer
  gifBytes.push(0x3B);

  var blob = new Blob([new Uint8Array(gifBytes)], { type: 'image/gif' });
  self.postMessage({ type: 'done', blob: blob, percent: 100 });
};
`;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

export async function exportGif(
  videoEl: HTMLVideoElement,
  _canvasEl: HTMLCanvasElement,
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

    const frames: number[][] = [];
    let lastReportedPct = -1;
    for (let i = 0; i < totalFrames; i++) {
      const t = validRange.start + i * step;
      videoEl.currentTime = Math.min(t, videoEl.duration - 0.001);

      const rawPct = 6 + (i / totalFrames) * 42;
      const capPercent = Math.floor(rawPct);
      if (capPercent !== lastReportedPct) {
        onProgress({ stage: 'capturing', percent: capPercent });
        lastReportedPct = capPercent;
      }

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => resolve(), 500);
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

      await new Promise((r) => requestAnimationFrame(() => r()));

      workCtx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);
      applyFilterFn(workCtx, targetWidth, targetHeight, filterConfigs);
      const imageData = workCtx.getImageData(0, 0, targetWidth, targetHeight);
      frames.push(Array.from(imageData.data));

      const midRawPct = 6 + ((i + 0.5) / totalFrames) * 42;
      const midPct = Math.floor(midRawPct);
      if (midPct !== lastReportedPct) {
        onProgress({ stage: 'capturing', percent: midPct });
        lastReportedPct = midPct;
      }
    }

    onProgress({ stage: 'capturing', percent: 48 });

    videoEl.currentTime = originalTime;
    if (!originalPaused) {
      videoEl.play().catch(() => {});
    }

    onProgress({ stage: 'encoding', percent: 50 });

    const worker = createEncoderWorker();

    worker.onerror = (ev) => {
      worker.terminate();
      onError(new Error(ev.message || 'Worker 编码失败'));
    };

    worker.onmessage = (ev) => {
      const msg = ev.data;
      if (msg.type === 'progress') {
        onProgress({ stage: msg.stage, percent: msg.percent });
      } else if (msg.type === 'done') {
        worker.terminate();
        onProgress({ stage: 'done', percent: 100 });
        setTimeout(() => onComplete(msg.blob as Blob), 200);
      }
    };

    worker.postMessage({
      frames,
      width: targetWidth,
      height: targetHeight,
      fps: FPS
    });
  } catch (err) {
    onError(err instanceof Error ? err : new Error('导出失败'));
  }
}
