import { CanvasState } from './types';

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

export function handleZoom(
  e: React.WheelEvent,
  canvas: CanvasState,
  setCanvas: (canvas: CanvasState) => void
) {
  e.preventDefault();
  const delta = -e.deltaY * 0.001;
  const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, canvas.scale * (1 + delta)));
  
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  const scaleRatio = newScale / canvas.scale;
  const newOffsetX = mouseX - (mouseX - canvas.offsetX) * scaleRatio;
  const newOffsetY = mouseY - (mouseY - canvas.offsetY) * scaleRatio;
  
  setCanvas({
    scale: newScale,
    offsetX: newOffsetX,
    offsetY: newOffsetY,
  });
}

export function handlePan(
  e: React.MouseEvent,
  startX: number,
  startY: number,
  canvas: CanvasState,
  setCanvas: (canvas: CanvasState) => void
) {
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  
  setCanvas({
    ...canvas,
    offsetX: canvas.offsetX + dx,
    offsetY: canvas.offsetY + dy,
  });
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  offsetX: number,
  offsetY: number
) {
  ctx.clearRect(0, 0, width, height);
  
  if (scale > 3) return;
  
  const baseGridSize = 50;
  const gridSize = baseGridSize * scale;
  
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
  ctx.lineWidth = 1;
  
  const startX = offsetX % gridSize;
  const startY = offsetY % gridSize;
  
  ctx.beginPath();
  
  for (let x = startX; x < width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  
  for (let y = startY; y < height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  
  ctx.stroke();
}
