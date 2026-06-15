export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateJudgementFormat = (text: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length !== 4) {
    errors.push(`判詞須為七言律詩格式，共四句，現為${lines.length}句`);
  }

  lines.forEach((line, index) => {
    const cleanLine = line.replace(/[，。！？、；：\s]/g, '');
    if (cleanLine.length !== 7 && cleanLine.length > 0) {
      errors.push(`第${index + 1}句「${line.trim()}」字數不對，應為七字，現為${cleanLine.length}字`);
    }
  });

  const penaltyCombinations: Array<[RegExp, RegExp, string]> = [
    [/斬|絞|凌遲/, /杖|笞|徒|流/, '死刑不應與其他刑罰併用'],
    [/流三千里/, /徒/, '流三千里已達流刑極刑，不應再科徒刑'],
  ];

  penaltyCombinations.forEach(([p1, p2, message]) => {
    if (p1.test(text) && p2.test(text)) {
      errors.push(`量刑矛盾：${message}`);
    }
  });

  const validPenalties = [
    '笞二十', '笞三十', '笞四十', '笞五十',
    '杖六十', '杖七十', '杖八十', '杖九十', '杖一百',
    '徒一年', '徒一年半', '徒二年', '徒二年半', '徒三年',
    '流二千里', '流二千五百里', '流三千里',
    '絞', '斬', '凌遲',
  ];

  const penaltyRegex = /(笞|杖|徒|流|絞|斬|凌遲)[一二三四五六七八九十千五年半里]*\s*/g;
  const matches = text.match(penaltyRegex) || [];
  
  matches.forEach(match => {
    const cleanMatch = match.trim();
    if (!validPenalties.some(p => cleanMatch.includes(p))) {
      warnings.push(`刑罰「${cleanMatch}」可能不符合清律規範`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

export const extractSentence = (text: string): string => {
  const penaltyRegex = /(?:笞|杖|徒|流|絞|斬|凌遲)[一二三四五六七八九十千五年半里]*(?:[^，。！？、；：\s]*)?/g;
  const matches = text.match(penaltyRegex);
  return matches ? matches.join('、') : '';
};

export const highlightLawText = (content: string, keyword: string): string => {
  if (!keyword) return content;
  const regex = new RegExp(`(${keyword})`, 'gi');
  return content.replace(regex, '<mark class="law-highlight">$1</mark>');
};
