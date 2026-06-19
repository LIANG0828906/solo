import { ColorPair, hslToString, brightenHSL } from '../utils/colorEngine';

export interface AuraConfig {
  layers: Array<{
    radius: number;
    opacity: number;
    colorType: 'primary' | 'primaryBright' | 'secondary';
  }>;
  targetFps: number;
}

const DEFAULT_CONFIG: AuraConfig = {
  layers: [
    { radius: 150, opacity: 0.3, colorType: 'primary' },
    { radius: 250, opacity: 0.15, colorType: 'primaryBright' },
    { radius: 400, opacity: 0.08, colorType: 'secondary' },
  ],
  targetFps: 30,
};

export class AuraCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: AuraConfig;
  private colors: ColorPair;
  private mouseX: number;
  private mouseY: number;
  private targetMouseX: number;
  private targetMouseY: number;
  private running: boolean;
  private animationFrameId: number | null;
  private lastDrawTime: number;
  private frameInterval: number;

  constructor(canvas: HTMLCanvasElement, config?: Partial<AuraConfig>) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.colors = {
      primary: { h: 197, s: 89, l: 47 },
      secondary: { h: 17, s: 89, l: 55 },
    };
    this.mouseX = window.innerWidth / 2;
    this.mouseY = window.innerHeight / 2;
    this.targetMouseX = this.mouseX;
    this.targetMouseY = this.mouseY;
    this.running = false;
    this.animationFrameId = null;
    this.lastDrawTime = 0;
    this.frameInterval = 1000 / this.config.targetFps;
    this.resize();
    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousemove', this.handleMouseMove);
  }

  private unbindEvents(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
  }

  private handleResize = (): void => {
    this.resize();
  };

  private handleMouseMove = (e: MouseEvent): void => {
    this.targetMouseX = e.clientX;
    this.targetMouseY = e.clientY;
  };

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public setColors(colors: ColorPair): void {
    this.colors = colors;
  }

  private drawLayer(
    cx: number,
    cy: number,
    radius: number,
    colorStr: string,
    opacity: number,
  ): void {
    const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, colorStr);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    this.ctx.globalAlpha = opacity;
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawFrame(): void {
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.08;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.08;

    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const layer of this.config.layers) {
      let colorStr: string;
      switch (layer.colorType) {
        case 'primaryBright':
          colorStr = hslToString(brightenHSL(this.colors.primary, 15));
          break;
        case 'secondary':
          colorStr = hslToString(this.colors.secondary);
          break;
        case 'primary':
        default:
          colorStr = hslToString(this.colors.primary);
          break;
      }
      this.drawLayer(this.mouseX, this.mouseY, layer.radius, colorStr, layer.opacity);
    }
    this.ctx.globalAlpha = 1;
  }

  private loop = (timestamp: number): void => {
    if (!this.running) return;
    if (timestamp - this.lastDrawTime >= this.frameInterval) {
      this.drawFrame();
      this.lastDrawTime = timestamp;
    }
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.lastDrawTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy(): void {
    this.stop();
    this.unbindEvents();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
