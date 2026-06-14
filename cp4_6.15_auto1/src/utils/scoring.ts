import type { Question, ScoringResult } from '@/types';

const KEYWORD_WEIGHT = 0.5;
const LENGTH_WEIGHT = 0.2;
const SEMANTIC_WEIGHT = 0.3;
const EDIT_DISTANCE_MAX_LEN = 2000;
const NGRAM_SAMPLE_MAX_LEN = 5000;

const SYNONYMS: Record<string, string[]> = {
  '提高': ['提升', '增加', '增强', '改善', '优化'],
  '提升': ['提高', '增加', '增强', '改善', '优化'],
  '增加': ['提高', '提升', '增长', '扩大', '增多'],
  '减少': ['降低', '下降', '削减', '减小', '缩小'],
  '降低': ['减少', '下降', '削减', '减小', '缩小'],
  '重要': ['关键', '核心', '主要', '首要', '重点'],
  '关键': ['重要', '核心', '主要', '首要', '重点'],
  '有效': ['高效', '成功', '可行', '有效率', '有效果'],
  '方法': ['方式', '手段', '途径', '办法', '策略'],
  '方式': ['方法', '手段', '途径', '办法', '形式'],
  '问题': ['难题', '困难', '挑战', '议题', '矛盾'],
  '解决': ['处理', '化解', '应对', '攻克', '破解'],
  '分析': ['研究', '探究', '剖析', '解析', '探讨'],
  '学习': ['掌握', '理解', '把握', '学会', '习得'],
  '理解': ['明白', '懂得', '领会', '领悟', '掌握'],
  '发展': ['进步', '前进', '成长', '推进', '壮大'],
  '影响': ['作用', '效果', '效应', '后果', '意义'],
  '原因': ['因素', '缘由', '缘故', '起因', '来源'],
  '结果': ['效果', '结论', '成果', '结局', '产物'],
  '过程': ['流程', '进程', '步骤', '阶段', '环节'],
  '系统': ['体系', '制度', '体制', '机制', '架构'],
  '技术': ['技能', '技巧', '工艺', '科技', '工程'],
  '能力': ['实力', '水平', '本领', '才能', '潜力'],
  '效率': ['效益', '效果', '效能', '产出率', '工作效率'],
  '质量': ['品质', '水准', '成色', '品位', '等级'],
  '创新': ['创造', '革新', '突破', '新颖', '首创'],
};

function getSynonyms(word: string): string[] {
  return SYNONYMS[word] || [];
}

function tokenizeFast(text: string): string[] {
  const result: string[] = [];
  const len = text.length;
  let i = 0;
  while (i < len) {
    const c = text.charCodeAt(i);
    if (c >= 0x4e00 && c <= 0x9fff) {
      if (i + 1 < len && text.charCodeAt(i + 1) >= 0x4e00 && text.charCodeAt(i + 1) <= 0x9fff) {
        result.push(text.slice(i, i + 2).toLowerCase());
        i += 2;
      } else {
        result.push(text[i].toLowerCase());
        i += 1;
      }
    } else if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) {
      let j = i + 1;
      while (j < len) {
        const cc = text.charCodeAt(j);
        if ((cc >= 65 && cc <= 90) || (cc >= 97 && cc <= 122)) {
          j++;
        } else {
          break;
        }
      }
      result.push(text.slice(i, j).toLowerCase());
      i = j;
    } else {
      i += 1;
    }
  }
  return result;
}

function ngramTokensFast(tokens: string[], n: number, maxTokens = 500): string[] {
  const len = Math.min(tokens.length, maxTokens);
  const result: string[] = [];
  for (let i = 0; i <= len - n; i++) {
    let gram = '';
    for (let j = 0; j < n; j++) {
      gram += tokens[i + j];
    }
    result.push(gram);
  }
  return result;
}

