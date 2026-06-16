import {
  MindMapNode,
  NODE_COLORS,
  LAYOUT_CONFIG,
  ANIMATION_CONFIG,
  LINE_CONFIG,
} from '../types';
import { getNodeBounds, isNodeInViewport } from './layout';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  hoveredNodeId: string | null;
  draggedNodeId: string | null;
  collapseAnimations: Map<string, { startTime: number; collapsing: boolean }>;
  layoutAnimations: Map<string, { startTime: number; startPos: { x: number; y: number } }>;
  now: number;
  useVirtualization: boolean;
  viewport: { x: number; y: number; width: number; height: number };
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }
  return { r: 102, g: 102, b: 102 };
}

function getAnimatedPosition(
  node: MindMapNode,
  context: RenderContext
): { x: number; y: number } {
  const anim = context.layoutAnimations.get(node.id);
  if (!anim) {
    return { x: node.position.x, y: node.position.y };
  }
  const elapsed = context.now - anim.startTime;
  const t = Math.min(elapsed / ANIMATION_CONFIG.layoutDuration, 1);
  const eased = 1 - Math.pow(1 - t, 3);
  return {
    x: anim.startPos.x + (node.position.x - anim.startPos.x) * eased,
    y: anim.startPos.y + (node.position.y - anim.startPos.y) * eased,
  };
}

function getCollapseOpacity(
  node: MindMapNode,
  context: RenderContext
): number {
  const anim = context.collapseAnimations.get(node.id);
  if (!anim) {
    return 1;
  }
  const elapsed = context.now - anim.startTime;
  const t = Math.min(elapsed / ANIMATION_CONFIG.collapseTransition, 1);
  return anim.collapsing ? 1 - t : t;
}

export function drawBezierConnection(
  context: RenderContext,
  parentNode: MindMapNode,
  childNode: MindMapNode
): void {
  const { ctx, draggedNodeId } = context;

  const parentPos = getAnimatedPosition(parentNode, context);
  const childPos = getAnimatedPosition(childNode, context);

  const childOpacity = getCollapseOpacity(childNode, context);
  if (childOpacity <= 0.01) {
    return;
  }

  const parentBounds = getNodeBounds(parentNode);
  const childBounds = getNodeBounds(childNode);

  const startX =
    parentPos.x +
    (childPos.x >= parentPos.x ? parentBounds.width / 2 : -parentBounds.width / 2);
  const startY = parentPos.y;

  const endX =
    childPos.x +
    (parentPos.x >= childPos.x ? childBounds.width / 2 : -childBounds.width / 2);
  const endY = childPos.y;

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const normX = -dy / dist;
  const normY = dx / dist;

  const ctrlX = midX + normX * LINE_CONFIG.controlPointOffset;
  const ctrlY = midY + normY * LINE_CONFIG.controlPointOffset;

  const parentColor = NODE_COLORS[parentNode.level].border;
  const childColor = NODE_COLORS[childNode.level].border;

  const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
  gradient.addColorStop(0, parentColor);
  gradient.addColorStop(1, childColor);

  ctx.save();
  ctx.globalAlpha = childOpacity;

  const isDragging = draggedNodeId === parentNode.id || draggedNodeId === childNode.id;
  const lineWidth = isDragging ? LINE_CONFIG.dragWidth : LINE_CONFIG.defaultWidth;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.restore();
}

