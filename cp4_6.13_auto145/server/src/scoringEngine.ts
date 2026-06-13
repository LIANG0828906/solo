import { Rule, ScoreResult } from './types';

function extractMatches(text: string, regex: RegExp, contextLen: number = 20): { text: string; index: number }[] {
  const matches: { text: string; index: number }[] = [];
  let match;
  const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  
  while ((match = globalRegex.exec(text)) !== null && matches.length < 3) {
    const start = Math.max(0, match.index - contextLen);
    const end = Math.min(text.length, match.index + match[0].length + contextLen);
    const context = text.slice(start, end);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';
    matches.push({ text: prefix + context + suffix, index: match.index });
  }
  
  return matches;
}

function matchKeyword(text: string, pattern: string): { hit: boolean; matches: { text: string; index: number }[] } {
  if (!pattern) return { hit: false, matches: [] };
  const regex = new RegExp(pattern, 'i');
  const matches = extractMatches(text, regex, 20);
  return { hit: matches.length > 0, matches };
}

function matchFormat(text: string, ruleName: string, pattern: string): { hit: boolean; matches: { text: string; index: number }[] } {
  const matches: { text: string; index: number }[] = [];
  
  switch (ruleName) {
    case '字数超过500': {
      const charCount = text.replace(/\s/g, '').length;
      const hit = charCount > 500;
      if (hit) {
        matches.push({ text: `报告字数：${charCount}字，已超过500字要求`, index: 0 });
      }
      return { hit, matches };
    }
    case '数据表格存在': {
      if (!pattern) return { hit: false, matches: [] };
      const regex = new RegExp(pattern, 'i');
      const found = extractMatches(text, regex, 20);
      return { hit: found.length > 0, matches: found };
    }
    case '包含图表': {
      if (!pattern) return { hit: false, matches: [] };
      const regex = new RegExp(pattern, 'i');
      const found = extractMatches(text, regex, 20);
      return { hit: found.length > 0, matches: found };
    }
    case '引用了至少2篇文献': {
      if (!pattern) return { hit: false, matches: [] };
      const regex = new RegExp(pattern, 'gi');
      const found = extractMatches(text, regex, 15);
      const hit = found.length >= 2;
      return { hit, matches: found.slice(0, 3) };
    }
    default: {
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      if (paragraphs.length > 3) {
        matches.push({ text: `检测到${paragraphs.length}个段落，结构较为完整`, index: 0 });
        return { hit: true, matches };
      }
      if (pattern) {
        const regex = new RegExp(pattern, 'i');
        const found = extractMatches(text, regex, 20);
        if (found.length > 0) {
          return { hit: true, matches: found };
        }
      }
      return { hit: false, matches: [] };
    }
  }
}

function isValidIdentifier(str: string): boolean {
  const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return identifierRegex.test(str.trim());
}

function isValidNumber(str: string): boolean {
  const num = parseFloat(str.trim());
  return !isNaN(num);
}

function isValidExpressionPart(str: string): boolean {
  if (!str || str.trim() === '') return false;
  
  const trimmed = str.trim();
  
  if (isValidIdentifier(trimmed)) return true;
  if (isValidNumber(trimmed)) return true;
  
  const complexPatterns = [
    /^[a-zA-Z_][a-zA-Z0-9_]*\s*(\+\s*[a-zA-Z0-9_]+\s*)*$/,
    /^[a-zA-Z_][a-zA-Z0-9_]*\s*\-\s*[a-zA-Z0-9_]+\s*$/,
    /^[a-zA-Z_][a-zA-Z0-9_]*\s*\*\s*[a-zA-Z0-9_]+\s*$/,
    /^[a-zA-Z_][a-zA-Z0-9_]*\s*\/\s*[a-zA-Z0-9_]+\s*$/,
    /^\(\s*[a-zA-Z0-9_+\-*/\s]+\s*\)$/,
    /^(\d+\.?\d*\s*[+\-*/]\s*)*\d+\.?\d*$/,
    /^[a-zA-Z_][a-zA-Z0-9_]*\s*(\*\s*[a-zA-Z0-9_]+(\s*\+\s*[a-zA-Z0-9_]+)*\s*)*$/,
  ];
  
  return complexPatterns.some(pattern => pattern.test(trimmed));
}

function matchFormula(text: string, pattern: string): { hit: boolean; matches: { text: string; index: number }[] } {
  const matches: { text: string; index: number }[] = [];
  
  const formulaPatterns = [
    /[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*\s*[+\-*/]\s*[a-zA-Z0-9_]+\s*)+[a-zA-Z0-9_]+/,
    /[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\/\s*[a-zA-Z0-9_]+/,
    /mean\s*[=:]\s*sum\s*\/\s*n/i,
    /average\s*[=:]\s*sum\s*\/\s*count/i,
    /[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*sum\s*\(\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\)\s*\/\s*\d+/i,
    /[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*(\d+\.?\d*\s*[+\-*/]\s*)+\d+\.?\d*/,
    /[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*\(\s*[a-zA-Z0-9_+\-*/\s]+\s*\)\s*\/\s*[a-zA-Z0-9_]+/,
  ];

  for (const formulaRegex of formulaPatterns) {
    const found = extractMatches(text, formulaRegex, 25);
    for (const match of found) {
      if (!matches.some(m => m.text === match.text)) {
        matches.push(match);
      }
    }
  }

  if (pattern) {
    try {
      const customRegex = new RegExp(pattern, 'gi');
      const customMatches = extractMatches(text, customRegex, 25);
      for (const match of customMatches) {
        if (!matches.some(m => m.text === match.text)) {
          matches.push(match);
        }
      }
    } catch {
    }
  }

  const filteredMatches = matches.filter(match => {
    const parts = match.text.split(/[=:]/);
    if (parts.length !== 2) return false;
    
    const leftPart = parts[0].replace(/[.\s]/g, '');
    const rightPart = parts[1].replace(/[.\s]/g, '');
    
    if (!leftPart || !rightPart) return false;
    
    if (!isValidIdentifier(leftPart) && !isValidNumber(leftPart)) {
      return false;
    }
    
    const rightHasOperator = /[+\-*/]/.test(rightPart);
    const rightHasAlpha = /[a-zA-Z]/.test(rightPart);
    const rightHasNumber = /[0-9]/.test(rightPart);
    
    return rightHasOperator && (rightHasAlpha || rightHasNumber);
  });

  return { hit: filteredMatches.length > 0, matches: filteredMatches.slice(0, 3) };
}

export function scoreText(text: string, rules: Rule[]): ScoreResult[] {
  const results: ScoreResult[] = [];
  const cleanedText = text.trim();
  
  for (const rule of rules) {
    let hit = false;
    let matches: { text: string; index: number }[] = [];
    
    switch (rule.type) {
      case 'keyword':
        ({ hit, matches } = matchKeyword(cleanedText, rule.pattern));
        break;
      case 'format':
        ({ hit, matches } = matchFormat(cleanedText, rule.name, rule.pattern));
        break;
      case 'formula':
        ({ hit, matches } = matchFormula(cleanedText, rule.pattern));
        break;
    }
    
    results.push({
      ruleId: rule.id,
      ruleName: rule.name,
      passed: hit,
      matchedTexts: matches.map(m => m.text),
      score: hit ? rule.weight : 0,
      maxScore: rule.weight,
      suggestion: hit ? '符合要求' : rule.suggestion
    });
  }
  
  return results;
}
