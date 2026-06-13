export type ToolType =
  | 'pen-thin'
  | 'pen-medium'
  | 'pen-thick'
  | 'rectangle'
  | 'circle'
  | 'sticky'
  | 'arrow';

export interface Point {
  x: number;
  y: number;
}

export interface DrawStyle {
  color: string;
  lineWidth: number;
}

export interface DrawEvent {
  id: string;
  userId: string;
  tool: ToolType;
  points: Point[];
  style: DrawStyle;
  text?: string;
  timestamp: number;
}

export interface StickyNote {
  id: string;
  userId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
}

export interface HistoryStack<T> {
  past: T[];
  present: T;
  future: T[];
}

export const getLineWidth = (tool: ToolType): number => {
  switch (tool) {
    case 'pen-thin':
      return 1.5;
    case 'pen-medium':
      return 3;
    case 'pen-thick':
      return 6;
    case 'rectangle':
    case 'circle':
    case 'arrow':
      return 2;
    default:
      return 2;
  }
};

export const drawLine = (
  ctx: CanvasRenderingContext2D,
  points: Point[],
  style: DrawStyle,
): void => {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.restore();
};

export const drawRectangle = (
  ctx: CanvasRenderingContext2D,
  points: Point[],
  style: DrawStyle,
): void => {
  if (points.length < 2) return;
  const start = points[0];
  const end = points[points.length - 1];
  ctx.save();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  ctx.restore();
};

export const drawCircle = (
  ctx: CanvasRenderingContext2D,
  points: Point[],
  style: DrawStyle,
): void => {
  if (points.length < 2) return;
  const start = points[0];
  const end = points[points.length - 1];
  const radiusX = Math.abs(end.x - start.x) / 2;
  const radiusY = Math.abs(end.y - start.y) / 2;
  const centerX = start.x + (end.x - start.x) / 2;
  const centerY = start.y + (end.y - start.y) / 2;
  ctx.save();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.lineWidth;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

export const drawArrow = (
  ctx: CanvasRenderingContext2D,
  points: Point[],
  style: DrawStyle,
): void => {
  if (points.length < 2) return;
  const start = points[0];
  const end = points[points.length - 1];
  const headLength = 12 + style.lineWidth * 3;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  ctx.save();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.fillStyle = style.color;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - Math.PI / 6),
    end.y - headLength * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + Math.PI / 6),
    end.y - headLength * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

export const drawSticky = (
  ctx: CanvasRenderingContext2D,
  note: StickyNote,
  scale: number,
): void => {
  const fontSize = Math.max(10, 14 * scale);
  const padding = 12 * scale;
  ctx.save();
  ctx.fillStyle = note.color;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 6 * scale;
  ctx.shadowOffsetY = 2 * scale;
  const radius = 4 * scale;
  ctx.beginPath();
  ctx.moveTo(note.x + radius, note.y);
  ctx.lineTo(note.x + note.width - radius, note.y);
  ctx.quadraticCurveTo(note.x + note.width, note.y, note.x + note.width, note.y + radius);
  ctx.lineTo(note.x + note.width, note.y + note.height - radius);
  ctx.quadraticCurveTo(
    note.x + note.width,
    note.y + note.height,
    note.x + note.width - radius,
    note.y + note.height,
  );
  ctx.lineTo(note.x + radius, note.y + note.height);
  ctx.quadraticCurveTo(note.x, note.y + note.height, note.x, note.y + note.height - radius);
  ctx.lineTo(note.x, note.y + radius);
  ctx.quadraticCurveTo(note.x, note.y, note.x + radius, note.y);
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#333';
  ctx.font = `${fontSize}px 'Noto Sans SC', sans-serif`;
  ctx.textBaseline = 'top';
  wrapText(ctx, note.text, note.x + padding, note.y + padding, note.width - padding * 2, fontSize * 1.5);
  ctx.restore();
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void => {
  const chars = text.split('');
  let line = '';
  let lineY = y;
  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, lineY);
      line = chars[i];
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, lineY);
};

export const drawEvent = (ctx: CanvasRenderingContext2D, event: DrawEvent): void => {
  switch (event.tool) {
    case 'pen-thin':
    case 'pen-medium':
    case 'pen-thick':
      drawLine(ctx, event.points, event.style);
      break;
    case 'rectangle':
      drawRectangle(ctx, event.points, event.style);
      break;
    case 'circle':
      drawCircle(ctx, event.points, event.style);
      break;
    case 'arrow':
      drawArrow(ctx, event.points, event.style);
      break;
    default:
      break;
  }
};

export const createHistoryStack = <T>(initial: T): HistoryStack<T> => ({
  past: [],
  present: initial,
  future: [],
});

export const pushHistory = <T>(stack: HistoryStack<T>, next: T): HistoryStack<T> => ({
  past: [...stack.past, stack.present],
  present: next,
  future: [],
});

export const undoHistory = <T>(stack: HistoryStack<T>): HistoryStack<T> | null => {
  if (stack.past.length === 0) return null;
  const previous = stack.past[stack.past.length - 1];
  const newPast = stack.past.slice(0, -1);
  return {
    past: newPast,
    present: previous,
    future: [stack.present, ...stack.future],
  };
};

export const redoHistory = <T>(stack: HistoryStack<T>): HistoryStack<T> | null => {
  if (stack.future.length === 0) return null;
  const next = stack.future[0];
  const newFuture = stack.future.slice(1);
  return {
    past: [...stack.past, stack.present],
    present: next,
    future: newFuture,
  };
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const STICKY_COLORS = [
  '#FFE066',
  '#74C0FC',
  '#8CE99A',
  '#FF8787',
  '#B197FC',
  '#FFA94D',
];
