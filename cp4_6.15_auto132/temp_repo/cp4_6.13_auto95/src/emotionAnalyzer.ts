export type EmotionType = 'joy' | 'sadness' | 'anger' | 'calm' | 'anxiety';

export interface EmotionResult {
  type: EmotionType;
  score: number;
}

const emotionKeywords: Record<EmotionType, string[]> = {
  joy: [
    '开心', '快乐', '高兴', '喜悦', '幸福', '满足', '兴奋', '愉快',
    '欢乐', '欣喜', '愉悦', '乐观', '微笑', '欢笑', '甜蜜', '美好',
    '希望', '热爱', '感动', '温暖', '舒服', '畅快', '开心的', 'happy',
    'joy', 'glad', 'cheerful', 'delight', 'love', 'wonderful', 'great'
  ],
  sadness: [
    '悲伤', '难过', '伤心', '痛苦', '失落', '沮丧', '忧愁', '惆怅',
    '忧郁', '哀伤', '凄凉', '孤独', '寂寞', '绝望', '哭', '流泪',
    '心碎', '痛苦的', '伤感', '悲哀', 'sad', 'sorrow', 'grief', 'cry',
    'tears', 'lonely', 'depressed', 'heartbroken', 'unhappy', 'miss'
  ],
  anger: [
    '愤怒', '生气', '暴怒', '恼火', '气愤', '愤怒的', '憎恨', '厌恶',
    '愤怒', '烦躁', '不满', '怨恨', '怒火', '咆哮', '怒吼', '愤慨',
    '愤懑', '气', 'angry', 'anger', 'rage', 'furious', 'hate', 'mad',
    'irritated', 'annoyed', 'outrage', 'wrath'
  ],
  calm: [
    '平静', '宁静', '安宁', '安静', '祥和', '沉稳', '淡定', '从容',
    '悠闲', '安逸', '平和', '舒缓', '静谧', '恬静', '安心', '放松',
    '舒适', '惬意', '禅意', '淡然', 'calm', 'peaceful', 'serene',
    'quiet', 'tranquil', 'relaxed', 'gentle', 'soft', 'harmony'
  ],
  anxiety: [
    '焦虑', '紧张', '不安', '担忧', '恐慌', '害怕', '恐惧', '忧虑',
    '烦躁', '着急', '心慌', '焦虑的', '不安的', '忐忑', '彷徨',
    '迷茫', '困惑', '纠结', '压力', 'anxious', 'anxiety', 'worried',
    'nervous', 'fear', 'panic', 'stress', 'tense', 'uneasy', 'afraid'
  ]
};

export function analyzeEmotion(text: string): EmotionResult {
  const lowerText = text.toLowerCase();
  const scores: Record<EmotionType, number> = {
    joy: 0,
    sadness: 0,
    anger: 0,
    calm: 0,
    anxiety: 0
  };

  (Object.keys(emotionKeywords) as EmotionType[]).forEach((emotion) => {
    emotionKeywords[emotion].forEach((keyword) => {
      const regex = new RegExp(keyword.toLowerCase(), 'g');
      const matches = lowerText.match(regex);
      if (matches) {
        scores[emotion] += matches.length;
      }
    });
  });

  let maxEmotion: EmotionType = 'calm';
  let maxScore = 0;
  let totalScore = 0;

  (Object.keys(scores) as EmotionType[]).forEach((emotion) => {
    totalScore += scores[emotion];
    if (scores[emotion] > maxScore) {
      maxScore = scores[emotion];
      maxEmotion = emotion;
    }
  });

  if (totalScore === 0) {
    return { type: 'calm', score: 50 };
  }

  const normalizedScore = Math.min(100, Math.round((maxScore / totalScore) * 100));

  return { type: maxEmotion, score: normalizedScore };
}

export const emotionColors: Record<
  EmotionType,
  { start: string; end: string; label: string }
> = {
  joy: { start: '#ff9a56', end: '#ff6b6b', label: '喜悦' },
  sadness: { start: '#4a90d9', end: '#1e3a5f', label: '悲伤' },
  anger: { start: '#c0392b', end: '#641e16', label: '愤怒' },
  calm: { start: '#1abc9c', end: '#0e6655', label: '平静' },
  anxiety: { start: '#8e7cc3', end: '#4a4a6a', label: '焦虑' }
};
