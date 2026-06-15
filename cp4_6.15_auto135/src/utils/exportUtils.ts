export interface ExportOptions {
  canvas: HTMLCanvasElement;
  duration: number;
  fps: number;
  format: 'mp4' | 'gif';
  onProgress: (progress: number) => void;
  onStart?: () => void;
  onComplete?: (blob: Blob) => void;
}

export async function exportNebula(options: ExportOptions): Promise<void> {
  const { canvas, duration, fps, format, onProgress, onStart, onComplete } = options;

  onStart?.();
  onProgress(0);

  if (format === 'mp4') {
    return exportMP4(canvas, duration, fps, onProgress, onComplete);
  } else {
    return exportGIF(canvas, duration, fps, onProgress, onComplete);
  }
}

async function exportMP4(
  canvas: HTMLCanvasElement,
  duration: number,
  fps: number,
  onProgress: (progress: number) => void,
  onComplete?: (blob: Blob) => void
): Promise<void> {
  const stream = canvas.captureStream(fps);

  const mimeType = getSupportedMimeType();
  if (!mimeType) {
    throw new Error('当前浏览器不支持视频录制');
  }

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000
  });

  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      onProgress(100);
      onComplete?.(blob);
      downloadBlob(blob, 'nebula-animation.mp4');
      resolve();
    };

    recorder.onerror = (e) => {
      reject(new Error('视频录制失败'));
    };

    recorder.start();

    let elapsed = 0;
    const interval = 100;
    const progressInterval = setInterval(() => {
      elapsed += interval;
      const progress = Math.min((elapsed / (duration * 1000)) * 100, 100);
      onProgress(Math.round(progress));

      if (elapsed >= duration * 1000) {
        clearInterval(progressInterval);
        recorder.stop();
      }
    }, interval);
  });
}

function getSupportedMimeType(): string | null {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4'
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return null;
}

async function exportGIF(
  canvas: HTMLCanvasElement,
  duration: number,
  fps: number,
  onProgress: (progress: number) => void,
  onComplete?: (blob: Blob) => void
): Promise<void> {
  const totalFrames = Math.floor(duration * fps);
  const frameDelay = 1000 / fps;
  const width = canvas.width;
  const height = canvas.height;

  const gif = await createGIF(width, height, { repeat: 0, quality: 10 });

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const ctx = tempCanvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法创建Canvas上下文');
  }

  const ctx2 = ctx;
  return new Promise((resolve) => {
    let currentFrame = 0;

    function captureFrame() {
      if (currentFrame >= totalFrames) {
        gif.on('finished', (blob?: Blob) => {
          onProgress(100);
          if (blob) {
            onComplete?.(blob);
            downloadBlob(blob, 'nebula-animation.gif');
          }
          resolve();
        });
        gif.render();
        return;
      }

      ctx2.drawImage(canvas, 0, 0);
      const imageData = ctx2.getImageData(0, 0, width, height);
      gif.addFrame(imageData, { delay: frameDelay });

      currentFrame++;
      const progress = Math.round((currentFrame / totalFrames) * 100);
      onProgress(progress);

      setTimeout(captureFrame, frameDelay / 2);
    }

    captureFrame();
  });
}

interface GIFOptions {
  repeat?: number;
  quality?: number;
  width?: number;
  height?: number;
}

interface GIFFrame {
  imageData: ImageData;
  delay: number;
}

async function createGIF(width: number, height: number, options: GIFOptions) {
  const frames: GIFFrame[] = [];
  let callbacks: Record<string, (blob?: Blob) => void> = {};

  return {
    addFrame(imageData: ImageData, frameOptions: { delay: number }) {
      frames.push({ imageData, delay: frameOptions.delay });
    },
    on(event: string, callback: (blob?: Blob) => void) {
      callbacks[event] = callback;
    },
    render() {
      const gifBlob = encodeGIF(frames, width, height, options);
      callbacks.finished?.(gifBlob);
    }
  };
}

function encodeGIF(
  frames: GIFFrame[],
  width: number,
  height: number,
  options: GIFOptions
): Blob {
  const quality = options.quality ?? 10;

  const quantizedFrames = frames.map((frame) => {
    const { pixels, palette, transparentIndex } = quantizeImage(
      frame.imageData,
      256
    );
    return {
      pixels,
      palette,
      delay: Math.round(frame.delay / 10),
      transparentIndex
    };
  });

  const palette = quantizedFrames[0].palette;
  const colorTableSize = palette.length / 3;

  const parts: Uint8Array[] = [];

  parts.push(writeString('GIF89a'));
  parts.push(writeUInt16(width));
  parts.push(writeUInt16(height));

  const gctSize = Math.ceil(Math.log2(palette.length / 3)) - 1;
  parts.push(new Uint8Array([0x80 | gctSize]));
  parts.push(new Uint8Array([0]));
  parts.push(new Uint8Array([0]));

  const gct = new Uint8Array(256 * 3);
  for (let i = 0; i < palette.length; i++) {
    gct[i] = palette[i];
  }
  parts.push(gct);

  parts.push(new Uint8Array([0x21, 0xff, 0x0b]));
  parts.push(writeString('NETSCAPE2.0'));
  parts.push(new Uint8Array([0x03, 0x01]));
  parts.push(writeUInt16(options.repeat ?? 0));
  parts.push(new Uint8Array([0x00]));

  for (const frame of quantizedFrames) {
    parts.push(new Uint8Array([0x21, 0xf9, 0x04]));
    parts.push(new Uint8Array([0x09]));
    parts.push(writeUInt16(frame.delay));
    parts.push(new Uint8Array([frame.transparentIndex ?? 0]));
    parts.push(new Uint8Array([0x00]));

    parts.push(new Uint8Array([0x2c]));
    parts.push(writeUInt16(0));
    parts.push(writeUInt16(0));
    parts.push(writeUInt16(width));
    parts.push(writeUInt16(height));

    const lctSize = 0;
    parts.push(new Uint8Array([lctSize]));

    const minCodeSize = 8;
    parts.push(new Uint8Array([minCodeSize]));

    const lzwData = lzwEncode(frame.pixels, colorTableSize, quality);
    let offset = 0;
    while (offset < lzwData.length) {
      const chunkSize = Math.min(255, lzwData.length - offset);
      parts.push(new Uint8Array([chunkSize]));
      parts.push(lzwData.subarray(offset, offset + chunkSize));
      offset += chunkSize;
    }
    parts.push(new Uint8Array([0x00]));
  }

  parts.push(new Uint8Array([0x3b]));

  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return new Blob([result], { type: 'image/gif' });
}

