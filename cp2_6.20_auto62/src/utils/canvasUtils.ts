import type {
  Point,
  BoardElement,
  ShapeElement,
  PathElement,
  TextElement,
  ImageElement,
  Theme,
} from '../types/board';

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zoom: number,
  offset: Point,
  theme: Theme
): void {
  const gridSize = 20;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const effectiveGrid = gridSize;
  const startX = -offset.x % effectiveGrid;
  const startY = -offset.y % effectiveGrid;

  ctx.strokeStyle = theme.gridColor;
  ctx.globalAlpha = theme.gridOpacity;
  ctx.lineWidth = 1;

  ctx.beginPath();
  for (let x = startX; x < width; x += effectiveGrid) {
    const px = Math.round(x) + 0.5;
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
  }
  for (let y = startY; y < height; y += effectiveGrid) {
    const py = Math.round(y) + 0.5;
    ctx.moveTo(0, py);
    ctx.lineTo(width, py);
  }
  ctx.stroke();

  drawCheckerboard(ctx, width, height, offset, theme);
  ctx.restore();
}

function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  offset: Point,
  theme: Theme
): void {
  const tileSize = 80;
  const startGX = Math.floor(offset.x / tileSize);
  const startGY = Math.floor(offset.y / tileSize);
  const endGX = Math.ceil((offset.x + width) / tileSize);
  const endGY = Math.ceil((offset.y + height) / tileSize);

  ctx.globalAlpha = theme.gridOpacity * 0.18;
  ctx.fillStyle = theme.gridColor;

  for (let gx = startGX; gx < endGX; gx++) {
    for (let gy = startGY; gy < endGY; gy++) {
      if ((gx + gy) % 2 === 0) continue;
      const x = Math.floor(gx * tileSize - offset.x);
      const y = Math.floor(gy * tileSize - offset.y);
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }
}

export function drawElement(
  ctx: CanvasRenderingContext2D,
  element: BoardElement,
  imageCache: Map<string, HTMLImageElement>
): void {
  ctx.save();
  ctx.globalAlpha = element.opacity;
  ctx.imageSmoothingEnabled = true;

  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;
  ctx.translate(cx, cy);
  ctx.rotate((element.rotation * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  switch (element.type) {
    case 'shape':
      drawShape(ctx, element);
      break;
    case 'path':
      drawPath(ctx, element);
      break;
    case 'text':
      drawText(ctx, element);
      break;
    case 'image':
      drawImageElement(ctx, element, imageCache);
      break;
  }

  ctx.restore();
}

function drawShape(ctx: CanvasRenderingContext2D, element: ShapeElement): void {
  ctx.fillStyle = element.fillColor;
  ctx.strokeStyle = element.strokeColor;
  ctx.lineWidth = element.strokeWidth;

  if (element.shapeType === 'rectangle') {
    const r = Math.min(8, element.width * 0.1, element.height * 0.1);
    const x = element.x;
    const y = element.y;
    const w = element.width;
    const h = element.height;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    if (element.strokeWidth > 0) ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.ellipse(
      element.x + element.width / 2,
      element.y + element.height / 2,
      element.width / 2,
      element.height / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    if (element.strokeWidth > 0) ctx.stroke();
  }
}

function drawPath(ctx: CanvasRenderingContext2D, element: PathElement): void {
  if (element.points.length < 2) {
    if (element.points.length === 1) {
      ctx.fillStyle = element.strokeColor;
      ctx.beginPath();
      ctx.arc(
        element.x + element.points[0].x,
        element.y + element.points[0].y,
        element.strokeWidth / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    return;
  }

  ctx.strokeStyle = element.strokeColor;
  ctx.lineWidth = element.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(element.x + element.points[0].x, element.y + element.points[0].y);

  for (let i = 1; i < element.points.length - 1; i++) {
    const xc = (element.x + element.points[i].x + element.x + element.points[i + 1].x) / 2;
    const yc = (element.y + element.points[i].y + element.y + element.points[i + 1].y) / 2;
    ctx.quadraticCurveTo(element.x + element.points[i].x, element.y + element.points[i].y, xc, yc);
  }
  const last = element.points[element.points.length - 1];
  ctx.lineTo(element.x + last.x, element.y + last.y);
  ctx.stroke();
}

function drawText(ctx: CanvasRenderingContext2D, element: TextElement): void {
  ctx.fillStyle = element.color;
  ctx.font = `${element.fontSize}px ${element.fontFamily}`;
  ctx.textBaseline = 'top';

  const lineHeight = element.fontSize * 1.4;
  const lines = element.text.split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, element.x, element.y + i * lineHeight);
  });
}

function drawImageElement(
  ctx: CanvasRenderingContext2D,
  element: ImageElement,
  imageCache: Map<string, HTMLImageElement>
): void {
  const img = imageCache.get(element.src);
  if (img && img.complete) {
    ctx.drawImage(img, element.x, element.y, element.width, element.height);
  } else {
    ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
    ctx.fillRect(element.x, element.y, element.width, element.height);
    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading...', element.x + element.width / 2, element.y + element.height / 2);
  }
}

export function drawSelection(
  ctx: CanvasRenderingContext2D,
  element: BoardElement,
  zoom: number
): void {
  ctx.save();
  const color = '#2196F3';
  const lineW = Math.max(1.5, 2 / zoom);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineW;
  ctx.setLineDash([Math.max(4, 6 / zoom), Math.max(3, 4 / zoom)]);

  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;
  ctx.translate(cx, cy);
  ctx.rotate((element.rotation * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  ctx.strokeRect(element.x - lineW / 2, element.y - lineW / 2, element.width + lineW, element.height + lineW);

  ctx.setLineDash([]);
  const handleSize = Math.max(8, 10 / zoom);
  const halfHandle = handleSize / 2;
  const positions: Record<string, Point> = {
    nw: { x: element.x, y: element.y },
    n:  { x: cx, y: element.y },
    ne: { x: element.x + element.width, y: element.y },
    e:  { x: element.x + element.width, y: cy },
    se: { x: element.x + element.width, y: element.y + element.height },
    s:  { x: cx, y: element.y + element.height },
    sw: { x: element.x, y: element.y + element.height },
    w:  { x: element.x, y: cy },
  };

  for (const pos of Object.values(positions)) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pos.x - halfHandle, pos.y - halfHandle, handleSize, handleSize);
    ctx.strokeRect(pos.x - halfHandle, pos.y - halfHandle, handleSize, handleSize);
  }

  const rotateDist = Math.max(20, 30 / zoom);
  const rotateY = element.y - rotateDist;
  ctx.beginPath();
  ctx.moveTo(cx, element.y);
  ctx.lineTo(cx, rotateY);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, rotateY, Math.max(6, handleSize * 0.75), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawRipple(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number
): void {
  ctx.save();
  const maxRadius = 60;
  const radius = maxRadius * progress;
  const alpha = Math.max(0, 1 - progress);
  ctx.strokeStyle = `rgba(33, 150, 243, ${alpha})`;
  ctx.lineWidth = 3 * (1 - progress * 0.5);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawSnapFlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  active: boolean
): void {
  if (!active) return;
  ctx.save();
  const radius = 14;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, 'rgba(255, 255, 200, 0.95)');
  gradient.addColorStop(0.5, 'rgba(255, 235, 100, 0.7)');
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function preloadImage(
  src: string,
  cache: Map<string, HTMLImageElement>
): Promise<HTMLImageElement> {
  const cached = cache.get(src);
  if (cached && cached.complete) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}