function levenshteinDistanceFast(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  if (Math.abs(m - n) > Math.max(m, n) * 0.3) {
    return Math.max(m, n);
  }

  let prev = new Uint16Array(n + 1);
  let curr = new Uint16Array(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const aChar = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

function computeCosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  const smaller = vecA.size <= vecB.size ? vecA : vecB;
  const larger = vecA.size > vecB.size ? vecA : vecB;

  for (const [key, valA] of smaller) {
    const valB = larger.get(key) || 0;
    if (valB > 0) {
      dotProduct += valA * valB;
    }
  }

  for (const v of vecA.values()) magA += v * v;
  for (const v of vecB.values()) magB += v * v;

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

function buildFrequencyVector(tokens: string[], useSynonyms = false): Map<string, number> {
  const freq = new Map<string, number>();
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    freq.set(token, (freq.get(token) || 0) + 1);
    if (useSynonyms) {
      const syns = getSynonyms(token);
      for (let j = 0; j < syns.length; j++) {
        freq.set(syns[j], (freq.get(syns[j]) || 0) + 0.5);
      }
    }
  }
  return freq;
}

function sampleText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const third = Math.floor(maxLen / 3);
  return text.slice(0, third) + text.slice(Math.floor(text.length / 2) - Math.floor(third / 2), Math.floor(text.length / 2) + Math.ceil(third / 2)) + text.slice(-third);
}

function computeKeywordScore(question: Question, studentAnswer: string): number {
  if (question.keywords.length === 0) return 0;
  const lowerAnswer = studentAnswer.toLowerCase();
  let earned = 0;
  let totalPossible = 0;
  const kws = question.keywords;
  for (let i = 0; i < kws.length; i++) {
    const kw = kws[i];
    totalPossible += kw.scorePoint;
    const kwLower = kw.word.toLowerCase();
    let found = lowerAnswer.includes(kwLower);
    if (!found) {
      const syns = getSynonyms(kwLower);
      for (let j = 0; j < syns.length; j++) {
        if (lowerAnswer.includes(syns[j])) {
          found = true;
          break;
        }
      }
    }
    if (found) earned += kw.scorePoint;
  }
  if (totalPossible === 0) return 0;
  return earned / totalPossible;
}

function computeLengthScore(referenceAnswer: string, studentAnswer: string): number {
  const refLen = referenceAnswer.trim().length;
  const ansLen = studentAnswer.trim().length;
  if (refLen === 0) return 0;
  const ratio = ansLen / refLen;
  if (ratio <= 1) return ratio;
  if (ratio <= 1.5) return 1;
  return Math.max(0.7, 1 - (ratio - 1.5) * 0.3);
}

function computeSemanticScore(referenceAnswer: string, studentAnswer: string): number {
  const refText = referenceAnswer.trim();
  const ansText = studentAnswer.trim();
  if (refText.length === 0 || ansText.length === 0) return 0;

  const refTokens = tokenizeFast(refText);
  const ansTokens = tokenizeFast(ansText);
  if (refTokens.length === 0 || ansTokens.length === 0) return 0;

  const unigramCosine = computeCosineSimilarity(
    buildFrequencyVector(refTokens, true),
    buildFrequencyVector(ansTokens, true)
  );

  const useBigram = refTokens.length >= 2 && ansTokens.length >= 2;
  let bigramCosine = 0;
  if (useBigram) {
    const refBigrams = ngramTokensFast(refTokens, 2, 600);
    const ansBigrams = ngramTokensFast(ansTokens, 2, 600);
    if (refBigrams.length > 0 && ansBigrams.length > 0) {
      bigramCosine = computeCosineSimilarity(
        buildFrequencyVector(refBigrams),
        buildFrequencyVector(ansBigrams)
      );
    }
  }

  let trigramCosine = 0;
  if (refTokens.length >= 3 && ansTokens.length >= 3 && useBigram) {
    const refTrigrams = ngramTokensFast(refTokens, 3, 400);
    const ansTrigrams = ngramTokensFast(ansTokens, 3, 400);
    if (refTrigrams.length > 0 && ansTrigrams.length > 0) {
      trigramCosine = computeCosineSimilarity(
        buildFrequencyVector(refTrigrams),
        buildFrequencyVector(ansTrigrams)
      );
    }
  }

  let editSim = 0;
  const totalLen = refText.length + ansText.length;
  if (totalLen <= EDIT_DISTANCE_MAX_LEN * 2) {
    const refSample = sampleText(refText, EDIT_DISTANCE_MAX_LEN);
    const ansSample = sampleText(ansText, EDIT_DISTANCE_MAX_LEN);
    const maxLen = Math.max(refSample.length, ansSample.length);
    if (maxLen > 0) {
      const dist = levenshteinDistanceFast(refSample, ansSample);
      editSim = 1 - dist / maxLen;
    }
  } else {
    editSim = unigramCosine * 0.8;
  }

  const ngramScore = 0.6 * bigramCosine + 0.4 * trigramCosine;
  const overall = 0.4 * unigramCosine + 0.35 * ngramScore + 0.25 * Math.max(0, editSim);

  return Math.max(0, Math.min(1, overall));
}

