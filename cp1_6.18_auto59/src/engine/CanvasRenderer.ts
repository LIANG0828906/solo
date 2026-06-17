import type { InkPoint } from '@/store/useSimStore';
import { generatePaperTexture } from '@/utils/perlin';

interface RendererOptions {
  store: {
    getState: () => {
      inkPoints: InkPoint[];
      advanceDiffusion: (deltaTime: number) => void;
    };
  };
  onFpsUpdate?: (fps: number) => void;
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private store: RendererOptions['store'];
  private animationId: number | null = null;
  private lastTime: number = 0;
  private paperTexture: HTMLCanvasElement | null = null;
  private paperPattern: CanvasPattern | null = null;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private onFpsUpdate?: (fps: number) => void;

  constructor(ctx: CanvasRenderingContext2D, options: RendererOptions) {
    this.ctx = ctx;
    this.store = options.store;
    this.onFpsUpdate = options.onFpsUpdate;
    this.initPaperTexture();
  }

  private initPaperTexture(): void {
    this.paperTexture = generatePaperTexture(512);
    this.paperPattern = this.ctx.createPattern(this.paperTexture, 'repeat');
  }

  start(): void {
    if (this.animationId !== null) return;
    this.lastTime = performance.now();
    this.fpsUpdateTime = this.lastTime;
    this.animate();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = (): void => {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 500) {
      const fps = Math.round((this.frameCount * 1000) / (currentTime - this.fpsUpdateTime));
      this.onFpsUpdate?.(fps);
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }

    this.store.getState().advanceDiffusion(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(this.animate);
  };

  private render(): void {
    const state = this.store.getState();
    const { inkPoints } = state;
    const canvas = this.ctx.canvas;

    this.ctx.fillStyle = '#F5F0E1';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (this.paperPattern) {
      this.ctx.globalAlpha = 0.15;
      this.ctx.fillStyle = this.paperPattern;
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);
      this.ctx.globalAlpha = 1;
    }

    this.drawConnections(inkPoints);
    this.drawInkPoints(inkPoints);
  }

  private drawConnections(inkPoints: InkPoint[]): void {
    const pointMap = new Map<string, InkPoint>();
    inkPoints.forEach((p) => pointMap.set(p.id, p));

    this.ctx.strokeStyle = 'rgba(26, 26, 26, 0.6)';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    inkPoints.forEach((point) => {
      if (point.connectedTo) {
        const prevPoint = pointMap.get(point.connectedTo);
        if (prevPoint) {
          this.ctx.beginPath();
          this.ctx.moveTo(prevPoint.x, prevPoint.y);
          this.ctx.lineTo(point.x, point.y);
          this.ctx.stroke();
        }
      }
    });
  }

  private drawInkPoints(inkPoints: InkPoint[]): void {
    inkPoints.forEach((point) => {
      this.drawInkPoint(point);
    });
  }

  private drawInkPoint(point: InkPoint): void {
    const { x, y, radius, opacity, blendOpacity } = point;

    if (radius <= 0) return;

    const totalOpacity = opacity + blendOpacity * 0.5;

    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(26, 26, 26, ${Math.min(1, totalOpacity)})`);
    gradient.addColorStop(0.3, `rgba(26, 26, 26, ${Math.min(0.85, totalOpacity * 0.85)})`);
    gradient.addColorStop(0.6, `rgba(26, 26, 26, ${Math.min(0.4, totalOpacity * 0.4)})`);
    gradient.addColorStop(1, 'rgba(26, 26, 26, 0)');

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    if (blendOpacity > 0) {
      const blendRadius = radius * 1.1;
      const blendGradient = this.ctx.createRadialGradient(x, y, radius * 0.9, x, y, blendRadius);
      blendGradient.addColorStop(0, `rgba(26, 26, 26, ${blendOpacity * 0.5})`);
      blendGradient.addColorStop(1, 'rgba(26, 26, 26, 0)');

      this.ctx.beginPath();
      this.ctx.arc(x, y, blendRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = blendGradient;
      this.ctx.fill();
    }
  }

  resize(width: number, height: number): void {
    this.ctx.canvas.width = width;
    this.ctx.canvas.height = height;
    if (this.paperTexture) {
      this.paperPattern = this.ctx.createPattern(this.paperTexture, 'repeat');
    }
  }

  destroy(): void {
    this.stop();
    this.paperTexture = null;
    this.paperPattern = null;
  }
}
