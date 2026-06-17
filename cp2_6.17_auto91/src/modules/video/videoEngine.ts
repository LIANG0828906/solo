import { v4 as uuidv4 } from 'uuid';
import type { VideoMetadata } from '@/types';

const FRAME_CACHE_SIZE = 10;

class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export class VideoEngine {
  private videoElement: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private frameCache: LRUCache<number, ImageData>;
  private metadata: VideoMetadata | null = null;
  private isSeeking: boolean = false;

  constructor() {
    this.videoElement = document.createElement('video');
    this.videoElement.crossOrigin = 'anonymous';
    this.videoElement.preload = 'auto';
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;

    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;

    this.frameCache = new LRUCache<number, ImageData>(FRAME_CACHE_SIZE);
  }

  async loadVideo(url: string): Promise<VideoMetadata> {
    this.frameCache.clear();

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        this.videoElement.removeEventListener('loadedmetadata', onLoaded);
        this.videoElement.removeEventListener('error', onError);
      };

      const onLoaded = () => {
        cleanup();
        const duration = this.videoElement.duration;
        const width = this.videoElement.videoWidth;
        const height = this.videoElement.videoHeight;
        const fps = 30;
        const totalFrames = Math.floor(duration * fps);

        this.metadata = {
          id: uuidv4(),
          duration,
          width,
          height,
          fps,
          totalFrames,
        };

        this.canvas.width = width;
        this.canvas.height = height;

        resolve(this.metadata);
      };

      const onError = () => {
        cleanup();
        reject(new Error('Failed to load video'));
      };

      this.videoElement.addEventListener('loadedmetadata', onLoaded);
      this.videoElement.addEventListener('error', onError);
      this.videoElement.src = url;
      this.videoElement.load();
    });
  }

  async seekToTime(time: number): Promise<ImageData | null> {
    if (!this.metadata) {
      return null;
    }

    const clampedTime = Math.max(0, Math.min(time, this.metadata.duration));
    const frameIndex = Math.floor(clampedTime * this.metadata.fps);

    const cached = this.frameCache.get(frameIndex);
    if (cached) {
      return cached;
    }

    if (this.isSeeking) {
      return null;
    }

    this.isSeeking = true;

    return new Promise((resolve) => {
      const cleanup = () => {
        this.videoElement.removeEventListener('seeked', onSeeked);
        this.videoElement.removeEventListener('error', onError);
        this.isSeeking = false;
      };

      const onSeeked = () => {
        cleanup();
        try {
          this.ctx.drawImage(this.videoElement, 0, 0);
          const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
          this.frameCache.set(frameIndex, imageData);
          resolve(imageData);
        } catch {
          resolve(null);
        }
      };

      const onError = () => {
        cleanup();
        resolve(null);
      };

      this.videoElement.addEventListener('seeked', onSeeked);
      this.videoElement.addEventListener('error', onError);

      try {
        this.videoElement.currentTime = clampedTime;
      } catch {
        cleanup();
        resolve(null);
      }
    });
  }

  async getFrameAtTime(time: number): Promise<ImageData | null> {
    return this.seekToTime(time);
  }

  getCurrentFrame(): ImageData | null {
    if (!this.metadata) {
      return null;
    }

    try {
      this.ctx.drawImage(this.videoElement, 0, 0);
      return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    } catch {
      return null;
    }
  }

  getMetadata(): VideoMetadata | null {
    return this.metadata;
  }

  getVideoElement(): HTMLVideoElement {
    return this.videoElement;
  }

  destroy(): void {
    if (this.videoElement.src) {
      URL.revokeObjectURL(this.videoElement.src);
    }
    this.videoElement.pause();
    this.videoElement.src = '';
    this.videoElement.removeAttribute('src');
    this.frameCache.clear();
    this.metadata = null;
  }
}

export const videoEngine = new VideoEngine();
