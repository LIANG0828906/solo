import { FontItem } from './fontLoader';

export interface GradientStop {
  color: string;
  position: number;
}

export interface ShadowSettings {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface StrokeSettings {
  width: number;
  color: string;
}

export type GradientDirection = 'horizontal' | 'vertical' | 'diagonal';

export type TextureType = 'none' | 'paper' | 'wood' | 'metal' | 'water' | 'fire';

export interface TextureSettings {
  type: TextureType;
  opacity: number;
}

export interface TextRenderOptions {
  text: string;
  font: FontItem;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  rotation: number;
  scale: number;
  skew: number;
  gradientStops: GradientStop[];
  gradientDirection: GradientDirection;
  useGradient: boolean;
  shadow: ShadowSettings;
  stroke: StrokeSettings;
  texture: TextureSettings;
  canvasWidth: number;
  canvasHeight: number;
  fillColor: string;
  textOffsetX?: number;
  textOffsetY?: number;
  opacity?: number;
}

const textureCache: Map<string, CanvasPattern> = new Map();

function generatePaperTexture(ctx: CanvasRenderingContext2D, width: number, height: number): CanvasPattern | null {
  const cacheKey = `paper_${width}_${height}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const pctx = canvas.getContext('2d')!;

  const baseGradient = pctx.createLinearGradient(0, 0, width, height);
  baseGradient.addColorStop(0, '#f5f0e6');
  baseGradient.addColorStop(0.5, '#ebe5d5');
  baseGradient.addColorStop(1, '#f0ead8');
  pctx.fillStyle = baseGradient;
  pctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 200; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 2 + 0.5;
    const alpha = Math.random() * 0.15;
    pctx.fillStyle = `rgba(180, 160, 120, ${alpha})`;
    pctx.fillRect(x, y, size, size);
  }

  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const length = Math.random() * 8 + 2;
    const angle = Math.random() * Math.PI;
    const alpha = Math.random() * 0.1;
    pctx.strokeStyle = `rgba(150, 130, 90, ${alpha})`;
    pctx.lineWidth = 0.5;
    pctx.beginPath();
    pctx.moveTo(x, y);
    pctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    pctx.stroke();
  }

  const pattern = ctx.createPattern(canvas, 'repeat');
  if (pattern) {
    textureCache.set(cacheKey, pattern);
  }
  return pattern;
}

function generateWoodTexture(ctx: CanvasRenderingContext2D, width: number, height: number): CanvasPattern | null {
  const cacheKey = `wood_${width}_${height}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const pctx = canvas.getContext('2d')!;

  const baseGradient = pctx.createLinearGradient(0, 0, 0, height);
  baseGradient.addColorStop(0, '#8B5A2B');
  baseGradient.addColorStop(0.15, '#CD853F');
  baseGradient.addColorStop(0.3, '#A0522D');
  baseGradient.addColorStop(0.5, '#CD853F');
  baseGradient.addColorStop(0.7, '#8B4513');
  baseGradient.addColorStop(0.85, '#A0522D');
  baseGradient.addColorStop(1, '#654321');
  pctx.fillStyle = baseGradient;
  pctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 30; i++) {
    const amplitude = 3 + Math.random() * 5;
    const frequency = 0.02 + Math.random() * 0.03;
    const phase = Math.random() * Math.PI * 2;
    const baseY = Math.random() * height;

    pctx.strokeStyle = `rgba(80, 40, 10, ${0.15 + Math.random() * 0.2})`;
    pctx.lineWidth = 1 + Math.random() * 1.5;
    pctx.beginPath();
    
    for (let x = 0; x <= width; x += 2) {
      const y = baseY + Math.sin(x * frequency + phase) * amplitude;
      if (x === 0) {
        pctx.moveTo(x, y);
      } else {
        pctx.lineTo(x, y);
      }
    }
    pctx.stroke();
  }

  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 1.5 + 0.5;
    const alpha = Math.random() * 0.2;
    pctx.fillStyle = `rgba(50, 25, 5, ${alpha})`;
    pctx.beginPath();
    pctx.arc(x, y, size, 0, Math.PI * 2);
    pctx.fill();
  }

  const pattern = ctx.createPattern(canvas, 'repeat');
  if (pattern) {
    textureCache.set(cacheKey, pattern);
  }
  return pattern;
}

