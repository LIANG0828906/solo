const POSITIVE_WORDS = [
  '好', '棒', '优秀', '实用', '满意', '推荐', '清晰', '专业', '有趣', '丰富',
  '深入', '易懂', '干货', '收获', '赞', '喜欢', '精彩', '透彻', '受益', '不错',
  '提升', '帮助', '启发', '详细', '生动', '到位', '扎实', '热情', '耐心', '认真',
  'excellent', 'great', 'good', 'helpful', 'useful', 'amazing', 'wonderful',
  'fantastic', 'love', 'best', 'awesome', 'clear', 'informative', 'practical',
];

const NEGATIVE_WORDS = [
  '差', '烂', '失望', '无聊', '难懂', '浪费时间', '不满', '差劲', '糟糕', '敷衍',
  '浅显', '重复', '混乱', '模糊', '拖沓', '冗长', '枯燥', '空洞', '过时', '敷衍了事',
  '没帮助', '不推荐', '一般', '太简', '太长', '不清楚', '不专业', '无效', '低质', '水',
  'bad', 'terrible', 'boring', 'waste', 'disappointed', 'poor', 'worst',
  'useless', 'confusing', 'unclear', 'slow', 'repetitive', 'outdated', 'shallow',
];

export type SentimentResult = 'positive' | 'neutral' | 'negative';

export function analyzeSentiment(
  text: string,
  contentQuality: number,
  instructorExpression: number,
  practicalValue: number,
): SentimentResult {
  const lowerText = text.toLowerCase();

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of POSITIVE_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      positiveCount++;
    }
  }

  for (const word of NEGATIVE_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      negativeCount++;
    }
  }

  const avgScore = (contentQuality + instructorExpression + practicalValue) / 3;

  const keywordScore = positiveCount - negativeCount;

  const weightedScore = keywordScore * 1.5 + (avgScore - 3) * 2;

  if (weightedScore > 1) return 'positive';
  if (weightedScore < -1) return 'negative';
  return 'neutral';
}