function writeString(str: string): Uint8Array {
  const result = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    result[i] = str.charCodeAt(i);
  }
  return result;
}

function writeUInt16(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >> 8) & 0xff]);
}

function quantizeImage(imageData: ImageData, colors: number) {
  const data = imageData.data;
  const pixelCount = imageData.width * imageData.height;
  const pixels = new Uint8Array(pixelCount);

  let minR = 255, maxR = 0;
  let minG = 255, maxG = 0;
  let minB = 255, maxB = 0;

  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minG = Math.min(minG, g);
    maxG = Math.max(maxG, g);
    minB = Math.min(minB, b);
    maxB = Math.max(maxB, b);
  }

  const palette: number[] = [];
  const steps = Math.pow(colors, 1 / 3);
  const rStep = Math.max(1, Math.round((maxR - minR) / (steps - 1 || 1)));
  const gStep = Math.max(1, Math.round((maxG - minG) / (steps - 1 || 1)));
  const bStep = Math.max(1, Math.round((maxB - minB) / (steps - 1 || 1)));

  for (let r = minR; r <= maxR; r += rStep) {
    for (let g = minG; g <= maxG; g += gStep) {
      for (let b = minB; b <= maxB; b += bStep) {
        palette.push(r, g, b);
        if (palette.length / 3 >= colors) break;
      }
      if (palette.length / 3 >= colors) break;
    }
    if (palette.length / 3 >= colors) break;
  }

  while (palette.length < colors * 3) {
    palette.push(0, 0, 0);
  }

  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    let minDist = Infinity;
    let bestIndex = 0;

    for (let j = 0; j < palette.length; j += 3) {
      const dr = r - palette[j];
      const dg = g - palette[j + 1];
      const db = b - palette[j + 2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < minDist) {
        minDist = dist;
        bestIndex = j / 3;
      }
    }

    pixels[i] = bestIndex;
  }

  return { pixels, palette, transparentIndex: undefined as number | undefined };
}

function lzwEncode(pixels: Uint8Array, colorCount: number, quality: number): Uint8Array {
  const minCodeSize = Math.max(2, Math.ceil(Math.log2(colorCount + 1)));
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  const maxCodeSize = 12;
  const maxCode = 1 << maxCodeSize;

  const output: number[] = [];
  let outputByte = 0;
  let outputBits = 0;

  function writeCode(code: number, codeSize: number) {
    for (let i = 0; i < codeSize; i++) {
      outputByte |= ((code >> i) & 1) << outputBits;
      outputBits++;
      if (outputBits >= 8) {
        output.push(outputByte);
        outputByte = 0;
        outputBits = 0;
      }
    }
  }

  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const dictionary = new Map<string, number>();

  for (let i = 0; i < clearCode; i++) {
    dictionary.set(String(i), i);
  }

  writeCode(clearCode, codeSize);

  let currentString = String(pixels[0]);

  for (let i = 1; i < pixels.length; i++) {
    const pixel = pixels[i];
    const key = currentString + ',' + pixel;

    if (dictionary.has(key)) {
      currentString = key;
    } else {
      const code = dictionary.get(currentString);
      if (code !== undefined) {
        writeCode(code, codeSize);
      }

      if (nextCode < maxCode) {
        dictionary.set(key, nextCode++);
        if (nextCode > (1 << codeSize)) {
          codeSize++;
        }
      } else {
        writeCode(clearCode, codeSize);
        dictionary.clear();
        for (let j = 0; j < clearCode; j++) {
          dictionary.set(String(j), j);
        }
        nextCode = eoiCode + 1;
        codeSize = minCodeSize + 1;
      }

      currentString = String(pixel);
    }
  }

  const lastCode = dictionary.get(currentString);
  if (lastCode !== undefined) {
    writeCode(lastCode, codeSize);
  }
  writeCode(eoiCode, codeSize);

  if (outputBits > 0) {
    output.push(outputByte);
  }

  return Uint8Array.from(output);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
