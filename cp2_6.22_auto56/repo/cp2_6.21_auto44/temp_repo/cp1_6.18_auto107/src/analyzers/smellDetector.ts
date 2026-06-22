import { v4 as uuidv4 } from 'uuid';
import type { BadSmell, Severity } from '../types';

export type ProgressCallback = (p: number) => void;

const WINDOW_SIZE = 5;

function normalizeCode(code: string): string[] {
  return code.replace(/\r\n/g, '\n').split('\n');
}

function getSnippet(lines: string[], startLine: number, endLine: number): string {
  const start = Math.max(0, startLine - 1);
  const end = Math.min(lines.length, endLine);
  return lines.slice(start, end).join('\n');
}

function findMatchingBrace(lines: string[], startLine: number, startColumn: number): { line: number; column: number } | null {
  let depth = 0;
  let started = false;
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    const startCol = i === startLine ? startColumn : 0;
    for (let j = startCol; j < line.length; j++) {
      if (line[j] === '{') {
        depth++;
        started = true;
      } else if (line[j] === '}') {
        depth--;
        if (started && depth === 0) {
          return { line: i, column: j };
        }
      }
    }
  }
  return null;
}

function detectLongFunctions(lines: string[]): BadSmell[] {
  const badSmells: BadSmell[] = [];
  const functionPattern = /(?:function\s+(\w+)\s*\([^)]*\)\s*\{)|(?:(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=]+?)\s*=>\s*\{)|(?:(\w+)\s*:\s*(?:\([^)]*\)|[^:]+?)\s*=>\s*\{)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(functionPattern);
    if (match) {
      const funcName = match[1] || match[2] || match[3] || 'anonymous';
      const braceIndex = line.indexOf('{');
      if (braceIndex === -1) continue;
      const endPos = findMatchingBrace(lines, i, braceIndex);
      if (!endPos) continue;

      const startLine = i + 1;
      const endLine = endPos.line + 1;
      const bodyLines = endLine - startLine - 1;

      if (bodyLines > 50) {
        let severity: Severity;
        let description: string;
        let suggestion: string;

        if (bodyLines > 80) {
          severity = 'critical';
          description = `函数 "${funcName}" 过长，共有 ${bodyLines} 行代码。严重超过推荐的 50 行限制，会严重影响代码可读性和可维护性。`;
          suggestion = `强烈建议将 "${funcName}" 拆分为多个职责单一的小函数，每个函数控制在 50 行以内。可以按功能模块提取子函数，使用组合模式来组织逻辑。`;
        } else {
          severity = 'medium';
          description = `函数 "${funcName}" 较长，共有 ${bodyLines} 行代码。超过了推荐的 50 行限制，可能影响代码的可读性。`;
          suggestion = `建议考虑将 "${funcName}" 拆分为更小的函数，提取独立的逻辑块。目标是让每个函数只做一件事并做好。`;
        }

        badSmells.push({
          id: uuidv4(),
          type: 'long-function',
          name: '过长函数',
          severity,
          description,
          suggestion,
          position: { startLine, endLine },
          snippet: getSnippet(lines, startLine, Math.min(endLine, startLine + 20)),
        });

        i = endPos.line;
      }
    }
  }

  return badSmells;
}

