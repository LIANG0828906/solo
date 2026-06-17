export type SentimentType = 'positive' | 'neutral' | 'negative';

const POSITIVE_WORDS = new Set([
  '开心', '快乐', '幸福', '美好', '喜欢', '爱', '温暖', '希望', '阳光',
  '笑', '甜', '棒', '赞', '优秀', '成功', '感谢', '感恩', '幸运',
  '精彩', '惊喜', '满足', '欣赏', '鼓励', '勇敢', '自由', '和平',
  '自信', '欢乐', '热情', '活力', '梦想', '闪耀', '绽放', '拥抱',
  'happy', 'love', 'great', 'wonderful', 'amazing', 'good', 'beautiful',
  'joy', 'hope', 'bright', 'awesome', 'fantastic', 'excellent', 'perfect',
]);

const NEGATIVE_WORDS = new Set([
  '悲伤', '痛苦', '难过', '讨厌', '恨', '失望', '绝望', '孤独', '恐惧',
  '哭', '苦', '差', '烦', '焦虑', '压力', '崩溃', '无奈', '遗憾',
  '愤怒', '沮丧', '消沉', '疲惫', '迷茫', '空洞', '压抑', '冷漠',
  '伤心', '可怕', '噩梦', '挫折', '失败', '困难', '黑暗', '冰冷',
  'sad', 'hate', 'bad', 'terrible', 'awful', 'ugly', 'pain', 'fear',
  'angry', 'depressed', 'anxious', 'hopeless', 'miserable', 'horrible',
]);

export function analyzeSentiment(text: string): SentimentType {
  const lower = text.toLowerCase();
  let score = 0;

  for (const word of POSITIVE_WORDS) {
    if (lower.includes(word)) score += 1;
  }

  for (const word of NEGATIVE_WORDS) {
    if (lower.includes(word)) score -= 1;
  }

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

export function getSentimentColor(sentiment: SentimentType): number {
  switch (sentiment) {
    case 'positive': return 0xFF6B6B;
    case 'neutral': return 0x4ECDC4;
    case 'negative': return 0x1A535C;
  }
}

export function getSentimentLabel(sentiment: SentimentType): string {
  switch (sentiment) {
    case 'positive': return '积极';
    case 'neutral': return '中性';
    case 'negative': return '消极';
  }
}
