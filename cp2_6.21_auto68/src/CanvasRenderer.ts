export interface TextShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface TextStroke {
  width: number;
  color: string;
}

export interface TextConfig {
  title: string;
  subtitle: string;
  fontFamily: string;
  titleSize: number;
  subtitleSize: number;
  color: string;
  shadow: TextShadow;
  stroke: TextStroke;
}

export type BackgroundTemplate =
  | 'gradient-linear'
  | 'gradient-radial'
  | 'stripes'
  | 'polygons'
  | 'grain';

export type DecorShape = 'circle' | 'triangle' | 'star';

export interface DecorElement {
  id: string;
  shape: DecorShape;
  size: number;
  color: string;
  x: number;
  y: number;
  rotation: number;
}

export interface PosterConfig {
  text: TextConfig;
  background: BackgroundTemplate;
  decorations: DecorElement[];
}

export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 480;
export const EXPORT_SCALE = 2;

const FONT_FAMILIES = [
  'Arial',
  'Georgia',
  'Courier New',
  'Impact',
  'Comic Sans MS',
];

function drawLinearGradient(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawRadialGradient(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) / 2
  );
  gradient.addColorStop(0, '#ffecd2');
  gradient.addColorStop(1, '#fcb69f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawStripes(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(45 * Math.PI / 180);
  const stripeWidth = 40;
  const diag = Math.sqrt(width * width + height * height);
  ctx.fillStyle = '#f0f0f0';
  for (let i = -diag; i < diag; i += stripeWidth * 2) {
    ctx.fillRect(i, -diag, stripeWidth, diag * 2);
  }
  ctx.restore();
}

function drawPolygons(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d'];
  const triangles = [
    { x: 0.15, y: 0.2, size: 0.25, colorIdx: 0, rot: 15 },
    { x: 0.8, y: 0.25, size: 0.2, colorIdx: 1, rot: -20 },
    { x: 0.5, y: 0.7, size: 0.3, colorIdx: 2, rot: 30 },
    { x: 0.2, y: 0.75, size: 0.18, colorIdx: 2, rot: -45 },
    { x: 0.85, y: 0.8, size: 0.22, colorIdx: 0, rot: 60 },
    { x: 0.6, y: 0.45, size: 0.15, colorIdx: 1, rot: -10 },
  ];

  triangles.forEach((t) => {
    ctx.save();
    ctx.translate(t.x * width, t.y * height);
    ctx.rotate((t.rot * Math.PI) / 180);
    ctx.fillStyle = colors[t.colorIdx] + '4D';
    const s = t.size * Math.min(width, height);
    ctx.beginPath();
    ctx.moveTo(0, -s / 2);
    ctx.lineTo(s / 2, s / 2);
    ctx.lineTo(-s / 2, s / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function drawGrain(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, width, height);
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 30;
    data[i] = Math.max(0, Math.min(255, data[i] + grain));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function drawBackground(ctx: CanvasRenderingContext2D, template: BackgroundTemplate, width: number, height: number): void {
  switch (template) {
    case 'gradient-linear':
      drawLinearGradient(ctx, width, height);
      break;
    case 'gradient-radial':
      drawRadialGradient(ctx, width, height);
      break;
    case 'stripes':
      drawStripes(ctx, width, height);
      break;
    case 'polygons':
      drawPolygons(ctx, width, height);
      break;
    case 'grain':
      drawGrain(ctx, width, height);
      break;
  }
}

function drawDecorShape(ctx: CanvasRenderingContext2D, shape: DecorShape, size: number): void {
  switch (shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(size / 2, size / 2);
      ctx.lineTo(-size / 2, size / 2);
      ctx.closePath();
      ctx.fill();
      break;
    case 'star':
      const spikes = 5;
      const outerRadius = size / 2;
      const innerRadius = size / 4;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      break;
  }
}

function drawDecorations(ctx: CanvasRenderingContext2D, decorations: DecorElement[], width: number, height: number): void {
  decorations.forEach((decor) => {
    ctx.save();
    ctx.translate((decor.x / 100) * width, (decor.y / 100) * height);
    ctx.rotate((decor.rotation * Math.PI) / 180);
    ctx.fillStyle = decor.color;
    drawDecorShape(ctx, decor.shape, decor.size);
    ctx.restore();
  });
}

function drawText(ctx: CanvasRenderingContext2D, textConfig: TextConfig, width: number, height: number): void {
  const { title, subtitle, fontFamily, titleSize, subtitleSize, color, shadow, stroke } = textConfig;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (shadow.blur > 0 || shadow.offsetX !== 0 || shadow.offsetY !== 0) {
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
  }

  const centerY = height / 2;
  const spacing = titleSize * 0.3 + subtitleSize * 0.6;

  ctx.font = `bold ${titleSize}px ${fontFamily}`;
  ctx.fillStyle = color;

  if (stroke.width > 0) {
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineJoin = 'round';
    ctx.strokeText(title, width / 2, centerY - spacing / 2);
  }
  ctx.fillText(title, width / 2, centerY - spacing / 2);

  ctx.font = `${subtitleSize}px ${fontFamily}`;
  if (stroke.width > 0) {
    ctx.strokeText(subtitle, width / 2, centerY + spacing / 2);
  }
  ctx.fillText(subtitle, width / 2, centerY + spacing / 2);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export function renderPoster(
  ctx: CanvasRenderingContext2D,
  config: PosterConfig,
  width: number = CANVAS_WIDTH,
  height: number = CANVAS_HEIGHT
): void {
  ctx.clearRect(0, 0, width, height);
  drawBackground(ctx, config.background, width, height);
  drawDecorations(ctx, config.decorations, width, height);
  drawText(ctx, config.text, width, height);
}

export function exportToPNG(config: PosterConfig): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH * EXPORT_SCALE;
    canvas.height = CANVAS_HEIGHT * EXPORT_SCALE;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('无法创建Canvas上下文'));
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
    
    renderPoster(ctx, config, CANVAS_WIDTH, CANVAS_HEIGHT);

    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('PNG导出失败'));
      }
    }, 'image/png');
  });
}

export function downloadPNG(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `poster-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const FONT_OPTIONS: string[] = FONT_FAMILIES;
