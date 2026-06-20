interface SentimentResult {
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

const positiveWords = ['精彩', '优秀', '推荐', '喜欢', '震撼', '感动', '杰作', '完美', '经典', '天才', '出色', '卓越', '深刻', '叹服', '绝妙', '赞叹', '喜爱', '迷人', '温暖', '治愈', '惊喜', '精美', '惊艳', '顶级', '无与伦比', '不朽', '宝贵', '珍贵', '辉煌', '壮观', '扣人心弦', '引人入胜', '拍案叫绝', '百读不厌', '酣畅淋漓', '妙不可言', '令人陶醉', '心旷神怡', '赏心悦目', '爱不释手'];

const negativeWords = ['失望', '无聊', '差劲', '糟糕', '后悔', '浪费', '难看', '痛苦', '压抑', '恶劣', '难读', '枯燥', '乏味', '平庸', '肤浅', '混乱', '拖沓', '生硬', '矫情', '刻意', '过誉', '不推荐', '难懂', '冗长', '单薄', '虚假', '偏颇', '不严谨', '堆砌', '窝囊'];

export function analyzeSentiment(text: string): SentimentResult {
  let posCount = 0;
  let negCount = 0;
  for (const w of positiveWords) {
    if (text.includes(w)) posCount++;
  }
  for (const w of negativeWords) {
    if (text.includes(w)) negCount++;
  }
  const total = posCount + negCount;
  if (total === 0) return { label: 'neutral', confidence: 0.6 };
  const posRatio = posCount / total;
  if (posRatio > 0.6) return { label: 'positive', confidence: Math.min(0.5 + posRatio * 0.5, 0.99) };
  if (posRatio < 0.4) return { label: 'negative', confidence: Math.min(0.5 + (1 - posRatio) * 0.5, 0.99) };
  return { label: 'neutral', confidence: 0.5 + Math.abs(posRatio - 0.5) };
}

export function analyzeReviews(reviews: string[]): { positive: number; negative: number; neutral: number; details: SentimentResult[] } {
  let positive = 0, negative = 0, neutral = 0;
  const details: SentimentResult[] = [];
  for (const r of reviews) {
    const result = analyzeSentiment(r);
    details.push(result);
    if (result.label === 'positive') positive++;
    else if (result.label === 'negative') negative++;
    else neutral++;
  }
  return { positive, negative, neutral, details };
}
