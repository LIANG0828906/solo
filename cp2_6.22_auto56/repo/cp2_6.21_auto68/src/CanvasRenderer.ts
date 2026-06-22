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

function drawLinearGradient(context: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function drawRadialGradient(context: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = context.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) / 2
  );
  gradient.addColorStop(0, '#ffecd2');
  gradient.addColorStop(1, '#fcb69f');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function drawStripes(context: CanvasRenderingContext2D, width: number, height: number): void {
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);

  context.save();
  context.translate(width / 2, height / 2);
  context.rotate(45 * Math.PI / 180);
  const stripeWidth = 40;
  const diag = Math.sqrt(width * width + height * height);
  context.fillStyle = '#f0f0f0';
  for (let i = -diag; i < diag; i += stripeWidth * 2) {
    context.fillRect(i, -diag, stripeWidth, diag * 2);
  }
  context.restore();
}

function drawPolygons(context: CanvasRenderingContext2D, width: number, height: number): void {
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);

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
    context.save();
    context.translate(t.x * width, t.y * height);
    context.rotate((t.rot * Math.PI) / 180);
    context.fillStyle = colors[t.colorIdx] + '4D';
    const s = t.size * Math.min(width, height);
    context.beginPath();
    context.moveTo(0, -s / 2);
    context.lineTo(s / 2, s / 2);
    context.lineTo(-s / 2, s / 2);
    context.closePath();
    context.fill();
    context.restore();
  });
}

function drawGrain(context: CanvasRenderingContext2D, width: number, height: number): void {
  context.fillStyle = '#f5f5f5';
  context.fillRect(0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 30;
    data[i] = Math.max(0, Math.min(255, data[i] + grain));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
  }

  context.putImageData(imageData, 0, 0);
}

function drawBackground(context: CanvasRenderingContext2D, template: BackgroundTemplate, width: number, height: number): void {
  switch (template) {
    case 'gradient-linear':
      drawLinearGradient(context, width, height);
      break;
    case 'gradient-radial':
      drawRadialGradient(context, width, height);
      break;
    case 'stripes':
      drawStripes(context, width, height);
      break;
    case 'polygons':
      drawPolygons(context, width, height);
      break;
    case 'grain':
      drawGrain(context, width, height);
      break;
  }
}

function drawDecorShape(context: CanvasRenderingContext2D, shape: DecorShape, size: number): void {
  switch (shape) {
    case 'circle':
      context.beginPath();
      context.arc(0, 0, size / 2, 0, Math.PI * 2);
      context.fill();
      break;
    case 'triangle':
      context.beginPath();
      context.moveTo(0, -size / 2);
      context.lineTo(size / 2, size / 2);
      context.lineTo(-size / 2, size / 2);
      context.closePath();
      context.fill();
      break;
    case 'star':
      const spikes = 5;
      const outerRadius = size / 2;
      const innerRadius = size / 4;
      context.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.closePath();
      context.fill();
      break;
  }
}

function drawDecorations(context: CanvasRenderingContext2D, decorations: DecorElement[], width: number, height: number): void {
  decorations.forEach((item) => {
    context.save();
    context.translate((item.x / 100) * width, (item.y / 100) * height);
    context.rotate((item.rotation * Math.PI) / 180);
    context.fillStyle = item.color;
    drawDecorShape(context, item.shape, item.size);
    context.restore();
  });
}

function drawText(context: CanvasRenderingContext2D, textConfig: TextConfig, width: number, height: number): void {
  const { title, subtitle, fontFamily, titleSize, subtitleSize, color, shadow, stroke } = textConfig;

  context.textAlign = 'center';
  context.textBaseline = 'middle';

  if (shadow.blur > 0 || shadow.offsetX !== 0 || shadow.offsetY !== 0) {
    context.shadowColor = shadow.color;
    context.shadowBlur = shadow.blur;
    context.shadowOffsetX = shadow.offsetX;
    context.shadowOffsetY = shadow.offsetY;
  }

  const centerY = height / 2;
  const spacing = titleSize * 0.3 + subtitleSize * 0.6;

  context.font = `bold ${titleSize}px ${fontFamily}`;
  context.fillStyle = color;

  if (stroke.width > 0) {
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.width;
    context.lineJoin = 'round';
    context.strokeText(title, width / 2, centerY - spacing / 2);
  }
  context.fillText(title, width / 2, centerY - spacing / 2);

  context.font = `${subtitleSize}px ${fontFamily}`;
  if (stroke.width > 0) {
    context.strokeText(subtitle, width / 2, centerY + spacing / 2);
  }
  context.fillText(subtitle, width / 2, centerY + spacing / 2);

  context.shadowColor = 'transparent';
  context.shadowBlur = 0;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
}

export function renderPoster(
  context: CanvasRenderingContext2D,
  config: PosterConfig,
  width: number = CANVAS_WIDTH,
  height: number = CANVAS_HEIGHT
): void {
  context.clearRect(0, 0, width, height);
  drawBackground(context, config.background, width, height);
  drawDecorations(context, config.decorations, width, height);
  drawText(context, config.text, width, height);
}

export function exportToPNG(config: PosterConfig): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 2560;
    exportCanvas.height = 1920;

    const context = exportCanvas.getContext('2d');
    if (!context) {
      reject(new Error('无法创建Canvas上下文'));
      return;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    context.save();
    context.scale(2, 2);
    renderPoster(context, config, CANVAS_WIDTH * EXPORT_SCALE, CANVAS_HEIGHT * EXPORT_SCALE);
    context.restore();

    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('PNG导出失败'));
        }
      },
      'image/png',
      1.0
    );
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