export function drawNode(context: RenderContext, node: MindMapNode): void {
  const { ctx, hoveredNodeId, draggedNodeId, now } = context;

  const pos = getAnimatedPosition(node, context);
  const opacity = getCollapseOpacity(node, context);
  if (opacity <= 0.01) {
    return;
  }

  if (
    context.useVirtualization &&
    !isNodeInViewport(
      { ...node, position: pos },
      context.viewport,
      100
    )
  ) {
    return;
  }

  const bounds = getNodeBounds(node);
  const colors = NODE_COLORS[node.level];
  const isHovered = hoveredNodeId === node.id;
  const isDragged = draggedNodeId === node.id;
  const isRoot = node.level === 1;

  const hoverT = isHovered ? Math.min((now - (node as any)._hoverStart || now) / ANIMATION_CONFIG.hoverTransition, 1) : 0;
  const bgColor = isHovered ? lerpColor(colors.default, colors.hover, 1) : colors.default;
  const textColor = isHovered ? colors.hoverText : colors.text;

  const scale = isDragged ? ANIMATION_CONFIG.dragScale : 1;
  const w = bounds.width * scale;
  const h = bounds.height * scale;
  const x = pos.x - w / 2;
  const y = pos.y - h / 2;

  const radius = isRoot ? 12 : 8;

  ctx.save();
  ctx.globalAlpha = opacity;

  if (isDragged) {
    ctx.shadowColor = ANIMATION_CONFIG.shadowColor;
    ctx.shadowBlur = ANIMATION_CONFIG.shadowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
  }

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  ctx.fillStyle = bgColor;
  ctx.fill();

  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = colors.border;
  ctx.lineWidth = isRoot ? 2.5 : 1.5;
  ctx.stroke();

  ctx.fillStyle = textColor;
  const fontSize = isRoot ? 15 : 13;
  ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const displayText = truncateText(node.text, LAYOUT_CONFIG.maxTextLength);
  ctx.fillText(displayText, pos.x, pos.y);

  if (node.children.length > 0) {
    ctx.fillStyle = colors.border;
    ctx.beginPath();
    const indicatorX = pos.x + w / 2 - 10;
    const indicatorY = pos.y;
    if (node.collapsed) {
      ctx.moveTo(indicatorX - 3, indicatorY - 4);
      ctx.lineTo(indicatorX + 3, indicatorY);
      ctx.lineTo(indicatorX - 3, indicatorY + 4);
    } else {
      ctx.moveTo(indicatorX - 4, indicatorY - 3);
      ctx.lineTo(indicatorX, indicatorY + 3);
      ctx.lineTo(indicatorX + 4, indicatorY - 3);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function renderConnections(
  context: RenderContext,
  node: MindMapNode
): void {
  if (node.collapsed) {
    return;
  }
  for (const child of node.children) {
    drawBezierConnection(context, node, child);
    renderConnections(context, child);
  }
}

export function renderNodes(
  context: RenderContext,
  node: MindMapNode
): void {
  drawNode(context, node);
  if (!node.collapsed) {
    for (const child of node.children) {
      renderNodes(context, child);
    }
  }
}

export function renderTooltip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number
): void {
  const paddingX = 12;
  const paddingY = 8;
  const maxWidth = 160;

  ctx.save();

  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  const words = text.split('');
  let lines: string[] = [];
  let currentLine = '';

  for (const char of words) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth - paddingX * 2 && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  const lineHeight = 18;
  const tooltipWidth = Math.min(
    maxWidth,
    Math.max(...lines.map((l) => ctx.measureText(l).width)) + paddingX * 2
  );
  const tooltipHeight = lines.length * lineHeight + paddingY * 2;

  let tooltipX = x + 15;
  let tooltipY = y - tooltipHeight / 2;

  if (tooltipX + tooltipWidth > ctx.canvas.width - 10) {
    tooltipX = x - tooltipWidth - 15;
  }
  if (tooltipY < 10) {
    tooltipY = 10;
  }
  if (tooltipY + tooltipHeight > ctx.canvas.height - 10) {
    tooltipY = ctx.canvas.height - tooltipHeight - 10;
  }

  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  const radius = 8;
  ctx.beginPath();
  ctx.moveTo(tooltipX + radius, tooltipY);
  ctx.lineTo(tooltipX + tooltipWidth - radius, tooltipY);
  ctx.quadraticCurveTo(tooltipX + tooltipWidth, tooltipY, tooltipX + tooltipWidth, tooltipY + radius);
  ctx.lineTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight - radius);
  ctx.quadraticCurveTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight, tooltipX + tooltipWidth - radius, tooltipY + tooltipHeight);
  ctx.lineTo(tooltipX + radius, tooltipY + tooltipHeight);
  ctx.quadraticCurveTo(tooltipX, tooltipY + tooltipHeight, tooltipX, tooltipY + tooltipHeight - radius);
  ctx.lineTo(tooltipX, tooltipY + radius);
  ctx.quadraticCurveTo(tooltipX, tooltipY, tooltipX + radius, tooltipY);
  ctx.closePath();

  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#333333';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  lines.forEach((line, i) => {
    ctx.fillText(line, tooltipX + paddingX, tooltipY + paddingY + i * lineHeight);
  });

  ctx.restore();
}

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
}

export function isTextTruncated(text: string): boolean {
  return text.length > LAYOUT_CONFIG.maxTextLength;
}
