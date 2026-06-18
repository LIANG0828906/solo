export interface IssueLike {
  id: string;
  title: string;
  description: string;
}

export interface SimilarIssue {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  similarity: number;
}

export interface TagSuggestion {
  tag: string;
  confidence: number;
}

const TAG_LEXICON: Record<string, string[]> = {
  Bug: [
    '错误', 'bug', '崩溃', '异常', '失败', '报错', '问题', '无法', '不行',
    'error', 'crash', 'fail', 'broken', 'fix', 'wrong', 'incorrect',
  ],
  增强: [
    '新增', '增加', '功能', 'feature', '支持', '实现', '需求', '希望',
    'improve', 'enhance', 'add', 'new', 'request',
  ],
  文档: [
    '文档', 'doc', 'readme', '注释', '说明', '示例', '教程', '文档更新',
    'documentation', 'docs', 'guide', 'tutorial', 'comment',
  ],
  优化: [
    '优化', '性能', '速度', 'refactor', '重构', '改进', '提升', '效率',
    'optimize', 'performance', 'speed', 'fast', 'improve',
  ],
  其他: [
    '其他', 'other', 'question', '问题', '讨论', 'misc',
  ],
};

function tokenize(text: string): Set<string> {
  const tokens = new Set<string>();
  const clean = text.toLowerCase().trim().replace(/[\s,.;:!?，。；：！？、()（）\[\]【】"'`\d]+/g, ' ');

  const words = clean.split(/\s+/).filter(w => w.length >= 1);
  words.forEach(w => {
    if (w.length >= 2 && w.length <= 6) tokens.add(w);
  });

  const noSpace = clean.replace(/\s+/g, '');
  for (let i = 0; i <= noSpace.length - 2; i++) {
    tokens.add(noSpace.substring(i, i + 2));
  }

  return tokens;
}

function diceCoefficient(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  a.forEach(t => {
    if (b.has(t)) inter++;
  });
  const total = a.size + b.size;
  if (total === 0) return 0;
  return (2 * inter) / total;
}

interface FullIssueLike extends IssueLike {
  createdAt?: string;
}

export interface SimilarityWeights {
  title: number;
  description: number;
}

export function calculateSimilarity(
  newIssue: IssueLike,
  issues: FullIssueLike[],
  threshold: number = 0.25,
  weights: SimilarityWeights = { title: 0.5, description: 0.5 }
): SimilarIssue[] {
  const titleTokensA = tokenize(newIssue.title);
  const descTokensA = tokenize(newIssue.description);

  const results: SimilarIssue[] = [];
  for (const issue of issues) {
    if (issue.id === newIssue.id) continue;
    const titleTokensB = tokenize(issue.title);
    const descTokensB = tokenize(issue.description);
    const titleSim = diceCoefficient(titleTokensA, titleTokensB);
    const descSim = diceCoefficient(descTokensA, descTokensB);
    const sim = titleSim * weights.title + descSim * weights.description;
    if (sim >= threshold) {
      results.push({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        createdAt: issue.createdAt || '',
        similarity: sim,
      });
    }
  }
  results.sort((a, b) => b.similarity - a.similarity);
  return results;
}

function extractNgrams(text: string, n: number): Map<string, number> {
  const grams = new Map<string, number>();
  const clean = text.toLowerCase().trim();

  const words = clean.split(/[\s,.;:!?，。；：！？、()（）\[\]【】"'`]+/).filter(Boolean);
  words.forEach(w => {
    grams.set(w, (grams.get(w) || 0) + 1);
  });

  for (let i = 0; i <= clean.length - n; i++) {
    const gram = clean.substring(i, i + n);
    if (!gram.trim()) continue;
    grams.set(gram, (grams.get(gram) || 0) + 1);
  }

  return grams;
}

export function suggestTags(issue: IssueLike): TagSuggestion[] {
  const text = `${issue.title} ${issue.description}`;
  const issueNgrams = new Map<string, number>();

  [2, 3].forEach(n => {
    const g = extractNgrams(text, n);
    g.forEach((count, key) => {
      issueNgrams.set(key, (issueNgrams.get(key) || 0) + count);
    });
  });

  const suggestions: TagSuggestion[] = [];
  const tagScores: Record<string, number> = {};

  Object.entries(TAG_LEXICON).forEach(([tag, keywords]) => {
    let matches = 0;
    keywords.forEach(kw => {
      const kwLower = kw.toLowerCase();
      if (text.includes(kwLower)) {
        matches += 2;
      }
      issueNgrams.forEach((_count, gram) => {
        if (gram.includes(kwLower) || kwLower.includes(gram)) {
          matches += 1;
        }
      });
    });
    tagScores[tag] = matches;
  });

  const total = Object.values(tagScores).reduce((a, b) => a + b, 0);
  Object.entries(tagScores).forEach(([tag, score]) => {
    const confidence = total === 0 ? 0 : Math.min(1, score / Math.max(4, total / 2));
    suggestions.push({ tag, confidence });
  });

  suggestions.sort((a, b) => b.confidence - a.confidence);
  return suggestions;
}
