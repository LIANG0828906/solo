export interface RenderOptions {
  transition?: boolean;
  transitionDuration?: number;
  scaleStart?: number;
  scaleEnd?: number;
}

export class RenderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private transitionStart: number = 0;
  private fromData: ImageData | null = null;
  private toData: ImageData | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas上下文');
    this.ctx = ctx;

    this.offscreenCanvas = document.createElement('canvas');
    const offCtx = this.offscreenCanvas.getContext('2d');
    if (!offCtx) throw new Error('无法获取离屏Canvas上下文');
    this.offscreenCtx = offCtx;
  }

  loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  drawImage(img: HTMLImageElement, maxWidth?: number): void {
    const ratio = img.width / img.height;
    let width = img.width;
    let height = img.height;
    if (maxWidth && width > maxWidth) {
      width = maxWidth;
      height = Math.round(width / ratio);
    }
    this.canvas.width = width;
    this.canvas.height = height;
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(img, 0, 0, width, height);
    this.offscreenCtx.clearRect(0, 0, width, height);
    this.offscreenCtx.drawImage(img, 0, 0, width, height);
  }

  drawProcessed(imageData: ImageData): void {
    this.canvas.width = imageData.width;
    this.canvas.height = imageData.height;
    this.offscreenCanvas.width = imageData.width;
    this.offscreenCanvas.height = imageData.height;
    this.ctx.clearRect(0, 0, imageData.width, imageData.height);
    this.ctx.putImageData(imageData, 0, 0);
    this.offscreenCtx.clearRect(0, 0, imageData.width, imageData.height);
    this.offscreenCtx.putImageData(imageData, 0, 0);
  }

  drawWithTransition(newImageData: ImageData, options: RenderOptions = {}): Promise<void> {
    const {
      transition = true,
      transitionDuration = 500,
      scaleStart = 0.95,
      scaleEnd = 1.0,
    } = options;

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.canvas.width = newImageData.width;
    this.canvas.height = newImageData.height;
    this.offscreenCanvas.width = newImageData.width;
    this.offscreenCanvas.height = newImageData.height;

    return new Promise((resolve) => {
      if (!transition) {
        this.drawProcessed(newImageData);
        resolve();
        return;
      }

      try {
        this.fromData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      } catch {
        this.fromData = new ImageData(this.canvas.width, this.canvas.height);
      }
      this.toData = newImageData;
      this.transitionStart = performance.now();

      const animate = (now: number) => {
        const elapsed = now - this.transitionStart;
        let progress = Math.min(elapsed / transitionDuration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const opacity = easeProgress;
        const scale = scaleStart + (scaleEnd - scaleStart) * easeProgress;

        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);
        this.ctx.save();
        this.ctx.translate(w / 2, h / 2);
        this.ctx.scale(scale, scale);
        this.ctx.translate(-w / 2, -h / 2);

        if (this.fromData && this.toData) {
          const fromImg = this.ctx.canvas;
          void fromImg;
          this.ctx.globalAlpha = 1 - opacity;
          this.ctx.putImageData(this.fromData, 0, 0);
          this.ctx.globalAlpha = opacity;
          this.ctx.putImageData(this.toData, 0, 0);
          this.ctx.globalAlpha = 1;
        }
        this.ctx.restore();

        if (progress < 1) {
          this.animationId = requestAnimationFrame(animate);
        } else {
          this.animationId = null;
          if (this.toData) {
            this.offscreenCtx.clearRect(0, 0, w, h);
            this.offscreenCtx.putImageData(this.toData, 0, 0);
          }
          resolve();
        }
      };

      this.animationId = requestAnimationFrame(animate);
    });
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
  }

  getImageData(): ImageData {
    return this.offscreenCtx.getImageData(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
  }

  toDataURL(type: string = 'image/png'): string {
    return this.offscreenCanvas.toDataURL(type);
  }

  destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
