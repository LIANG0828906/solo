import type { LintIssue } from '../types';

export function lintJavaScript(code: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }

    if (trimmed.startsWith('if ') || trimmed.startsWith('if(') ||
        trimmed.startsWith('for ') || trimmed.startsWith('for(') ||
        trimmed.startsWith('while ') || trimmed.startsWith('while(') ||
        trimmed.startsWith('switch ') || trimmed.startsWith('switch(')) {
      const parenMatch = trimmed.match(/^[a-z]+\s*\(/i);
      if (!parenMatch) {
        issues.push({
          line: lineNum,
          column: 1,
          severity: 'warning',
          message: '控制语句后应使用括号',
          rule: 'no-control-regex',
        });
      }
    }

    const isBlockEnd = /^(}|}\s*;?|};?)$/.test(trimmed);
    const isControlStart = /^(if|for|while|switch|else|try|catch|finally)\b/.test(trimmed);
    const isFuncDecl = /^function\s+/.test(trimmed);
    const isVarDecl = /^(const|let|var)\s+/.test(trimmed) && trimmed.includes('=') &&
                      !/[,;]\s*$/.test(trimmed.slice(-1));
    const isReturn = /^return\b/.test(trimmed);
    const isExpr = /[+\-*/%=<>!&|^]/.test(trimmed);

    if (!isBlockEnd && !isControlStart && !isFuncDecl && !isReturn &&
        !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') &&
        !trimmed.endsWith(',') && trimmed.length > 0 &&
        !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*')) {
      const isMultiLineVar = /^(const|let|var)\s+\w+\s*=/.test(trimmed) && !trimmed.includes(';');
      const isClassProp = /^\s*\w+\s*[:=]/.test(line) && !trimmed.endsWith(';');
      if (!isMultiLineVar && !isClassProp && isExpr) {
        issues.push({
          line: lineNum,
          column: trimmed.length + 1,
          severity: 'warning',
          message: '语句末尾缺少分号',
          rule: 'semi',
        });
      }
    }

    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    const openBrackets = (line.match(/\[/g) || []).length;
    const closeBrackets = (line.match(/\]/g) || []).length;

    if (openBraces !== closeBraces && Math.abs(openBraces - closeBraces) > 1) {
      issues.push({
        line: lineNum,
        column: 1,
        severity: 'warning',
        message: '括号数量不匹配，请检查大括号使用',
        rule: 'brace-style',
      });
    }

    if (openParens !== closeParens && Math.abs(openParens - closeParens) > 1) {
      issues.push({
        line: lineNum,
        column: 1,
        severity: 'warning',
        message: '括号数量不匹配，请检查圆括号使用',
        rule: 'no-extra-parens',
      });
    }

    if (openBrackets !== closeBrackets && Math.abs(openBrackets - closeBrackets) > 1) {
      issues.push({
        line: lineNum,
        column: 1,
        severity: 'warning',
        message: '括号数量不匹配，请检查方括号使用',
        rule: 'array-bracket-spacing',
      });
    }

    if (/\bvar\s+/.test(trimmed)) {
      issues.push({
        line: lineNum,
        column: trimmed.indexOf('var') + 1,
        severity: 'warning',
        message: '建议使用 const 或 let 替代 var',
        rule: 'no-var',
      });
    }

    if (/==[^=]/.test(trimmed) || /!=[^=]/.test(trimmed)) {
      issues.push({
        line: lineNum,
        column: 1,
        severity: 'warning',
        message: '建议使用 === 或 !== 进行严格相等比较',
        rule: 'eqeqeq',
      });
    }

    if (line.length > 120) {
      issues.push({
        line: lineNum,
        column: 121,
        severity: 'warning',
        message: '行长度超过 120 字符',
        rule: 'max-len',
      });
    }

    const indentMatch = line.match(/^(\s*)/);
    if (indentMatch && indentMatch[1].includes('\t') && indentMatch[1].includes(' ')) {
      issues.push({
        line: lineNum,
        column: 1,
        severity: 'warning',
        message: '缩进混合了制表符和空格，请保持一致',
        rule: 'no-mixed-spaces-and-tabs',
      });
    }

    if (/console\.(log|debug|info|warn|error)/.test(trimmed)) {
      issues.push({
        line: lineNum,
        column: trimmed.indexOf('console.') + 1,
        severity: 'warning',
        message: '生产代码中应移除 console 输出',
        rule: 'no-console',
      });
    }

    if (/function\s+\w+/.test(trimmed) && trimmed.includes('{') && !trimmed.includes('}')) {
      const bracePos = trimmed.indexOf('{');
      const beforeBrace = trimmed.slice(0, bracePos).trim();
      if (beforeBrace.charAt(beforeBrace.length - 1) !== ')') {
        issues.push({
          line: lineNum,
          column: bracePos + 1,
          severity: 'warning',
          message: '建议使用 Stroustrup 风格的大括号（与语句同行）',
          rule: 'brace-style',
        });
      }
    }
  });

  return issues;
}

