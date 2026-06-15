import { Router, type Request, type Response } from 'express';
import { getItems } from '../data/store.js';
import type { MatchResult, LostItem } from '../types.js';

const router = Router();

const STOP_WORDS = new Set<string>([
  '的', '是', '在', '了', '和', '与', '及', '或', '一个', '有', '我', '你', '他', '她',
  '它', '这', '那', '个', '只', '把', '被', '给', '让', '从', '到', '向', '往', '由',
  '以', '于', '上', '下', '左', '右', '前', '后', '里', '外', '中', '内', '旁', '边',
  '着', '过', '啊', '呢', '吧', '吗', '哦', '嗯', '啊', '就', '也', '都', '还', '而',
  '但', '然', '其', '之', '所', '为', '对', '将', '会', '能', '可', '要', '去', '来',
  '很', '稍', '轻', '微', '大', '小', '新', '旧', '长', '短', '高', '低', '多', '少',
  'some', 'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you',
  'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose',
  'where', 'when', 'why', 'how', 'and', 'or', 'but', 'if', 'then', 'else',
  'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from',
  'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further',
]);

const COLOR_WORDS = new Set([
  '红', '橙', '黄', '绿', '青', '蓝', '紫', '粉', '灰', '黑', '白', '棕', '褐', '米',
  '银色', '金色', '米色', '红色', '橙色', '黄色', '绿色', '青色', '蓝色', '紫色',
  '粉色', '灰色', '黑色', '白色', '棕色', '褐色', '深蓝', '浅蓝', '藏青', '墨绿',
  '深绿', '浅绿', '粉红', '酒红', '枣红', '咖啡', '卡其', '杏色',
]);

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '钱包': ['钱包', '皮夹', '钱夹', '卡包'],
  '钥匙': ['钥匙', '钥匙串', '钥匙扣', '锁匙'],
  '手机': ['手机', '电话', '智能手机', 'iphone', '安卓'],
  '雨伞': ['雨伞', '阳伞', '遮阳伞', '折叠伞', '长柄伞'],
  '书籍': ['书', '书籍', '笔记本', '本子', '课本', '教材', '图书'],
  '证件': ['身份证', '学生卡', '校园卡', '银行卡', '驾照', '护照', '证件', '卡'],
  '眼镜': ['眼镜', '墨镜', '太阳镜', '框架眼镜'],
  '耳机': ['耳机', '蓝牙', 'airpods', '耳塞', '头戴式'],
  '衣物': ['外套', '衣服', '帽子', '围巾', '手套', '鞋子', '背包', '书包'],
};

function isChineseChar(code: number): boolean {
  return code >= 0x4e00 && code <= 0x9fa5;
}

function isDigit(code: number): boolean {
  return code >= 48 && code <= 57;
}

function isAlpha(code: number): boolean {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function chineseTokenizer(text: string): string[] {
  const tokens: string[] = [];
  const cleanText = text.toLowerCase();

  let buffer = '';
  let bufferType: 'cn' | 'en' | 'num' | null = null;

  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];
    const code = ch.charCodeAt(0);

    let type: 'cn' | 'en' | 'num' | 'other' = 'other';
    if (isChineseChar(code)) type = 'cn';
    else if (isAlpha(code)) type = 'en';
    else if (isDigit(code)) type = 'num';

    if (type === 'other') {
      if (buffer) {
        tokens.push(buffer);
        buffer = '';
        bufferType = null;
      }
      continue;
    }

    if (bufferType === null || bufferType === type) {
      buffer += ch;
      bufferType = type;
    } else {
      tokens.push(buffer);
      buffer = ch;
      bufferType = type;
    }
  }

  if (buffer) tokens.push(buffer);

  const result: string[] = [];
  const seen = new Set<string>();

  const addToken = (t: string): void => {
    if (!t || STOP_WORDS.has(t)) return;
    if (t.length === 1 && !isChineseChar(t.charCodeAt(0))) return;
    if (seen.has(t)) return;
    seen.add(t);
    result.push(t);
  };

  for (const token of tokens) {
    if (token.length >= 2) {
      addToken(token);
    }

    if (token.length >= 3) {
      for (let i = 0; i < token.length - 1; i++) {
        const bigram = token.slice(i, i + 2);
        if (bigram.length === 2 && isChineseChar(bigram.charCodeAt(0)) && isChineseChar(bigram.charCodeAt(1))) {
          addToken(bigram);
        }
      }
    }

    if (token.length === 1 && isChineseChar(token.charCodeAt(0))) {
      const code = token.charCodeAt(0);
      if (COLOR_WORDS.has(token)) {
        addToken(token);
      }
      const categoryMatch = Object.keys(CATEGORY_KEYWORDS).find(k => k === token);
      if (categoryMatch) {
        addToken(token);
      }
      void code;
    }
  }

  return result;
}

function getCategoryTags(text: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k.toLowerCase()))) {
      tags.push(cat);
    }
  }
  return tags;
}

type TermFreq = Map<string, number>;

function buildTermFreq(tokens: string[]): TermFreq {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  return tf;
}

