export interface EmotionResult {
  score: number;
  keywords: string[];
}

const POSITIVE_WORDS_ZH: string[] = [
  '快乐', '幸福', '美好', '喜欢', '爱', '温暖', '阳光', '希望', '梦想', '精彩',
  '优秀', '开心', '欢乐', '感激', '赞美', '灿烂', '甜蜜', '成功', '胜利', '勇敢',
  '自信', '善良', '友好', '热情', '活力', '绽放', '愉悦', '满足', '欣慰', '骄傲',
  '光明', '自由', '和平', '丰收', '兴旺', '庆祝', '欢笑', '微笑', '感动', '欣慰',
  '幸运', '璀璨', '辉煌', '壮丽', '绝妙', '完美', '惊喜', '欣慰', '感动', '珍爱',
];

const NEGATIVE_WORDS_ZH: string[] = [
  '悲伤', '痛苦', '失望', '孤独', '恐惧', '绝望', '愤怒', '烦恼', '忧愁', '难过',
  '伤心', '焦虑', '沮丧', '疲惫', '厌倦', '崩溃', '无助', '迷茫', '堕落', '消极',
  '黑暗', '寒冷', '凄凉', '悲哀', '悔恨', '怨恨', '苦涩', '黯淡', '颓废', '抑郁',
  '痛心', '苦闷', '落寞', '惨淡', '凄惨', '悲哀', '忧伤', '苦楚', '悲惨', '懊悔',
  '惆怅', '落魄', '凄清', '哀伤', '痛楚', '郁结', '萎靡', '憔悴', '黯然', '凄苦',
];

const POSITIVE_WORDS_EN: string[] = [
  'happy', 'love', 'joy', 'wonderful', 'amazing', 'beautiful', 'great', 'excellent',
  'fantastic', 'brilliant', 'awesome', 'good', 'nice', 'perfect', 'delightful',
  'cheerful', 'grateful', 'hope', 'dream', 'success', 'victory', 'brave', 'kind',
  'warm', 'bright', 'sunshine', 'sweet', 'lucky', 'proud', 'confident',
  'freedom', 'peace', 'celebrate', 'smile', 'laugh', 'inspire', 'glorious',
  'magnificent', 'splendid', 'marvelous', 'outstanding', 'superb', 'terrific',
];

const NEGATIVE_WORDS_EN: string[] = [
  'sad', 'pain', 'hurt', 'lonely', 'fear', 'despair', 'angry', 'hate', 'awful',
  'terrible', 'horrible', 'bad', 'ugly', 'worst', 'miserable', 'depressed',
  'anxious', 'frustrated', 'disappointed', 'hopeless', 'dark', 'cold', 'cruel',
  'bitter', 'regret', 'sorrow', 'grief', 'agony', 'suffer', 'broken',
  'defeated', 'gloomy', 'tragic', 'dreadful', 'pathetic', 'wretched', 'bleak',
  'torment', 'anguish', 'mourn', 'weep', 'distress', 'gloomy', 'somber',
];

const STOP_WORDS: Set<string> = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '他', '她', '它', '们', '那', '些', '什么', '如何', '怎么', '为什么',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
  'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that',
  'these', 'those', 'and', 'or', 'but', 'if', 'then', 'so', 'as', 'not',
  'no', 'of', 'at', 'by', 'for', 'with', 'about', 'to', 'from', 'in',
  'on', 'up', 'out', 'into', 'over', 'after', 'before', 'under', 'between',
]);

function segmentChinese(text: string): string[] {
  const words: string[] = [];
  const chars = [...text];
  let buffer = '';
  for (const ch of chars) {
    if (/[\u4e00-\u9fff]/.test(ch)) {
      if (buffer) { words.push(buffer); buffer = ''; }
      words.push(ch);
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      buffer += ch;
    } else {
      if (buffer) { words.push(buffer); buffer = ''; }
    }
  }
  if (buffer) words.push(buffer);
  return words;
}

function tokenize(text: string): string[] {
  const lower = text.toLowerCase().trim();
  if (!lower) return [];
  const enWords = lower.match(/[a-z]+/g) || [];
  const zhWords = segmentChinese(text);
  return [...enWords, ...zhWords].filter(w => w.length > 0 && !STOP_WORDS.has(w));
}

export function analyzeEmotion(text: string): EmotionResult {
  const tokens = tokenize(text);
  let posScore = 0;
  let negScore = 0;
  const matchedKeywords: string[] = [];

  for (const token of tokens) {
    if (POSITIVE_WORDS_ZH.includes(token) || POSITIVE_WORDS_EN.includes(token)) {
      posScore += 1;
      if (!matchedKeywords.includes(token)) matchedKeywords.push(token);
    }
    if (NEGATIVE_WORDS_ZH.includes(token) || NEGATIVE_WORDS_EN.includes(token)) {
      negScore += 1;
      if (!matchedKeywords.includes(token)) matchedKeywords.push(token);
    }
  }

  let score = 0;
  const total = posScore + negScore;
  if (total > 0) {
    score = (posScore - negScore) / total;
  }

  let keywords = matchedKeywords.slice(0, 5);
  if (keywords.length < 3) {
    const remaining = tokens.filter(t => !STOP_WORDS.has(t) && !keywords.includes(t));
    for (const r of remaining) {
      if (keywords.length >= 5) break;
      if (!keywords.includes(r)) keywords.push(r);
    }
  }
  keywords = keywords.slice(0, 5);
  while (keywords.length < 3 && keywords.length < tokens.length) {
    const next = tokens.find(t => !keywords.includes(t));
    if (next) keywords.push(next);
    else break;
  }

  return { score: Math.max(-1, Math.min(1, score)), keywords: keywords.slice(0, 5) };
}