export function lintPython(code: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const indentMatch = line.match(/^(\s*)/);
    if (indentMatch && indentMatch[1].includes('\t') && indentMatch[1].includes(' ')) {
      issues.push({
        line: lineNum,
        column: 1,
        severity: 'warning',
        message: '缩进混合了制表符和空格，请保持一致',
        rule: 'W191',
      });
    }

    if (indentMatch && indentMatch[1].length % 4 !== 0 && indentMatch[1].length > 0) {
      issues.push({
        line: lineNum,
        column: 1,
        severity: 'warning',
        message: '缩进应使用 4 个空格',
        rule: 'E111',
      });
    }

    if (line.length > 120) {
      issues.push({
        line: lineNum,
        column: 121,
        severity: 'warning',
        message: '行长度超过 120 字符',
        rule: 'E501',
      });
    }

    if (/def\s+[A-Z]/.test(trimmed)) {
      const match = trimmed.match(/def\s+([A-Z]\w*)/);
      if (match) {
        issues.push({
          line: lineNum,
          column: trimmed.indexOf(match[1]) + 1,
          severity: 'warning',
          message: '函数名应使用 snake_case 命名风格',
          rule: 'PEP8 N802',
        });
      }
    }

    if (/class\s+[a-z]/.test(trimmed)) {
      const match = trimmed.match(/class\s+([a-z]\w*)/);
      if (match) {
        issues.push({
          line: lineNum,
          column: trimmed.indexOf(match[1]) + 1,
          severity: 'warning',
          message: '类名应使用 PascalCase 命名风格',
          rule: 'PEP8 N801',
        });
      }
    }

    if (trimmed.endsWith(';')) {
      issues.push({
        line: lineNum,
        column: trimmed.length,
        severity: 'warning',
        message: 'Python 代码行尾不应有分号',
        rule: 'E703',
      });
    }

    if (/\s+$/.test(line)) {
      issues.push({
        line: lineNum,
        column: line.length,
        severity: 'warning',
        message: '行尾有多余空格',
        rule: 'W291',
      });
    }
  });

  return issues;
}

export function lintJava(code: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }

    if (/class\s+[a-z]/.test(trimmed)) {
      const match = trimmed.match(/class\s+([a-z]\w*)/);
      if (match) {
        issues.push({
          line: lineNum,
          column: trimmed.indexOf(match[1]) + 1,
          severity: 'warning',
          message: '类名应使用 PascalCase 命名风格',
          rule: 'ClassName',
        });
      }
    }

    if (/public\s+(static\s+)?(final\s+)?(int|String|boolean|double|float|long|void)\s+[A-Z]/.test(trimmed) ||
        /private\s+(static\s+)?(final\s+)?(int|String|boolean|double|float|long|void)\s+[A-Z]/.test(trimmed) ||
        /protected\s+(static\s+)?(final\s+)?(int|String|boolean|double|float|long|void)\s+[A-Z]/.test(trimmed)) {
      const match = trimmed.match(/\s+([A-Z]\w*)\s*\(/);
      if (match) {
        issues.push({
          line: lineNum,
          column: trimmed.indexOf(match[1]) + 1,
          severity: 'warning',
          message: '方法名应使用 camelCase 命名风格',
          rule: 'MethodName',
        });
      }
    }

    if (line.length > 120) {
      issues.push({
        line: lineNum,
        column: 121,
        severity: 'warning',
        message: '行长度超过 120 字符',
        rule: 'LineLength',
      });
    }

    const indentMatch = line.match(/^(\s*)/);
    if (indentMatch && indentMatch[1].includes('\t') && indentMatch[1].includes(' ')) {
      issues.push({
        line: lineNum,
        column: 1,
        severity: 'warning',
        message: '缩进混合了制表符和空格，请保持一致',
        rule: 'Indentation',
      });
    }
  });

  return issues;
}

export function lintCode(code: string, language: string): LintIssue[] {
  switch (language) {
    case 'javascript':
      return lintJavaScript(code);
    case 'python':
      return lintPython(code);
    case 'java':
      return lintJava(code);
    default:
      return [];
  }
}