function detectTooManyParameters(lines: string[]): BadSmell[] {
  const badSmells: BadSmell[] = [];
  const paramPatterns = [
    /function\s+(\w+)\s*\(([^)]*)\)/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/g,
    /(\w+)\s*:\s*\(([^)]*)\)\s*=>/g,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of paramPatterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line)) !== null) {
        const funcName = match[1] || 'anonymous';
        const paramsStr = match[2].trim();
        if (!paramsStr) continue;

        const params = paramsStr.split(',').map(p => p.trim()).filter(p => p.length > 0);
        const paramCount = params.length;

        if (paramCount > 4) {
          let severity: Severity;
          let description: string;
          let suggestion: string;

          if (paramCount > 7) {
            severity = 'critical';
            description = `函数 "${funcName}" 有 ${paramCount} 个参数，严重超过推荐的 4 个参数限制。过多参数会导致调用困难、容易传错、难以记忆。`;
            suggestion = `考虑使用参数对象模式：将相关参数封装为一个配置对象传入，或使用 TypeScript 接口定义参数类型，这样可以显著提升可读性和可维护性。`;
          } else {
            severity = 'medium';
            description = `函数 "${funcName}" 有 ${paramCount} 个参数，超过了推荐的 4 个参数限制。`;
            suggestion = `建议将参数合并为一个对象传入，或者检查是否有参数可以通过其他方式获取（如上下文、依赖注入等）。`;
          }

          const startColumn = match.index;
          const endColumn = match.index + match[0].length;

          badSmells.push({
            id: uuidv4(),
            type: 'too-many-parameters',
            name: '过多参数',
            severity,
            description,
            suggestion,
            position: { startLine: i + 1, endLine: i + 1, startColumn, endColumn },
            snippet: line.trim(),
          });
        }
      }
    }
  }

  return badSmells;
}

function detectDeepNesting(lines: string[]): BadSmell[] {
  const badSmells: BadSmell[] = [];
  const blockKeywords = /^\s*(if|for|while|switch|try|catch|else\s*if|else)\b/;
  let depth = 0;
  let maxDepth = 0;
  let deepestStart = -1;
  const depthStack: { line: number; keyword: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;

    const keywordMatch = line.match(blockKeywords);
    let bracesInLine = 0;
    for (const ch of line) {
      if (ch === '{') bracesInLine++;
      else if (ch === '}') bracesInLine--;
    }

    if (keywordMatch && bracesInLine > 0) {
      const keyword = keywordMatch[1];
      depthStack.push({ line: i, keyword });
      depth++;

      if (depth > maxDepth) {
        maxDepth = depth;
        deepestStart = i;
      }
    } else {
      depth += bracesInLine;
      while (bracesInLine < 0 && depthStack.length > 0) {
        depthStack.pop();
        bracesInLine++;
      }
    }

    if (maxDepth >= 4 && (depth < 4 || i === lines.length - 1)) {
      if (deepestStart >= 0 && maxDepth >= 4) {
        let severity: Severity;
        let description: string;
        let suggestion: string;

        const startLine = deepestStart + 1;
        const endLine = i + 1;

        if (maxDepth >= 6) {
          severity = 'critical';
          description = `检测到深度嵌套，最大嵌套深度达到 ${maxDepth} 层。过深的嵌套会严重影响代码的可读性和可测试性，容易引入逻辑错误。`;
          suggestion = `强烈建议重构：1) 使用提前返回(Guard Clauses)减少嵌套；2) 将内层逻辑提取为独立函数；3) 考虑使用策略模式或状态模式替代复杂的条件嵌套。`;
        } else {
          severity = 'medium';
          description = `检测到较深的嵌套，最大嵌套深度为 ${maxDepth} 层。多层嵌套会增加代码的认知负担。`;
          suggestion = `建议使用卫语句(Guard Clauses)提前返回，或者将嵌套逻辑提取为独立的函数来降低复杂度。`;
        }

        badSmells.push({
          id: uuidv4(),
          type: 'deep-nesting',
          name: '深层嵌套',
          severity,
          description,
          suggestion,
          position: { startLine, endLine },
          snippet: getSnippet(lines, startLine, Math.min(endLine, startLine + 20)),
        });
      }
      maxDepth = 0;
      deepestStart = -1;
    }
  }

  return badSmells;
}

function normalizeLine(line: string): string {
  return line
    .replace(/\/\/.*$/, '')
    .replace(/\s+/g, '')
    .trim();
}

