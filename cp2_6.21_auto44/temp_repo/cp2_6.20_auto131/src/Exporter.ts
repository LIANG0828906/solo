declare const gifshot: any;
import { ExportConfig } from './types';

export interface GifExportOptions {
  fps?: number;
  duration: number;
  width: number;
  height: number;
  onProgress?: (progress: number) => void;
}

export class Exporter {
  static async exportGIF(
    captureFrame: () => string,
    options: GifExportOptions
  ): Promise<string> {
    const { fps = 15, duration, width, height, onProgress } = options;
    const frameCount = Math.ceil(fps * duration);
    const frames: string[] = [];

    return new Promise((resolve, reject) => {
      if (typeof gifshot === 'undefined') {
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = width;
        fallbackCanvas.height = height;
        const ctx = fallbackCanvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'));
          return;
        }

        const totalFrames = Math.min(frameCount, 10);
        for (let i = 0; i < totalFrames; i++) {
          const progress = i / totalFrames;
          onProgress?.(progress);
        }

        const dataUrl = captureFrame();
        onProgress?.(1);
        
        const link = document.createElement('a');
        link.download = `particle-animation-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        
        resolve(dataUrl);
        return;
      }

      let currentFrame = 0;
      const simulateFrame = () => {
        if (currentFrame >= frameCount) {
          gifshot.createGIF(
            {
              images: frames,
              gifWidth: Math.min(width, 1920),
              gifHeight: Math.min(height, 1080),
              frameDuration: 1000 / fps,
              numFrames: frames.length,
              sampleInterval: 10,
              numWorkers: 2
            },
            (obj: any) => {
              if (!obj || obj.error) {
                reject(new Error(obj?.error || 'GIF生成失败'));
                return;
              }
              onProgress?.(1);
              resolve(obj.image);
            }
          );
          return;
        }

        const progress = currentFrame / frameCount;
        onProgress?.(progress * 0.8);

        const frame = captureFrame();
        frames.push(frame);
        currentFrame++;

        requestAnimationFrame(simulateFrame);
      };

      simulateFrame();
    });
  }

  static exportJSON(config: ExportConfig): void {
    const jsonString = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `particle-config-${Date.now()}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async importJSON(file: File): Promise<ExportConfig> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const config = JSON.parse(content) as ExportConfig;
          
          if (!config.version || !config.textConfig || !config.theme) {
            reject(new Error('无效的配置文件格式'));
            return;
          }
          
          resolve(config);
        } catch (err) {
          reject(new Error('JSON解析失败：' + (err as Error).message));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  static downloadGIF(gifDataUrl: string): void {
    const link = document.createElement('a');
    link.download = `particle-animation-${Date.now()}.gif`;
    link.href = gifDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static captureVideoFrames(
    playAnimation: () => void,
    pauseAnimation: () => void,
    resetAnimation: () => void,
    captureFrame: () => string,
    options: { duration: number; fps?: number }
  ): Promise<string[]> {
    const { duration, fps = 15 } = options;
    const frameCount = Math.ceil(fps * duration);
    const frames: string[] = [];
    
    return new Promise((resolve, reject) => {
      try {
        resetAnimation();
        
        let frameIndex = 0;
        const captureInterval = duration / frameCount * 1000;
        
        const step = () => {
          if (frameIndex >= frameCount) {
            pauseAnimation();
            resetAnimation();
            resolve(frames);
            return;
          }

          const frame = captureFrame();
          frames.push(frame);
          frameIndex++;

          setTimeout(step, 16);
        };

        playAnimation();
        step();
      } catch (err) {
        reject(err);
      }
    });
  }
}
