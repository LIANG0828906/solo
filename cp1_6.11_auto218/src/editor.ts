import { PatternType, renderPattern, PaperType, PaperConfig, getPaperConfigs } from './template';

export type ElementType = 'text' | 'pattern';

export interface TextElement {
  id: string;
  type: 'text';
  text: string;
  font: string;
  fontSize: number;
  x: number;
  y: number;
  color: string;
  opacity: number;
  zIndex: number;
  rotation: number;
  scale: number;
}

export interface PatternElement {
  id: string;
  type: 'pattern';
  patternType: PatternType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  zIndex: number;
  rotation: number;
  scale: number;
}

export type DesignElement = TextElement | PatternElement;

export interface ElementOp {
  roomId: string;
  elementId: string;
  type: ElementType;
  action: 'add' | 'move' | 'scale' | 'rotate' | 'delete' | 'color' | 'opacity' | 'reorder';
  data: Record<string, any>;
}

let idCounter = 0;

export function generateId(): string {
  return `el_${Date.now()}_${++idCounter}`;
}

export function createTextElement(
  text: string,
  font: string,
  fontSize: number,
  x: number,
  y: number
): TextElement {
  return {
    id: generateId(),
    type: 'text',
    text,
    font,
    fontSize,
    x,
    y,
    color: '#2F1B0E',
    opacity: 1,
    zIndex: 100,
    rotation: 0,
    scale: 1,
  };
}

export function createPatternElement(
  patternType: PatternType,
  x: number,
  y: number,
  width: number = 200,
  height: number = 200
): PatternElement {
  return {
    id: generateId(),
    type: 'pattern',
    patternType,
    x,
    y,
    width,
    height,
    color: '#8B3A3A',
    opacity: 0.8,
    zIndex: 50,
    rotation: 0,
    scale: 1,
  };
}

export function moveElement(el: DesignElement, dx: number, dy: number): void {
  el.x += dx;
  el.y += dy;
}

export function scaleElement(el: DesignElement, delta: number): void {
  const step = 0.1;
  const newScale = Math.round((el.scale + delta * step) * 10) / 10;
  el.scale = Math.max(0.3, Math.min(2.0, newScale));
}

export function rotateElement(el: DesignElement, deltaAngle: number): void {
  const step = 5;
  el.rotation = Math.round((el.rotation + deltaAngle * step) / step) * step;
}

export function setElementColor(el: DesignElement, color: string): void {
  el.color = color;
}

export function setElementOpacity(el: DesignElement, opacity: number): void {
  el.opacity = Math.max(0, Math.min(1, opacity));
}

export function reorderElement(
  elements: DesignElement[],
  elementId: string,
  newZIndex: number
): void {
  const el = elements.find(e => e.id === elementId);
  if (el) {
    el.zIndex = newZIndex;
  }
}

export function deleteElement(elements: DesignElement[], elementId: string): DesignElement[] {
  return elements.filter(e => e.id !== elementId);
}

export function getSortedElements(elements: DesignElement[]): DesignElement[] {
  return [...elements].sort((a, b) => a.zIndex - b.zIndex);
}

export function hitTest(
  elements: DesignElement[],
  x: number,
  y: number
): DesignElement | null {
  const sorted = getSortedElements(elements).reverse();
  for (const el of sorted) {
    const bounds = getElementBounds(el);
    if (x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h) {
      return el;
    }
  }
  return null;
}

export function getElementBounds(el: DesignElement): { x: number; y: number; w: number; h: number } {
  if (el.type === 'text') {
    const w = el.text.length * el.fontSize * 0.7 * el.scale;
    const h = el.fontSize * 1.2 * el.scale;
    return { x: el.x - w / 2, y: el.y - h / 2, w, h };
  } else {
    const w = el.width * el.scale;
    const h = el.height * el.scale;
    return { x: el.x - w / 2, y: el.y - h / 2, w, h };
  }
}

export function renderElement(
  ctx: CanvasRenderingContext2D,
  el: DesignElement,
  showSelection: boolean = false,
  inkWash: boolean = false
): void {
  ctx.save();
  ctx.translate(el.x, el.y);
  ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.scale(el.scale, el.scale);
  ctx.globalAlpha = el.opacity;

  if (inkWash) {
    ctx.filter = 'saturate(0.7)';
    const jitterX = (Math.random() - 0.5) * 2;
    const jitterY = (Math.random() - 0.5) * 2;
    ctx.translate(jitterX, jitterY);
    ctx.shadowBlur = 3;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
  }

  if (el.type === 'text') {
    renderTextElement(ctx, el);
  } else {
    renderPatternElement(ctx, el);
  }

  ctx.restore();

  if (showSelection) {
    renderSelectionBox(ctx, el);
  }
}

function renderTextElement(ctx: CanvasRenderingContext2D, el: TextElement): void {
  ctx.font = `${el.fontSize}px "${el.font}", KaiTi, STKaiti, serif`;
  ctx.fillStyle = el.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 1;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.fillText(el.text, 0, 0);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function renderPatternElement(ctx: CanvasRenderingContext2D, el: PatternElement): void {
  const patternCanvas = renderPattern({
    type: el.patternType,
    color: el.color,
    size: el.width,
  });
  ctx.drawImage(patternCanvas, -el.width / 2, -el.height / 2, el.width, el.height);
}

function renderSelectionBox(ctx: CanvasRenderingContext2D, el: DesignElement): void {
  const bounds = getElementBounds(el);
  ctx.save();
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
  ctx.setLineDash([]);

  const handleSize = 6;
  const handles = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.w, y: bounds.y },
    { x: bounds.x, y: bounds.y + bounds.h },
    { x: bounds.x + bounds.w, y: bounds.y + bounds.h },
  ];
  ctx.fillStyle = '#DAA520';
  for (const h of handles) {
    ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
  }
  ctx.restore();
}

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number = 40
): void {
  ctx.save();
  ctx.strokeStyle = '#D2B48C';
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 0.5;

  for (let x = 0; x <= width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function makeOp(
  roomId: string,
  elementId: string,
  type: ElementType,
  action: ElementOp['action'],
  data: Record<string, any>
): ElementOp {
  return { roomId, elementId, type, action, data };
}

export function applyOp(elements: DesignElement[], op: ElementOp): DesignElement[] {
  const el = elements.find(e => e.id === op.elementId);

  switch (op.action) {
    case 'add':
      if (op.type === 'text') {
        return [...elements, op.data.element as TextElement];
      } else {
        return [...elements, op.data.element as PatternElement];
      }
    case 'move':
      if (el) {
        el.x = op.data.x;
        el.y = op.data.y;
      }
      return [...elements];
    case 'scale':
      if (el) {
        el.scale = op.data.scale;
      }
      return [...elements];
    case 'rotate':
      if (el) {
        el.rotation = op.data.rotation;
      }
      return [...elements];
    case 'delete':
      return deleteElement(elements, op.elementId);
    case 'color':
      if (el) {
        el.color = op.data.color;
      }
      return [...elements];
    case 'opacity':
      if (el) {
        el.opacity = op.data.opacity;
      }
      return [...elements];
    case 'reorder':
      if (el) {
        el.zIndex = op.data.zIndex;
      }
      return [...elements];
    default:
      return elements;
  }
}
