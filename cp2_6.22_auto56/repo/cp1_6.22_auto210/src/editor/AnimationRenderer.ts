import { AnimationConfig } from '../types';

export class AnimationRenderer {
  private pathElement: SVGPathElement | null = null;
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private totalLength: number = 0;
  private config: AnimationConfig = {
    speed: 1,
    loop: false,
    duration: 2000
  };
  private onProgress?: (progress: number) => void;
  private onComplete?: () => void;

  setPathElement(element: SVGPathElement | null): void {
    this.pathElement = element;
    if (element) {
      this.totalLength = element.getTotalLength();
      element.style.strokeDasharray = `${this.totalLength}`;
      element.style.strokeDashoffset = `${this.totalLength}`;
    }
  }

  setConfig(config: Partial<AnimationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AnimationConfig {
    return { ...this.config };
  }

  setOnProgress(callback: (progress: number) => void): void {
    this.onProgress = callback;
  }

  setOnComplete(callback: () => void): void {
    this.onComplete = callback;
  }

  start(): void {
    if (!this.pathElement) return;

    this.stop();
    this.totalLength = this.pathElement.getTotalLength();
    this.pathElement.style.strokeDasharray = `${this.totalLength}`;
    this.startTime = performance.now();
    this.animate();
  }

  private animate = (): void => {
    if (!this.pathElement) return;

    const elapsed = performance.now() - this.startTime;
    const adjustedDuration = this.config.duration / this.config.speed;
    let progress = Math.min(elapsed / adjustedDuration, 1);

    if (this.config.loop && progress >= 1) {
      this.startTime = performance.now();
      progress = 0;
    }

    const offset = this.totalLength * (1 - progress);
    this.pathElement.style.strokeDashoffset = `${offset}`;

    if (this.onProgress) {
      this.onProgress(progress);
    }

    if (progress < 1) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    } else {
      this.animationFrameId = null;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  };

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  reset(): void {
    this.stop();
    if (this.pathElement) {
      this.pathElement.style.strokeDashoffset = `${this.totalLength}`;
    }
    if (this.onProgress) {
      this.onProgress(0);
    }
  }

  isPlaying(): boolean {
    return this.animationFrameId !== null;
  }

  interpolateColor(startColor: string, endColor: string, t: number): string {
    const s = this.hexToRgb(startColor);
    const e = this.hexToRgb(endColor);

    if (!s || !e) return startColor;

    const r = Math.round(s.r + (e.r - s.r) * t);
    const g = Math.round(s.g + (e.g - s.g) * t);
    const b = Math.round(s.b + (e.b - s.b) * t);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  }
}
