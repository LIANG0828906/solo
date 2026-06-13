import { Rule, ScoreResult } from './types';

function extractMatches(text: string, regex: RegExp, contextLen: number = 20): string[] {
  const matches: string[] = [];
  let match;
  const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  
  while ((match = globalRegex.exec(text)) !== null && matches.length < 3) {
    const start = Math.max(0, match.index - contextLen);
    const end = Math.min(text.length, match.index + match[0].length + contextLen);
    const context = text.slice(start, end);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';
    matches.push(prefix + context + suffix);
  }
  
  return matches;
}

function matchKeyword(text: string, pattern: string): { hit: boolean; matches: string[] } {
  if (!pattern) return { hit: false, matches: [] };
  const regex = new RegExp(pattern, 'i');
  const matches = extractMatches(text, regex, 20);
  return { hit: matches.length > 0, matches };
}

function matchFormat(text: string, ruleName: string, pattern: string): { hit: boolean; matches: string[] } {
  const matches: string[] = [];
  
  switch (ruleName) {
    case '字数超过500': {
      const charCount = text.replace(/\s/g, '').length;
      const hit = charCount > 500;
      if (hit) {
        matches.push(`报告字数：${charCount}字，已超过500字要求`);
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
        matches.push(`检测到${paragraphs.length}个段落，结构较为完整`);
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

function matchFormula(text: string, pattern: string): { hit: boolean; matches: string[] } {
  if (!pattern) return { hit: false, matches: [] };
  const regex = new RegExp(pattern, 'i');
  const matches = extractMatches(text, regex, 25);
  return { hit: matches.length > 0, matches };
}

export function scoreText(text: string, rules: Rule[]): ScoreResult[] {
  const results: ScoreResult[] = [];
  const cleanedText = text.trim();
  
  for (const rule of rules) {
    let hit = false;
    let matches: string[] = [];
    
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
      hit,
      matches,
      score: hit ? rule.weight : 0,
      maxScore: rule.weight,
      suggestion: hit ? '符合要求' : rule.suggestion
    });
  }
  
  return results;
}
