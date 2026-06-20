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
}

const texturePatterns: Record<TextureType, (ctx: CanvasRenderingContext2D, width: number, height: number) => CanvasPattern | null> = {
  none: () => null,
  paper: (ctx, width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const pctx = canvas.getContext('2d')!;
    
    const imageData = pctx.createImageData(width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 40 - 20;
      data[i] = 245 + noise;
      data[i + 1] = 240 + noise;
      data[i + 2] = 230 + noise;
      data[i + 3] = 255;
    }
    pctx.putImageData(imageData, 0, 0);
    
    return ctx.createPattern(canvas, 'repeat');
  },
  wood: (ctx, width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const pctx = canvas.getContext('2d')!;
    
    const gradient = pctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#8B4513');
    gradient.addColorStop(0.3, '#A0522D');
    gradient.addColorStop(0.5, '#CD853F');
    gradient.addColorStop(0.7, '#A0522D');
    gradient.addColorStop(1, '#8B4513');
    pctx.fillStyle = gradient;
    pctx.fillRect(0, 0, width, height);
    
    for (let i = 0; i < 20; i++) {
      pctx.strokeStyle = `rgba(60, 30, 10, ${Math.random() * 0.3})`;
      pctx.lineWidth = Math.random() * 2 + 0.5;
      pctx.beginPath();
      const y = Math.random() * height;
      pctx.moveTo(0, y);
      for (let x = 0; x < width; x += 10) {
        pctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 5);
      }
      pctx.stroke();
    }
    
    return ctx.createPattern(canvas, 'repeat');
  },
  metal: (ctx, width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const pctx = canvas.getContext('2d')!;
    
    const gradient = pctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#b8b8b8');
    gradient.addColorStop(0.25, '#e8e8e8');
    gradient.addColorStop(0.5, '#a0a0a0');
    gradient.addColorStop(0.75, '#d0d0d0');
    gradient.addColorStop(1, '#909090');
    pctx.fillStyle = gradient;
    pctx.fillRect(0, 0, width, height);
    
    for (let i = 0; i < 50; i++) {
      pctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15})`;
      pctx.fillRect(Math.random() * width, Math.random() * height, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }
    
    return ctx.createPattern(canvas, 'repeat');
  },
  water: (ctx, width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const pctx = canvas.getContext('2d')!;
    
    const gradient = pctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1e90ff');
    gradient.addColorStop(0.5, '#4169e1');
    gradient.addColorStop(1, '#000080');
    pctx.fillStyle = gradient;
    pctx.fillRect(0, 0, width, height);
    
    for (let i = 0; i < 15; i++) {
      pctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + Math.random() * 0.3})`;
      pctx.lineWidth = 1;
      pctx.beginPath();
      const y = Math.random() * height;
      pctx.moveTo(0, y);
      for (let x = 0; x < width; x += 5) {
        pctx.lineTo(x, y + Math.sin(x * 0.03 + i * 2) * 8);
      }
      pctx.stroke();
    }
    
    return ctx.createPattern(canvas, 'repeat');
  },
  fire: (ctx, width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const pctx = canvas.getContext('2d')!;
    
    const gradient = pctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.3, '#ff4500');
    gradient.addColorStop(0.6, '#ff8c00');
    gradient.addColorStop(0.8, '#ffd700');
    gradient.addColorStop(1, '#ffff00');
    pctx.fillStyle = gradient;
    pctx.fillRect(0, 0, width, height);
    
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const glowSize = Math.random() * 30 + 10;
      const radialGradient = pctx.createRadialGradient(x, y, 0, x, y, glowSize);
      radialGradient.addColorStop(0, 'rgba(255, 255, 200, 0.5)');
      radialGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
      pctx.fillStyle = radialGradient;
      pctx.fillRect(x - glowSize, y - glowSize, glowSize * 2, glowSize * 2);
    }
    
    return ctx.createPattern(canvas, 'repeat');
  },
};

export function renderTextToCanvas(options: TextRenderOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = options.canvasWidth;
  canvas.height = options.canvasHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, options.canvasWidth, options.canvasHeight);
  ctx.save();

  const centerX = options.canvasWidth / 2;
  const centerY = options.canvasHeight / 2;

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
    let grad: CanvasGradient;

    const xOffset = options.textAlign === 'left' ? 0 : options.textAlign === 'right' ? -textWidth : -textWidth / 2;

    switch (options.gradientDirection) {
      case 'horizontal':
        grad = ctx.createLinearGradient(xOffset, 0, xOffset + textWidth, 0);
        break;
      case 'vertical':
        grad = ctx.createLinearGradient(0, startY - fontSize / 2, 0, startY + totalHeight - fontSize / 2);
        break;
      case 'diagonal':
        grad = ctx.createLinearGradient(xOffset, startY - fontSize / 2, xOffset + textWidth, startY + totalHeight - fontSize / 2);
        break;
    }

    options.gradientStops.forEach((stop) => {
      grad.addColorStop(stop.position, stop.color);
    });
    fillStyle = grad;
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
    const pattern = texturePatterns[options.texture.type](ctx, options.canvasWidth, options.canvasHeight);
    if (pattern) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = options.texture.opacity;
      ctx.fillStyle = pattern;
      
      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        ctx.fillText(line, 0, y);
      });
    }
  }

  ctx.restore();
  return canvas;
}

export function getDefaultGradientStops(): GradientStop[] {
  return [
    { color: '#ff6b6b', position: 0 },
    { color: '#feca57', position: 0.5 },
    { color: '#48dbfb', position: 1 },
  ];
}
