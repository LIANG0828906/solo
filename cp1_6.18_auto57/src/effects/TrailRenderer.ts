import {
  BG_COLOR,
  BG_COLOR_RGB,
  TRAIL_DECAY,
  colorToCSS,
  ColorRGB,
} from '../config/visualConfig';

export class TrailRenderer {
  private mainCanvas: HTMLCanvasElement;
  private mainCtx: CanvasRenderingContext2D;
  private offCanvas: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.mainCanvas = canvas;
    this.mainCtx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;

    this.offCanvas = document.createElement('canvas');
    this.offCanvas.width = this.width;
    this.offCanvas.height = this.height;
    this.offCtx = this.offCanvas.getContext('2d')!;

    this.clearOffscreen();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.mainCanvas.width = width;
    this.mainCanvas.height = height;
    this.offCanvas.width = width;
    this.offCanvas.height = height;
    this.clearOffscreen();
  }

  private clearOffscreen(): void {
    this.offCtx.fillStyle = BG_COLOR;
    this.offCtx.fillRect(0, 0, this.width, this.height);
  }

  clearAll(): void {
    this.clearOffscreen();
  }

  getCanvas(): HTMLCanvasElement {
    return this.mainCanvas;
  }

  renderFrame(
    x: number,
    y: number,
    radius: number,
    color: ColorRGB,
    flashWhite: boolean
  ): void {
    this.offCtx.fillStyle = `rgba(${BG_COLOR_RGB.r},${BG_COLOR_RGB.g},${BG_COLOR_RGB.b},${TRAIL_DECAY})`;
    this.offCtx.fillRect(0, 0, this.width, this.height);

    const drawColor = flashWhite ? { r: 255, g: 255, b: 255 } : color;

    const gradient = this.offCtx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, colorToCSS(drawColor, 1));
    gradient.addColorStop(0.6, colorToCSS(drawColor, 0.6));
    gradient.addColorStop(1, colorToCSS(drawColor, 0.2));

    this.offCtx.beginPath();
    this.offCtx.arc(x, y, radius, 0, Math.PI * 2);
    this.offCtx.fillStyle = gradient;
    this.offCtx.fill();

    this.offCtx.beginPath();
    this.offCtx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
    this.offCtx.fillStyle = colorToCSS(drawColor, 1);
    this.offCtx.fill();

    this.mainCtx.drawImage(this.offCanvas, 0, 0);
  }
}
