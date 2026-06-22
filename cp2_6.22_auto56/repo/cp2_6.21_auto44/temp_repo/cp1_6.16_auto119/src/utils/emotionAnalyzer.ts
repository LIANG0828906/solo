export interface EmotionResult {
  score: number;
  dominantWord: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

const positiveWords: { word: string; weight: number }[] = [
  { word: '开心', weight: 0.9 },
  { word: '快乐', weight: 0.9 },
  { word: '高兴', weight: 0.85 },
  { word: '幸福', weight: 0.95 },
  { word: '兴奋', weight: 0.85 },
  { word: '激动', weight: 0.8 },
  { word: '满意', weight: 0.7 },
  { word: '满足', weight: 0.75 },
  { word: '感恩', weight: 0.9 },
  { word: '温暖', weight: 0.75 },
  { word: '美好', weight: 0.8 },
  { word: '美丽', weight: 0.7 },
  { word: '精彩', weight: 0.8 },
  { word: '棒', weight: 0.75 },
  { word: '好', weight: 0.5 },
  { word: '赞', weight: 0.8 },
  { word: '喜欢', weight: 0.7 },
  { word: '爱', weight: 0.95 },
  { word: '期待', weight: 0.6 },
  { word: '希望', weight: 0.7 },
  { word: '顺利', weight: 0.75 },
  { word: '成功', weight: 0.9 },
  { word: '放松', weight: 0.6 },
  { word: '舒适', weight: 0.7 },
  { word: '愉快', weight: 0.85 },
  { word: '喜悦', weight: 0.9 },
  { word: '惊喜', weight: 0.85 },
  { word: '乐观', weight: 0.75 },
  { word: '充实', weight: 0.7 },
  { word: '平静', weight: 0.5 },
  { word: '😊', weight: 0.8 },
  { word: '😄', weight: 0.85 },
  { word: '😍', weight: 0.9 },
  { word: '🥰', weight: 0.9 },
  { word: '😁', weight: 0.8 },
  { word: '😃', weight: 0.8 },
  { word: '❤️', weight: 0.9 },
  { word: '✨', weight: 0.7 },
  { word: '🎉', weight: 0.9 },
  { word: '👍', weight: 0.75 },
  { word: 'happy', weight: 0.85 },
  { word: 'love', weight: 0.95 },
  { word: 'great', weight: 0.8 },
  { word: 'good', weight: 0.6 },
  { word: 'wonderful', weight: 0.9 },
  { word: 'amazing', weight: 0.9 },
  { word: 'excellent', weight: 0.85 },
  { word: 'joy', weight: 0.9 },
  { word: 'blessed', weight: 0.9 },
  { word: 'grateful', weight: 0.9 },
];

const negativeWords: { word: string; weight: number }[] = [
  { word: '难过', weight: 0.85 },
  { word: '伤心', weight: 0.9 },
  { word: '悲伤', weight: 0.95 },
  { word: '沮丧', weight: 0.8 },
  { word: '失望', weight: 0.75 },
  { word: '绝望', weight: 0.95 },
  { word: '愤怒', weight: 0.9 },
  { word: '生气', weight: 0.85 },
  { word: '烦躁', weight: 0.7 },
  { word: '焦虑', weight: 0.8 },
  { word: '紧张', weight: 0.65 },
  { word: '压力', weight: 0.7 },
  { word: '疲惫', weight: 0.65 },
  { word: '累', weight: 0.5 },
  { word: '痛苦', weight: 0.9 },
  { word: '讨厌', weight: 0.75 },
  { word: '烦', weight: 0.6 },
  { word: '郁闷', weight: 0.75 },
  { word: '孤独', weight: 0.8 },
  { word: '寂寞', weight: 0.75 },
  { word: '无聊', weight: 0.5 },
  { word: '担心', weight: 0.65 },
  { word: '害怕', weight: 0.8 },
  { word: '恐惧', weight: 0.9 },
  { word: '糟糕', weight: 0.8 },
  { word: '差', weight: 0.6 },
  { word: '坏', weight: 0.6 },
  { word: '难过', weight: 0.85 },
  { word: '哭', weight: 0.8 },
  { word: '痛', weight: 0.7 },
  { word: '😢', weight: 0.85 },
  { word: '😭', weight: 0.9 },
  { word: '😔', weight: 0.75 },
  { word: '😞', weight: 0.8 },
  { word: '😠', weight: 0.85 },
  { word: '😡', weight: 0.9 },
  { word: '😰', weight: 0.75 },
  { word: '😨', weight: 0.8 },
  { word: '💔', weight: 0.9 },
  { word: '😓', weight: 0.7 },
  { word: 'sad', weight: 0.85 },
  { word: 'angry', weight: 0.85 },
  { word: 'bad', weight: 0.65 },
  { word: 'terrible', weight: 0.9 },
  { word: 'awful', weight: 0.9 },
  { word: 'depressed', weight: 0.9 },
  { word: 'stressed', weight: 0.75 },
  { word: 'anxious', weight: 0.8 },
  { word: 'worried', weight: 0.7 },
  { word: 'hate', weight: 0.85 },
];

export function analyzeEmotion(text: string): EmotionResult {
  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;
  let maxPositiveWeight = 0;
  let maxNegativeWeight = 0;
  let dominantPositiveWord = '';
  let dominantNegativeWord = '';

  for (const { word, weight } of positiveWords) {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      const contribution = weight * matches.length;
      positiveScore += contribution;
      if (weight > maxPositiveWeight) {
        maxPositiveWeight = weight;
        dominantPositiveWord = word;
      }
    }
  }

  for (const { word, weight } of negativeWords) {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      const contribution = weight * matches.length;
      negativeScore += contribution;
      if (weight > maxNegativeWeight) {
        maxNegativeWeight = weight;
        dominantNegativeWord = word;
      }
    }
  }

  const totalScore = positiveScore + negativeScore;
  let normalizedScore = 0.5;

  if (totalScore > 0) {
    normalizedScore = positiveScore / totalScore;
  }

  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  let dominantWord = '平静';

  if (normalizedScore > 0.6) {
    sentiment = 'positive';
    dominantWord = dominantPositiveWord || '开心';
  } else if (normalizedScore < 0.4) {
    sentiment = 'negative';
    dominantWord = dominantNegativeWord || '低落';
  }

  return {
    score: normalizedScore,
    dominantWord,
    sentiment,
  };
}

export function getEmotionColor(score: number): string {
  const green = { r: 76, g: 175, b: 80 };
  const yellow = { r: 255, g: 193, b: 7 };
  const red = { r: 244, g: 67, b: 54 };

  let color;
  if (score <= 0.5) {
    const t = score * 2;
    color = {
      r: Math.round(green.r + (yellow.r - green.r) * t),
      g: Math.round(green.g + (yellow.g - green.g) * t),
      b: Math.round(green.b + (yellow.b - green.b) * t),
    };
  } else {
    const t = (score - 0.5) * 2;
    color = {
      r: Math.round(yellow.r + (red.r - yellow.r) * t),
      g: Math.round(yellow.g + (red.g - yellow.g) * t),
      b: Math.round(yellow.b + (red.b - yellow.b) * t),
    };
  }

  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}