function generateMetalTexture(ctx: CanvasRenderingContext2D, width: number, height: number): CanvasPattern | null {
  const cacheKey = `metal_${width}_${height}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const pctx = canvas.getContext('2d')!;

  const baseGradient = pctx.createLinearGradient(0, 0, 0, height);
  baseGradient.addColorStop(0, '#a8a8a8');
  baseGradient.addColorStop(0.1, '#d8d8d8');
  baseGradient.addColorStop(0.2, '#f0f0f0');
  baseGradient.addColorStop(0.3, '#c0c0c0');
  baseGradient.addColorStop(0.4, '#989898');
  baseGradient.addColorStop(0.5, '#b8b8b8');
  baseGradient.addColorStop(0.6, '#e0e0e0');
  baseGradient.addColorStop(0.7, '#c8c8c8');
  baseGradient.addColorStop(0.8, '#a0a0a0');
  baseGradient.addColorStop(0.9, '#d0d0d0');
  baseGradient.addColorStop(1, '#888888');
  pctx.fillStyle = baseGradient;
  pctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 200; i++) {
    const y = Math.random() * height;
    const length = Math.random() * 60 + 20;
    const x = Math.random() * width;
    const alpha = Math.random() * 0.15;
    pctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    pctx.lineWidth = Math.random() * 1.5 + 0.5;
    pctx.beginPath();
    pctx.moveTo(x, y);
    pctx.lineTo(x + length, y);
    pctx.stroke();
  }

  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 2 + 0.5;
    const alpha = Math.random() * 0.25;
    pctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    pctx.beginPath();
    pctx.arc(x, y, size, 0, Math.PI * 2);
    pctx.fill();
  }

  const pattern = ctx.createPattern(canvas, 'repeat');
  if (pattern) {
    textureCache.set(cacheKey, pattern);
  }
  return pattern;
}

function generateWaterTexture(ctx: CanvasRenderingContext2D, width: number, height: number): CanvasPattern | null {
  const cacheKey = `water_${width}_${height}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const pctx = canvas.getContext('2d')!;

  const baseGradient = pctx.createLinearGradient(0, 0, 0, height);
  baseGradient.addColorStop(0, '#1e90ff');
  baseGradient.addColorStop(0.3, '#4169e1');
  baseGradient.addColorStop(0.6, '#0066cc');
  baseGradient.addColorStop(1, '#003399');
  pctx.fillStyle = baseGradient;
  pctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 20; i++) {
    const baseY = Math.random() * height;
    const amplitude = 5 + Math.random() * 10;
    const frequency = 0.03 + Math.random() * 0.02;
    const phase = Math.random() * Math.PI * 2;
    const alpha = 0.1 + Math.random() * 0.2;

    pctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    pctx.lineWidth = 1 + Math.random();
    pctx.beginPath();

    for (let x = 0; x <= width; x += 2) {
      const y = baseY + Math.sin(x * frequency + phase) * amplitude;
      if (x === 0) {
        pctx.moveTo(x, y);
      } else {
        pctx.lineTo(x, y);
      }
    }
    pctx.stroke();
  }

  for (let i = 0; i < 150; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 2 + 0.5;
    const alpha = Math.random() * 0.3;
    pctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    pctx.beginPath();
    pctx.arc(x, y, size, 0, Math.PI * 2);
    pctx.fill();
  }

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 15 + 5;
    const radialGradient = pctx.createRadialGradient(x, y, 0, x, y, size);
    radialGradient.addColorStop(0, 'rgba(200, 230, 255, 0.4)');
    radialGradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
    pctx.fillStyle = radialGradient;
    pctx.beginPath();
    pctx.arc(x, y, size, 0, Math.PI * 2);
    pctx.fill();
  }

  const pattern = ctx.createPattern(canvas, 'repeat');
  if (pattern) {
    textureCache.set(cacheKey, pattern);
  }
  return pattern;
}

