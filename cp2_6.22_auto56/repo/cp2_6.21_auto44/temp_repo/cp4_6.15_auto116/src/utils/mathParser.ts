import { parse } from 'mathjs';
import { Point, ParseResult } from '../types';

const MAX_POINTS = 2000;

export function parseExpression(expression: string): { valid: boolean; error?: string } {
  try {
    const testExpr = expression.replace(/\^/g, '**');
    const node = parse(testExpr);
    const testResult = node.evaluate({ x: 1 });
    if (typeof testResult !== 'number' || isNaN(testResult) || !isFinite(testResult)) {
      return { valid: false, error: '表达式计算结果无效，请检查表达式' };
    }
    return { valid: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { valid: false, error: err.message || '表达式解析失败' };
  }
}

export function evaluateFunction(
  expression: string,
  xMin: number,
  xMax: number,
  amplitude: number,
  frequency: number,
  phase: number
): Point[] {
  const points: Point[] = [];
  const step = (xMax - xMin) / (MAX_POINTS - 1);
  const safeExpr = expression.replace(/\^/g, '**');

  let compiled;
  try {
    compiled = parse(safeExpr);
  } catch {
    return points;
  }

  for (let i = 0; i < MAX_POINTS; i++) {
    const xRaw = xMin + i * step;
    const xScaled = frequency * xRaw + phase;
    try {
      const yRaw = compiled.evaluate({ x: xScaled }) as number;
      if (typeof yRaw === 'number' && isFinite(yRaw) && !isNaN(yRaw)) {
        points.push({
          x: xRaw,
          y: amplitude * yRaw,
        });
      }
    } catch {
      continue;
    }
  }

  return points;
}

export function evaluateExpression(
  expression: string,
  xMin: number,
  xMax: number,
  amplitude: number,
  frequency: number,
  phase: number
): ParseResult {
  const parseCheck = parseExpression(expression);
  if (!parseCheck.valid) {
    return { valid: false, error: parseCheck.error };
  }
  const points = evaluateFunction(expression, xMin, xMax, amplitude, frequency, phase);
  return { valid: true, points };
}

export const PRESET_COLORS = [
  '#e94560',
  '#0f3460',
  '#00d9ff',
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#96ceb4',
  '#ffeaa7',
  '#dfe6e9',
  '#fd79a8',
  '#a29bfe',
  '#00b894',
];

export const DEFAULT_FUNCTIONS = [
  { expression: 'sin(x)', color: '#e94560' },
  { expression: 'cos(x/2)*2', color: '#00d9ff' },
];
