export type BlendMode = 'source-over' | 'multiply' | 'screen' | 'overlay' | 'lighter' | 'darken';

export type ShapeType = 'image' | 'circle' | 'star' | 'triangle' | 'wave';

export interface Layer {
  id: string;
  type: ShapeType;
  src?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  blendMode: BlendMode;
  fillColor?: string;
}

export const BLEND_MODES: { value: BlendMode; label: string; description: string }[] = [
  { value: 'source-over', label: '正常', description: '正常：默认叠加' },
  { value: 'multiply', label: '正片叠底', description: '正片叠底：变暗' },
  { value: 'screen', label: '滤色', description: '滤色：变亮' },
  { value: 'overlay', label: '叠加', description: '叠加：对比度增强' },
  { value: 'lighter', label: '变亮', description: '变亮：加色' },
  { value: 'darken', label: '变暗', description: '变暗：取较暗值' },
];

const imageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const cached = imageCache.get(src);
    if (cached) {
      resolve(cached);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  points: number = 5,
): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fill();
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - height / 2);
  ctx.lineTo(cx - width / 2, cy + height / 2);
  ctx.lineTo(cx + width / 2, cy + height / 2);
  ctx.closePath();
  ctx.fill();
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
): void {
  ctx.beginPath();
  const startX = cx - width / 2;
  const endX = cx + width / 2;
  const amplitude = height / 4;
  const frequency = (Math.PI * 4) / width;

  ctx.moveTo(startX, cy);
  for (let x = startX; x <= endX; x += 1) {
    const y = cy + Math.sin((x - startX) * frequency) * amplitude;
    ctx.lineTo(x, y);
  }

  ctx.lineTo(endX, cy + height / 4);
  ctx.lineTo(startX, cy + height / 4);
  ctx.closePath();
  ctx.fill();
}

export function drawLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
): void {
  ctx.save();
  ctx.globalCompositeOperation = layer.blendMode;
  ctx.translate(layer.x, layer.y);
  ctx.rotate((layer.rotation * Math.PI) / 180);

  const fillColor = layer.fillColor || getDefaultColor(layer.type);
  ctx.fillStyle = fillColor;

  switch (layer.type) {
    case 'image':
      if (layer.src) {
        const img = imageCache.get(layer.src);
        if (img) {
          ctx.drawImage(
            img,
            -layer.width / 2,
            -layer.height / 2,
            layer.width,
            layer.height,
          );
        }
      }
      break;
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(layer.width, layer.height) / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'star':
      drawStar(
        ctx,
        0,
        0,
        Math.min(layer.width, layer.height) / 2,
        Math.min(layer.width, layer.height) / 4,
      );
      break;
    case 'triangle':
      drawTriangle(ctx, 0, 0, layer.width, layer.height);
      break;
    case 'wave':
      drawWave(ctx, 0, 0, layer.width, layer.height);
      break;
  }

  ctx.restore();
}

export function drawLayers(
  ctx: CanvasRenderingContext2D,
  layers: Layer[],
  canvasWidth: number,
  canvasHeight: number,
): void {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  for (const layer of layers) {
    drawLayer(ctx, layer);
  }
}

export function drawSelectionHandles(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
): void {
  ctx.save();
  ctx.translate(layer.x, layer.y);
  ctx.rotate((layer.rotation * Math.PI) / 180);

  const halfW = layer.width / 2;
  const halfH = layer.height / 2;

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.strokeRect(-halfW, -halfH, layer.width, layer.height);
  ctx.setLineDash([]);

  const handleSize = 8;
  const handlePositions = [
    [-halfW, -halfH],
    [0, -halfH],
    [halfW, -halfH],
    [halfW, 0],
    [halfW, halfH],
    [0, halfH],
    [-halfW, halfH],
    [-halfW, 0],
  ];

  for (const [hx, hy] of handlePositions) {
    ctx.beginPath();
    ctx.arc(hx, hy, handleSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  const handleY = -halfH - 20;
  ctx.beginPath();
  ctx.moveTo(0, -halfH);
  ctx.lineTo(0, handleY + 6);
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, handleY, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function getDefaultColor(type: ShapeType): string {
  switch (type) {
    case 'circle':
      return '#ef4444';
    case 'star':
      return '#f59e0b';
    case 'triangle':
      return '#3b82f6';
    case 'wave':
      return '#8b5cf6';
    default:
      return '#6b7280';
  }
}

export function isPointInLayer(
  layer: Layer,
  px: number,
  py: number,
): boolean {
  const cos = Math.cos((-layer.rotation * Math.PI) / 180);
  const sin = Math.sin((-layer.rotation * Math.PI) / 180);
  const dx = px - layer.x;
  const dy = py - layer.y;
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  return (
    Math.abs(localX) <= layer.width / 2 && Math.abs(localY) <= layer.height / 2
  );
}

export type HandleType =
  | 'tl' | 'tm' | 'tr'
  | 'ml' | 'mr'
  | 'bl' | 'bm' | 'br'
  | 'rotate' | null;

export function getHandleAtPoint(
  layer: Layer,
  px: number,
  py: number,
): HandleType {
  const cos = Math.cos((-layer.rotation * Math.PI) / 180);
  const sin = Math.sin((-layer.rotation * Math.PI) / 180);
  const dx = px - layer.x;
  const dy = py - layer.y;
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  const halfW = layer.width / 2;
  const halfH = layer.height / 2;
  const handleRadius = 8;

  const handles: { pos: HandleType; x: number; y: number }[] = [
    { pos: 'tl', x: -halfW, y: -halfH },
    { pos: 'tm', x: 0, y: -halfH },
    { pos: 'tr', x: halfW, y: -halfH },
    { pos: 'mr', x: halfW, y: 0 },
    { pos: 'br', x: halfW, y: halfH },
    { pos: 'bm', x: 0, y: halfH },
    { pos: 'bl', x: -halfW, y: halfH },
    { pos: 'ml', x: -halfW, y: 0 },
  ];

  for (const h of handles) {
    const dist = Math.sqrt((localX - h.x) ** 2 + (localY - h.y) ** 2);
    if (dist <= handleRadius) {
      return h.pos;
    }
  }

  const rotateY = -halfH - 20;
  const rotateDist = Math.sqrt(localX ** 2 + (localY - rotateY) ** 2);
  if (rotateDist <= 8) {
    return 'rotate';
  }

  return null;
}

export { loadImage };
