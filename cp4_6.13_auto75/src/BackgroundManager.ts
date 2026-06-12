export type BackgroundMode = 'solid' | 'gradient' | 'image';

export type GradientType = 'linear' | 'radial';

export interface SolidBackground {
  mode: 'solid';
  color: string;
}

export interface GradientBackground {
  mode: 'gradient';
  type: GradientType;
  startColor: string;
  endColor: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface ImageBackground {
  mode: 'image';
  image: HTMLImageElement | null;
  blur: number;
  overlayOpacity: number;
  overlayColor: string;
}

export type BackgroundConfig = SolidBackground | GradientBackground | ImageBackground;

export const BASE_COLORS: string[] = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483',
  '#e94560', '#0f3460', '#1e5128', '#d15123',
  '#190019', '#2b124c', '#201658', '#0b0063'
];

export class BackgroundManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: BackgroundConfig;
  private blurredImageCanvas: HTMLCanvasElement | null = null;
  private rafId: number | null = null;
  private pendingRender: boolean = false;
  private transitionAlpha: number = 1;
  private transitionTarget: BackgroundConfig | null = null;
  private width: number = 0;
  private height: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;

    this.config = {
      mode: 'gradient',
      type: 'linear',
      startColor: '#1a1a2e',
      endColor: '#16213e',
      startX: 0,
      startY: 0,
      endX: 1,
      endY: 1
    };
  }

  setConfig(config: BackgroundConfig, animate: boolean = true) {
    if (animate) {
      this.transitionTarget = config;
      this.transitionAlpha = 0;
      this.animateTransition();
    } else {
      this.config = config;
      if (config.mode === 'image' && config.image) {
        this.preBlurImage(config.image, (config as ImageBackground).blur);
      }
      this.requestRender();
    }
  }

  getConfig(): BackgroundConfig {
    return this.config;
  }

  resize(width: number, height: number) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = width;
    this.height = height;
    const cfg = this.config;
    if (cfg.mode === 'image' && cfg.image) {
      this.preBlurImage(cfg.image, cfg.blur);
    }
    this.requestRender();
  }

  updateGradientPoint(which: 'start' | 'end', x: number, y: number) {
    if (this.config.mode !== 'gradient') return;
    if (which === 'start') {
      this.config.startX = x;
      this.config.startY = y;
    } else {
      this.config.endX = x;
      this.config.endY = y;
    }
    this.requestRender();
  }

  updateImageBlur(blur: number) {
    if (this.config.mode !== 'image') return;
    this.config.blur = blur;
    if (this.config.image) {
      this.preBlurImage(this.config.image, blur);
    }
    this.requestRender();
  }

  async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const cfg = this.config;
          const newConfig: ImageBackground = {
            mode: 'image',
            image: img,
            blur: cfg.mode === 'image' ? cfg.blur : 10,
            overlayOpacity: cfg.mode === 'image' ? cfg.overlayOpacity : 0.5,
            overlayColor: cfg.mode === 'image' ? cfg.overlayColor : '#000000'
          };
          this.setConfig(newConfig);
          resolve(img);
        };
        img.onerror = reject;
        img.src = e.target!.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private preBlurImage(img: HTMLImageElement, blur: number) {
    if (!this.width || !this.height) return;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = this.width;
    offCanvas.height = this.height;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return;

    const scale = Math.max(this.width / img.width, this.height / img.height);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const offsetX = (this.width - drawWidth) / 2;
    const offsetY = (this.height - drawHeight) / 2;

    ctx.filter = blur > 0 ? `blur(${blur}px)` : 'none';
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    this.blurredImageCanvas = offCanvas;
  }

  private animateTransition() {
    if (this.transitionAlpha >= 1 || !this.transitionTarget) {
      if (this.transitionTarget) {
        this.config = this.transitionTarget;
        if (this.config.mode === 'image' && this.config.image) {
          this.preBlurImage(this.config.image, (this.config as ImageBackground).blur);
        }
        this.transitionTarget = null;
        this.transitionAlpha = 1;
      }
      this.requestRender();
      return;
    }
    this.transitionAlpha = Math.min(1, this.transitionAlpha + 1 / 30);
    this.requestRender();
    requestAnimationFrame(() => this.animateTransition());
  }

  requestRender() {
    if (this.pendingRender) return;
    this.pendingRender = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      this.pendingRender = false;
      this.render();
    });
  }

  render() {
    const { ctx, canvas } = this;
    const cssWidth = canvas.width / (window.devicePixelRatio || 1);
    const cssHeight = canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, cssWidth, cssHeight);
    this.renderBackground(ctx, this.config, cssWidth, cssHeight, 1);

    if (this.transitionTarget && this.transitionAlpha < 1) {
      ctx.globalAlpha = this.transitionAlpha;
      this.renderBackground(ctx, this.transitionTarget, cssWidth, cssHeight, this.transitionAlpha);
      ctx.globalAlpha = 1;
    }
  }

  private renderBackground(
    ctx: CanvasRenderingContext2D,
    config: BackgroundConfig,
    width: number,
    height: number,
    alpha: number
  ) {
    ctx.save();
    ctx.globalAlpha = alpha;

    if (config.mode === 'solid') {
      ctx.fillStyle = config.color;
      ctx.fillRect(0, 0, width, height);
    } else if (config.mode === 'gradient') {
      let gradient: CanvasGradient;
      if (config.type === 'linear') {
        gradient = ctx.createLinearGradient(
          config.startX * width,
          config.startY * height,
          config.endX * width,
          config.endY * height
        );
      } else {
        const cx = (config.startX + config.endX) / 2 * width;
        const cy = (config.startY + config.endY) / 2 * height;
        const dist = Math.sqrt(
          Math.pow((config.endX - config.startX) * width, 2) +
          Math.pow((config.endY - config.startY) * height, 2)
        );
        const radius = Math.max(width, height) * 0.6 + dist * 0.3;
        gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      }
      gradient.addColorStop(0, config.startColor);
      gradient.addColorStop(1, config.endColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    } else if (config.mode === 'image') {
      if (this.blurredImageCanvas) {
        ctx.drawImage(this.blurredImageCanvas, 0, 0, width, height);
      }
      if (config.overlayOpacity > 0) {
        ctx.globalAlpha = alpha * config.overlayOpacity;
        ctx.fillStyle = config.overlayColor;
        ctx.fillRect(0, 0, width, height);
      }
    }
    ctx.restore();
  }

  drawToContext(targetCtx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    const off = document.createElement('canvas');
    off.width = width;
    off.height = height;
    const offCtx = off.getContext('2d')!;
    if (this.config.mode === 'solid') {
      offCtx.fillStyle = this.config.color;
      offCtx.fillRect(0, 0, width, height);
    } else if (this.config.mode === 'gradient') {
      let gradient: CanvasGradient;
      if (this.config.type === 'linear') {
        gradient = offCtx.createLinearGradient(
          this.config.startX * width, this.config.startY * height,
          this.config.endX * width, this.config.endY * height
        );
      } else {
        const cx = (this.config.startX + this.config.endX) / 2 * width;
        const cy = (this.config.startY + this.config.endY) / 2 * height;
        const radius = Math.max(width, height) * 0.7;
        gradient = offCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      }
      gradient.addColorStop(0, this.config.startColor);
      gradient.addColorStop(1, this.config.endColor);
      offCtx.fillStyle = gradient;
      offCtx.fillRect(0, 0, width, height);
    } else if (this.config.mode === 'image') {
      if (this.config.image) {
        const scale = Math.max(width / this.config.image.width, height / this.config.image.height);
        const dw = this.config.image.width * scale;
        const dh = this.config.image.height * scale;
        offCtx.filter = `blur(${this.config.blur * width / this.width}px)`;
        offCtx.drawImage(this.config.image, (width - dw) / 2, (height - dh) / 2, dw, dh);
        offCtx.filter = 'none';
      }
      if (this.config.overlayOpacity > 0) {
        offCtx.globalAlpha = this.config.overlayOpacity;
        offCtx.fillStyle = this.config.overlayColor;
        offCtx.fillRect(0, 0, width, height);
      }
    }
    targetCtx.drawImage(off, x, y, width, height);
  }

  destroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }
}
