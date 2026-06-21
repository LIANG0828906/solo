export type MoodMode = 'calm' | 'passionate';

export type Sentiment = 'sad' | 'joyful' | 'neutral' | 'romantic' | 'melancholy';

export interface PoemLine {
  id: string;
  text: string;
}

export interface ColorScheme {
  bgGradient: [string, string, string];
  particleColors: string[];
  lineConnectionColor: string;
  textGlowColor: string;
}

export const moodSchemes: Record<MoodMode, ColorScheme> = {
  calm: {
    bgGradient: ['#0a1628', '#1a2a4a', '#0d1b2a'],
    particleColors: ['#64b5f6', '#42a5f5', '#90caf9', '#bbdefb', '#81d4fa'],
    lineConnectionColor: 'rgba(129, 212, 250, 0.15)',
    textGlowColor: 'rgba(129, 212, 250, 0.6)'
  },
  passionate: {
    bgGradient: ['#2a0a1a', '#4a1a2a', '#3d0c1e'],
    particleColors: ['#ff8a65', '#ff7043', '#ffab91', '#ffcc80', '#ffb74d'],
    lineConnectionColor: 'rgba(255, 138, 101, 0.2)',
    textGlowColor: 'rgba(255, 171, 145, 0.6)'
  }
};

export const sentimentColors: Record<Sentiment, string[]> = {
  sad: ['#64b5f6', '#42a5f5', '#90caf9', '#7986cb', '#5c6bc0'],
  joyful: ['#ffd54f', '#ffca28', '#ffee58', '#fff176', '#ffb74d'],
  neutral: ['#90a4ae', '#b0bec5', '#cfd8dc', '#e0e0e0', '#bdbdbd'],
  romantic: ['#f48fb1', '#f06292', '#ec407a', '#ce93d8', '#ba68c8'],
  melancholy: ['#9575cd', '#7e57c2', '#b39ddb', '#9fa8da', '#7986cb']
};

const sentimentKeywords: Record<Sentiment, string[]> = {
  sad: ['悲伤', '难过', '泪', '雨', '离别', '孤独', '寂寞', '失去', 'sad', 'cry', 'tear', 'rain', 'lonely', 'goodbye'],
  joyful: ['喜悦', '快乐', '欢', '笑', '阳光', '花', '春', '希望', 'joy', 'happy', 'smile', 'sun', 'flower', 'spring'],
  romantic: ['爱', '情', '心', '月', '梦', '温柔', '思念', '恋', 'love', 'heart', 'moon', 'dream', 'romance'],
  melancholy: ['秋', '思念', '故乡', '回忆', '往事', '愁', '黄昏', '夜', 'autumn', 'memory', 'nostalgia', 'dusk', 'night'],
  neutral: []
};

export function detectSentiment(theme: string): Sentiment {
  const lowerTheme = theme.toLowerCase();
  const scores: Record<Sentiment, number> = {
    sad: 0,
    joyful: 0,
    neutral: 0,
    romantic: 0,
    melancholy: 0
  };

  for (const [sentiment, keywords] of Object.entries(sentimentKeywords)) {
    for (const keyword of keywords) {
      if (lowerTheme.includes(keyword)) {
        scores[sentiment as Sentiment]++;
      }
    }
  }

  let maxSentiment: Sentiment = 'neutral';
  let maxScore = 0;
  for (const [sentiment, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxSentiment = sentiment as Sentiment;
    }
  }
  return maxSentiment;
}
