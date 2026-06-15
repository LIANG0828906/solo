import type { PatternRow } from '@/types';

export function parsePattern(text: string): PatternRow[] {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  return lines.map((line, index) => ({
    index,
    symbols: line.split(''),
  }));
}

export function getPatternRowCount(text: string): number {
  return text.split('\n').filter((line) => line.trim() !== '').length;
}
