import type { ValidateRequest, ValidateResponse, SubmitRequest, SubmitResponse } from '@/types';
import { mockCases } from '../data/cases';
import { mockLaws } from '../data/laws';

export const validateJudgement = (request: ValidateRequest): ValidateResponse => {
  const { judgementText, caseId, citedLaws } = request;
  const errors: string[] = [];
  const warnings: string[] = [];

  const lines = judgementText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length !== 4) {
    errors.push('判詞須為七言律詩格式，共四句');
  }

  lines.forEach((line, index) => {
    const cleanLine = line.replace(/[，。！？、；：]/g, '').trim();
    if (cleanLine.length !== 7) {
      errors.push(`第${index + 1}句字數不對，應為七字，現為${cleanLine.length}字`);
    }
  });

  const penaltyPatterns = [
    { pattern: /杖(?:六十|七十|八十|九十|一百)/g, name: '杖刑' },
    { pattern: /笞(?:二十|三十|四十|五十)/g, name: '笞刑' },
    { pattern: /徒(?:一年|一年半|二年|二年半|三年)/g, name: '徒刑' },
    { pattern: /流(?:二千里|二千五百里|三千里)/g, name: '流刑' },
    { pattern: /絞|斬|凌遲/g, name: '死刑' },
  ];

  const foundPenalties: string[] = [];
  penaltyPatterns.forEach(({ pattern, name }) => {
    const matches = judgementText.match(pattern);
    if (matches) {
      foundPenalties.push(...matches.map(m => `${name}:${m}`));
    }
  });

  const hasDeath = /絞|斬|凌遲/.test(judgementText);
  const hasCorporal = /杖|笞/.test(judgementText);
  const hasPrison = /徒/.test(judgementText);
  const hasExile = /流/.test(judgementText);

  if (hasDeath && (hasCorporal || hasPrison || hasExile)) {
    errors.push('量刑矛盾：死刑不應與其他刑罰併用');
  }

  if (hasExile && hasPrison) {
    warnings.push('注意：流刑通常重於徒刑，請確認是否適當');
  }

  if (citedLaws.length === 0) {
    warnings.push('未援引任何律例條文');
  }

  const caseData = mockCases.find(c => c.id === caseId);
  if (caseData) {
    if (caseData.caseType === 'homicide' && !hasDeath) {
      const hasHomicideLaw = citedLaws.some(lawId => {
        const law = mockLaws.find(l => l.id === lawId);
        return law && (law.keywords.includes('殺人') || law.keywords.includes('鬥毆'));
      });
      if (!hasHomicideLaw) {
        warnings.push('命案宜參考鬥毆殺人、故殺等相關律例');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

export const submitJudgement = (request: SubmitRequest): SubmitResponse => {
  const { caseId, citedLaws, selectedWitnesses, selectedEvidences } = request;
  const caseData = mockCases.find(c => c.id === caseId);
  
  if (!caseData) {
    return {
      success: false,
      score: 0,
      comment: '案件不存在',
      triggerAppeal: false,
      riskPercent: 0,
    };
  }

  let score = 50;
  let comment = '';

  const evidenceScore = (selectedWitnesses.length / Math.max(caseData.witnesses.length, 1)) * 20;
  score += evidenceScore;

  const evidenceSelectScore = (selectedEvidences.length / Math.max(caseData.evidences.length, 1)) * 15;
  score += evidenceSelectScore;

  if (citedLaws.length > 0) {
    score += 10;
    const relevantLaws = citedLaws.filter(lawId => {
      const law = mockLaws.find(l => l.id === lawId);
      if (!law) return false;
      if (caseData.caseType === 'homicide') {
        return law.keywords.some(k => ['殺人', '鬥毆', '故殺', '過失'].includes(k));
      } else if (caseData.caseType === 'land') {
        return law.keywords.some(k => ['田宅', '盜賣', '侵占', '典買'].includes(k));
      } else if (caseData.caseType === 'marriage') {
        return law.keywords.some(k => ['離異', '為婚', '子孫', '教令'].includes(k));
      }
      return false;
    });
    if (relevantLaws.length > 0) {
      score += 5;
    }
  }

  if (score >= 90) {
    comment = '明察秋毫';
  } else if (score >= 75) {
    comment = '判案公允';
  } else if (score >= 60) {
    comment = '尚可接受';
  } else {
    comment = '草菅人命';
  }

  const triggerAppeal = caseData.defendantInjured || caseData.testimonyConflict;
  const riskPercent = triggerAppeal ? 50 : 10;

  return {
    success: true,
    score: Math.min(100, Math.round(score)),
    comment,
    triggerAppeal,
    riskPercent,
  };
};