function generateFeedback(keywordRatio: number, lengthRatio: number, semanticRatio: number, maxScore: number, totalScore: number): string {
  const parts: string[] = [];
  const scoreRatio = totalScore / maxScore;

  if (keywordRatio >= 0.85) {
    parts.push('关键词覆盖全面');
  } else if (keywordRatio >= 0.6) {
    parts.push('答案包含多数关键词，但仍有重要概念遗漏');
  } else if (keywordRatio >= 0.3) {
    parts.push('关键词覆盖不足，缺少核心要点');
  } else {
    parts.push('几乎未命中关键要点');
  }

  if (lengthRatio >= 0.9 && lengthRatio <= 1.3) {
    parts.push('答案篇幅适中');
  } else if (lengthRatio >= 0.6) {
    parts.push('答案偏短，建议补充更多细节和例证');
  } else if (lengthRatio > 1.5) {
    parts.push('答案冗长，建议提炼核心观点');
  } else {
    parts.push('答案过于简短，需要详细展开论述');
  }

  if (semanticRatio >= 0.7) {
    parts.push('语义表达与参考答案高度一致');
  } else if (semanticRatio >= 0.45) {
    parts.push('语义部分匹配，表述方式可进一步优化');
  } else {
    parts.push('语义与参考答案差异较大，建议重新梳理思路');
  }

  if (scoreRatio >= 0.9) {
    parts.push('整体回答优秀，继续保持');
  } else if (scoreRatio >= 0.7) {
    parts.push('整体良好，仍有提升空间');
  } else if (scoreRatio >= 0.5) {
    parts.push('回答尚可，建议加强知识点掌握');
  } else {
    parts.push('需要重点复习相关内容');
  }

  return parts.join('；');
}

export function scoreAnswer(question: Question, studentAnswer: string): ScoringResult {
  const keywordRatio = computeKeywordScore(question, studentAnswer);
  const lengthRatio = computeLengthScore(question.referenceAnswer, studentAnswer);
  const semanticRatio = computeSemanticScore(question.referenceAnswer, studentAnswer);

  const weightedScore =
    KEYWORD_WEIGHT * keywordRatio +
    LENGTH_WEIGHT * Math.min(lengthRatio, 1) +
    SEMANTIC_WEIGHT * semanticRatio;

  const totalScore = Math.round(Math.min(weightedScore, 1.0) * question.maxScore * 10) / 10;

  return {
    totalScore: Math.max(0, totalScore),
    keywordScore: Math.round(keywordRatio * 100) / 100,
    lengthScore: Math.round(lengthRatio * 100) / 100,
    semanticScore: Math.round(semanticRatio * 100) / 100,
    feedback: generateFeedback(keywordRatio, lengthRatio, semanticRatio, question.maxScore, totalScore),
  };
}
