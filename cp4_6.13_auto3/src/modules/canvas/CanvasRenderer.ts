export type PatternType = 'dots' | 'hexagons' | 'waves' | 'triangles';

export type PatternLayerConfig = {
  type: PatternType;
  opacity: number;
  scale: number;
  rotation: number;
  enabled: boolean;
};

export type WallpaperConfig = {
  templateId: string;
  primaryColor: string;
  secondaryColor: string;
  gradientAngle: number;
  gradientType: 'linear' | 'radial';
  patterns: PatternLayerConfig[];
};

type RgbColor = { r: number; g: number; b: number };

function hexToRgb(hex: string): RgbColor {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(c1: string, c2: string, t: number): string {
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  return rgbToHex(
    lerpNumber(rgb1.r, rgb2.r, t),
    lerpNumber(rgb1.g, rgb2.g, t),
    lerpNumber(rgb1.b, rgb2.b, t)
  );
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function interpolatePattern(
  from: PatternLayerConfig,
  to: PatternLayerConfig,
  t: number
): PatternLayerConfig {
  return {
    type: t < 0.5 ? from.type : to.type,
    opacity: lerpNumber(from.opacity, to.opacity, t),
    scale: lerpNumber(from.scale, to.scale, t),
    rotation: lerpNumber(from.rotation, to.rotation, t),
    enabled: t < 0.5 ? from.enabled : to.enabled,
  };
}

function interpolateConfig(from: WallpaperConfig, to: WallpaperConfig, t: number): WallpaperConfig {
  const maxLen = Math.max(from.patterns.length, to.patterns.length);
  const patterns: PatternLayerConfig[] = [];
  for (let i = 0; i < maxLen; i++) {
    const pFrom = from.patterns[i] || { type: to.patterns[i].type, opacity: 0, scale: to.patterns[i].scale, rotation: 0, enabled: false };
    const pTo = to.patterns[i] || { type: from.patterns[i].type, opacity: 0, scale: from.patterns[i].scale, rotation: 0, enabled: false };
    patterns.push(interpolatePattern(pFrom, pTo, t));
  }
  return {
    templateId: t < 0.5 ? from.templateId : to.templateId,
    primaryColor: lerpColor(from.primaryColor, to.primaryColor, t),
    secondaryColor: lerpColor(from.secondaryColor, to.secondaryColor, t),
    gradientAngle: lerpNumber(from.gradientAngle, to.gradientAngle, t),
    gradientType: t < 0.5 ? from.gradientType : to.gradientType,
    patterns,
  };
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private previousConfig: WallpaperConfig | null = null;
  private targetConfig: WallpaperConfig | null = null;
  private currentConfig: WallpaperConfig | null = null;
  private animFrameId: number | null = null;
  private tweenStartTime: number = 0;
  private readonly tweenDuration = 200;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  render(config: WallpaperConfig): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.currentConfig) {
      this.previousConfig = { ...this.currentConfig };
    } else {
      this.previousConfig = null;
    }

    this.targetConfig = config;
    this.tweenStartTime = performance.now();

    if (!this.previousConfig) {
      this.currentConfig = config;
      this.composite(config, 1);
      return;
    }

    this.startTween();
  }

  private startTween(): void {
    const tick = (now: number) => {
      const elapsed = now - this.tweenStartTime;
      const rawProgress = Math.min(elapsed / this.tweenDuration, 1);
      const progress = easeOutCubic(rawProgress);

      const interpolated = interpolateConfig(this.previousConfig!, this.targetConfig!, progress);
      this.currentConfig = interpolated;
      this.composite(interpolated, progress);

      if (rawProgress < 1) {
        this.animFrameId = requestAnimationFrame(tick);
      } else {
        this.animFrameId = null;
        this.currentConfig = this.targetConfig;
      }
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private composite(config: WallpaperConfig, _progress: number): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);
    this.drawGradient(config);
    for (const pattern of config.patterns) {
      if (pattern.enabled) {
        this.drawPatternLayer(this.ctx, pattern, w, h);
      }
    }
  }

  private drawGradient(config: WallpaperConfig): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const { primaryColor, secondaryColor, gradientType, gradientAngle } = config;

    let gradient: CanvasGradient;
    if (gradientType === 'linear') {
      const angleRad = (gradientAngle * Math.PI) / 180;
      const cx = w / 2;
      const cy = h / 2;
      const diagLen = Math.sqrt(w * w + h * h) / 2;
      const startX = cx - Math.cos(angleRad) * diagLen;
      const startY = cy - Math.sin(angleRad) * diagLen;
      const endX = cx + Math.cos(angleRad) * diagLen;
      const endY = cy + Math.sin(angleRad) * diagLen;
      gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
    } else {
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.sqrt(cx * cx + cy * cy);
      gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    }

    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, w, h);
  }

  private drawPatternLayer(
    ctx: CanvasRenderingContext2D,
    pattern: PatternLayerConfig,
    canvasW: number,
    canvasH: number
  ): void {
    ctx.save();
    ctx.globalAlpha = pattern.opacity;
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate((pattern.rotation * Math.PI) / 180);
    ctx.translate(-canvasW / 2, -canvasH / 2);

    const diagLen = Math.sqrt(canvasW * canvasW + canvasH * canvasH);
    const offsetX = (diagLen - canvasW) / 2;
    const offsetY = (diagLen - canvasH) / 2;

    switch (pattern.type) {
      case 'dots':
        this.drawDots(ctx, pattern.scale, -offsetX, -offsetY, diagLen, diagLen);
        break;
      case 'hexagons':
        this.drawHexagons(ctx, pattern.scale, -offsetX, -offsetY, diagLen, diagLen);
        break;
      case 'waves':
        this.drawWaves(ctx, pattern.scale, -offsetX, -offsetY, diagLen, diagLen);
        break;
      case 'triangles':
        this.drawTriangles(ctx, pattern.scale, -offsetX, -offsetY, diagLen, diagLen);
        break;
    }

    ctx.restore();
  }

  private drawDots(
    ctx: CanvasRenderingContext2D,
    scale: number,
    startX: number,
    startY: number,
    w: number,
    h: number
  ): void {
    const spacing = 40 * scale;
    const radius = Math.max(1, 3 * scale);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let y = startY; y < startY + h; y += spacing) {
      for (let x = startX; x < startX + w; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawHexagons(
    ctx: CanvasRenderingContext2D,
    scale: number,
    startX: number,
    startY: number,
    w: number,
    h: number
  ): void {
    const size = Math.max(4, 20 * scale);
    const hexH = size * Math.sqrt(3);
    const colSpacing = size * 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;

    for (let col = 0; col * colSpacing + startX < startX + w; col++) {
      for (let row = 0; row * hexH + startY < startY + h; row++) {
        const cx = startX + col * colSpacing;
        const cy = startY + row * hexH + (col % 2 === 1 ? hexH / 2 : 0);
        this.drawHexagon(ctx, cx, cy, size);
      }
    }
  }

  private drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + size * Math.cos(angle);
      const y = cy + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  private drawWaves(
    ctx: CanvasRenderingContext2D,
    scale: number,
    startX: number,
    startY: number,
    w: number,
    h: number
  ): void {
    const amplitude = 20 * scale;
    const lineCount = 4;
    const spacing = h / (lineCount + 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;

    for (let i = 1; i <= lineCount; i++) {
      const baseY = startY + i * spacing;
      ctx.beginPath();
      for (let x = startX; x <= startX + w; x += 2) {
        const y = baseY + Math.sin((x * 2 * Math.PI) / (80 * scale)) * amplitude;
        if (x === startX) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  private drawTriangles(
    ctx: CanvasRenderingContext2D,
    scale: number,
    startX: number,
    startY: number,
    w: number,
    h: number
  ): void {
    const size = Math.max(6, 30 * scale);
    const triH = size * Math.sqrt(3) / 2;
    const colSpacing = size;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;

    for (let row = 0; row * triH + startY < startY + h; row++) {
      for (let col = 0; col * colSpacing + startX < startX + w; col++) {
        const cx = startX + col * colSpacing;
        const cy = startY + row * triH;
        const up = (row + col) % 2 === 0;
        if (up) {
          this.drawTriangle(ctx, cx, cy + triH, cx + size / 2, cy, cx + size, cy + triH);
        } else {
          this.drawTriangle(ctx, cx, cy, cx + size / 2, cy + triH, cx + size, cy);
        }
      }
    }
  }

  private drawTriangle(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.stroke();
  }

  getCurrentConfig(): WallpaperConfig {
    return this.currentConfig!;
  }
}
