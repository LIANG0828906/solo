const positiveWords: string[] = [
  '温暖', '希望', '勇敢', '幸福', '快乐', '光明', '成功', '胜利', '美好', '和平',
  '友爱', '善良', '真诚', '热情', '希望', '梦想', '坚定', '信心', '微笑', '喜悦',
  '温暖', '感恩', '成长', '蜕变', '进步', '突破', '创造', '奇迹', '收获', '祝福',
  'happy', 'joy', 'love', 'hope', 'brave', 'warm', 'smile', 'dream', 'success', 'peace'
];

const conflictWords: string[] = [
  '战斗', '危险', '争吵', '冲突', '死亡', '血腥', '暴力', '恐惧', '愤怒', '仇恨',
  '痛苦', '绝望', '危机', '威胁', '背叛', '阴谋', '毁灭', '灾难', '恐怖', '紧张',
  '悲痛', '心碎', '崩溃', '失控', '对立', '分裂', '战争', '火焰', '爆炸', '坠落',
  'fight', 'danger', 'war', 'fear', 'hate', 'death', 'blood', 'pain', 'terror', 'crisis'
];

export function analyzeSentiment(text: string): 'positive' | 'conflict' | 'neutral' {
  let positiveScore = 0;
  let conflictScore = 0;

  const lowerText = text.toLowerCase();

  for (const word of positiveWords) {
    const matches = lowerText.match(new RegExp(word, 'g'));
    if (matches) {
      positiveScore += matches.length;
    }
  }

  for (const word of conflictWords) {
    const matches = lowerText.match(new RegExp(word, 'g'));
    if (matches) {
      conflictScore += matches.length;
    }
  }

  if (positiveScore > conflictScore && positiveScore > 0) {
    return 'positive';
  }
  if (conflictScore > positiveScore && conflictScore > 0) {
    return 'conflict';
  }
  return 'neutral';
}
