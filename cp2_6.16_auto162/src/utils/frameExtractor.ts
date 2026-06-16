import type { FrameData } from './types';

export interface ExtractOptions {
  onProgress?: (current: number, total: number) => void;
  maxFrames?: number;
  targetFps?: number;
}

export async function extractFrames(
  videoFile: File,
  options: ExtractOptions = {},
): Promise<FrameData[]> {
  const { onProgress, maxFrames = 500, targetFps = 10 } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const url = URL.createObjectURL(videoFile);
    video.src = url;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法获取 canvas 上下文'));
      return;
    }

    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      const totalFramesEstimate = Math.min(Math.floor(duration * targetFps), maxFrames);
      const actualFps = totalFramesEstimate / duration;
      const frameInterval = 1 / actualFps;

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const frames: FrameData[] = [];
      let currentFrame = 0;

      const processFrame = () => {
        if (currentFrame >= totalFramesEstimate) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }

        const time = currentFrame * frameInterval;
        video.currentTime = Math.min(time, duration - 0.01);
      };

      video.addEventListener('seeked', () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          frames.push({
            index: currentFrame,
            imageData,
          });

          currentFrame++;
          onProgress?.(currentFrame, totalFramesEstimate);

          setTimeout(processFrame, 0);
        } catch (err) {
          reject(err);
        }
      });

      processFrame();
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('视频加载失败'));
    });
  });
}

export function imageDataToDataURL(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export function drawImageDataOnCanvas(
  imageData: ImageData,
  canvas: HTMLCanvasElement,
  scale = 1,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = imageData.width * scale;
  canvas.height = imageData.height * scale;
  ctx.putImageData(imageData, 0, 0);
}