type DocInfo = {
  item: LostItem;
  tf: TermFreq;
  tokens: Set<string>;
  categories: string[];
  titleTokens: Set<string>;
  maxTf: number;
};

function buildDocInfo(item: LostItem): DocInfo {
  const text = `${item.title} ${item.description} ${item.location}`;
  const tokensArr = chineseTokenizer(text);
  const tf = buildTermFreq(tokensArr);
  let maxTf = 0;
  for (const [, freq] of tf) if (freq > maxTf) maxTf = freq;

  const titleTokensArr = chineseTokenizer(item.title);
  const categories = getCategoryTags(text);

  return {
    item,
    tf,
    tokens: new Set(tokensArr),
    categories,
    titleTokens: new Set(titleTokensArr),
    maxTf: maxTf || 1,
  };
}

function computeTfIdf(
  queryTf: TermFreq,
  queryTokens: Set<string>,
  docs: DocInfo[]
): Map<string, number> {
  const docCount = docs.length;
  const scores = new Map<string, number>();

  for (const [queryTerm, queryFreqRaw] of queryTf) {
    const queryTfNorm = queryFreqRaw;

    let docFreq = 0;
    for (const doc of docs) {
      if (doc.tokens.has(queryTerm)) docFreq++;
    }

    const idf = Math.log(1 + (docCount + 1) / (docFreq + 1));

    for (const doc of docs) {
      const termFreq = doc.tf.get(queryTerm) || 0;
      if (termFreq === 0) continue;

      const tfNorm = termFreq / doc.maxTf;
      const tfIdfScore = tfNorm * idf * queryTfNorm;

      let titleBoost = 1;
      if (doc.titleTokens.has(queryTerm)) {
        titleBoost = 1.8;
      }

      let categoryBoost = 1;
      if (COLOR_WORDS.has(queryTerm)) {
        categoryBoost = 1.3;
      }

      const finalScore = tfIdfScore * titleBoost * categoryBoost;

      scores.set(
        doc.item.id,
        (scores.get(doc.item.id) || 0) + finalScore
      );
    }
  }

  return scores;
}

function computeCategoryScore(queryCategories: string[], doc: DocInfo): number {
  if (queryCategories.length === 0) return 0;
  let matches = 0;
  for (const cat of queryCategories) {
    if (doc.categories.includes(cat)) matches++;
  }
  return (matches / queryCategories.length) * 15;
}

function computeJaccardScore(queryTokens: Set<string>, doc: DocInfo): number {
  if (queryTokens.size === 0 || doc.tokens.size === 0) return 0;
  let intersection = 0;
  for (const t of queryTokens) {
    if (doc.tokens.has(t)) intersection++;
  }
  const union = queryTokens.size + doc.tokens.size - intersection;
  return union > 0 ? (intersection / union) * 10 : 0;
}

function normalizeScores(
  docs: DocInfo[],
  tfidfScores: Map<string, number>,
  queryCategories: string[],
  queryTokens: Set<string>
): { id: string; finalScore: number }[] {
  let maxTfIdf = 0;
  for (const [, s] of tfidfScores) if (s > maxTfIdf) maxTfIdf = s;
  if (maxTfIdf === 0) maxTfIdf = 1;

  return docs.map(doc => {
    const rawTfIdf = tfidfScores.get(doc.item.id) || 0;
    const normalizedTfIdf = Math.min(100, (rawTfIdf / maxTfIdf) * 75);
    const categoryScore = computeCategoryScore(queryCategories, doc);
    const jaccardScore = computeJaccardScore(queryTokens, doc);

    const finalScore = Math.min(
      100,
      Math.round(normalizedTfIdf * 0.65 + categoryScore + jaccardScore * 2)
    );

    return { id: doc.item.id, finalScore };
  });
}

router.post('/', (req: Request, res: Response): void => {
  const { description } = req.body;

  if (!description || typeof description !== 'string' || !description.trim()) {
    res.status(400).json({
      success: false,
      error: '描述是必填项，请输入失物特征描述',
    });
    return;
  }

  const rawQuery = description.trim();
  const allItems = getItems().filter(item => !item.isClaimed);

  if (allItems.length === 0) {
    res.json({
      success: true,
      data: [],
    });
    return;
  }

  const queryTokensArr = chineseTokenizer(rawQuery);
  const queryTf = buildTermFreq(queryTokensArr);
  const queryTokens = new Set(queryTokensArr);
  const queryCategories = getCategoryTags(rawQuery);

  const docs = allItems.map(buildDocInfo);
  const tfidfScores = computeTfIdf(queryTf, queryTokens, docs);

  const scored = normalizeScores(docs, tfidfScores, queryCategories, queryTokens);
  scored.sort((a, b) => b.finalScore - a.finalScore);

  const topResults = scored.slice(0, 5);

  const matches: MatchResult[] = topResults.map(s => {
    const doc = docs.find(d => d.item.id === s.id)!;
    const score = s.finalScore;
    return {
      item: doc.item,
      score,
      isHighMatch: score >= 60,
    };
  });

  res.json({
    success: true,
    data: matches,
  });
});

export default router;
