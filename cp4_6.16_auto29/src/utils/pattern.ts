import type { PatternRow, PatternValidationResult } from '@/types';
import { ALLOWED_PATTERN_SYMBOLS } from '@/types';

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

export function validatePattern(text: string, expectedRowCount?: number): PatternValidationResult {
  const lines = text.split('\n').filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    return {
      valid: false,
      rowCount: 0,
      stitchCount: 0,
      inconsistentRows: [],
      invalidCharacters: [],
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
      invalidCharacters: [],
      error: '第一行不能为空',
    };
  }

  const inconsistentRows: { rowIndex: number; length: number }[] = [];
  const invalidCharacters: { rowIndex: number; char: string; position: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length !== stitchCount) {
      inconsistentRows.push({ rowIndex: i + 1, length: lines[i].length });
    }

    const chars = lines[i].split('');
    for (let j = 0; j < chars.length; j++) {
      if (!ALLOWED_PATTERN_SYMBOLS.includes(chars[j])) {
        invalidCharacters.push({ rowIndex: i + 1, char: chars[j], position: j + 1 });
      }
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
      invalidCharacters,
      error: `图案行数不对齐：第1行有${stitchCount}针，但${examples}${more}针数不一致`,
    };
  }

  if (invalidCharacters.length > 0) {
    const examples = invalidCharacters
      .slice(0, 3)
      .map((c) => `第${c.rowIndex}行第${c.position}列"${c.char}"`)
      .join('、');
    const more = invalidCharacters.length > 3 ? ` 等${invalidCharacters.length}处` : '';
    return {
      valid: false,
      rowCount,
      stitchCount,
      inconsistentRows,
      invalidCharacters,
      error: `包含不支持的符号：${examples}${more}。允许的符号：${ALLOWED_PATTERN_SYMBOLS.join(' ')}`,
    };
  }

  if (expectedRowCount !== undefined && rowCount !== expectedRowCount) {
    return {
      valid: false,
      rowCount,
      stitchCount,
      inconsistentRows: [],
      invalidCharacters: [],
      error: `行数不匹配：图案有 ${rowCount} 行，但设置的行数为 ${expectedRowCount} 行`,
    };
  }

  return {
    valid: true,
    rowCount,
    stitchCount,
    inconsistentRows: [],
    invalidCharacters: [],
  };
}
