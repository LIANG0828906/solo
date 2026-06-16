import { v4 as uuidv4 } from 'uuid';
import type { Issue, AnalysisResult, Thresholds, IssueType, Severity } from '../utils/db';

const SAMPLE_CODE = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.price > 0) {
      total += item.price * item.quantity;
    } else {
      total += 0;
    }
  }
  return total;
}

function calculateDiscount(price, discount) {
  let total = 0;
  for (let i = 0; i < price.length; i++) {
    const item = price[i];
    if (item > 0) {
      total += item * discount;
    } else {
      total += 0;
    }
  }
  return total;
}

function processUser(user) {
  let result = null;
  if (user.active) {
    if (user.age >= 18) {
      if (user.country === 'CN') {
        if (user.city === 'Beijing') {
          if (user.tier === 'gold') {
            result = 'Premium';
          } else if (user.tier === 'silver') {
            result = 'Standard';
          } else {
            result = 'Basic';
          }
        } else {
          result = 'Regional';
        }
      } else if (user.country === 'US') {
        if (user.state === 'CA') {
          result = 'West Coast';
        } else {
          result = 'Other';
        }
      } else {
        result = 'International';
      }
    } else {
      result = 'Minor';
    }
  } else {
    result = 'Inactive';
  }
  return result;
}

