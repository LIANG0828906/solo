import { Layer, FilterConfig } from '../types';
import { applyPixelFilter } from './filterUtils';

const imageCache = new Map<string, HTMLImageElement>();

export async function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }

  return new Promise((resolve, reject) => {
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

export function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tileSize: number = 20
): void {
  const lightColor = '#FFFFFF';
  const darkColor = '#EBEBEB';

  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      const isLight = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isLight ? lightColor : darkColor;
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }
}

async function drawImageLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  canvasScale: number
): Promise<void> {
  if (!layer.imageSrc) return;

  try {
    const img = await loadImage(layer.imageSrc);
    
    ctx.save();
    ctx.translate(layer.x * canvasScale, layer.y * canvasScale);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(layer.scale * canvasScale, layer.scale * canvasScale);
    ctx.globalAlpha = layer.opacity;

    const drawWidth = layer.width;
    const drawHeight = layer.height;
    const offsetX = -drawWidth / 2;
    const offsetY = -drawHeight / 2;

    if (layer.filterConfig.preset === 'vintage' || 
        layer.filterConfig.preset === 'ecommerce' ||
        layer.filterConfig.hue !== 0 ||
        layer.filterConfig.saturation < -50 ||
        layer.filterConfig.contrast > 25) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = drawWidth;
      tempCanvas.height = drawHeight;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(img, 0, 0, drawWidth, drawHeight);
      
      const imageData = tempCtx.getImageData(0, 0, drawWidth, drawHeight);
      applyPixelFilter(imageData, layer.filterConfig);
      tempCtx.putImageData(imageData, 0, 0);
      
      ctx.drawImage(tempCanvas, offsetX, offsetY);
    } else {
      ctx.filter = getCanvasFilter(layer.filterConfig);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    ctx.restore();
  } catch (error) {
    console.error('Failed to draw image layer:', error);
  }
}

function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  canvasScale: number
): void {
  if (!layer.textStyle) return;

  const { textStyle } = layer;
  
  ctx.save();
  ctx.translate(layer.x * canvasScale, layer.y * canvasScale);
  ctx.rotate(((layer.rotation + textStyle.rotation) * Math.PI) / 180);
  ctx.scale(canvasScale, canvasScale);
  ctx.globalAlpha = layer.opacity;

  ctx.font = `${textStyle.fontWeight} ${textStyle.fontSize}px ${textStyle.fontFamily}`;
  ctx.fillStyle = textStyle.color;
  ctx.textAlign = textStyle.align;
  ctx.textBaseline = 'middle';

  const lines = textStyle.content.split('\n');
  const lineHeight = textStyle.fontSize * 1.2;
  const totalHeight = lines.length * lineHeight;
  const startY = -totalHeight / 2 + lineHeight / 2;

  ctx.filter = getCanvasFilter(layer.filterConfig);
  
  lines.forEach((line, index) => {
    ctx.fillText(line, 0, startY + index * lineHeight);
  });

  ctx.restore();
}

function getCanvasFilter(filterConfig: FilterConfig): string {
  const { brightness, contrast, hue, saturation } = filterConfig;
  const filters: string[] = [];
  
  if (brightness !== 0) {
    filters.push(`brightness(${100 + brightness}%)`);
  }
  if (contrast !== 0) {
    filters.push(`contrast(${100 + contrast}%)`);
  }
  if (hue !== 0) {
    filters.push(`hue-rotate(${hue}deg)`);
  }
  if (saturation !== 0) {
    filters.push(`saturate(${100 + saturation}%)`);
  }
  
  return filters.length > 0 ? filters.join(' ') : 'none';
}

export async function drawLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  canvasScale: number
): Promise<void> {
  if (!layer.visible) return;

  if (layer.type === 'image') {
    await drawImageLayer(ctx, layer, canvasScale);
  } else if (layer.type === 'text') {
    drawTextLayer(ctx, layer, canvasScale);
  }
}

