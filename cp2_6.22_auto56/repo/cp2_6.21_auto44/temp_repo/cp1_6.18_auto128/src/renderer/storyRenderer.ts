import type { WeatherType } from '../data/weatherService';

export interface VisualConfig {
  backgroundGradient: string;
  particleColors: string[];
  particleSpeed: number;
  fontSize: {
    min: number;
    max: number;
  };
  fontFamily: string;
  wordSpacing: number;
  textColor: string;
  animationDuration: number;
}

const sentimentColors = {
  positive: {
    text: '#A8E6CF',
    fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
    wordSpacing: 2
  },
  neutral: {
    text: '#E0E0E0',
    fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
    wordSpacing: 1.5
  },
  negative: {
    text: '#FF8A80',
    fontFamily: '"Georgia", "Times New Roman", serif',
    wordSpacing: 1
  }
};

const weatherBackgrounds: Record<WeatherType, Record<string, string>> = {
  sunny: {
    positive: 'linear-gradient(135deg, #87CEEB 0%, #FFF8E7 100%)',
    neutral: 'linear-gradient(135deg, #87CEEB 0%, #E8E8E8 100%)',
    negative: 'linear-gradient(135deg, #6B8E9E 0%, #B8B8B8 100%)'
  },
  cloudy: {
    positive: 'linear-gradient(135deg, #B0C4DE 0%, #E6E6FA 100%)',
    neutral: 'linear-gradient(135deg, #708090 0%, #A9A9A9 100%)',
    negative: 'linear-gradient(135deg, #4A5568 0%, #2D3748 100%)'
  },
  rainy: {
    positive: 'linear-gradient(135deg, #6B9DB8 0%, #A8D8EA 100%)',
    neutral: 'linear-gradient(135deg, #4A6FA5 0%, #6B8E9E 100%)',
    negative: 'linear-gradient(135deg, #2C3E50 0%, #4A235A 100%)'
  },
  snowy: {
    positive: 'linear-gradient(135deg, #E0F0FF 0%, #FFFAF0 100%)',
    neutral: 'linear-gradient(135deg, #C0D8E8 0%, #E8E8E8 100%)',
    negative: 'linear-gradient(135deg, #5C7A99 0%, #2C3E50 100%)'
  }
};

const particleColorPalettes = {
  positive: ['#6C63FF', '#FF6584', '#A8E6CF', '#FFD700'],
  neutral: ['#6C63FF', '#B0B0B0', '#E0E0E0', '#888888'],
  negative: ['#FF6584', '#4A235A', '#FF8A80', '#666666']
};

const weatherParticleSpeeds: Record<WeatherType, number> = {
  sunny: 1.5,
  cloudy: 1,
  rainy: 2,
  snowy: 0.8
};

export function calculateVisualConfig(
  weatherType: WeatherType,
  sentiment: 'positive' | 'neutral' | 'negative'
): VisualConfig {
  const sentimentStyle = sentimentColors[sentiment];
  const background = weatherBackgrounds[weatherType][sentiment];
  const particleColors = particleColorPalettes[sentiment];
  const particleSpeed = weatherParticleSpeeds[weatherType];
  
  return {
    backgroundGradient: background,
    particleColors,
    particleSpeed,
    fontSize: {
      min: 16,
      max: 20
    },
    fontFamily: sentimentStyle.fontFamily,
    wordSpacing: sentimentStyle.wordSpacing,
    textColor: sentimentStyle.text,
    animationDuration: 5
  };
}

export function getDominantWeatherType(weatherTypes: WeatherType[]): WeatherType {
  const counts: Record<WeatherType, number> = {
    sunny: 0,
    cloudy: 0,
    rainy: 0,
    snowy: 0
  };
  
  weatherTypes.forEach(type => counts[type]++);
  
  let maxCount = 0;
  let dominant: WeatherType = 'sunny';
  
  (Object.keys(counts) as WeatherType[]).forEach(type => {
    if (counts[type] > maxCount) {
      maxCount = counts[type];
      dominant = type;
    }
  });
  
  return dominant;
}

export function generateParticles(count: number, colors: string[], baseSpeed: number) {
  const particles = [];
  
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * baseSpeed * 2,
      speedY: (Math.random() - 0.5) * baseSpeed * 2,
      opacity: 0.3 + Math.random() * 0.7
    });
  }
  
  return particles;
}
