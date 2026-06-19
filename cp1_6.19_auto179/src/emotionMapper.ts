import { EmotionKey, ParticleConfig, MotionMode } from './types';

const emotionConfigs: Record<EmotionKey, ParticleConfig> = {
  excited: {
    primaryColor: '#FF6B35',
    secondaryColor: '#FFB347',
    motionMode: 'vortex',
    speed: 0.6,
    hasJitter: false,
    jitterAmount: 0,
    hasTwinkle: false,
    baseOpacity: 0.8,
    particleCount: 2500,
    sphereRadius: 15,
    cyclePeriod: 4,
  },
  calm: {
    primaryColor: '#4FC3F7',
    secondaryColor: '#81D4FA',
    motionMode: 'breathing',
    speed: 0.3,
    hasJitter: false,
    jitterAmount: 0,
    hasTwinkle: false,
    baseOpacity: 0.7,
    particleCount: 2200,
    sphereRadius: 15,
    cyclePeriod: 8,
  },
  anxious: {
    primaryColor: '#CE93D8',
    secondaryColor: '#E1BEE7',
    motionMode: 'vortex',
    speed: 0.3,
    hasJitter: true,
    jitterAmount: 0.5,
    hasTwinkle: false,
    baseOpacity: 0.75,
    particleCount: 2800,
    sphereRadius: 15,
    cyclePeriod: 4,
  },
  sad: {
    primaryColor: '#78909C',
    secondaryColor: '#546E7A',
    motionMode: 'sinking',
    speed: 0.1,
    hasJitter: false,
    jitterAmount: 0,
    hasTwinkle: false,
    baseOpacity: 0.6,
    particleCount: 2000,
    sphereRadius: 15,
    cyclePeriod: 4,
  },
  happy: {
    primaryColor: '#FFD54F',
    secondaryColor: '#FFF176',
    motionMode: 'mixed',
    speed: 0.3,
    hasJitter: false,
    jitterAmount: 0,
    hasTwinkle: true,
    baseOpacity: 0.85,
    particleCount: 3000,
    sphereRadius: 15,
    cyclePeriod: 4,
  },
};

const keywordMapping: Record<string, EmotionKey> = {
  兴奋: 'excited',
  激动: 'excited',
  热情: 'excited',
  亢奋: 'excited',
  充满活力: 'excited',
  开心: 'happy',
  快乐: 'happy',
  愉快: 'happy',
  欢乐: 'happy',
  喜悦: 'happy',
  高兴: 'happy',
  幸福: 'happy',
  平静: 'calm',
  宁静: 'calm',
  放松: 'calm',
  安宁: 'calm',
  安稳: 'calm',
  平和: 'calm',
  焦虑: 'anxious',
  紧张: 'anxious',
  不安: 'anxious',
  担忧: 'anxious',
  烦躁: 'anxious',
  恐慌: 'anxious',
  悲伤: 'sad',
  难过: 'sad',
  伤心: 'sad',
  忧郁: 'sad',
  沮丧: 'sad',
  失落: 'sad',
  痛苦: 'sad',
};

export function getEmotionConfig(emotionKey: EmotionKey): ParticleConfig {
  return { ...emotionConfigs[emotionKey] };
}

export function mapEmotionKeyword(keyword: string): ParticleConfig {
  const trimmed = keyword.trim().toLowerCase();
  
  for (const [key, emotion] of Object.entries(keywordMapping)) {
    if (trimmed.includes(key.toLowerCase())) {
      return { ...emotionConfigs[emotion] };
    }
  }
  
  const allEmotions: EmotionKey[] = ['excited', 'calm', 'anxious', 'sad', 'happy'];
  const randomEmotion = allEmotions[Math.floor(Math.random() * allEmotions.length)];
  return { ...emotionConfigs[randomEmotion] };
}

export function parseEmotionInput(input: string): ParticleConfig {
  const keywords = input.split(/[,，]/).filter(k => k.trim().length > 0);
  
  if (keywords.length === 0) {
    return { ...emotionConfigs.calm };
  }
  
  const scores: Record<EmotionKey, number> = {
    excited: 0,
    calm: 0,
    anxious: 0,
    sad: 0,
    happy: 0,
  };
  
  for (const keyword of keywords) {
    const trimmed = keyword.trim().toLowerCase();
    for (const [key, emotion] of Object.entries(keywordMapping)) {
      if (trimmed.includes(key.toLowerCase())) {
        scores[emotion] += 1;
      }
    }
  }
  
  let maxScore = 0;
  let topEmotion: EmotionKey = 'calm';
  
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      topEmotion = emotion as EmotionKey;
    }
  }
  
  if (maxScore === 0) {
    return { ...emotionConfigs.calm };
  }
  
  return { ...emotionConfigs[topEmotion] };
}

export { emotionConfigs };
