import { KaleidoParams, MirrorMode, UICallbacks } from './types';
import { ImageProcessor } from './imageProcessor';
import { Renderer } from './renderer';
import { UIManager } from './ui';

const DEFAULT_PARAMS: KaleidoParams = {
  ringCount: 8,
  rotationSpeedBase: 2,
  mirrorMode: 'none',
  dividerOpacity: 0.6
};

export class Controller {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private canvasWrapper: HTMLElement;
  private processor: ImageProcessor;
  private renderer: Renderer;
  private ui: UIManager;
  private params: KaleidoParams;
  private rafId: number | null = null;
  private isRunning: boolean = false;

  constructor(containerSelector: string) {
    const container = document.querySelector(containerSelector);
    if (!container) throw new Error(`Container not found: ${containerSelector}`);
    this.container = container as HTMLElement;

    this.canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (!this.canvas) throw new Error('Canvas not found');
    this.canvasWrapper = document.getElementById('canvas-wrapper') as HTMLElement;

    this.processor = new ImageProcessor();
    this.renderer = new Renderer(this.processor);
    this.renderer.setCanvas(this.canvas);

    this.params = { ...DEFAULT_PARAMS };
    this.processor.setParams(this.params);

    const callbacks: UICallbacks = {
      onImageUpload: this.handleImageUpload.bind(this),
      onParamsChange: this.handleParamsChange.bind(this),
      onExportRequest: this.handleExportRequest.bind(this),
      onExportConfirm: this.handleExportConfirm.bind(this),
      onExportCancel: this.handleExportCancel.bind(this),
      onReset: this.handleReset.bind(this)
    };
    this.ui = new UIManager(callbacks);

    this.setupResizeObserver();
    this.resizeCanvas();
  }

  private setupResizeObserver(): void {
    const resize = () => this.resizeCanvas();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
  }

  private resizeCanvas(): void {
    const rect = this.canvasWrapper.getBoundingClientRect();
    const size = Math.max(200, Math.floor(Math.min(rect.width, rect.height)));
    this.renderer.resize(size);
  }

  private handleImageUpload(file: File): void {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      this.processor.setSourceImage(img);
      this.ui.hideUploadOverlay();
      this.resizeCanvas();
      this.startLoop();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert('图片加载失败，请尝试其他文件');
    };
    img.src = url;
  }

  private handleParamsChange(patch: Partial<KaleidoParams>): void {
    this.params = { ...this.params, ...patch };
    this.processor.setParams(patch);
    this.ui.updateValues(patch);
  }

  private handleReset(): void {
    this.params = { ...DEFAULT_PARAMS };
    this.processor.setParams(this.params);
    this.ui.updateValues(this.params);
  }

  private handleExportRequest(): void {
  }

  private async handleExportConfirm(resolution: number): Promise<void> {
    const image = this.processor.getImage();
    if (!image) return;

    this.ui.startProgress();

    const canvasSize = this.canvas.clientWidth || 512;
    const timestamp = performance.now();
    const rings = this.processor.updateAndGetRings(timestamp, canvasSize);

    try {
      const blob = await this.renderer.exportPNG(
        resolution,
        image,
        rings,
        this.params.mirrorMode,
        this.params.dividerOpacity,
        (p) => this.ui.setProgress(p)
      );
      const filename = `kaleidosnap_${resolution}x${resolution}_${Date.now()}.png`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      this.ui.finishProgress(filename);
    } catch (e) {
      console.error(e);
      alert('导出失败，请重试');
      this.ui.closeModal();
    }
  }

  private handleExportCancel(): void {
  }

  private startLoop(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const loop = (timestamp: number) => {
      const canvasSize = this.canvas.clientWidth || 512;
      const rings = this.processor.updateAndGetRings(timestamp, canvasSize);
      const image = this.processor.getImage();
      if (image) {
        this.renderer.render(
          image,
          rings,
          this.params.mirrorMode,
          this.params.dividerOpacity
        );
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isRunning = false;
  }
}
