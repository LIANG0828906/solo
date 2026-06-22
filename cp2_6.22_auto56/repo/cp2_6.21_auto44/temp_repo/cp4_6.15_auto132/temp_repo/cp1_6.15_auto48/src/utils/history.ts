import { v4 as uuidv4 } from 'uuid';

export interface GradientScheme {
  id: string;
  name: string;
  startColor: string;
  endColor: string;
  gradientType: 'linear' | 'radial' | 'conic';
  direction: number;
  steps: number;
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  type: 'create' | 'update' | 'delete';
  scheme: GradientScheme;
  collectionsSnapshot: GradientScheme[];
  timestamp: number;
}

export interface HistoryStack {
  entries: HistoryEntry[];
  currentIndex: number;
}

export function createHistoryStack(): HistoryStack {
  return { entries: [], currentIndex: -1 };
}

export function pushState(
  stack: HistoryStack,
  type: HistoryEntry['type'],
  scheme: GradientScheme,
  collectionsSnapshot: GradientScheme[]
): HistoryStack {
  const newEntries = stack.entries.slice(0, stack.currentIndex + 1);
  const entry: HistoryEntry = {
    id: uuidv4(),
    type,
    scheme: { ...scheme },
    collectionsSnapshot: collectionsSnapshot.map(c => ({ ...c })),
    timestamp: Date.now(),
  };
  newEntries.push(entry);
  return { entries: newEntries, currentIndex: newEntries.length - 1 };
}

export function undo(stack: HistoryStack): HistoryStack {
  if (stack.currentIndex <= 0) return stack;
  return { ...stack, currentIndex: stack.currentIndex - 1 };
}

export function redo(stack: HistoryStack): HistoryStack {
  if (stack.currentIndex >= stack.entries.length - 1) return stack;
  return { ...stack, currentIndex: stack.currentIndex + 1 };
}

export function getSnapshotAt(stack: HistoryStack, index: number): HistoryEntry | null {
  if (index < 0 || index >= stack.entries.length) return null;
  return stack.entries[index];
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function generateColorStops(startColor: string, endColor: string, steps: number): string {
  if (steps <= 1) return startColor;
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);
  const stops: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.round(start.r + (end.r - start.r) * t);
    const g = Math.round(start.g + (end.g - start.g) * t);
    const b = Math.round(start.b + (end.b - start.b) * t);
    const percent = Math.round(t * 100);
    stops.push(`rgb(${r}, ${g}, ${b}) ${percent}%`);
  }
  return stops.join(', ');
}

export function generateGradientCSS(scheme: GradientScheme): { webkit: string; standard: string } {
  const stops = generateColorStops(scheme.startColor, scheme.endColor, scheme.steps);
  let gradientFunc = '';
  switch (scheme.gradientType) {
    case 'linear':
      gradientFunc = `linear-gradient(${scheme.direction}deg, ${stops})`;
      break;
    case 'radial':
      gradientFunc = `radial-gradient(circle, ${stops})`;
      break;
    case 'conic':
      gradientFunc = `conic-gradient(from ${scheme.direction}deg, ${stops})`;
      break;
  }
  return {
    webkit: `background: -webkit-${gradientFunc};`,
    standard: `background: ${gradientFunc};`,
  };
}

export function generateFullCSSCode(scheme: GradientScheme): string {
  const { webkit, standard } = generateGradientCSS(scheme);
  return `${webkit}\n${standard}`;
}

export function createDefaultScheme(): GradientScheme {
  return {
    id: uuidv4(),
    name: `方案 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`,
    startColor: '#6366f1',
    endColor: '#8b5cf6',
    gradientType: 'linear',
    direction: 135,
    steps: 2,
    createdAt: Date.now(),
  };
}

export function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
