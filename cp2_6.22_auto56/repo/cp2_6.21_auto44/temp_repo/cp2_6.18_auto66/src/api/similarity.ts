import type { Issue, IssueTag } from '@/store/issueStore';

export interface SimilarIssue {
  issue: Issue;
  similarity: number;
}

export interface SuggestedTag {
  tag: IssueTag;
  confidence: number;
}

function tokenize(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const tokens = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i++) {
    tokens.add(normalized.slice(i, i + 2));
  }
  return tokens;
}

function jaccard(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function calculateSimilarity(
  currentIssue: Issue,
  issues: Issue[],
  threshold = 0.6
): SimilarIssue[] {
  const currentTokens = tokenize(currentIssue.title + ' ' + currentIssue.description);
  const tokenCache = new Map<string, Set<string>>();
  const results: SimilarIssue[] = [];

  for (const issue of issues) {
    if (issue.id === currentIssue.id) continue;
    let tokens = tokenCache.get(issue.id);
    if (!tokens) {
      tokens = tokenize(issue.title + ' ' + issue.description);
      tokenCache.set(issue.id, tokens);
    }
    const sim = jaccard(currentTokens, tokens);
    if (sim >= threshold) {
      results.push({ issue, similarity: Math.round(sim * 1000) / 1000 });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}

const TAG_KEYWORDS: Record<IssueTag, string[]> = {
  'Bug': [
    '错误', '崩溃', '异常', '报错', 'bug', 'crash', 'error', 'fail', '故障',
    '失效', '不能', '无法', '失败', '闪退', '卡死', '死机', '白屏',
    '缺陷', '问题', '修复', 'fix', 'broken', 'issue', 'wrong',
  ],
  '增强': [
    '增强', '改进', '提升', '优化', 'enhance', 'improve', 'upgrade',
    '新增', '添加', '增加', '支持', '扩展', '增强功能', 'feature',
    '新功能', '加强', '完善',
  ],
  '文档': [
    '文档', '说明', '注释', '文档', 'doc', 'documentation', 'readme',
    '指南', '教程', '示例', 'api文档', '注释', '帮助',
    '手册', 'tutorial', 'guide', 'example',
  ],
  '优化': [
    '性能', '速度', '慢', '卡顿', '优化', 'optimize', 'performance',
    '加速', '缓存', '内存', 'cpu', '减少', '压缩', '懒加载',
    '响应', '延迟', 'fps', '流畅',
  ],
  '其他': [
    '其他', '杂项', 'misc', 'other', '讨论', '疑问', 'question',
    '建议', '反馈', '咨询', '讨论区',
  ],
};

function extractNgrams(text: string, n: number): Set<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const ngrams = new Set<string>();
  for (let i = 0; i <= normalized.length - n; i++) {
    ngrams.add(normalized.slice(i, i + n));
  }
  return ngrams;
}

export function suggestTags(issue: Issue): SuggestedTag[] {
  const text = issue.title + ' ' + issue.description;
  const bigrams = extractNgrams(text, 2);
  const trigrams = extractNgrams(text, 3);
  const allNgrams = new Set([...bigrams, ...trigrams]);

  const results: SuggestedTag[] = [];

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    let score = 0;
    let maxScore = 0;

    for (const keyword of keywords) {
      const kwBigrams = extractNgrams(keyword, 2);
      const kwTrigrams = extractNgrams(keyword, 3);
      const kwAll = new Set([...kwBigrams, ...kwTrigrams]);

      maxScore += kwAll.size;

      for (const ng of kwAll) {
        if (allNgrams.has(ng)) {
          score++;
        }
      }
    }

    const confidence = maxScore > 0 ? score / maxScore : 0;
    if (confidence > 0.05) {
      results.push({
        tag: tag as IssueTag,
        confidence: Math.round(confidence * 1000) / 10,
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}
