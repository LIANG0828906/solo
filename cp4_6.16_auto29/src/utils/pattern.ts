import type { PatternRow, PatternValidationResult } from '@/types';

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

export function validatePattern(text: string): PatternValidationResult {
  const lines = text.split('\n').filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    return {
      valid: false,
      rowCount: 0,
      stitchCount: 0,
      inconsistentRows: [],
      error: '图案内容不能为空',
    };
  }

  const rowCount = lines.length;
  const stitchCount = lines[0].length;

  if (stitchCount === 0) {
    return {
      valid: false,
      rowCount,
      stitchCount: 0,
      inconsistentRows: [],
      error: '第一行不能为空',
    };
  }

  const inconsistentRows: { rowIndex: number; length: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length !== stitchCount) {
      inconsistentRows.push({ rowIndex: i + 1, length: lines[i].length });
    }
  }

  if (inconsistentRows.length > 0) {
    const examples = inconsistentRows.slice(0, 3).map((r) => `第${r.rowIndex}行(${r.length}针)`).join('、');
    const more = inconsistentRows.length > 3 ? ` 等${inconsistentRows.length}行` : '';
    return {
      valid: false,
      rowCount,
      stitchCount,
      inconsistentRows,
      error: `图案行数不对齐：第1行有${stitchCount}针，但${examples}${more}针数不一致`,
    };
  }

  return {
    valid: true,
    rowCount,
    stitchCount,
    inconsistentRows: [],
  };
}