function detectDuplicateCode(lines: string[]): BadSmell[] {
  const badSmells: BadSmell[] = [];
  const normalized: string[] = lines.map(normalizeLine);
  const seenBlocks = new Map<string, { startLine: number; count: number }>();
  const reportedRanges: { start: number; end: number }[] = [];

  const isRangeReported = (start: number, end: number): boolean => {
    return reportedRanges.some(r => !(end < r.start || start > r.end));
  };

  for (let i = 0; i <= normalized.length - WINDOW_SIZE; i++) {
    const block: string[] = [];
    let hasContent = false;
    for (let j = 0; j < WINDOW_SIZE; j++) {
      const nl = normalized[i + j];
      block.push(nl);
      if (nl.length > 0) hasContent = true;
    }
    if (!hasContent) continue;

    const blockKey = block.join('\n');

    if (seenBlocks.has(blockKey)) {
      const prev = seenBlocks.get(blockKey)!;
      const endLine = i + WINDOW_SIZE;

      if (!isRangeReported(prev.startLine, prev.startLine + WINDOW_SIZE) &&
          !isRangeReported(i, endLine)) {
        let extendedLength = WINDOW_SIZE;
        while (
          i + extendedLength < normalized.length &&
          prev.startLine + extendedLength < i &&
          normalized[i + extendedLength] === normalized[prev.startLine + extendedLength]
        ) {
          extendedLength++;
        }

        const dupLines = extendedLength;
        let severity: Severity;
        let description: string;
        let suggestion: string;

        if (dupLines >= 15) {
          severity = 'critical';
          description = `发现严重重复代码：第 ${prev.startLine + 1} 行和第 ${i + 1} 行附近有 ${dupLines} 行几乎完全相同的代码。大量重复会导致维护成本激增，修改时容易遗漏。`;
          suggestion = `立即将重复代码提取为公共函数或工具方法。如果是类之间的重复，考虑使用继承、组合或策略模式来消除重复。遵循 DRY（Don't Repeat Yourself）原则。`;
        } else if (dupLines >= 10) {
          severity = 'medium';
          description = `发现重复代码：第 ${prev.startLine + 1} 行和第 ${i + 1} 行附近有 ${dupLines} 行相似的代码。`;
          suggestion = `建议将重复逻辑提取为独立的函数，避免代码复制。这样如果逻辑需要修改，只需要修改一处即可。`;
        } else {
          severity = 'low';
          description = `发现潜在重复代码：第 ${prev.startLine + 1} 行和第 ${i + 1} 行附近有 ${dupLines} 行相似代码。`;
          suggestion = `可以考虑将这段代码提取为一个小函数，以提高代码复用性和可维护性。`;
        }

        badSmells.push({
          id: uuidv4(),
          type: 'duplicate-code',
          name: '重复代码',
          severity,
          description,
          suggestion,
          position: { startLine: i + 1, endLine: i + extendedLength },
          snippet: getSnippet(lines, i + 1, i + extendedLength),
        });

        reportedRanges.push({ start: prev.startLine, end: prev.startLine + extendedLength });
        reportedRanges.push({ start: i, end: i + extendedLength });
      }

      prev.count++;
      i += WINDOW_SIZE - 1;
    } else {
      seenBlocks.set(blockKey, { startLine: i, count: 1 });
    }
  }

  return badSmells;
}

export async function detectBadSmells(
  code: string,
  onProgress?: ProgressCallback
): Promise<BadSmell[]> {
  const lines = normalizeCode(code);
  const allBadSmells: BadSmell[] = [];

  await new Promise(resolve => setTimeout(resolve, 0));
  onProgress?.(10);

  const longFunctions = detectLongFunctions(lines);
  allBadSmells.push(...longFunctions);
  onProgress?.(25);

  await new Promise(resolve => setTimeout(resolve, 0));
  const tooManyParams = detectTooManyParameters(lines);
  allBadSmells.push(...tooManyParams);
  onProgress?.(50);

  await new Promise(resolve => setTimeout(resolve, 0));
  const deepNesting = detectDeepNesting(lines);
  allBadSmells.push(...deepNesting);
  onProgress?.(75);

  await new Promise(resolve => setTimeout(resolve, 0));
  const duplicateCode = detectDuplicateCode(lines);
  allBadSmells.push(...duplicateCode);
  onProgress?.(90);

  allBadSmells.sort((a, b) => {
    const severityOrder = { critical: 0, medium: 1, low: 2 };
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return a.position.startLine - b.position.startLine;
  });

  onProgress?.(100);
  return allBadSmells;
}
