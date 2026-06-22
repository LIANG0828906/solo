import { v4 as uuidv4 } from 'uuid';
import { FrameData } from '@/types';

export interface ExtractionOptions {
  intervalSec: number;
  width?: number;
  height?: number;
}

const DEFAULT_OPTIONS: ExtractionOptions = {
  intervalSec: 2,
  width: 1920,
  height: 1080,
};

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    video.currentTime = time;
    const handler = () => {
      video.removeEventListener('seeked', handler);
      resolve();
    };
    video.addEventListener('seeked', handler);
  });
}

function captureFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.width = video.videoWidth || canvas.width;
    canvas.height = video.videoHeight || canvas.height;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to capture frame'));
      },
      'image/jpeg',
      0.85
    );
  });
}

export async function extractFrames(
  file: File,
  options: Partial<ExtractionOptions> = {},
  onProgress?: (current: number, total: number) => void
): Promise<FrameData[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video'));
    video.load();
  });

  const duration = video.duration;
  const interval = opts.intervalSec;
  const totalFrames = Math.floor(duration / interval);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const frames: FrameData[] = [];

  for (let i = 0; i < totalFrames; i++) {
    const time = i * interval;

    await seekTo(video, time);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const blob = await captureFrame(video, canvas, ctx);
    const frameUrl = URL.createObjectURL(blob);

    frames.push({
      id: uuidv4(),
      index: i,
      timestamp: time,
      blob,
      url: frameUrl,
    });

    if (onProgress) {
      onProgress(i + 1, totalFrames);
    }
  }

  video.src = '';
  URL.revokeObjectURL(url);

  return frames;
}
