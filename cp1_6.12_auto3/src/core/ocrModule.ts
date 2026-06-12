import Tesseract from 'tesseract.js';
import { OCRFrameResult, OCRTextLine } from '@/types';

const FRAME_INTERVAL = 5;
const MAX_DURATION = 180;

export async function extractVideoFrames(
  videoFile: File,
  onProgress?: (progress: number, message: string) => void
): Promise<HTMLCanvasElement[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(videoFile);
    video.src = url;

    const frames: HTMLCanvasElement[] = [];
    const canvasList: HTMLCanvasElement[] = [];

    video.onloadedmetadata = () => {
      const duration = Math.min(video.duration, MAX_DURATION);
      const frameCount = Math.floor(duration / FRAME_INTERVAL) + 1;
      
      let currentFrame = 0;
      
      const captureFrame = () => {
        if (currentFrame >= frameCount) {
          URL.revokeObjectURL(url);
          resolve(canvasList);
          return;
        }
        
        const timestamp = currentFrame * FRAME_INTERVAL;
        video.currentTime = Math.min(timestamp, duration - 0.1);
        
        if (onProgress) {
          onProgress(
            (currentFrame / frameCount) * 50,
            `正在提取第 ${currentFrame + 1}/${frameCount} 帧...`
          );
        }
        
        currentFrame++;
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvasList.push(canvas);
          frames.push(canvas);
        }
        
        setTimeout(captureFrame, 10);
      };
      
      captureFrame();
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('视频加载失败'));
    };
  });
}

export async function ocrFrames(
  frames: HTMLCanvasElement[],
  onProgress?: (progress: number, message: string) => void
): Promise<OCRFrameResult[]> {
  const results: OCRFrameResult[] = [];
  const totalFrames = frames.length;

  for (let i = 0; i < frames.length; i++) {
    const canvas = frames[i];
    
    if (onProgress) {
      onProgress(
        50 + (i / totalFrames) * 50,
        `正在识别第 ${i + 1}/${totalFrames} 帧文字...`
      );
    }

    try {
      const { data } = await Tesseract.recognize(
        canvas,
        'chi_sim+eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text' && onProgress) {
              const ocrProgress = m.progress || 0;
              const frameProgress = (i + ocrProgress) / totalFrames;
              onProgress(
                50 + frameProgress * 50,
                `正在识别第 ${i + 1}/${totalFrames} 帧文字...`
              );
            }
          },
        }
      );

      const lines: OCRTextLine[] = data.lines.map(line => ({
        text: line.text.trim(),
        confidence: line.confidence,
      }));

      const fullText = lines.map(l => l.text).join('\n');

      results.push({
        timestamp: i * FRAME_INTERVAL,
        frameIndex: i,
        lines,
        fullText,
      });
    } catch (error) {
      console.error(`OCR failed for frame ${i}:`, error);
      results.push({
        timestamp: i * FRAME_INTERVAL,
        frameIndex: i,
        lines: [],
        fullText: '',
      });
    }
  }

  return results;
}

export async function processVideoOCR(
  videoFile: File,
  onProgress?: (progress: number, message: string) => void
): Promise<OCRFrameResult[]> {
  if (onProgress) {
    onProgress(0, '正在加载视频...');
  }

  const frames = await extractVideoFrames(videoFile, onProgress);

  if (onProgress) {
    onProgress(50, '正在进行OCR识别...');
  }

  const ocrResults = await ocrFrames(frames, onProgress);

  if (onProgress) {
    onProgress(100, 'OCR识别完成');
  }

  return ocrResults;
}