export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  canvasScale: number
): void {
  const scaledWidth = layer.width * layer.scale * canvasScale;
  const scaledHeight = layer.height * layer.scale * canvasScale;
  const centerX = layer.x * canvasScale;
  const centerY = layer.y * canvasScale;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((layer.rotation * Math.PI) / 180);

  ctx.strokeStyle = '#1976D2';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
  ctx.setLineDash([]);

  const handleSize = 8;
  const halfHandle = handleSize / 2;
  const corners = [
    { x: -scaledWidth / 2, y: -scaledHeight / 2, cursor: 'nw-resize' },
    { x: 0, y: -scaledHeight / 2, cursor: 'n-resize' },
    { x: scaledWidth / 2, y: -scaledHeight / 2, cursor: 'ne-resize' },
    { x: scaledWidth / 2, y: 0, cursor: 'e-resize' },
    { x: scaledWidth / 2, y: scaledHeight / 2, cursor: 'se-resize' },
    { x: 0, y: scaledHeight / 2, cursor: 's-resize' },
    { x: -scaledWidth / 2, y: scaledHeight / 2, cursor: 'sw-resize' },
    { x: -scaledWidth / 2, y: 0, cursor: 'w-resize' },
  ];

  ctx.fillStyle = '#1976D2';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;

  corners.forEach((corner) => {
    ctx.fillRect(
      corner.x - halfHandle,
      corner.y - halfHandle,
      handleSize,
      handleSize
    );
    ctx.strokeRect(
      corner.x - halfHandle,
      corner.y - halfHandle,
      handleSize,
      handleSize
    );
  });

  ctx.fillStyle = '#1976D2';
  ctx.beginPath();
  ctx.arc(0, -scaledHeight / 2 - 20, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -scaledHeight / 2);
  ctx.lineTo(0, -scaledHeight / 2 - 14);
  ctx.strokeStyle = '#1976D2';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

export type HandlePosition =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'rotate'
  | 'move'
  | null;

export function getHandleAtPosition(
  x: number,
  y: number,
  layer: Layer,
  canvasScale: number
): HandlePosition {
  const scaledWidth = layer.width * layer.scale * canvasScale;
  const scaledHeight = layer.height * layer.scale * canvasScale;
  const centerX = layer.x * canvasScale;
  const centerY = layer.y * canvasScale;

  const cos = Math.cos((-layer.rotation * Math.PI) / 180);
  const sin = Math.sin((-layer.rotation * Math.PI) / 180);
  const localX = cos * (x - centerX) - sin * (y - centerY);
  const localY = sin * (x - centerX) + cos * (y - centerY);

  const handleSize = 12;
  const halfWidth = scaledWidth / 2;
  const halfHeight = scaledHeight / 2;

  if (
    Math.abs(localX - 0) < handleSize &&
    Math.abs(localY - (-halfHeight - 20)) < handleSize
  ) {
    return 'rotate';
  }

  if (
    localX >= -halfWidth - handleSize / 2 &&
    localX <= -halfWidth + handleSize / 2 &&
    localY >= -halfHeight - handleSize / 2 &&
    localY <= -halfHeight + handleSize / 2
  ) {
    return 'nw';
  }
  if (
    localX >= -handleSize / 2 &&
    localX <= handleSize / 2 &&
    localY >= -halfHeight - handleSize / 2 &&
    localY <= -halfHeight + handleSize / 2
  ) {
    return 'n';
  }
  if (
    localX >= halfWidth - handleSize / 2 &&
    localX <= halfWidth + handleSize / 2 &&
    localY >= -halfHeight - handleSize / 2 &&
    localY <= -halfHeight + handleSize / 2
  ) {
    return 'ne';
  }
  if (
    localX >= halfWidth - handleSize / 2 &&
    localX <= halfWidth + handleSize / 2 &&
    localY >= -handleSize / 2 &&
    localY <= handleSize / 2
  ) {
    return 'e';
  }
  if (
    localX >= halfWidth - handleSize / 2 &&
    localX <= halfWidth + handleSize / 2 &&
    localY >= halfHeight - handleSize / 2 &&
    localY <= halfHeight + handleSize / 2
  ) {
    return 'se';
  }
  if (
    localX >= -handleSize / 2 &&
    localX <= handleSize / 2 &&
    localY >= halfHeight - handleSize / 2 &&
    localY <= halfHeight + handleSize / 2
  ) {
    return 's';
  }
  if (
    localX >= -halfWidth - handleSize / 2 &&
    localX <= -halfWidth + handleSize / 2 &&
    localY >= halfHeight - handleSize / 2 &&
    localY <= halfHeight + handleSize / 2
  ) {
    return 'sw';
  }
  if (
    localX >= -halfWidth - handleSize / 2 &&
    localX <= -halfWidth + handleSize / 2 &&
    localY >= -handleSize / 2 &&
    localY <= handleSize / 2
  ) {
    return 'w';
  }

  if (
    localX >= -halfWidth &&
    localX <= halfWidth &&
    localY >= -halfHeight &&
    localY <= halfHeight
  ) {
    return 'move';
  }

  return null;
}

export function clearImageCache(): void {
  imageCache.clear();
}
