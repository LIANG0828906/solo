export type EmotionType = 'happy' | 'sad' | 'calm' | 'anxious';

export interface EmotionResult {
  emotion: EmotionType;
  intensity: number;
}

interface EmotionLexicon {
  [key: string]: number;
}

const happyLexicon: EmotionLexicon = {
  '开心': 3, '高兴': 3, '快乐': 3, '愉快': 3, '幸福': 3,
  '兴奋': 3, '喜悦': 3, '满足': 2, '满意': 2, '欣慰': 2,
  '惊喜': 3, '期待': 2, '热爱': 3, '喜欢': 2, '爱': 3,
  '棒': 2, '好': 1, '赞': 2, '笑': 2, '灿烂': 2,
  '成功': 3, '顺利': 2, '美好': 2, '温暖': 2, '阳光': 2,
  'happy': 3, 'joy': 3, 'glad': 2, 'love': 3, 'great': 2,
  'nice': 1, 'good': 1, 'wonderful': 3, 'amazing': 3, '😄': 3,
  '😊': 2, '🥰': 3, '😆': 3, '🎉': 3, '✨': 2
};

const sadLexicon: EmotionLexicon = {
  '难过': 3, '伤心': 3, '悲伤': 3, '痛苦': 3, '失落': 2,
  '沮丧': 3, '郁闷': 2, '孤独': 3, '寂寞': 2, '心酸': 2,
  '遗憾': 2, '后悔': 2, '委屈': 2, '绝望': 3, '崩溃': 3,
  '哭': 2, '泪': 2, '分手': 3, '离开': 2, '失去': 2,
  'sad': 3, 'cry': 2, 'unhappy': 3, 'depressed': 3, 'lonely': 3,
  'grief': 3, 'pain': 3, 'sorry': 2, '😭': 3, '😢': 2,
  '🥺': 2, '💔': 3, '😔': 2, '😞': 2
};

const calmLexicon: EmotionLexicon = {
  '平静': 3, '安静': 3, '宁静': 3, '放松': 2, '安心': 2,
  '舒适': 2, '惬意': 2, '悠然': 2, '自在': 2, '淡定': 2,
  '平和': 3, '温柔': 2, '舒缓': 2, '淡然': 2, '从容': 2,
  '冥想': 3, '休息': 1, '睡觉': 1, '自然': 2, '森林': 2,
  'calm': 3, 'peaceful': 3, 'relaxed': 2, 'quiet': 2, 'serene': 3,
  'chill': 2, '🌿': 2, '🍃': 2, '🌙': 2, '☕': 1
};

const anxiousLexicon: EmotionLexicon = {
  '焦虑': 3, '紧张': 3, '担心': 2, '害怕': 3, '恐惧': 3,
  '烦躁': 2, '不安': 3, '压力': 3, '焦虑': 3, '焦躁': 3,
  '愤怒': 3, '生气': 3, '恼火': 2, '暴躁': 3, '抓狂': 3,
  '纠结': 2, '迷茫': 2, '困惑': 2, '担忧': 2, '恐慌': 3,
  'anxious': 3, 'stressed': 3, 'worried': 2, 'nervous': 3, 'afraid': 3,
  'angry': 3, 'mad': 3, 'panic': 3, '😰': 3, '😨': 3,
  '😡': 3, '🤯': 3, '😠': 2, '💢': 2
};

function calculateScore(text: string, lexicon: EmotionLexicon): number {
  let score = 0;
  const lowerText = text.toLowerCase();
  for (const [word, weight] of Object.entries(lexicon)) {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      score += matches.length * weight;
    }
  }
  return score;
}

export function analyzeEmotion(text: string): EmotionResult {
  if (!text.trim()) {
    return { emotion: 'calm', intensity: 0.5 };
  }

  const happyScore = calculateScore(text, happyLexicon);
  const sadScore = calculateScore(text, sadLexicon);
  const calmScore = calculateScore(text, calmLexicon);
  const anxiousScore = calculateScore(text, anxiousLexicon);

  const total = happyScore + sadScore + calmScore + anxiousScore;

  if (total === 0) {
    const charCount = text.length;
    if (charCount < 10) {
      return { emotion: 'calm', intensity: 0.4 };
    } else if (charCount < 30) {
      return { emotion: 'calm', intensity: 0.5 };
    } else {
      return { emotion: 'calm', intensity: 0.6 };
    }
  }

  const scores: { emotion: EmotionType; score: number }[] = [
    { emotion: 'happy', score: happyScore },
    { emotion: 'sad', score: sadScore },
    { emotion: 'calm', score: calmScore },
    { emotion: 'anxious', score: anxiousScore }
  ];

  scores.sort((a, b) => b.score - a.score);

  const maxScore = scores[0].score;
  const intensity = Math.min(1, 0.3 + (maxScore / total) * 0.7);

  return { emotion: scores[0].emotion, intensity };
}

export const emotionColors: Record<EmotionType, { from: string; to: string; label: string; emoji: string }> = {
  happy: { from: '#FFD700', to: '#FF8C00', label: '快乐', emoji: '😊' },
  sad: { from: '#7B68EE', to: '#00008B', label: '悲伤', emoji: '😢' },
  calm: { from: '#00CED1', to: '#006400', label: '平静', emoji: '🍃' },
  anxious: { from: '#FF1493', to: '#8B0000', label: '焦虑', emoji: '😰' }
};