function generateFireTexture(ctx: CanvasRenderingContext2D, width: number, height: number): CanvasPattern | null {
  const cacheKey = `fire_${width}_${height}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const pctx = canvas.getContext('2d')!;

  const baseGradient = pctx.createLinearGradient(0, height, 0, 0);
  baseGradient.addColorStop(0, '#cc0000');
  baseGradient.addColorStop(0.2, '#ff3300');
  baseGradient.addColorStop(0.4, '#ff6600');
  baseGradient.addColorStop(0.6, '#ff9900');
  baseGradient.addColorStop(0.8, '#ffcc00');
  baseGradient.addColorStop(1, '#ffff66');
  pctx.fillStyle = baseGradient;
  pctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 40; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 25 + 10;
    const radialGradient = pctx.createRadialGradient(x, y, 0, x, y, size);
    radialGradient.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
    radialGradient.addColorStop(0.5, 'rgba(255, 200, 50, 0.3)');
    radialGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    pctx.fillStyle = radialGradient;
    pctx.beginPath();
    pctx.arc(x, y, size, 0, Math.PI * 2);
    pctx.fill();
  }

  for (let i = 0; i < 80; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3 + 1;
    const alpha = Math.random() * 0.7 + 0.3;
    pctx.fillStyle = `rgba(255, 255, 150, ${alpha})`;
    pctx.beginPath();
    pctx.arc(x, y, size, 0, Math.PI * 2);
    pctx.fill();
  }

  for (let i = 0; i < 25; i++) {
    const baseX = Math.random() * width;
    const baseY = Math.random() * height;
    const flameHeight = Math.random() * 40 + 20;
    const flameWidth = flameHeight * 0.4;

    const flameGradient = pctx.createRadialGradient(
      baseX, baseY, 0,
      baseX, baseY - flameHeight / 2, flameHeight / 2
    );
    flameGradient.addColorStop(0, 'rgba(255, 255, 200, 0.5)');
    flameGradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.3)');
    flameGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
    pctx.fillStyle = flameGradient;
    pctx.beginPath();
    pctx.ellipse(baseX, baseY - flameHeight / 2, flameWidth, flameHeight / 2, 0, 0, Math.PI * 2);
    pctx.fill();
  }

  const pattern = ctx.createPattern(canvas, 'repeat');
  if (pattern) {
    textureCache.set(cacheKey, pattern);
  }
  return pattern;
}

const textureGenerators: Record<TextureType, (ctx: CanvasRenderingContext2D, width: number, height: number) => CanvasPattern | null> = {
  none: () => null,
  paper: generatePaperTexture,
  wood: generateWoodTexture,
  metal: generateMetalTexture,
  water: generateWaterTexture,
  fire: generateFireTexture,
};

export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function createGradient(
  ctx: CanvasRenderingContext2D,
  direction: GradientDirection,
  stops: GradientStop[],
  x: number,
  y: number,
  width: number,
  height: number
): CanvasGradient {
  let grad: CanvasGradient;

  switch (direction) {
    case 'horizontal':
      grad = ctx.createLinearGradient(x, y, x + width, y);
      break;
    case 'vertical':
      grad = ctx.createLinearGradient(x, y, x, y + height);
      break;
    case 'diagonal':
      grad = ctx.createLinearGradient(x, y, x + width, y + height);
      break;
  }

  stops.forEach((stop) => {
    grad.addColorStop(stop.position, stop.color);
  });

  return grad;
}

export function renderTextToCanvas(options: TextRenderOptions): HTMLCanvasElement {
  const startTime = performance.now();

  const canvas = document.createElement('canvas');
  canvas.width = options.canvasWidth;
  canvas.height = options.canvasHeight;
  const ctx = canvas.getContext('2d')!;

  const opacity = options.opacity ?? 1;
  const offsetX = options.textOffsetX ?? 0;
  const offsetY = options.textOffsetY ?? 0;

  ctx.clearRect(0, 0, options.canvasWidth, options.canvasHeight);
  ctx.save();

  if (opacity < 1) {
    ctx.globalAlpha = opacity;
  }

  const centerX = options.canvasWidth / 2 + offsetX;
  const centerY = options.canvasHeight / 2 + offsetY;

  ctx.translate(centerX, centerY);
  ctx.rotate((options.rotation * Math.PI) / 180);
  ctx.scale(options.scale, options.scale);
  ctx.transform(1, Math.tan((options.skew * Math.PI) / 180), 0, 1, 0, 0);

  const fontSize = options.fontSize;
  ctx.font = `${fontSize}px ${options.font.family}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = options.textAlign;

  const lines = options.text.split('\n');
  const lineHeight = fontSize * 1.3;
  const totalHeight = lines.length * lineHeight;
  const startY = -totalHeight / 2 + lineHeight / 2;

  if (options.shadow.blur > 0 || options.shadow.offsetX !== 0 || options.shadow.offsetY !== 0) {
    ctx.shadowColor = options.shadow.color;
    ctx.shadowBlur = options.shadow.blur;
    ctx.shadowOffsetX = options.shadow.offsetX;
    ctx.shadowOffsetY = options.shadow.offsetY;
  }

  let fillStyle: string | CanvasGradient | CanvasPattern = options.fillColor;

  if (options.useGradient && options.gradientStops.length >= 2) {
    const textWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
    
    const xOffset =
      options.textAlign === 'left'
        ? 0
        : options.textAlign === 'right'
        ? -textWidth
        : -textWidth / 2;

    fillStyle = createGradient(
      ctx,
      options.gradientDirection,
      options.gradientStops,
      xOffset,
      startY - fontSize / 2,
      textWidth,
      totalHeight
    );
  }

  ctx.fillStyle = fillStyle;

  if (options.stroke.width > 0) {
    ctx.strokeStyle = options.stroke.color;
    ctx.lineWidth = options.stroke.width;
    ctx.lineJoin = 'round';
  }

  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;

    if (options.stroke.width > 0) {
      ctx.strokeText(line, 0, y);
    }

    ctx.fillText(line, 0, y);
  });

  if (options.texture.type !== 'none' && options.texture.opacity > 0) {
    const pattern = textureGenerators[options.texture.type](ctx, options.canvasWidth, options.canvasHeight);
    if (pattern) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = options.texture.opacity * opacity;
      ctx.fillStyle = pattern;

      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        ctx.fillText(line, 0, y);
      });
    }
  }

  ctx.restore();

  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  if (renderTime > 16) {
    console.warn(`Slow render: ${renderTime.toFixed(2)}ms`);
  }

  return canvas;
}

export function getDefaultGradientStops(): GradientStop[] {
  return [
    { color: '#ff6b6b', position: 0 },
    { color: '#feca57', position: 0.5 },
    { color: '#48dbfb', position: 1 },
  ];
}

export function clearTextureCache(): void {
  textureCache.clear();
}
