export class SilkTexture {
  private width: number;
  private height: number;
  private textureCanvas: HTMLCanvasElement;
  private textureCtx: CanvasRenderingContext2D;
  private noiseData: ImageData | null = null;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.textureCanvas = document.createElement('canvas');
    this.textureCanvas.width = width;
    this.textureCanvas.height = height;
    const ctx = this.textureCanvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.textureCtx = ctx;
    this.generateTexture();
  }

  private generateTexture(): void {
    const ctx = this.textureCtx;
    const { width, height } = this;

    ctx.fillStyle = '#F5F0E1';
    ctx.fillRect(0, 0, width, height);

    const baseColor = { r: 245, g: 240, b: 225 };
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;

        const noise = (Math.random() - 0.5) * 12;

        const warpNoise = Math.sin(x * 0.02 + y * 0.015) * 3
          + Math.sin(x * 0.05 - y * 0.03) * 2;

        const weftLine = Math.sin(y * 0.8 + warpNoise) * 0.5 + 0.5;
        const warpLine = Math.sin(x * 0.9 + warpNoise * 0.8) * 0.5 + 0.5;

        const threadVariation = (weftLine + warpLine) * 3;

        data[i] = Math.max(0, Math.min(255, baseColor.r + noise + threadVariation - 5));
        data[i + 1] = Math.max(0, Math.min(255, baseColor.g + noise + threadVariation - 7));
        data[i + 2] = Math.max(0, Math.min(255, baseColor.b + noise + threadVariation - 10));
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    this.noiseData = imageData;

    this.drawFiberDetails();
  }

  private drawFiberDetails(): void {
    const ctx = this.textureCtx;
    const { width, height } = this;

    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#8B7D6B';
    ctx.lineWidth = 0.5;

    for (let y = 0; y < height; y += 3) {
      ctx.beginPath();
      const startX = Math.random() * 10;
      ctx.moveTo(startX, y);
      for (let x = startX; x < width; x += 20) {
        const wobble = Math.sin(x * 0.1 + y * 0.05) * 1.5;
        ctx.lineTo(x, y + wobble);
      }
      ctx.stroke();
    }

    for (let x = 0; x < width; x += 4) {
      ctx.beginPath();
      const startY = Math.random() * 8;
      ctx.moveTo(x, startY);
      for (let y = startY; y < height; y += 25) {
        const wobble = Math.sin(y * 0.08 + x * 0.06) * 1;
        ctx.lineTo(x + wobble, y);
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const w = Math.random() * 3 + 1;
      const h = Math.random() * 2 + 0.5;
      ctx.fillStyle = Math.random() > 0.5 ? '#6B5B4B' : '#D4C8B0';
      ctx.fillRect(x, y, w, h);
    }

    ctx.globalAlpha = 1;
  }

  public getTextureCanvas(): HTMLCanvasElement {
    return this.textureCanvas;
  }

  public getTextureData(): ImageData {
    return this.textureCtx.getImageData(0, 0, this.width, this.height);
  }

  public getNoiseValue(x: number, y: number): number {
    if (!this.noiseData) return 0;
    const px = Math.floor(x) % this.width;
    const py = Math.floor(y) % this.height;
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return 0;
    const i = (py * this.width + px) * 4;
    return (this.noiseData.data[i] - 245) / 12;
  }

  public overlayInk(ctx: CanvasRenderingContext2D): void {
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(this.textureCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.textureCanvas.width = width;
    this.textureCanvas.height = height;
    this.generateTexture();
  }
}
