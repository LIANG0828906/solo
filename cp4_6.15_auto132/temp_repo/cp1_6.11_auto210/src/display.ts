export interface PixelColor {
  r: number;
  g: number;
  b: number;
}

export interface PixelState {
  baseColor: PixelColor;
  overlayColor: PixelColor | null;
  overlayAlpha: number;
  fadeSpeed: number;
}

export class PixelDisplay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pixelSize: number;
  private cols: number;
  private rows: number;
  private pixels: PixelState[] = [];
  private pixelChangeCount: number = 0;
  
  private rippleIntensity: Float32Array;
  private rippleTemp: Float32Array;
  private rippleColor: PixelColor = { r: 0, g: 191, b: 255 };
  private rippleDecay: number = 0.96;
  private rippleDiffusion: number = 0.25;

  constructor(canvas: HTMLCanvasElement, pixelSize: number = 10) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.pixelSize = pixelSize;
    this.cols = Math.floor(canvas.width / pixelSize);
    this.rows = Math.floor(canvas.height / pixelSize);
    this.rippleIntensity = new Float32Array(this.cols * this.rows);
    this.rippleTemp = new Float32Array(this.cols * this.rows);
    this.initializePixels();
  }

  private initializePixels(): void {
    this.pixels = [];
    const total = this.cols * this.rows;
    for (let i = 0; i < total; i++) {
      this.pixels.push({
        baseColor: {
          r: Math.floor(Math.random() * 191) + 30,
          g: Math.floor(Math.random() * 191) + 30,
          b: Math.floor(Math.random() * 191) + 30
        },
        overlayColor: null,
        overlayAlpha: 0,
        fadeSpeed: 0
      });
    }
    if (this.rippleIntensity.length !== total) {
      this.rippleIntensity = new Float32Array(total);
      this.rippleTemp = new Float32Array(total);
    } else {
      this.rippleIntensity.fill(0);
      this.rippleTemp.fill(0);
    }
  }

  public getPixelSize(): number {
    return this.pixelSize;
  }

  public getCols(): number {
    return this.cols;
  }

  public getRows(): number {
    return this.rows;
  }

  public getTotalPixels(): number {
    return this.cols * this.rows;
  }

  public getPixelChangeCount(): number {
    return this.pixelChangeCount;
  }

  public setPixelSize(newSize: number): void {
    this.pixelSize = newSize;
    this.cols = Math.floor(this.canvas.width / newSize);
    this.rows = Math.floor(this.canvas.height / newSize);
    const total = this.cols * this.rows;
    this.rippleIntensity = new Float32Array(total);
    this.rippleTemp = new Float32Array(total);
    this.initializePixels();
  }

  public setRippleColor(color: PixelColor): void {
    this.rippleColor = { ...color };
  }

  public getPixelIndex(col: number, row: number): number {
    return row * this.cols + col;
  }

  public getPixelCoords(index: number): { col: number; row: number } {
    return {
      col: index % this.cols,
      row: Math.floor(index / this.cols)
    };
  }

  public setPixelOverlay(index: number, color: PixelColor, fadeDuration: number = 200): void {
    if (index < 0 || index >= this.pixels.length) return;
    const pixel = this.pixels[index];
    pixel.overlayColor = { ...color };
    pixel.overlayAlpha = 1;
    pixel.fadeSpeed = 1 / (fadeDuration / 16.67);
    this.pixelChangeCount++;
  }

  public setRowOverlay(row: number, color: PixelColor, fadeDuration: number = 200): void {
    if (row < 0 || row >= this.rows) return;
    const startIdx = row * this.cols;
    for (let col = 0; col < this.cols; col++) {
      const idx = startIdx + col;
      const pixel = this.pixels[idx];
      pixel.overlayColor = { ...color };
      pixel.overlayAlpha = 1;
      pixel.fadeSpeed = 1 / (fadeDuration / 16.67);
    }
    this.pixelChangeCount += this.cols;
  }

  public addRipple(col: number, row: number, intensity: number = 1.0): void {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    const idx = row * this.cols + col;
    this.rippleIntensity[idx] = Math.min(1.0, this.rippleIntensity[idx] + intensity);
    this.pixelChangeCount++;
  }

  public addRippleRing(indices: number[], intensity: number = 1.0): void {
    for (const idx of indices) {
      if (idx >= 0 && idx < this.rippleIntensity.length) {
        this.rippleIntensity[idx] = Math.min(1.0, this.rippleIntensity[idx] + intensity);
      }
    }
    this.pixelChangeCount += indices.length;
  }

  public update(deltaTime: number = 16.67): void {
    const dtRatio = deltaTime / 16.67;
    
    for (let i = 0; i < this.pixels.length; i++) {
      const pixel = this.pixels[i];
      if (pixel.overlayAlpha > 0 && pixel.overlayColor) {
        pixel.overlayAlpha -= pixel.fadeSpeed * dtRatio;
        if (pixel.overlayAlpha <= 0) {
          pixel.overlayAlpha = 0;
          pixel.overlayColor = null;
        }
      }
    }

    this.updateRipples(dtRatio);
  }

  private updateRipples(dtRatio: number): void {
    const cols = this.cols;
    const rows = this.rows;
    const src = this.rippleIntensity;
    const dst = this.rippleTemp;
    
    const decay = Math.pow(this.rippleDecay, dtRatio);
    const diffusion = this.rippleDiffusion * dtRatio;
    const centerWeight = 1 - diffusion;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        
        const up = row > 0 ? src[idx - cols] : 0;
        const down = row < rows - 1 ? src[idx + cols] : 0;
        const left = col > 0 ? src[idx - 1] : 0;
        const right = col < cols - 1 ? src[idx + 1] : 0;
        
        const neighborAvg = (up + down + left + right) / 4;
        
        let newValue = src[idx] * centerWeight + neighborAvg * diffusion;
        newValue *= decay;
        
        dst[idx] = Math.max(0, Math.min(1, newValue));
      }
    }
    
    this.rippleTemp = src;
    this.rippleIntensity = dst;
  }

  public render(): void {
    const ctx = this.ctx;
    const ps = this.pixelSize;
    const cols = this.cols;
    const rows = this.rows;
    
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const pixel = this.pixels[idx];
        
        let r = pixel.baseColor.r;
        let g = pixel.baseColor.g;
        let b = pixel.baseColor.b;

        if (pixel.overlayColor && pixel.overlayAlpha > 0) {
          const alpha = pixel.overlayAlpha;
          r = pixel.baseColor.r * (1 - alpha) + pixel.overlayColor.r * alpha;
          g = pixel.baseColor.g * (1 - alpha) + pixel.overlayColor.g * alpha;
          b = pixel.baseColor.b * (1 - alpha) + pixel.overlayColor.b * alpha;
        }

        const ripple = this.rippleIntensity[idx];
        if (ripple > 0) {
          r = r * (1 - ripple) + this.rippleColor.r * ripple;
          g = g * (1 - ripple) + this.rippleColor.g * ripple;
          b = b * (1 - ripple) + this.rippleColor.b * ripple;
        }

        ctx.fillStyle = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        ctx.fillRect(col * ps, row * ps, ps, ps);
      }
    }
  }

  public reset(): void {
    this.pixelChangeCount = 0;
    this.rippleIntensity.fill(0);
    this.rippleTemp.fill(0);
    this.initializePixels();
  }

  public resetRipples(): void {
    this.rippleIntensity.fill(0);
    this.rippleTemp.fill(0);
  }
}
