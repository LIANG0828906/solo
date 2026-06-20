import { ChartNode, ChartEdge, COLORS, CONFIG, BorderRadius, BorderStyle } from '@/types';
import { getBestAnchorPoints, calculateEdgePath } from './geometry';

export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  zoom: number
) => {
  ctx.save();
  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 1;

  const gridSize = CONFIG.GRID_SIZE * zoom;
  const startX = (offsetX % gridSize) - gridSize;
  const startY = (offsetY % gridSize) - gridSize;

  ctx.beginPath();
  for (let x = startX; x < width + gridSize; x += gridSize) {
    ctx.moveTo(Math.floor(x) + 0.5, 0);
    ctx.lineTo(Math.floor(x) + 0.5, height);
  }
  for (let y = startY; y < height + gridSize; y += gridSize) {
    ctx.moveTo(0, Math.floor(y) + 0.5);
    ctx.lineTo(width, Math.floor(y) + 0.5);
  }
  ctx.stroke();
  ctx.restore();
};

export const drawNode = (
  ctx: CanvasRenderingContext2D,
  node: ChartNode,
  isSelected: boolean,
  isDragging: boolean,
  isFlashing: boolean,
  offsetX: number,
  offsetY: number,
  zoom: number
) => {
  ctx.save();
  
  const x = node.x * zoom + offsetX;
  const y = node.y * zoom + offsetY;
  const width = node.width * zoom;
  const height = node.height * zoom;

  if (isDragging) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 24 * zoom;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8 * zoom;
  }

  const liftOffset = isDragging ? CONFIG.DRAG_LIFT_OFFSET * zoom : 0;
  const drawY = y - liftOffset;

  ctx.fillStyle = node.bgColor;
  ctx.strokeStyle = isSelected ? COLORS.primary : 'transparent';
  ctx.lineWidth = isSelected ? 2 * zoom : 0;

  if (isFlashing) {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = COLORS.primary;
    ctx.lineWidth = 3 * zoom;
  }

  drawRoundedRect(ctx, x, drawY, width, height, node.borderRadius);

  if (node.borderStyle !== 'none') {
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1 * zoom;
    if (node.borderStyle === 'dashed') {
      ctx.setLineDash([5 * zoom, 5 * zoom]);
    }
    drawRoundedRect(ctx, x, drawY, width, height, node.borderRadius, true);
    ctx.setLineDash([]);
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  const iconSize = 24 * zoom;
  const iconY = drawY + height / 2 - iconSize / 2;
  const textSize = 14 * zoom;
  ctx.font = `${textSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (node.icon) {
    const iconX = x + width / 2;
    ctx.font = `${iconSize}px sans-serif`;
    ctx.fillText(node.icon, iconX, iconY + iconSize / 2);

    if (node.text) {
      ctx.fillStyle = COLORS.text;
      ctx.font = `${textSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      ctx.fillText(node.text, x + width / 2, drawY + height - 16 * zoom);
    }
  } else if (node.text) {
    ctx.fillStyle = COLORS.text;
    ctx.fillText(node.text, x + width / 2, drawY + height / 2);
  }

  ctx.restore();
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  borderRadius: BorderRadius,
  strokeOnly: boolean = false
) => {
  let radius = 0;
  if (borderRadius === 'round') {
    radius = Math.min(width, height) * 0.2;
  } else if (borderRadius === 'ellipse') {
    radius = Math.min(width, height) * 0.5;
  }

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (strokeOnly) {
    ctx.stroke();
  } else {
    ctx.fill();
    if (ctx.lineWidth > 0) {
      ctx.stroke();
    }
  }
};

export const drawEdge = (
  ctx: CanvasRenderingContext2D,
  edge: ChartEdge,
  nodes: ChartNode[],
  isSelected: boolean,
  offsetX: number,
  offsetY: number,
  zoom: number,
  isEditingLabel: boolean = false
) => {
  const fromNode = nodes.find(n => n.id === edge.fromId);
  const toNode = nodes.find(n => n.id === edge.toId);

  if (!fromNode || !toNode) return;

  ctx.save();

  const { from, to } = getBestAnchorPoints(fromNode, toNode);
  const fromX = from.x * zoom + offsetX;
  const fromY = from.y * zoom + offsetY;
  const toX = to.x * zoom + offsetX;
  const toY = to.y * zoom + offsetY;

  const { path, points } = calculateEdgePath(edge.style, fromX, fromY, toX, toY);

  ctx.strokeStyle = edge.color;
  ctx.lineWidth = edge.width * zoom;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (isSelected) {
    ctx.shadowColor = COLORS.primary;
    ctx.shadowBlur = 8 * zoom;
  }

  const path2D = new Path2D(path);
  ctx.stroke(path2D);

  if (edge.arrow) {
    drawArrow(ctx, fromX, fromY, toX, toY, edge.color, edge.width * zoom, zoom);
  }

  if (edge.label) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    const midPoint = points[Math.floor(points.length / 2)] || { x: (fromX + toX) / 2, y: (fromY + toY) / 2 };
    const labelX = midPoint.x;
    const labelY = midPoint.y - 10 * zoom;

    const fontSize = CONFIG.EDGE_LABEL_FONT_SIZE * zoom;
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    const textMetrics = ctx.measureText(edge.label);
    const padding = 4 * zoom;

    if (!isEditingLabel) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(
        labelX - textMetrics.width / 2 - padding,
        labelY - fontSize / 2 - padding,
        textMetrics.width + padding * 2,
        fontSize + padding * 2
      );

      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(edge.label, labelX, labelY);
    }
  }

  ctx.restore();
};

const drawArrow = (
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  lineWidth: number,
  zoom: number
) => {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const arrowLength = 12 * zoom + lineWidth * 2;
  const arrowWidth = 6 * zoom + lineWidth;

  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle),
    toY - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle)
  );
  ctx.lineTo(
    toX - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle),
    toY - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

export const drawConnectingLine = (
  ctx: CanvasRenderingContext2D,
  fromNode: ChartNode,
  mouseX: number,
  mouseY: number,
  offsetX: number,
  offsetY: number,
  zoom: number
) => {
  ctx.save();

  const anchors = getBestAnchorPoints(fromNode, fromNode);
  const fromX = anchors.from.x * zoom + offsetX;
  const fromY = anchors.from.y * zoom + offsetY;

  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(mouseX, mouseY);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.restore();
};

export const screenToWorld = (
  screenX: number,
  screenY: number,
  offsetX: number,
  offsetY: number,
  zoom: number
): { x: number; y: number } => {
  return {
    x: (screenX - offsetX) / zoom,
    y: (screenY - offsetY) / zoom,
  };
};

export const getNodesBounds = (nodes: ChartNode[]): { minX: number; maxX: number; minY: number; maxY: number } => {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 1000, minY: 0, maxY: 800 };
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x + node.width);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y + node.height);
  }

  const padding = 80;
  return {
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding,
  };
};

export const drawNodeBorder = (
  ctx: CanvasRenderingContext2D,
  node: ChartNode,
  offsetX: number,
  offsetY: number,
  zoom: number,
  borderStyle: BorderStyle,
  color: string
) => {
  ctx.save();
  
  const x = node.x * zoom + offsetX;
  const y = node.y * zoom + offsetY;
  const width = node.width * zoom;
  const height = node.height * zoom;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * zoom;

  if (borderStyle === 'dashed') {
    ctx.setLineDash([5 * zoom, 5 * zoom]);
  } else if (borderStyle === 'none') {
    ctx.restore();
    return;
  }

  drawRoundedRect(ctx, x, y, width, height, node.borderRadius, true);

  ctx.restore();
};
