import { appState } from './state';

interface Point {
  x: number;
  y: number;
}

interface AuroraBand {
  controlPoints: Point[];
  basePoints: Point[];
  width: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  colorShiftOffset: number;
  turbulence: number[];
  turbulenceSpeed: number[];
}

const DEFAULT_COLORS: string[] = ['#00FF87', '#60EFFF', '#FBFF00'];

const BAND_COUNT = 12;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 255, b: 135 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return rgbToHex(
    Math.round(lerp(c1.r, c2.r, t)),
    Math.round(lerp(c1.g, c2.g, t)),
    Math.round(lerp(c1.b, c2.b, t))
  );
}

function getGradientColor(colors: string[], progress: number): string {
  const clampedProgress = ((progress % 1) + 1) % 1;
  const segment = 1 / (colors.length - 1);
  const index = Math.min(Math.floor(clampedProgress / segment), colors.length - 2);
  const localT = (clampedProgress - index * segment) / segment;
  return lerpColor(colors[index], colors[index + 1], localT);
}

export class AuroraRenderer {
  private canvas: HTMLCanvasElement;

  private ctx: CanvasRenderingContext2D;

  private bands: AuroraBand[];

  private animationId: number | null;

  private lastTime: number;

  private width: number;

  private height: number;

  private dpr: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;
    this.bands = [];
    this.animationId = null;
    this.lastTime = 0;
    this.width = 0;
    this.height = 0;
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
    this.initBands();
  }

  public resize(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(this.dpr, this.dpr);
  }

  private initBands(): void {
    this.bands = [];
    for (let i = 0; i < BAND_COUNT; i++) {
      this.bands.push(this.createBand());
    }
  }

  private createBand(): AuroraBand {
    const directions: Array<'top' | 'left' | 'right'> = ['top', 'left', 'right'];
    const flowDirection = directions[Math.floor(Math.random() * directions.length)];
    const pointCount = Math.floor(Math.random() * 5) + 8;
    const controlPoints: Point[] = [];
    const basePoints: Point[] = [];
    const turbulence: number[] = [];
    const turbulenceSpeed: number[] = [];

    let startX: number;
    let startY: number;

    switch (flowDirection) {
      case 'left':
        startX = -50;
        startY = Math.random() * this.height * 0.5;
        break;
      case 'right':
        startX = this.width + 50;
        startY = Math.random() * this.height * 0.5;
        break;
      case 'top':
      default:
        startX = Math.random() * this.width;
        startY = -50;
        break;
    }

    const endX = this.width / 2 + (Math.random() - 0.5) * this.width * 0.4;
    const endY = this.height * 0.4 + Math.random() * this.height * 0.2;

    for (let i = 0; i < pointCount; i++) {
      const t = i / (pointCount - 1);
      const x = lerp(startX, endX, t) + (Math.random() - 0.5) * 100;
      const y = lerp(startY, endY, t) + (Math.random() - 0.5) * 60;
      controlPoints.push({ x, y });
      basePoints.push({ x, y });
      turbulence.push(Math.random() * Math.PI * 2);
      turbulenceSpeed.push(0.3 + Math.random() * 0.7);
    }

    return {
      controlPoints,
      basePoints,
      width: 60 + Math.random() * 60,
      baseAlpha: 0.1 + Math.random() * 0.3,
      phase: Math.random(),
      speed: 0.2 + Math.random() * 0.4,
      colorShiftOffset: Math.random(),
      turbulence,
      turbulenceSpeed
    };
  }

  private updateBand(band: AuroraBand, deltaTime: number, flowSpeed: number, colorSpeed: number): void {
    const dt = deltaTime * 0.001;

    band.phase += band.speed * flowSpeed * dt * 0.3;
    if (band.phase > 1) {
      band.phase -= 1;
      const newBand = this.createBand();
      Object.assign(band, newBand);
    }

    band.colorShiftOffset += colorSpeed * dt * 0.15;

    for (let i = 0; i < band.controlPoints.length; i++) {
      band.turbulence[i] += band.turbulenceSpeed[i] * flowSpeed * dt * 0.8;
      const turbulenceX = Math.sin(band.turbulence[i]) * 25;
      const turbulenceY = Math.cos(band.turbulence[i] * 0.7) * 15;
      const driftX = Math.sin(band.phase * Math.PI * 2 + i * 0.5) * 10;
      const driftY = Math.cos(band.phase * Math.PI * 2 + i * 0.3) * 8;

      const targetX = band.basePoints[i].x + driftX + turbulenceX;
      const targetY = band.basePoints[i].y + band.phase * this.height * 0.15 + driftY + turbulenceY;

      band.controlPoints[i].x = lerp(band.controlPoints[i].x, targetX, 0.05);
      band.controlPoints[i].y = lerp(band.controlPoints[i].y, targetY, 0.05);
    }
  }

  private drawBackground(): void {
    const gradient = this.ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      0,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) * 0.8
    );
    gradient.addColorStop(0, '#0A1128');
    gradient.addColorStop(1, '#000511');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawBand(band: AuroraBand, brightness: number): void {
    if (band.controlPoints.length < 2) return;

    const colorProgress = band.colorShiftOffset + band.phase * 0.3;
    const flickerAlpha = band.baseAlpha * (0.7 + Math.sin(band.phase * Math.PI * 6) * 0.3);
    const alpha = flickerAlpha * brightness;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';

    const path = new Path2D();
    const first = band.controlPoints[0];
    path.moveTo(first.x, first.y);

    for (let i = 1; i < band.controlPoints.length - 1; i++) {
      const current = band.controlPoints[i];
      const next = band.controlPoints[i + 1];
      const cpX = (current.x + next.x) / 2;
      const cpY = (current.y + next.y) / 2;
      path.quadraticCurveTo(current.x, current.y, cpX, cpY);
    }

    const last = band.controlPoints[band.controlPoints.length - 1];
    const prev = band.controlPoints[band.controlPoints.length - 2];
    path.quadraticCurveTo(prev.x, prev.y, last.x, last.y);

    const strokeGradient = this.ctx.createLinearGradient(
      band.controlPoints[0].x,
      band.controlPoints[0].y,
      last.x,
      last.y
    );

    const color1 = getGradientColor(DEFAULT_COLORS, colorProgress);
    const color2 = getGradientColor(DEFAULT_COLORS, colorProgress + 0.33);
    const color3 = getGradientColor(DEFAULT_COLORS, colorProgress + 0.66);

    strokeGradient.addColorStop(0, this.colorWithAlpha(color1, 0));
    strokeGradient.addColorStop(0.2, this.colorWithAlpha(color1, alpha * 0.8));
    strokeGradient.addColorStop(0.5, this.colorWithAlpha(color2, alpha));
    strokeGradient.addColorStop(0.8, this.colorWithAlpha(color3, alpha * 0.8));
    strokeGradient.addColorStop(1, this.colorWithAlpha(color3, 0));

    this.ctx.strokeStyle = strokeGradient;
    this.ctx.lineWidth = band.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke(path);

    const innerGradient = this.ctx.createLinearGradient(
      band.controlPoints[0].x,
      band.controlPoints[0].y,
      last.x,
      last.y
    );
    innerGradient.addColorStop(0, this.colorWithAlpha(color1, 0));
    innerGradient.addColorStop(0.2, this.colorWithAlpha(color1, alpha * 0.5));
    innerGradient.addColorStop(0.5, this.colorWithAlpha(color2, alpha * 0.7));
    innerGradient.addColorStop(0.8, this.colorWithAlpha(color3, alpha * 0.5));
    innerGradient.addColorStop(1, this.colorWithAlpha(color3, 0));

    this.ctx.strokeStyle = innerGradient;
    this.ctx.lineWidth = band.width * 0.5;
    this.ctx.stroke(path);

    this.ctx.restore();
  }

  private colorWithAlpha(hex: string, alpha: number): string {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0, Math.min(1, alpha))})`;
  }

  private render = (timestamp: number): void => {
    const deltaTime = this.lastTime ? timestamp - this.lastTime : 16;
    this.lastTime = timestamp;

    const flowSpeed = appState.get('flowSpeed');
    const colorSpeed = appState.get('colorSpeed');
    const brightness = appState.get('brightness');

    this.drawBackground();

    for (const band of this.bands) {
      this.updateBand(band, deltaTime, flowSpeed, colorSpeed);
      this.drawBand(band, brightness);
    }

    this.animationId = requestAnimationFrame(this.render);
  };

  public start(): void {
    if (this.animationId === null) {
      this.lastTime = 0;
      this.animationId = requestAnimationFrame(this.render);
    }
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public destroy(): void {
    this.stop();
  }
}