function generateReport(data) {
  const header = "=== Report ===";
  console.log(header);
  for (let i = 0; i < data.length; i++) {
    console.log(data[i].name + ": " + data[i].value);
  }
  const footer = "=== End ===";
  console.log(footer);
  console.log("Generated at: " + new Date());
  console.log("Total records: " + data.length);
  console.log("Report completed successfully");
  console.log("Sending notification...");
  console.log("Notification sent");
  console.log("Archiving report...");
  console.log("Report archived");
  console.log("Cleaning up...");
  console.log("Cleanup done");
  console.log("Final status: OK");
  console.log("Exiting function");
  return true;
}
`;

export function getSampleCode(): string {
  return SAMPLE_CODE;
}

interface TokenInfo {
  type: 'keyword' | 'operator' | 'punctuation' | 'identifier' | 'literal' | 'other';
  value: string;
}

function tokenizeLine(line: string): TokenInfo[] {
  const tokens: TokenInfo[] = [];
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
    return tokens;
  }

  let i = 0;
  while (i < trimmed.length) {
    const ch = trimmed[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/[a-zA-Z_$]/.test(ch)) {
      let ident = '';
      while (i < trimmed.length && /[a-zA-Z0-9_$]/.test(trimmed[i])) {
        ident += trimmed[i];
        i++;
      }
      const keywords = new Set([
        'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while',
        'switch', 'case', 'break', 'continue', 'new', 'typeof', 'instanceof',
        'try', 'catch', 'finally', 'throw', 'class', 'extends', 'import', 'export',
        'default', 'async', 'await', 'yield', 'from', 'of', 'in', 'do', 'delete',
        'void', 'this', 'super', 'static', 'get', 'set', 'true', 'false', 'null', 'undefined',
      ]);
      if (keywords.has(ident)) {
        tokens.push({ type: 'keyword', value: ident });
      } else {
        tokens.push({ type: 'identifier', value: 'ID' });
      }
      continue;
    }

    if (/\d/.test(ch)) {
      let num = '';
      while (i < trimmed.length && /[\d.eExX]/.test(trimmed[i])) {
        num += trimmed[i];
        i++;
      }
      tokens.push({ type: 'literal', value: 'NUM' });
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i++;
      while (i < trimmed.length && trimmed[i] !== quote) {
        if (trimmed[i] === '\\') i++;
        i++;
      }
      i++;
      tokens.push({ type: 'literal', value: 'STR' });
      continue;
    }

    const twoCharOps = ['===', '!==', '&&', '||', '=>', '++', '--', '+=', '-=', '*=', '/=', '==', '!=', '<=', '>='];
    let matched = false;
    for (const op of twoCharOps) {
      if (trimmed.substring(i, i + op.length) === op) {
        tokens.push({ type: 'operator', value: op });
        i += op.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    if ('+-*/%=<>!&|^~?'.includes(ch)) {
      tokens.push({ type: 'operator', value: ch });
      i++;
      continue;
    }

    if ('(){}[];:,.'.includes(ch)) {
      tokens.push({ type: 'punctuation', value: ch });
      i++;
      continue;
    }

    tokens.push({ type: 'other', value: ch });
    i++;
  }

  return tokens;
}

function getStructuralPattern(line: string): string {
  const tokens = tokenizeLine(line);
  if (tokens.length === 0) return '';
  return tokens.map(t => {
    switch (t.type) {
      case 'keyword': return `K:${t.value}`;
      case 'operator': return `O:${t.value}`;
      case 'punctuation': return `P:${t.value}`;
      case 'identifier': return 'ID';
      case 'literal': return 'LIT';
      default: return '?';
    }
  }).join(' ');
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

interface DuplicationGroup {
  positions: number[];
  pattern: string;
}

function findDuplications(code: string, minLines: number): Issue[] {
  const issues: Issue[] = [];
  const lines = code.split('\n');
  const nonEmptyLines: { index: number; pattern: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const pattern = getStructuralPattern(lines[i]);
    if (pattern) {
      nonEmptyLines.push({ index: i, pattern });
    }
  }

  if (nonEmptyLines.length < minLines) return issues;

  const patternHashes = new Map<string, DuplicationGroup>();

  for (let i = 0; i <= nonEmptyLines.length - minLines; i++) {
    const windowPatterns: string[] = [];
    for (let j = 0; j < minLines; j++) {
      windowPatterns.push(nonEmptyLines[i + j].pattern);
    }
    const combinedPattern = windowPatterns.join('\n');
    const hash = hashString(combinedPattern);

    if (patternHashes.has(hash)) {
      const group = patternHashes.get(hash)!;
      if (group.pattern === combinedPattern) {
        group.positions.push(i);
      }
    } else {
      patternHashes.set(hash, {
        positions: [i],
        pattern: combinedPattern,
      });
    }
  }

  const reportedRanges = new Set<string>();

  for (const [, group] of patternHashes) {
    if (group.positions.length < 2) continue;

    const uniquePositions: number[] = [];
    const seenCodeLines = new Set<string>();

    for (const pos of group.positions) {
      const codeLines = lines.slice(
        nonEmptyLines[pos].index,
        nonEmptyLines[Math.min(pos + minLines - 1, nonEmptyLines.length - 1)].index + 1
      ).join('\n');

      const normalizedCode = codeLines
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .join('\n');

      if (!seenCodeLines.has(normalizedCode)) {
        seenCodeLines.add(normalizedCode);
        uniquePositions.push(pos);
      }
    }

    if (uniquePositions.length < 2) continue;

    for (const pos of uniquePositions) {
      const startLineIndex = nonEmptyLines[pos].index;
      const endLineIndex = nonEmptyLines[Math.min(pos + minLines - 1, nonEmptyLines.length - 1)].index;

      const lineStart = startLineIndex + 1;
      const lineEnd = endLineIndex + 1;

      const rangeKey = `${lineStart}-${lineEnd}`;
      if (reportedRanges.has(rangeKey)) continue;
      reportedRanges.add(rangeKey);

      const severity: Severity = uniquePositions.length >= 3 ? 'high' : 'medium';

      issues.push({
        id: uuidv4(),
        type: 'duplication',
        severity,
        lineStart,
        lineEnd,
        message: `第 ${lineStart}-${lineEnd} 行存在结构重复代码，共 ${uniquePositions.length} 处语义相似的重复`,
        suggestion: '将重复代码提取为公共函数或工具方法，通过参数化差异来减少维护成本',
      });
    }
  }

  return issues;
}

interface FunctionRange {
  name: string;
  startLine: number;
  endLine: number;
  content: string;
}

function findFunctions(code: string): FunctionRange[] {
  const functions: FunctionRange[] = [];
  const lines = code.split('\n');

  const functionPatterns = [
    /^(\s*)(async\s+)?function\s+(\w+)\s*\(/,
    /^(\s*)function\s+(\w+)\s*\(/,
    /^(\s*)(const|let|var)\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>/,
  ];

  for (let i = 0; i < lines.length; i++) {
    let match: RegExpMatchArray | null = null;
    let funcName = '';

    for (const pattern of functionPatterns) {
      match = lines[i].match(pattern);
      if (match) {
        const groups = match.filter(g => g !== undefined);
        funcName = groups[groups.length - 1] || 'anonymous';
        break;
      }
    }

    if (match) {
      let braceCount = 0;
      let startLine = i;
      let foundOpen = false;

      for (let j = i; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') {
            braceCount++;
            foundOpen = true;
          } else if (ch === '}') {
            braceCount--;
          }
        }

        if (foundOpen && braceCount === 0) {
          const funcContent = lines.slice(startLine, j + 1).join('\n');
          functions.push({
            name: funcName,
            startLine: startLine + 1,
            endLine: j + 1,
            content: funcContent,
          });
          i = j;
          break;
        }
      }
    }
  }

  return functions;
}

function calculateComplexity(funcContent: string): number {
  let complexity = 1;

  const lines = funcContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

    const ifMatches = trimmed.match(/\bif\s*\(/g);
    if (ifMatches) complexity += ifMatches.length;

    const elseIfMatches = trimmed.match(/\belse\s+if\s*\(/g);
    if (elseIfMatches) complexity += elseIfMatches.length;

    const forMatches = trimmed.match(/\bfor\s*\(/g);
    if (forMatches) complexity += forMatches.length;

    const whileMatches = trimmed.match(/\bwhile\s*\(/g);
    if (whileMatches) complexity += whileMatches.length;

    const caseMatches = trimmed.match(/\bcase\s+[^:]+:/g);
    if (caseMatches) complexity += caseMatches.length;

    const catchMatches = trimmed.match(/\bcatch\s*\(/g);
    if (catchMatches) complexity += catchMatches.length;

    const andMatches = trimmed.match(/&&/g);
    if (andMatches) complexity += andMatches.length;

    const orMatches = trimmed.match(/\|\|/g);
    if (orMatches) complexity += orMatches.length;

    const ternaryMatches = trimmed.match(/\?[^.?]*:/g);
    if (ternaryMatches) complexity += ternaryMatches.length;
  }

  return complexity;
}

function findComplexFunctions(code: string, threshold: number): Issue[] {
  const issues: Issue[] = [];
  const functions = findFunctions(code);

  for (const func of functions) {
    const complexity = calculateComplexity(func.content);

    if (complexity > threshold) {
      const severity: Severity = complexity > threshold * 1.5 ? 'high' : 'medium';

      issues.push({
        id: uuidv4(),
        type: 'complexity',
        severity,
        lineStart: func.startLine,
        lineEnd: func.endLine,
        message: `函数 "${func.name}" 圈复杂度为 ${complexity}，超过阈值 ${threshold}`,
        suggestion: '拆分函数，将复杂的条件逻辑提取为独立函数，使用策略模式或状态模式替代多层条件判断',
        functionName: func.name,
        complexity,
      });
    }
  }

  return issues;
}

function findLongFunctions(code: string, maxLines: number): Issue[] {
  const issues: Issue[] = [];
  const functions = findFunctions(code);

  for (const func of functions) {
    const lineCount = func.endLine - func.startLine + 1;

    if (lineCount > maxLines) {
      const severity: Severity = lineCount > maxLines * 1.5 ? 'high' : 'low';

      issues.push({
        id: uuidv4(),
        type: 'long-function',
        severity,
        lineStart: func.startLine,
        lineEnd: func.endLine,
        message: `函数 "${func.name}" 共 ${lineCount} 行，超过最大阈值 ${maxLines} 行`,
        suggestion: '将长函数拆分为多个职责单一的小函数，每个函数只做一件事',
        functionName: func.name,
      });
    }
  }

  return issues;
}

export function analyze(code: string, thresholds: Thresholds): AnalysisResult {
  if (!code.trim()) {
    return {
      issues: [],
      stats: { total: 0, duplication: 0, complexity: 0, longFunction: 0 },
      timestamp: Date.now(),
    };
  }

  const duplicationIssues = findDuplications(code, thresholds.duplicationLines);
  const complexityIssues = findComplexFunctions(code, thresholds.complexity);
  const longFunctionIssues = findLongFunctions(code, thresholds.maxFunctionLines);

  const issues = [...duplicationIssues, ...complexityIssues, ...longFunctionIssues];

  return {
    issues,
    stats: {
      total: issues.length,
      duplication: duplicationIssues.length,
      complexity: complexityIssues.length,
      longFunction: longFunctionIssues.length,
    },
    timestamp: Date.now(),
  };
}

export function generateMarkdownReport(
  result: AnalysisResult,
  filename: string,
  thresholds: Thresholds
): string {
  const severityCount: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  result.issues.forEach(issue => {
    severityCount[issue.severity]++;
  });

  const typeLabels: Record<IssueType, string> = {
    'duplication': '重复代码',
    'complexity': '高复杂度',
    'long-function': '过长函数',
  };

  const severityLabels: Record<Severity, string> = {
    'high': '🔴 严重',
    'medium': '🟡 中等',
    'low': '🔵 轻微',
  };

  let report = `# 代码审查报告\n\n`;
  report += `- **文件名**: ${filename}\n`;
  report += `- **审查时间**: ${new Date(result.timestamp).toLocaleString()}\n`;
  report += `- **配置阈值**: 重复代码${thresholds.duplicationLines}行 / 复杂度${thresholds.complexity} / 函数${thresholds.maxFunctionLines}行\n\n`;

  report += `## 问题摘要\n\n`;
  report += `| 指标 | 数量 |\n`;
  report += `|------|------|\n`;
  report += `| 问题总数 | **${result.stats.total}** |\n`;
  report += `| 🔴 严重 | ${severityCount.high} |\n`;
  report += `| 🟡 中等 | ${severityCount.medium} |\n`;
  report += `| 🔵 轻微 | ${severityCount.low} |\n`;
  report += `| 🔴 重复代码 | ${result.stats.duplication} |\n`;
  report += `| 🟡 高复杂度 | ${result.stats.complexity} |\n`;
  report += `| 🔵 过长函数 | ${result.stats.longFunction} |\n\n`;

  report += `## 问题详情\n\n`;

  if (result.issues.length === 0) {
    report += `✅ 代码质量良好，未发现问题！\n`;
  } else {
    report += `| 序号 | 类型 | 严重程度 | 位置 | 描述 | 修复建议 |\n`;
    report += `|------|------|----------|------|------|----------|\n`;

    result.issues.forEach((issue, index) => {
      report += `| ${index + 1} | ${typeLabels[issue.type]} | ${severityLabels[issue.severity]} | ${filename}:${issue.lineStart} | ${issue.message} | ${issue.suggestion} |\n`;
    });
  }

  report += `\n---\n`;
  report += `*报告由代码审查助手自动生成*`;

  return report;
}
